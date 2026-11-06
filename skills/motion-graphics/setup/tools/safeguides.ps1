<#
.SYNOPSIS
  Burn action-safe (90%) and title-safe (80%) guides onto key frames so safe-area compliance is lookable.
.DESCRIPTION
  Content under a platform's UI is invisible to `hyperframes check --json`; only the frame shows it.
  Yellow = 90% action safe. Green = 80% title safe (key text must be inside). Red = the platform UI
  band (9:16: bottom 15%, top 12%), where text must NOT sit.
.PARAMETER Piece
  Folder name under work/, or a path.
.PARAMETER At
  Comma-separated seconds. Default: 5 frames evenly spaced across the piece.
.EXAMPLE
  & "$MG\tools\safeguides.ps1" -Piece 01-measured
  & "$MG\tools\safeguides.ps1" -File .\work\01\renders\master.mp4 -At 0,3,7.5,11,14.5
#>
[CmdletBinding()]
param(
  [string]$Piece,
  [string]$File,
  [string]$At,
  [string]$OutDir
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot

if (-not $File) {
  if (-not $Piece) { throw "Pass -Piece <name> or -File <mp4>." }
  if (Test-Path $Piece) { $dir = (Resolve-Path $Piece).Path } else { $dir = Join-Path $root "work\$Piece" }
  $renders = Join-Path $dir 'renders'
  $File = (Get-ChildItem $renders -Filter *.mp4 | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
  if (-not $File) { throw "No .mp4 in $renders" }
} else {
  $File = (Resolve-Path $File).Path
  $fileDir = Split-Path -Parent $File
  if ((Split-Path -Leaf $fileDir) -eq 'renders') { $dir = Split-Path -Parent $fileDir } else { $dir = $fileDir }
}

if (-not $OutDir) { $OutDir = Join-Path $dir 'stills\safe' }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$probe = (& ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of json $File 2>$null | Out-String) | ConvertFrom-Json
$w = [int]$probe.streams[0].width
$h = [int]$probe.streams[0].height
$dur = [double]$probe.format.duration

function Box($pct) { [int]($pct / 100 * $w) }
function Vbox($pct) { [int]($pct / 100 * $h) }

# 90% action-safe and 80% title-safe, inset from the frame edge
$ax = [int]($w * 0.05); $ay = [int]($h * 0.05); $aw = $w - 2 * $ax; $ah = $h - 2 * $ay
$tx = [int]($w * 0.10); $ty = [int]($h * 0.10); $tw = $w - 2 * $tx; $th = $h - 2 * $ty

# NOTE: ${...} braces are mandatory. "$ax:y" parses as a scoped variable ($ax:y), not interpolation.
$filters = @(
  "drawbox=x=${ax}:y=${ay}:w=${aw}:h=${ah}:color=yellow@0.55:t=3",
  "drawbox=x=${tx}:y=${ty}:w=${tw}:h=${th}:color=lime@0.55:t=2"
)

# platform UI bands: only for vertical, where Reels/Stories/TikTok chrome actually covers the frame
$isVertical = ($h -gt $w)
if ($isVertical) {
  $topH = [int]($h * 0.12)
  $botY = [int]($h * 0.85)
  $filters += "drawbox=x=0:y=0:w=${w}:h=${topH}:color=red@0.14:t=fill"
  $filters += "drawbox=x=0:y=${botY}:w=${w}:h=$($h - $botY):color=red@0.14:t=fill"
}

$vf = ($filters -join ',')

if (-not $At) {
  $times = @()
  for ($i = 1; $i -le 5; $i++) { $times += [math]::Round($dur * $i / 6, 2) }
} else {
  $times = $At -split ',' | ForEach-Object { [double]$_.Trim() }
}

Write-Host "Guides: ${w}x${h}, vertical=$isVertical, $($times.Count) frames -> $OutDir`n" -ForegroundColor Cyan
foreach ($t in $times) {
  $out = Join-Path $OutDir ("safe-{0}.png" -f $t)
  $log = (& ffmpeg -hide_banner -v error -ss $t -i $File -frames:v 1 -vf $vf -y $out 2>&1 | Out-String)
  if (Test-Path $out) {
    Write-Host ("  {0,7:N2}s  -> {1}" -f $t, $out)
  } else {
    Write-Host ("  {0,7:N2}s  FAILED" -f $t) -ForegroundColor Red
    if ($log.Trim()) { Write-Host ("            " + (($log -split "`n")[0]).Trim()) -ForegroundColor DarkRed }
  }
}

Write-Host "`nLook at them: key text inside GREEN; nothing important in RED." -ForegroundColor Yellow
Write-Host "At 1080x1920 the red bands are the top $([int]($h*0.12))px and bottom $([int]($h*0.15))px." -ForegroundColor DarkGray
