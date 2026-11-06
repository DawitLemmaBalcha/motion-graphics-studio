<#
.SYNOPSIS
  Search the inspiration corpora from the command line, so exploring them is cheaper than guessing.
.DESCRIPTION
  Three sources, one command:
    80 Scenario loops (Canvas code, adaptable)  -> -Loop
    703 creator prompts (no code)               -> -Prompt
    190 source-repo links, with licences        -> -Repo
  With no arguments, prints what's available.
.EXAMPLE
  .\find-source.ps1 -Loop tunnel
  .\find-source.ps1 -Prompt shader
  .\find-source.ps1 -Repo three.js
  .\find-source.ps1 -List
#>
[CmdletBinding()]
param(
  [string]$Loop,
  [string]$Prompt,
  [string]$Repo,
  [switch]$List
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$loopsDir = Join-Path $root 'templates\scenario-motion-loops\loops'
$libDir = Join-Path $root 'prompts\library'
$casesDir = Join-Path $root 'repos\awesome-ai-motion\cases'
$resources = Join-Path $root 'repos\awesome-ai-motion\browse\resources.en.md'

function Show-Loops($pattern) {
  $files = Get-ChildItem (Join-Path $loopsDir 'js\tiles') -Recurse -File -Filter *.js -ErrorAction SilentlyContinue
  $rows = @()
  foreach ($f in $files) {
    $t = Get-Content $f.FullName -Raw
    foreach ($m in [regex]::Matches($t, "tile\('([^']+)',\s*\{[\s\S]{0,160}?name:\s*'([^']+)'")) {
      $id = $m.Groups[1].Value; $nm = $m.Groups[2].Value
      if (-not $pattern -or $id -match $pattern -or $nm -match $pattern) {
        $rows += [pscustomobject]@{
          id   = $id
          name = $nm
          file = $f.FullName.Replace("$loopsDir\", '')
        }
      }
    }
  }
  if ($rows.Count -eq 0) { Write-Host "No loop matched '$pattern'." -ForegroundColor Yellow; return }
  Write-Host "`n$($rows.Count) loop(s)  --  adapt P (palette), the period, and the counts" -ForegroundColor Cyan
  $rows | Format-Table -AutoSize | Out-String -Width 160 | Write-Host
  Write-Host "Open the file, copy the tile() block into scripts\loop-template.html, then:" -ForegroundColor DarkGray
  Write-Host "  node scripts\render-loop.mjs loop.html --check" -ForegroundColor DarkGray
}

function Show-Prompts($pattern) {
  # Two corpora, both local: 112 verbatim prompt files, and the 1,728 case studies that each carry
  # the creator's prompt plus a "what to learn" note. Replaces the removed prompt-only repos.
  $libHits = @()
  if (Test-Path $libDir) {
    $libHits = @(Get-ChildItem $libDir -Filter *.txt -ErrorAction SilentlyContinue |
        Where-Object { (Get-Content $_.FullName -Raw) -match $pattern })
  }

  $caseHits = @()
  if (Test-Path $casesDir) {
    $caseHits = @(Select-String -Path (Join-Path $casesDir '*.en.md') -Pattern $pattern -List -ErrorAction SilentlyContinue)
  }

  Write-Host ("`nlibrary: {0} prompt file(s) match '{1}'" -f $libHits.Count, $pattern) -ForegroundColor Cyan
  $libHits | Select-Object -First 3 | ForEach-Object {
    $t = Get-Content $_.FullName -Raw
    Write-Host ("`n  " + $_.Name) -ForegroundColor Magenta
    Write-Host ("  " + ($t -replace '\s+', ' ').Substring(0, [Math]::Min(400, $t.Length)))
  }

  Write-Host ("`ncases: {0} of 1728 match  --  prompt + 'what to learn', no code" -f $caseHits.Count) -ForegroundColor Cyan
  $caseHits | Select-Object -First 8 | ForEach-Object {
    $head = Get-Content $_.Path -TotalCount 8 | Where-Object { $_ -match '^# ' } | Select-Object -First 1
    if (-not $head) { $head = $_.Filename }
    Write-Host ("`n  " + $head.TrimStart('#',' ')) -ForegroundColor Magenta
    Write-Host ("  " + $_.Path.Replace("$root\", '')) -ForegroundColor DarkGray
  }
  if ($caseHits.Count -gt 8) { Write-Host "`n  ... $($caseHits.Count - 8) more. Narrow the pattern." -ForegroundColor DarkGray }
}

function Show-Repos($pattern) {
  if (-not (Test-Path $resources)) { Write-Host "resources.en.md not found." -ForegroundColor Red; return }
  $lines = Get-Content $resources
  $cur = ''
  $hits = 0
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^##\s+(.+)') { $cur = $lines[$i] }
    if ($lines[$i] -match 'Related tool|Public web page|Source code') {
      if ($lines[$i] -match $pattern -or $cur -match $pattern) {
        $hits++
        if ($hits -le 12) {
          Write-Host ("`n" + $cur) -ForegroundColor Magenta
          Write-Host ("  " + $lines[$i].Trim())
          # the licence usually sits on the same or next line
          if ($lines[$i] -match '\((MIT|Apache-2\.0|AGPL-3\.0|GPL-3\.0|BSD-[23]-Clause|none)\)') { }
        }
      }
    }
  }
  if ($hits -eq 0) { Write-Host "No source repo matched '$pattern'." -ForegroundColor Yellow }
  else { Write-Host "`n$hits match(es). Check each entry's licence line before adapting. AGPL has obligations." -ForegroundColor DarkGray }
}

if ($List -or (-not $Loop -and -not $Prompt -and -not $Repo)) {
  Write-Host "`nInspiration sources" -ForegroundColor Cyan
  if (Test-Path $loopsDir) {
    $n = 0
    foreach ($f in (Get-ChildItem (Join-Path $loopsDir 'js\tiles') -Recurse -File -Filter *.js -ErrorAction SilentlyContinue)) {
      $n += ([regex]::Matches((Get-Content $f.FullName -Raw), "tile\('")).Count
    }
    Write-Host ("  Scenario loops   {0} tile() definitions   -Loop <pattern>   (CODE - adapt)" -f $n)
  }
  if (Test-Path $libDir) {
    $nLib = (Get-ChildItem $libDir -Filter *.txt -ErrorAction SilentlyContinue).Count
    $nCases = (Get-ChildItem $casesDir -Filter *.en.md -ErrorAction SilentlyContinue).Count
    Write-Host ("  Prompts          {0} verbatim + {1} cases    -Prompt <pattern> (no code)" -f $nLib, $nCases)
  }
  if (Test-Path $resources) {
    Write-Host ("  Source repos     190 works, licences       -Repo <pattern>   (CODE - licence)")
  }
  Write-Host "`nExamples:  -Loop tunnel   -Prompt shader   -Repo three" -ForegroundColor DarkGray
  return
}

if ($Loop) { Show-Loops $Loop }
if ($Prompt) { Show-Prompts $Prompt }
if ($Repo) { Show-Repos $Repo }
