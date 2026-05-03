param(
  [string]$WebRoot,
  [string]$BackendRoot = "backend",
  [switch]$KillNode,
  [switch]$Clean,
  [switch]$Reinstall,
  [switch]$NoStart
)

$ErrorActionPreference = "Stop"

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))

$npmCommand = "npm"
$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($npmCmd) {
  $npmCommand = $npmCmd.Source
}

function Write-Section([string]$Title) {
  Write-Host ""
  Write-Host ("===== {0} =====" -f $Title) -ForegroundColor Cyan
}

function Normalize-Path([string]$Path) {
  return [System.IO.Path]::GetFullPath($Path).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
}

function Test-WithinWorkspace([string]$Path) {
  $rootPath = Normalize-Path $workspaceRoot
  $targetPath = Normalize-Path $Path
  return $targetPath -eq $rootPath -or $targetPath.StartsWith($rootPath + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
}

function Remove-SafeItem([string]$Path) {
  if (-not (Test-WithinWorkspace $Path)) {
    throw "Refusing to delete outside the workspace: $Path"
  }

  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
}

function Get-PackageInfo([string]$Path) {
  $packageJson = Join-Path $Path "package.json"
  if (-not (Test-Path -LiteralPath $packageJson)) {
    return $null
  }

  return Get-Content -LiteralPath $packageJson -Raw | ConvertFrom-Json
}

function Get-NpmScriptName([string]$Path) {
  $pkg = Get-PackageInfo $Path
  if (-not $pkg) {
    return $null
  }

  if ($pkg.PSObject.Properties.Name -contains "scripts" -and $pkg.scripts) {
    if ($pkg.scripts.PSObject.Properties.Name -contains "dev") {
      return "dev"
    }

    if ($pkg.scripts.PSObject.Properties.Name -contains "start") {
      return "start"
    }
  }

  return $null
}

function Get-PackageSnapshot([string]$Label, [string]$Path) {
  $pkg = Get-PackageInfo $Path
  $hasScripts = $false
  $hasDev = $false
  $hasStart = $false

  if ($pkg -and $pkg.PSObject.Properties.Name -contains "scripts" -and $pkg.scripts) {
    $hasScripts = $true
    $hasDev = $pkg.scripts.PSObject.Properties.Name -contains "dev"
    $hasStart = $pkg.scripts.PSObject.Properties.Name -contains "start"
  }

  [pscustomobject]@{
    Label      = $Label
    Name       = if ($pkg) { $pkg.name } else { "" }
    HasPackage = [bool]$pkg
    HasScripts = $hasScripts
    HasDev     = $hasDev
    HasStart   = $hasStart
    NodeModules = Test-Path -LiteralPath (Join-Path $Path "node_modules")
    NextBuild   = Test-Path -LiteralPath (Join-Path $Path ".next")
    HasApp      = Test-Path -LiteralPath (Join-Path $Path "app")
    HasPages    = Test-Path -LiteralPath (Join-Path $Path "pages")
    HasEslint   = (Test-Path -LiteralPath (Join-Path $Path "eslint.config.mjs")) -or (Test-Path -LiteralPath (Join-Path $Path ".eslintrc.json"))
  }
}

function Select-WebRoot([string]$ExplicitRoot) {
  if ($ExplicitRoot) {
    $candidate = if ([System.IO.Path]::IsPathRooted($ExplicitRoot)) { $ExplicitRoot } else { Join-Path $workspaceRoot $ExplicitRoot }
    $candidate = Normalize-Path $candidate

    if (-not (Test-Path -LiteralPath (Join-Path $candidate "package.json"))) {
      throw "WebRoot does not contain a package.json: $candidate"
    }

    return [pscustomobject]@{
      Label = Split-Path $candidate -Leaf
      Path  = $candidate
    }
  }

  $candidates = @(
    [pscustomobject]@{ Label = "frontend"; Path = (Join-Path $workspaceRoot "frontend") },
    [pscustomobject]@{ Label = "apps/web"; Path = (Join-Path (Join-Path $workspaceRoot "apps") "web") },
    [pscustomobject]@{ Label = "root"; Path = $workspaceRoot }
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath (Join-Path $candidate.Path "package.json")) {
      return [pscustomobject]@{
        Label = $candidate.Label
        Path  = Normalize-Path $candidate.Path
      }
    }
  }

  return $null
}

