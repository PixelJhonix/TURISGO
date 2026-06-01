# TuristGo — arranque full-stack (API + Vite)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Find-NpmCmd {
    # Start-Process no puede ejecutar npm.ps1; usar siempre npm.cmd
    $candidates = @(
        "$env:ProgramFiles\nodejs\npm.cmd",
        "${env:ProgramFiles(x86)}\nodejs\npm.cmd"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }
    $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npmCmd) { return $npmCmd.Source }
    return $null
}

$npmPath = Find-NpmCmd
if (-not $npmPath) {
    Write-Host ""
    Write-Host "ERROR: npm.cmd no encontrado." -ForegroundColor Red
    Write-Host "Instala Node.js LTS desde https://nodejs.org/ (marca 'Add to PATH')." -ForegroundColor Yellow
    Write-Host "Cierra y vuelve a abrir PowerShell, luego:  cd Front; npm install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solo backend:" -ForegroundColor Cyan
    Write-Host "  cd back; dotnet run --project TuristGo.API" -ForegroundColor Gray
    exit 1
}

Write-Host "TuristGo: iniciando backend y frontend..." -ForegroundColor Cyan
Write-Host "npm: $npmPath" -ForegroundColor DarkGray

$api = Start-Process -FilePath "dotnet" -ArgumentList "run --project `"$root\back\TuristGo.API\TuristGo.API.csproj`"" -WorkingDirectory "$root\back" -PassThru -NoNewWindow
Start-Sleep -Seconds 5

$frontDir = Join-Path $root "Front"
if (-not (Test-Path (Join-Path $frontDir "node_modules"))) {
    Write-Host "Instalando dependencias npm..." -ForegroundColor Yellow
    & $npmPath install --prefix $frontDir
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$front = Start-Process -FilePath $npmPath -ArgumentList "run", "dev" -WorkingDirectory $frontDir -PassThru -NoNewWindow

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Start-Process "http://localhost:5142/swagger"

Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "API/Swagger: http://localhost:5142/swagger" -ForegroundColor Green
Write-Host "Detener: Ctrl+C (API en esta ventana)" -ForegroundColor Gray
Write-Host "PID API: $($api.Id) | PID Front: $($front.Id)"

Wait-Process -Id $api.Id
