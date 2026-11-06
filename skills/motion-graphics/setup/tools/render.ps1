<#
.SYNOPSIS
  Render one work/ piece with the house defaults, into that piece's renders/ folder.
.DESCRIPTION
  Runs `hyperframes check` first and aborts on errors unless -Force. Writes a timestamped file so a
  failed render can never overwrite a good one.
.PARAMETER Piece
  Folder name under work/, or an absolute path.
.PARAMETER Aspect
  16:9 (master) or 9:16 (recomposed vertical cut). 9:16 requires a vertical composition to exist.
.PARAMETER Draft
  Fast, low quality, for timing only.
.EXAMPLE
  & "$MG\tools\render.ps1" -Piece 01-kinetic-type
  & "$MG\tools\render.ps1" -Piece 01-kinetic-type -Aspect 9:16
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Piece,
  [ValidateSet('16:9', '9:16', '1:1')][string]$Aspect = '16:9',
  [int]$Fps = 30,
  [ValidateSet('draft', 'looks', 'delivery')][string]$Quality = 'delivery',
  [int]$Workers = 0,
  [switch]$Draft,
  [switch]$Force,
  [switch]$SkipCheck
)

# 'Continue' is deliberate: Windows PowerShell 5.1 turns a native command's stderr (npx/ffmpeg) into a
# terminating NativeCommandError under 'Stop', which killed this script at its own check step.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot

if (Test-Path $Piece) { $dir = (Resolve-Path $Piece).Path }
else { $dir = Join-Path $root "work\$Piece" }

if (-not (Test-Path $dir)) { throw "Piece folder not found: $dir" }
$slug = Split-Path -Leaf $dir
$renders = Join-Path $dir 'renders'
New-Item -ItemType Directory -Force -Path $renders | Out-Null

# which composition represents this aspect?
$comp = 'index.html'
if ($Aspect -ne '16:9') {
  $tag = $Aspect -replace ':', 'x'
  $candidates = @("index-$tag.html", "index_$tag.html", "compositions\index-$tag.html")
  $found = $null
  foreach ($c in $candidates) { if (Test-Path (Join-Path $dir $c)) { $found = $c; break } }
  if (-not $found) {
    throw @"
No $Aspect composition in $dir.
A vertical cut must be RECOMPOSED, not cropped (see references/design-system.md).
Create index-$tag.html for this piece first, or render 16:9 only.
"@
  }
  $comp = $found
}
# the CLI wants a forward-slash path relative to the project dir
$compCli = $comp -replace '\\', '/'

# gate: check before burning render time
if (-not $SkipCheck) {
  Write-Host "`n[1/2] check ($comp)" -ForegroundColor Cyan
  $json = (& npx --yes hyperframes@latest check $dir --json 2>&1 | Out-String)
  # npx prepends banners/ANSI; slice from the first brace or every parse fails
  $s = $json.IndexOf('{'); $e = $json.LastIndexOf('}')
  if ($s -ge 0 -and $e -gt $s) { $json = $json.Substring($s, $e - $s + 1) }
  $errCount = -1
  try {
    $parsed = $json | ConvertFrom-Json
    if ($null -ne $parsed.ok) { $errCount = if ($parsed.ok) { 0 } else { 1 } }
    elseif ($null -ne $parsed.lint.errorCount) { $errCount = [int]$parsed.lint.errorCount }
    else { $errCount = @($parsed.errors).Count }
  } catch { Write-Host "  (check output not parseable - read it by hand)" -ForegroundColor Yellow }

  if ($errCount -gt 0 -and -not $Force) {
    Write-Host $json
    throw "check reported $errCount error(s). Fix them, or pass -Force to render anyway."
  }
  if ($errCount -eq 0) { Write-Host "  clean" -ForegroundColor Green }
}

# render
$tag2 = $Aspect -replace ':', 'x'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$out = Join-Path $renders ("{0}_{1}_{2}.mp4" -f $slug, $tag2, $stamp)

Write-Host "`n[2/2] render -> $out" -ForegroundColor Cyan

# NOT $args: that is an automatic variable and assigning to it silently starves the call of its flags.
$cliArgs = @('--yes', 'hyperframes@latest', 'render', $dir, '-o', $out, '-f', "$Fps", '-w', 'auto')
# This box has 7.9 GB, just under HyperFrames' 8192 MB low-memory threshold, so it permanently pins to
# 1 worker + screenshot capture. -Workers N opts out and asks for N workers instead.
if ($Workers -gt 1) {
  $cliArgs += @('--no-low-memory-mode', '-w', "$Workers")
  Write-Host "  low-memory mode OFF, requesting $Workers workers" -ForegroundColor DarkGray
}
$qa = if ($Draft) { 'draft' } else { $Quality }
$cliArgs += @('-q', $qa)
# A vertical cut lives in compositions/ and must be named explicitly, or the CLI renders index.html.
if ($comp -ne 'index.html') { $cliArgs += @('-c', $compCli) }

$t0 = Get-Date
# Pipe through the host: inheriting the child's stderr makes a SUCCESSFUL render surface as
# NativeCommandError + exit 1 to any caller that captures stderr, which reads as a failed render.
& npx @cliArgs 2>&1 | ForEach-Object { Write-Host $_ }
$code = $LASTEXITCODE
$elapsed = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)

if ($code -ne 0 -or -not (Test-Path $out)) {
  Write-Host "`nRender FAILED after ${elapsed}s (exit $code)." -ForegroundColor Red
  exit 1
}

Write-Host "`nDone in ${elapsed}s" -ForegroundColor Green
& ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1 $out
Write-Host "`nNext: & `"$root\tools\measure.ps1`" -Piece $slug" -ForegroundColor Cyan
exit 0
