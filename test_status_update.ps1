# 1. Login as DCA to get token
$dcaLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "dca@agency.com", "password": "dca123"}'
$dcaToken = $dcaLogin.token
Write-Host "DCA Logged In."

# 2. Get Assigned Cases for DCA
$dcaCases = Invoke-RestMethod -Uri "http://localhost:5000/api/cases" -Method Get -Headers @{ Authorization = "Bearer $dcaToken" }
$targetCase = $dcaCases.cases | Select-Object -First 1

if (-not $targetCase) {
    Write-Host "No cases assigned to DCA. Run setup first."
    exit
}

$caseId = $targetCase.id
Write-Host "Target Case ID: $caseId, Current Status: $($targetCase.status)"

# 3. Update Status to 'resolved'
Write-Host "Updating status to 'resolved'..."
$updateResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/cases/$caseId" -Method Put -Headers @{ Authorization = "Bearer $dcaToken" } -ContentType "application/json" -Body '{"status": "resolved"}'
Write-Host "Update Response Status: $($updateResponse.case.status)"
Write-Host "Update Response Status: $($updateResponse.case.status)"

# 4. Login as Admin to Check
$adminLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "admin@enterprise.com", "password": "admin123"}'
$adminToken = $adminLogin.token
Write-Host "Admin Logged In."

# 5. Fetch Case as Admin
$adminCase = Invoke-RestMethod -Uri "http://localhost:5000/api/cases/$caseId" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }

Write-Host "Admin View - Case ID: $caseId, Status: $($adminCase.case.status)"

if ($adminCase.case.status -eq "resolved") {
    Write-Host "SUCCESS: Status updated correctly."
}
else {
    Write-Host "FAILURE: Status is still $($adminCase.case.status)"
}
