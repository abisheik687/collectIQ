$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "dca@agency.com", "password": "dca123"}'
$token = $loginResponse.token

Write-Host "Login Successful. Token received."

$casesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/cases" -Method Get -Headers @{ Authorization = "Bearer $token" }

Write-Host "Cases Found for DCA User:"
$casesResponse.cases | Format-Table caseNumber, customerName, amount, status, assignedDcaName

if ($casesResponse.cases.Count -gt 0) {
    Write-Host "VERIFICATION PASSED: Cases are visible."
}
else {
    Write-Host "VERIFICATION FAILED: No cases found."
}
