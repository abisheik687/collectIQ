# CollectIQ Setup Script
# Run this script to set up environment files for local development

Write-Host "=== CollectIQ Setup Script ===" -ForegroundColor Cyan
Write-Host ""

# Create backend .env if it doesn't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend\.env..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Created backend\.env" -ForegroundColor Green
} else {
    Write-Host "✓ backend\.env already exists" -ForegroundColor Green
}

# Create frontend .env if it doesn't exist
if (-not (Test-Path "frontend\.env")) {
    Write-Host "Creating frontend\.env..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Created frontend\.env" -ForegroundColor Green
} else {
    Write-Host "✓ frontend\.env already exists" -ForegroundColor Green
}

# Create ML .env if it doesn't exist
if (-not (Test-Path "ml-models\.env")) {
    Write-Host "Creating ml-models\.env..." -ForegroundColor Yellow
    Copy-Item "ml-models\.env.example" "ml-models\.env"
    Write-Host "✓ Created ml-models\.env" -ForegroundColor Green
} else {
    Write-Host "✓ ml-models\.env already exists" -ForegroundColor Green
}

# Create logs directories
Write-Host ""
Write-Host "Creating directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "ml-models\models" | Out-Null

Write-Host "✓ Directory structure created" -ForegroundColor Green

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start with Docker: docker-compose up" -ForegroundColor White
Write-Host "  2. Or install dependencies manually:" -ForegroundColor White
Write-Host "     - Backend: cd backend && npm install" -ForegroundColor Gray
Write-Host "     - Frontend: cd frontend && npm install" -ForegroundColor Gray
Write-Host "     - ML: cd ml-models && pip install -r requirements.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Access the application at http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Demo credentials:" -ForegroundColor Cyan
Write-Host "  Enterprise: admin@enterprise.com / admin123" -ForegroundColor White
Write-Host "  DCA: dca@agency.com / dca123" -ForegroundColor White
Write-Host ""
