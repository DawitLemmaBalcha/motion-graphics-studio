<#
.SYNOPSIS
    Build the motion-graphics studio on a machine that has nothing.

.DESCRIPTION
    Idempotent. Installs the kit (tools, prompts, templates) that ships beside this script, clones the
    six upstream repos at the commits pinned in studio.json, points MG_STUDIO at the studio, and runs
    the environment check. Re-run it any time to repair a partial install; existing files are kept
    unless -Force.

.PARAMETER StudioRoot
    Where to build the studio. Default: $env:MG_STUDIO, else %USERPROFILE%\projects\motion-graphics.

.PARAMETER Latest
    Clone the default branch instead of the pinned commit. Reproducibility is lost; use on purpose.

.PARAMETER NoRepos
    Skip the repo clones (kit only).

.PARAMETER Force
    Overwrite existing kit files.

.PARAMETER InstallMissing
    Try to install missing prerequisites with winget.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1 -StudioRoot D:\studio\mg
#>
[CmdletBinding()]
param(
    [string]$StudioRoot,
    [switch]$Latest,
    [switch]$NoRepos,
    [switch]$SkipCheck,
    [switch]$Force,
    [switch]$InstallMissing
)

$ErrorActionPreference = 'Continue'
$setupDir = $PSScriptRoot
$manifestFile = Join-Path $setupDir 'studio.json'
if (-not (Test-Path $manifestFile)) { throw "studio.json is missing next to bootstrap.ps1 ($setupDir)" }
$m = Get-Content $manifestFile -Raw | ConvertFrom-Json

if (-not $StudioRoot) {
    if ($env:MG_STUDIO) { $StudioRoot = $env:MG_STUDIO }
    else { $StudioRoot = Join-Path (Join-Path $env:USERPROFILE 'projects') 'motion-graphics' }
}
$StudioRoot = [System.IO.Path]::GetFullPath($StudioRoot)
$rootLen = $StudioRoot.Length + 1
$reposDir = Join-Path $StudioRoot 'repos'
$problems = 0

Write-Host ''
Write-Host '=== motion-graphics studio bootstrap ===' -ForegroundColor Cyan
Write-Host ("  kit    : {0}" -f $setupDir)
Write-Host ("  studio : {0}" -f $StudioRoot)
Write-Host ''

# ---------------------------------------------------------------- 1. prerequisites
function Find-Cmd($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }

Write-Host '[1/5] prerequisites' -ForegroundColor Cyan
$missing = @()
if (-not (Find-Cmd git)) { $missing += 'git' }
if (-not (Find-Cmd ffmpeg) -or -not (Find-Cmd ffprobe)) { $missing += 'ffmpeg' }
if (-not (Find-Cmd node)) { $missing += 'node' }
else {
    $nv = (& node -v) -replace '^v', ''
    $major = 0
    [void][int]::TryParse(($nv -split '\.')[0], [ref]$major)
    if ($major -lt 22) { $missing += 'node>=22' }
    Write-Host ("  node   {0}" -f $nv)
}

if ($missing.Count -gt 0) {
    Write-Host ("  MISSING: {0}" -f ($missing -join ', ')) -ForegroundColor Yellow
    if ($InstallMissing) {
        if ($missing -contains 'git') { & winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements *> $null }
        if ($missing -contains 'node' -or $missing -contains 'node>=22') { & winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements *> $null }
        if ($missing -contains 'ffmpeg') { & winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements *> $null }
        Write-Host '  attempted installs with winget. OPEN A NEW SHELL and re-run this script.' -ForegroundColor Yellow
        exit 1
    }
    Write-Host '  Install them, then re-run. winget: Git.Git / OpenJS.NodeJS.LTS / Gyan.FFmpeg' -ForegroundColor Yellow
    Write-Host '  Or re-run with -InstallMissing to attempt it automatically.' -ForegroundColor DarkGray
    $problems++
} else {
    Write-Host '  git, node>=22, ffmpeg, ffprobe  OK' -ForegroundColor Green
}

# ---------------------------------------------------------------- 2. studio + kit
Write-Host ''
Write-Host '[2/5] studio folders and kit' -ForegroundColor Cyan
foreach ($d in @('', 'repos', 'work')) {
    $p = if ($d) { Join-Path $StudioRoot $d } else { $StudioRoot }
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
        $label = if ($p.Length -gt $rootLen) { $p.Substring($rootLen) } else { 'studio root' }
        Write-Host ("  created {0}" -f $label)
    }
}

$copied = 0
$kept = 0
foreach ($name in @('tools', 'prompts', 'templates')) {
    $src = Join-Path $setupDir $name
    if (-not (Test-Path $src)) { continue }
    $dst = Join-Path $StudioRoot $name
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Get-ChildItem $src -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($src.Length + 1)
        $target = Join-Path $dst $rel
        if ((Test-Path $target) -and -not $Force) { $script:kept++; return }
        $parent = Split-Path $target -Parent
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
        Copy-Item $_.FullName $target -Force
        $script:copied++
    }
    $n = (Get-ChildItem $dst -Recurse -File).Count
    Write-Host ("  {0,-10} {1,3} file(s) installed" -f $name, $n)
}
Write-Host ("  kit: {0} written, {1} kept (use -Force to overwrite)" -f $copied, $kept)

# the manifest travels into the studio so a later session can verify drift
Copy-Item $manifestFile (Join-Path $StudioRoot 'studio.json') -Force

# licence map for the cloned repos, so a new machine knows what may ship
$reposManifestSrc = Join-Path $setupDir 'repos-MANIFEST.md'
if (Test-Path $reposManifestSrc) {
    $reposManifestDst = Join-Path $StudioRoot 'repos\MANIFEST.md'
    if (-not (Test-Path $reposManifestDst) -or $Force) { Copy-Item $reposManifestSrc $reposManifestDst -Force }
}

