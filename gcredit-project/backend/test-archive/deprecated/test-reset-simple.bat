@echo off
powershell -Command "$body = @{ email = 'reset.test@gcredit.com' } | ConvertTo-Json; $response = Invoke-RestMethod -Uri 'http://localhost:3000/auth/request-reset' -Method POST -Body $body -ContentType 'application/json'; Write-Host 'Success!' -ForegroundColor Green; Write-Host ($response | ConvertTo-Json); Write-Host ''; Write-Host 'Check the backend console for the password reset email with token' -ForegroundColor Cyan"
pause
