<#
.SYNOPSIS
    Install the motion-graphics and motion-critic skills so an agent can see them.

.DESCRIPTION
    Links (or copies) both skills into the agent's skills directory. Run this once on a new machine.
    Pass -Bootstrap to also build the studio in the same step.

.PARAMETER SkillsDir
    Where the agent looks for skills. Default: %USERPROFILE%\.dsh\skills

.PARAMETER Copy
    Copy the skill folders instead of junctioning them. Use when the filesystem forbids junctions.

.PARAMETER Force
    Replace an existing skill folder that did not come from this repo.

.PARAMETER Bootstrap
    Run the studio bootstrap after installing the skills.

.PARAMETER StudioRoot
    Passed through to the bootstrap.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Bootstrap
#>
[CmdletBinding()]
param(
    [string]$SkillsDir,
    [switch]$Copy,
    [switch]$Force,
    [switch]$Bootstrap,
    [string]$StudioRoot
)

$ErrorActionPreference = 'Continue'
$repoRoot = $PSScriptRoot
if (-not $SkillsDir) { $SkillsDir = Join-Path $env:USERPROFILE '.dsh\skills' }

Write-Host ''
Write-Host '=== motion-graphics-studio: install skills ===' -ForegroundColor Cyan
Write-Host ("  repo       : {0}" -f $repoRoot)
Write-Host ("  skills dir : {0}" -f $SkillsDir)
Write-Host ''

if (-not (Test-Path $SkillsDir)) { New-Item -ItemType Directory -Force -Path $SkillsDir | Out-Null }

$installed = 0
foreach ($name in @('motion-graphics', 'motion-critic')) {
    $src = Join-Path $repoRoot ('skills\' + $name)
    $skillFile = Join-Path $src 'SKILL.md'
    if (-not (Test-Path $skillFile)) {
        Write-Host ("  {0,-16} SKILL.md missing in repo - skipped" -f $name) -ForegroundColor Red
        continue
    }
    $dst = Join-Path $SkillsDir $name
    $done = $false

    if (Test-Path $dst) {
        $item = Get-Item $dst -Force
        $target = $item.Target
        $targets = @($target)
        if ($targets.Count -gt 0 -and $targets[0] -eq $src) {
            Write-Host ("  {0,-16} already linked to this repo" -f $name) -ForegroundColor Green
            $done = $true
            $installed++
        } elseif ($Force) {
            Remove-Item $dst -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host ("  {0,-16} already exists and is not from this repo - use -Force" -f $name) -ForegroundColor Yellow
            $done = $true
        }
    }

    if (-not $done) {
        if ($Copy) {
            Copy-Item $src $dst -Recurse -Force
            Write-Host ("  {0,-16} copied" -f $name) -ForegroundColor Green
            $installed++
        } else {
            try {
                New-Item -ItemType Junction -Path $dst -Target $src -ErrorAction Stop | Out-Null
                Write-Host ("  {0,-16} linked" -f $name) -ForegroundColor Green
                $installed++
            } catch {
                Copy-Item $src $dst -Recurse -Force
                Write-Host ("  {0,-16} copied (junction not permitted here)" -f $name) -ForegroundColor Yellow
                $installed++
            }
        }
    }
}

Write-Host ''
if ($installed -eq 0) {
    Write-Host '  Nothing installed. Check -SkillsDir or use -Force.' -ForegroundColor Red
    exit 1
}
Write-Host '  Skills installed. RESTART the agent session so the catalog picks them up.' -ForegroundColor Green
Write-Host '  Then ask it to make a motion graphic; the skill builds the studio if it is missing.' -ForegroundColor DarkGray

if ($Bootstrap) {
    Write-Host ''
    $boot = Join-Path $repoRoot 'skills\motion-graphics\setup\bootstrap.ps1'
    if (-not (Test-Path $boot)) {
        Write-Host '  bootstrap.ps1 not found - skills installed, studio NOT built.' -ForegroundColor Red
        exit 1
    }
    $bootArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $boot)
    if ($StudioRoot) { $bootArgs += @('-StudioRoot', $StudioRoot) }
    & powershell @bootArgs
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host '  To build the studio now: powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Bootstrap' -ForegroundColor DarkGray
exit 0