function Select-BackendRoot([string]$ExplicitRoot) {
  if ($ExplicitRoot) {
    $candidate = if ([System.IO.Path]::IsPathRooted($ExplicitRoot)) { $ExplicitRoot } else { Join-Path $workspaceRoot $ExplicitRoot }
    $candidate = Normalize-Path $candidate

    if (-not (Test-Path -LiteralPath (Join-Path $candidate "package.json"))) {
      throw "BackendRoot does not contain a package.json: $candidate"
    }

    return [pscustomobject]@{
      Label = Split-Path $candidate -Leaf
      Path  = $candidate
    }
  }

  $candidate = Normalize-Path (Join-Path $workspaceRoot "backend")
  if (Test-Path -LiteralPath (Join-Path $candidate "package.json")) {
    return [pscustomobject]@{
      Label = "backend"
      Path  = $candidate
    }
  }

  return $null
}

function Test-EnvKeyInFileSet([string]$Key) {
  $files = @(
    Join-Path $workspaceRoot ".env",
    Join-Path $workspaceRoot ".env.local",
    Join-Path $workspaceRoot "backend\.env",
    Join-Path $workspaceRoot "backend\.env.local",
    Join-Path $workspaceRoot "frontend\.env",
    Join-Path $workspaceRoot "frontend\.env.local",
    Join-Path $workspaceRoot "apps\web\.env",
    Join-Path $workspaceRoot "apps\web\.env.local"
  )

  $pattern = "^\s*" + [regex]::Escape($Key) + "\s*="

  foreach ($file in $files) {
    if (Test-Path -LiteralPath $file) {
      if (Select-String -LiteralPath $file -Pattern $pattern -Quiet) {
        return $true
      }
    }
  }

  return $false
}

function Ensure-Install([string]$Path, [string]$Label) {
  $nodeModules = Join-Path $Path "node_modules"
  if ($Reinstall -or -not (Test-Path -LiteralPath $nodeModules)) {
    Write-Host (" Installing dependencies in {0}..." -f $Label) -ForegroundColor Yellow
    Push-Location $Path
    try {
      & $npmCommand install
    }
    finally {
      Pop-Location
    }
  }
}

function Start-NpmScript([string]$Path, [string]$Label) {
  $scriptName = Get-NpmScriptName $Path
  if (-not $scriptName) {
    Write-Host (" Skipping {0}: no dev or start script found." -f $Label) -ForegroundColor Yellow
    return
  }

  $logRoot = Join-Path $env:TEMP "tochi-legal-suite-logs"
  New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
  $safeName = ($Label -replace '[^A-Za-z0-9._-]', '_')
  $stdoutLog = Join-Path $logRoot ($safeName + ".out.log")
  $stderrLog = Join-Path $logRoot ($safeName + ".err.log")

  Start-Process `
    -FilePath $npmCommand `
    -ArgumentList @("run", $scriptName) `
    -WorkingDirectory $Path `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru | Out-Null

  Write-Host (" Started {0} with npm run {1}" -f $Label, $scriptName) -ForegroundColor Green
  Write-Host (" Logs: {0}" -f $stdoutLog)
  Write-Host ("       {0}" -f $stderrLog)
}

Write-Section "DIAGNOSTICO + FIX COMPLETO"
Write-Host (" Workspace: {0}" -f $workspaceRoot)

if ($workspaceRoot -like "*OneDrive*") {
  Write-Host " WARNING: the workspace is inside OneDrive. EPERM issues are more likely." -ForegroundColor Red
  Write-Host " Consider moving the repo to a local path like C:\dev." -ForegroundColor Red
}

if ($Clean -and -not $KillNode) {
  $KillNode = $true
}

