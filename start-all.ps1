# CollectIQ - Start All Services
# This script launches Backend, ML API, and Frontend in separate windows

Write-Host "Starting CollectIQ Services..." -ForegroundColor Green

# Get the project root directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend API
Write-Host "Starting Backend API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm install; npm run dev"

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start ML API
Write-Host "Starting ML API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\ml-models'; pip install -r requirements.txt; python api.py"

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm install; npm run dev"

Write-Host "`n✅ All services starting!" -ForegroundColor Green
Write-Host "`nBackend API: http://localhost:5000" -ForegroundColor Yellow
Write-Host "ML API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "`nLogin credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@fedex.com / admin123" -ForegroundColor White
Write-Host "  Collector: dca@agency.com / dca123" -ForegroundColor White
Write-Host "`nPress any key to exit (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
