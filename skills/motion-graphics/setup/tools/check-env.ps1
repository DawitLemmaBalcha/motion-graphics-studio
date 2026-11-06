<#
.SYNOPSIS
  Verify the motion-graphics toolchain before blaming the code.
.DESCRIPTION
  Checks node >= 22, ffmpeg/ffprobe, git, and the hyperframes CLI. Prints PASS/FAIL per item.
  Exit code 0 = ready, 1 = something is missing.
.EXAMPLE
  & "$MG\tools\check-env.ps1"
#>
[CmdletBinding()]
param([switch]$Quiet)

$ErrorActionPreference = 'Continue'
$fail = 0
$rows = @()

function Add-Row($item, $ok, $detail) {
  $script:rows += [pscustomobject]@{ Item = $item; Status = $(if ($ok) { 'PASS' } else { 'FAIL' }); Detail = $detail }
  if (-not $ok) { $script:fail++ }
}

# node
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $nv = (& node -v) -replace '^v', ''
  $major = 0
  [void][int]::TryParse(($nv -split '\.')[0], [ref]$major)
  Add-Row 'node' ($major -ge 22) "v$nv (need >= 22)"
} else { Add-Row 'node' $false 'not found' }

# ffmpeg
$ff = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ff) {
  $line = (& ffmpeg -version 2>&1 | Select-Object -First 1)
  Add-Row 'ffmpeg' $true ($line -replace '\s+', ' ')
} else { Add-Row 'ffmpeg' $false 'not on PATH' }

$fp = Get-Command ffprobe -ErrorAction SilentlyContinue
Add-Row 'ffprobe' ([bool]$fp) $(if ($fp) { 'on PATH' } else { 'not on PATH' })

# git
Add-Row 'git' ([bool](Get-Command git -ErrorAction SilentlyContinue)) 'required for repos/'

# hyperframes
$hfVersion = 'unknown'
$help = (& npx --yes hyperframes@latest --help 2>&1 | Out-String)
$m = [regex]::Match($help, 'hyperframes\s+v([0-9][0-9a-zA-Z\.\-]*)')
if ($m.Success) { $hfVersion = $m.Groups[1].Value }
Add-Row 'hyperframes' ($m.Success) $(if ($m.Success) { "v$hfVersion" } else { 'CLI not reachable via npx' })

# project shape
$root = Split-Path -Parent $PSScriptRoot
foreach ($d in @('skills', 'tools', 'templates', 'prompts', 'work')) {
  Add-Row "folder $d" (Test-Path (Join-Path $root $d)) 'project structure'
}
foreach ($r in @('hyperframes', 'claude-animation-skill', 'ffmpeg-skill', 'awesome-ai-motion')) {
  Add-Row "repo $r" (Test-Path (Join-Path $root "repos\$r")) 'vendored source'
}

# seam gate present?
$gate = Join-Path $root 'repos\hyperframes\.agents\skills\motion-doctrine\scripts\seam-gate.mjs'
Add-Row 'seam-gate.mjs' (Test-Path $gate) 'motion continuity verifier'

if (-not $Quiet) {
  $rows | Format-Table -AutoSize | Out-String -Width 200 | Write-Host
  Write-Host ("hyperframes version: {0}  ->  record this in BRIEF.md" -f $hfVersion)
}

if ($fail -gt 0) {
  Write-Host ("`n{0} check(s) failed. Fix before rendering." -f $fail) -ForegroundColor Red
  exit 1
}
Write-Host "`nEnvironment ready." -ForegroundColor Green
exit 0