Write-Section "VERSIONS"
Write-Host " Node:"
& node -v
Write-Host " npm:"
& $npmCommand -v

Write-Section "DISCOVERY"
$webSnapshot = Get-PackageSnapshot "frontend" (Join-Path $workspaceRoot "frontend")
$appsWebSnapshot = Get-PackageSnapshot "apps/web" (Join-Path (Join-Path $workspaceRoot "apps") "web")
$rootSnapshot = Get-PackageSnapshot "root" $workspaceRoot
$backendSnapshot = Get-PackageSnapshot "backend" (Join-Path $workspaceRoot "backend")

@(
  $webSnapshot
  $appsWebSnapshot
  $rootSnapshot
  $backendSnapshot
) | Format-Table Label, Name, HasPackage, HasScripts, HasDev, HasStart, NodeModules, NextBuild, HasApp, HasPages, HasEslint -AutoSize

if ($KillNode) {
  Write-Section "STOP NODE"
  Write-Host " Closing node.exe processes..." -ForegroundColor Yellow
  taskkill /F /IM node.exe 2>$null
}

$webRootInfo = Select-WebRoot $WebRoot
if (-not $webRootInfo) {
  Write-Host " No frontend package found." -ForegroundColor Red
}
else {
  $webPath = $webRootInfo.Path
  $webScript = Get-NpmScriptName $webPath

  Write-Section "FRONTEND"
  Write-Host (" Selected: {0} -> {1}" -f $webRootInfo.Label, $webPath)
  Write-Host (" Script:   {0}" -f $webScript)

  if ($Clean) {
    Write-Host " Cleaning frontend artifacts..." -ForegroundColor Yellow
    foreach ($rel in @("node_modules", ".next", "tsconfig.tsbuildinfo")) {
      try {
        Remove-SafeItem (Join-Path $webPath $rel)
      }
      catch {
        Write-Host ("  Skip {0}: {1}" -f $rel, $_.Exception.Message) -ForegroundColor Yellow
      }
    }
  }

  Ensure-Install $webPath $webRootInfo.Label
}

$backendInfo = Select-BackendRoot $BackendRoot
if (-not $backendInfo) {
  Write-Host " No backend package found." -ForegroundColor Red
}
else {
  $backendPath = $backendInfo.Path
  $backendScript = Get-NpmScriptName $backendPath

  Write-Section "BACKEND"
  Write-Host (" Selected: {0} -> {1}" -f $backendInfo.Label, $backendPath)
  Write-Host (" Script:   {0}" -f $backendScript)

  if (-not $env:MONGODB_URI -and -not (Test-EnvKeyInFileSet "MONGODB_URI")) {
    Write-Host " WARNING: MONGODB_URI was not found in the loaded environment or local .env files." -ForegroundColor Red
    Write-Host " backend/server.js will exit until MongoDB is configured." -ForegroundColor Red
  }

  if ($Clean) {
    Write-Host " Cleaning backend artifacts..." -ForegroundColor Yellow
    foreach ($rel in @("node_modules", "tsconfig.tsbuildinfo")) {
      try {
        Remove-SafeItem (Join-Path $backendPath $rel)
      }
      catch {
        Write-Host ("  Skip {0}: {1}" -f $rel, $_.Exception.Message) -ForegroundColor Yellow
      }
    }
  }

  Ensure-Install $backendPath $backendInfo.Label
}

if ($NoStart) {
  Write-Section "FINAL"
  Write-Host " Start skipped because -NoStart was provided." -ForegroundColor Yellow
  exit 0
}

if ($webRootInfo) {
  Start-NpmScript $webRootInfo.Path $webRootInfo.Label
}

if ($backendInfo) {
  Start-NpmScript $backendInfo.Path $backendInfo.Label
}

Write-Section "FINAL"
Write-Host " Frontend: http://localhost:3000"
Write-Host " Backend:  http://localhost:4000"
Write-Host " If you used a custom PORT env var, backend may listen elsewhere."
