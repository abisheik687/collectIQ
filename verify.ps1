# CollectIQ Deployment Verification Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CollectIQ Deployment Verification   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Check 1: Docker is installed
Write-Host "[1/8] Checking Docker installation..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "  ✓ Docker is installed" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Docker is not installed or not in PATH" -ForegroundColor Red
    $ErrorCount++
}

# Check 2: Docker Compose is available
Write-Host "[2/8] Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "  ✓ Docker Compose is available" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Docker Compose is not available" -ForegroundColor Red
    $ErrorCount++
}

# Check 3: Key files exist
Write-Host "[3/8] Checking key files..." -ForegroundColor Yellow
$files = @("docker-compose.yml", "README.md", "backend\package.json", "frontend\package.json")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ $file missing" -ForegroundColor Red
        $ErrorCount++
    }
}

# Check 4: Key directories exist
Write-Host "[4/8] Checking project structure..." -ForegroundColor Yellow
$dirs = @("backend", "frontend", "ml-models", "docs")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  ✓ $dir/ exists" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ $dir/ missing" -ForegroundColor Red
        $ErrorCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\setup.ps1" -ForegroundColor White
    Write-Host "  2. Run: docker-compose up" -ForegroundColor White
    Write-Host "  3. Open: http://localhost:3000" -ForegroundColor White
}
else {
    Write-Host "❌ Found $ErrorCount issue(s)" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
