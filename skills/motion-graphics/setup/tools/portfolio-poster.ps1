# portfolio-poster.ps1 — make every piece judgeable the way a buyer sees it.
#
# Extracts a poster frame from a delivered master, writes a 1600 px JPEG for the portfolio plus a
# 200 px thumbnail, and — with -Grid — assembles every thumbnail found into one sheet, because a
# portfolio is judged as a grid at 200 px and never as a single hero file.
#
#   & "work\..\tools\portfolio-poster.ps1" -Piece 03-sundial -At 12.5
#   & "work\..\tools\portfolio-poster.ps1" -Grid
#
# Poster times are a design decision, not a convenience: pick the frame that reads as the job at
# thumbnail size, not the prettiest frame in the piece.

param(
  [string]$Piece,
  [double]$At = 10.0,
  [string]$File,
  [switch]$Grid,
  [int]$ThumbWidth = 200
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$posters = Join-Path $root 'work\posters'
New-Item -ItemType Directory -Force -Path $posters | Out-Null

if ($Grid) {
  $thumbs = Get-ChildItem $posters -Filter '*_thumb.png' | Sort-Object Name
  if (-not $thumbs.Count) { Write-Host "No thumbnails yet in $posters" -ForegroundColor Yellow; exit 1 }
  $inputs = @()
  $filters = @()
  $labels = @()
  for ($i = 0; $i -lt $thumbs.Count; $i++) {
    $inputs += @('-i', $thumbs[$i].FullName)
    $filters += "[${i}:v]scale=-1:240,pad=iw+8:ih+8:4:4:0x141414[v$i]"
    $labels += "[v$i]"
  }
  $stack = ($labels -join '') + "hstack=inputs=$($thumbs.Count)[out]"
  $filter = ($filters -join ';') + ';' + $stack
  $out = Join-Path $posters 'GRID.png'
  & ffmpeg -hide_banner -v error -y @inputs -filter_complex $filter -map '[out]' $out
  if (Test-Path $out) {
    Write-Host "Grid of $($thumbs.Count) pieces -> $out" -ForegroundColor Green
    $thumbs | ForEach-Object { "  " + $_.BaseName }
  }
  exit 0
}

if (-not $File) {
  if (-not $Piece) { throw "Pass -Piece <name> or -File <mp4>." }
  $dir = Join-Path $root "work\$Piece"
  $File = (Get-ChildItem (Join-Path $dir 'renders') -Filter '*16x9_master.mp4' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
  if (-not $File) {
    $File = (Get-ChildItem (Join-Path $dir 'renders') -Filter '*.mp4' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
  }
}
if (-not $File -or -not (Test-Path $File)) { throw "No master found. Pass -File." }

$slug = if ($Piece) { $Piece } else { [System.IO.Path]::GetFileNameWithoutExtension($File) }
$poster = Join-Path $posters "${slug}_poster.jpg"
$thumb = Join-Path $posters "${slug}_thumb.png"

# JPEG first (small, what Upwork prefers); PNG fallback, which cannot fail on colour range.
& ffmpeg -hide_banner -v error -y -i $File -ss $At -frames:v 1 -q:v 2 -vf "scale=1600:-2,format=yuvj420p" $poster
if (-not (Test-Path $poster)) {
  $poster = [System.IO.Path]::ChangeExtension($poster, '.png')
  & ffmpeg -hide_banner -v error -y -i $File -ss $At -frames:v 1 -vf "scale=1600:-2" $poster
}
& ffmpeg -hide_banner -v error -y -i $File -ss $At -frames:v 1 -vf "scale=${ThumbWidth}:-1" $thumb

if (Test-Path $poster) {
  Write-Host "poster  $poster  ($([math]::Round((Get-Item $poster).Length/1kb)) KB)" -ForegroundColor Green
  Write-Host "thumb   $thumb" -ForegroundColor Green
  Write-Host "`nNow open the thumb. If it does not name the job at 200 px, pick a different time." -ForegroundColor Cyan
} else { throw "ffmpeg did not write the poster" }