$workReadme = Join-Path $StudioRoot 'work\README.md'
if (-not (Test-Path $workReadme)) {
    $t = @'
# work/ - one folder per piece

    work/NN-slug/
        INSPIRATION.md   what it borrows and from where, filled before the lane is locked
        BRIEF.md         the brief, tokens, copy, measured results, critic verdict
        BEATMAP.md       cuts in seconds and frames, on measured beats
        inventory.md     catalog candidates, with rejections
        ledger.json      seam ledger, written before authoring
        attribution.md   what was reused and under which licence
        index.html       the composition
        assets/          fonts, audio, logos, footage
        renders/         mp4 output
        stills/          frames for portfolio thumbnails

Numbering is permanent. Retire a piece by prefixing `_`, never by renumbering.
'@
    Set-Content -Path $workReadme -Value $t -Encoding UTF8
}

# ---------------------------------------------------------------- 3. repos
Write-Host ''
Write-Host '[3/5] upstream repos (pinned)' -ForegroundColor Cyan
if ($NoRepos) {
    Write-Host '  skipped (-NoRepos)'
} else {
    foreach ($r in $m.repos) {
        $dest = Join-Path $reposDir $r.name
        if (Test-Path $dest) {
            $have = (& git -C $dest rev-parse --short=12 HEAD 2>$null)
            Write-Host ("  {0,-24} present ({1})" -f $r.name, $have)
            continue
        }
        if ($r.lfsSkipSmudge) { $env:GIT_LFS_SKIP_SMUDGE = '1' } else { Remove-Item Env:GIT_LFS_SKIP_SMUDGE -ErrorAction SilentlyContinue }
        Write-Host ("  {0,-24} cloning..." -f $r.name) -NoNewline
        $ok = $false
        if ($r.commit -and -not $Latest) {
            & git init --quiet $dest *> $null
            & git -C $dest remote add origin $r.url *> $null
            & git -C $dest fetch --quiet --depth 1 origin $r.commit *> $null
            if ($LASTEXITCODE -eq 0) {
                & git -C $dest checkout --quiet FETCH_HEAD *> $null
                if ($LASTEXITCODE -eq 0) { $ok = $true }
            }
        }
        if (-not $ok) {
            if (Test-Path $dest) { Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue }
            & git clone --quiet --depth 1 $r.url $dest *> $null
            if ($LASTEXITCODE -eq 0) { $ok = $true }
        }
        if (-not $ok) {
            Write-Host ' FAILED' -ForegroundColor Red
            Write-Host ("      {0}" -f $r.url) -ForegroundColor DarkGray
            $problems++
            continue
        }
        foreach ($t in @($r.trim)) {
            if (-not $t) { continue }
            $trimPath = Join-Path $dest $t
            if (Test-Path $trimPath) { Remove-Item $trimPath -Recurse -Force -ErrorAction SilentlyContinue }
        }
        $mb = [math]::Round(((Get-ChildItem $dest -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum) / 1MB, 1)
        $sha = (& git -C $dest rev-parse --short=12 HEAD 2>$null)
        Write-Host (" OK  {0} MB  {1}" -f $mb, $sha) -ForegroundColor Green
    }
    Remove-Item Env:GIT_LFS_SKIP_SMUDGE -ErrorAction SilentlyContinue
}

# ---------------------------------------------------------------- 4. env var
Write-Host ''
Write-Host '[4/5] environment variable' -ForegroundColor Cyan
try {
    [Environment]::SetEnvironmentVariable('MG_STUDIO', $StudioRoot, 'User')
    $env:MG_STUDIO = $StudioRoot
    Write-Host ("  MG_STUDIO = {0}  (persisted for this user)" -f $StudioRoot) -ForegroundColor Green
}
catch {
    Write-Host ("  could not persist MG_STUDIO: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    Write-Host '  set it yourself:  setx MG_STUDIO "<studio path>"' -ForegroundColor DarkGray
}

# ---------------------------------------------------------------- 5. verify
Write-Host ''
Write-Host '[5/5] verify' -ForegroundColor Cyan
if ($SkipCheck) {
    Write-Host '  skipped (-SkipCheck)'
} else {
    $check = Join-Path $StudioRoot 'tools\check-env.ps1'
    if (Test-Path $check) {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $check
        if ($LASTEXITCODE -ne 0) { $problems++ }
    } else {
        Write-Host '  tools\check-env.ps1 is missing - kit did not install' -ForegroundColor Red
        $problems++
    }
}

# ---------------------------------------------------------------- summary
Write-Host ''
$total = [math]::Round(((Get-ChildItem $StudioRoot -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum) / 1MB, 1)
Write-Host '=== done ===' -ForegroundColor Cyan
Write-Host ("  studio : {0}  ({1} MB)" -f $StudioRoot, $total)
Write-Host ("  hyperframes CLI recorded: {0}" -f $m.hyperframesCliTested)
Write-Host ''
Write-Host '  Next: open a session and ask it to make a motion graphic.' -ForegroundColor Green
Write-Host '  The skill resolves the studio from MG_STUDIO, or from the current directory.' -ForegroundColor DarkGray
Write-Host ('  Manual check: powershell -NoProfile -ExecutionPolicy Bypass -File "' + $StudioRoot + '\tools\check-env.ps1"')
Write-Host ''

if ($problems -gt 0) {
    Write-Host ("{0} problem(s) above." -f $problems) -ForegroundColor Red
    exit 1
}
exit 0
