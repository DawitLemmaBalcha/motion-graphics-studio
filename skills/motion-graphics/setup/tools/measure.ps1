<#
.SYNOPSIS
  Measure a rendered piece against the quality bar. Numbers, not opinions.
.DESCRIPTION
  Reports duration, fps, resolution, longest MID-PIECE frozen frame (a held final frame is allowed),
  integrated loudness, true peak, audio presence, and optionally the contrast audit. Writes
  stills/measure.txt and exits 1 if anything fails.
.EXAMPLE
  & "$MG\tools\measure.ps1" -Piece 01-kinetic-type
  & "$MG\tools\measure.ps1" -Piece 01-kinetic-type -WithCheck
#>
[CmdletBinding()]
param(
  [string]$Piece,
  [string]$File,
  [switch]$WithCheck,
  [switch]$AllowSilence,
  [double]$TargetLufs = -14,
  [double]$LufsTolerance = 1
)

# NOTE: 'Continue' is deliberate. Under Windows PowerShell 5.1, ffmpeg's stderr output becomes a
# terminating NativeCommandError if this is 'Stop', which would kill the script on every probe.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot

if (-not $File) {
  if (-not $Piece) { throw "Pass -Piece <name> or -File <mp4>." }
  if (Test-Path $Piece) { $dir = (Resolve-Path $Piece).Path } else { $dir = Join-Path $root "work\$Piece" }
  $renders = Join-Path $dir 'renders'
  if (-not (Test-Path $renders)) { throw "No renders/ folder in $dir" }
  $File = (Get-ChildItem $renders -Filter *.mp4 | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
  if (-not $File) { throw "No .mp4 in $renders" }
  $projDir = $dir
} else {
  $File = (Resolve-Path $File).Path
  $fileDir = Split-Path -Parent $File
  if ((Split-Path -Leaf $fileDir) -eq 'renders') { $projDir = Split-Path -Parent $fileDir }
  else { $projDir = $fileDir }
  $dir = $projDir
}

if (-not (Test-Path $File)) { throw "File not found: $File" }
$slug = Split-Path -Leaf $dir
Write-Host "Measuring $File`n" -ForegroundColor Cyan

$rows = @()
function Add-Result($metric, $target, $actual, $ok) {
  $script:rows += [pscustomobject]@{
    Metric = $metric; Target = $target; Actual = $actual
    Result = $(if ($ok) { 'PASS' } else { 'FAIL' })
  }
}

# ---- container / stream
$probe = (& ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,codec_type -of json $File 2>$null | Out-String) | ConvertFrom-Json
$v = @($probe.streams | Where-Object { $_.codec_type -eq 'video' })[0]
$a = @($probe.streams | Where-Object { $_.codec_type -eq 'audio' })
$dur = [double]$probe.format.duration
$fpsNum, $fpsDen = ($v.r_frame_rate -split '/')
$fps = [math]::Round([double]$fpsNum / [double]$fpsDen, 2)

$declared = $null
$indexHtml = Join-Path $projDir 'index.html'
if (Test-Path $indexHtml) {
  $html = Get-Content $indexHtml -Raw
  $mDur = [regex]::Match($html, 'data-composition-id\s*=\s*"main"[\s\S]{0,400}?data-duration\s*=\s*"([0-9\.]+)"')
  if (-not $mDur.Success) { $mDur = [regex]::Match($html, 'data-duration\s*=\s*"([0-9\.]+)"') }
  if ($mDur.Success) { $declared = [double]$mDur.Groups[1].Value }
}
if ($null -ne $declared) {
  Add-Result 'Duration' ("declared {0:N2}s" -f $declared) ("{0:N3}s" -f $dur) ([math]::Abs($dur - $declared) -le (1.0 / $fps))
} else {
  Add-Result 'Duration' 'exact to brief (declared)' ("{0:N3}s" -f $dur) $true
}
Add-Result 'Frame rate' '30 (or 60)' ("$fps fps") ($fps -in @(30, 60))
Add-Result 'Resolution' '1920x1080 or 1080x1920' ("{0}x{1}" -f $v.width, $v.height) (($v.width -eq 1920 -and $v.height -eq 1080) -or ($v.width -eq 1080 -and $v.height -eq 1920))
Add-Result 'Pixel format' 'yuv420p (player-safe)' ($v.pix_fmt) ($v.pix_fmt -eq 'yuv420p')
Add-Result 'Video codec' 'h264' ($v.codec_name) ($v.codec_name -eq 'h264')
Add-Result 'Audio stream' 'present' $(if ($a.Count -gt 0) { 'yes' } else { 'none' }) (($a.Count -gt 0) -or $AllowSilence)

# ---- frozen frames
# ffmpeg emits freeze_start always, but freeze_duration/freeze_end only when the freeze CLOSES.
# An unclosed final freeze runs to EOF, so its length is duration - start. Pair by index.
$fd = (& ffmpeg -hide_banner -nostats -i $File -vf 'freezedetect=n=0.001:d=0.5' -an -f null - 2>&1 | Out-String)
$starts = @([regex]::Matches($fd, 'freeze_start:\s*([0-9\.]+)') | ForEach-Object { [double]$_.Groups[1].Value })
$durs = @([regex]::Matches($fd, 'freeze_duration:\s*([0-9\.]+)') | ForEach-Object { [double]$_.Groups[1].Value })

$worstMid = 0.0
$worstAt = 0.0
$finalHold = 0.0
for ($i = 0; $i -lt $starts.Count; $i++) {
  $s = $starts[$i]
  if ($i -lt $durs.Count) { $len = $durs[$i]; $closed = $true }
  else { $len = $dur - $s; $closed = $false }
  $reach = $s + $len
  $isFinal = (-not $closed) -or ($reach -ge ($dur - 0.45))
  if ($isFinal) {
    if ($len -gt $finalHold) { $finalHold = $len }
  } elseif ($len -gt $worstMid) {
    $worstMid = $len
    $worstAt = $s
  }
}

Add-Result 'Frozen frame (mid)' '< 0.5s' $(if ($worstMid -gt 0) { ("{0:N2}s at {1:N2}s" -f $worstMid, $worstAt) } else { 'none' }) ($worstMid -lt 0.5)
Add-Result 'Held end state' '0.4s - 2.5s composed' $(("{0:N2}s" -f $finalHold)) ($finalHold -ge 0.4 -and $finalHold -le 2.5)
Add-Result 'Not a static piece' '< 60% of runtime frozen' $(("{0:N0}%" -f (100 * $finalHold / [math]::Max($dur, 0.001)))) (($finalHold / [math]::Max($dur, 0.001)) -lt 0.6)

# ---- loudness
if ($a.Count -gt 0) {
  $ln = (& ffmpeg -hide_banner -nostats -i $File -vn -af 'loudnorm=print_format=summary' -f null - 2>&1 | Out-String)
  $mI = [regex]::Match($ln, 'Input Integrated:\s*(-?[0-9\.]+)\s*LUFS')
  $mT = [regex]::Match($ln, 'Input True Peak:\s*(-?[0-9\.]+)\s*dBTP')
  if ($mI.Success) {
    $lufs = [double]$mI.Groups[1].Value
    Add-Result 'Integrated loudness' ("{0} +/- {1} LUFS" -f $TargetLufs, $LufsTolerance) ("{0:N1} LUFS" -f $lufs) ([math]::Abs($lufs - $TargetLufs) -le $LufsTolerance)
  } else { Add-Result 'Integrated loudness' 'measurable' 'unreadable' $false }
  if ($mT.Success) {
    $tp = [double]$mT.Groups[1].Value
    Add-Result 'True peak' '< -1 dBTP' ("{0:N1} dBTP" -f $tp) ($tp -lt -1)
  }
  # Loudness RANGE: level and range are different goals. Only meaningful on pieces long enough to have
  # dynamics, so a 6s sting is exempt.
  $mLra = [regex]::Match($ln, 'Input LRA:\s*(-?[0-9\.]+)\s*LU')
  if ($mLra.Success -and $dur -ge 10) {
    $lra = [double]$mLra.Groups[1].Value
    Add-Result 'Loudness range' '4 - 9 LU' ("{0:N1} LU" -f $lra) ($lra -ge 4 -and $lra -le 9)
  }
}

# ---- contrast audit (optional: spawns a browser)
if ($WithCheck) {
  Write-Host 'Running contrast audit via hyperframes check (slow)...' -ForegroundColor DarkGray
  $json = (& npx --yes hyperframes@latest check $dir --json 2>&1 | Out-String)
  try {
    # npx/npm can prepend banners and ANSI before the JSON payload; slice from the first brace.
    $s = $json.IndexOf('{'); $e = $json.LastIndexOf('}')
    if ($s -ge 0 -and $e -gt $s) { $json = $json.Substring($s, $e - $s + 1) }
    $parsed = $json | ConvertFrom-Json
    $c = $parsed.contrast
    if ($null -eq $c) {
      Add-Result 'Contrast findings' '0' 'contrast audit not reported' $false
    } else {
      $findings = @($c.findings).Count
      Add-Result 'Contrast findings' '0' ("{0} finding(s); {1}/{2} samples passed" -f $findings, $c.passed, $c.checked) ($findings -eq 0)
    }
  } catch {
    Add-Result 'Contrast findings' '0' 'check output unparseable' $false
  }
}

# ---- report
$table = $rows | Format-Table -AutoSize | Out-String -Width 200
Write-Host $table
$fails = @($rows | Where-Object { $_.Result -eq 'FAIL' })
$summary = "MEASURED $([datetime]::Now.ToString('yyyy-MM-dd HH:mm'))`nFILE $File`n`n$table`nFAILS: $($fails.Count)"

$stills = Join-Path $dir 'stills'
New-Item -ItemType Directory -Force -Path $stills | Out-Null
$outTxt = Join-Path $stills 'measure.txt'
Set-Content -Path $outTxt -Value $summary -Encoding UTF8
Write-Host "Wrote $outTxt" -ForegroundColor DarkGray

if ($fails.Count -gt 0) {
  Write-Host ("`n{0} metric(s) failing." -f $fails.Count) -ForegroundColor Red
  exit 1
}
Write-Host "`nAll measured metrics pass. Now look at the stills." -ForegroundColor Green
exit 0
