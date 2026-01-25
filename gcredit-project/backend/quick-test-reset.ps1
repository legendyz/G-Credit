# Quick Password Reset Test

Write-Host "`n=== Testing Password Reset Endpoint ===" -ForegroundColor Cyan

# Test 1: Request password reset
Write-Host "`n1. Requesting password reset for reset.test@gcredit.com..."
try {
    $body = @{ email = "reset.test@gcredit.com" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/request-reset" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
    Write-Host "`nℹ️  Check backend console for email output with token" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:"
Write-Host "1. Check the backend console output above for the password reset email"
Write-Host "2. Copy the token from the reset URL"
Write-Host "3. Use the token to test password reset:"
Write-Host '   $body = @{ token = "YOUR_TOKEN"; newPassword = "NewPass123!" } | ConvertTo-Json'
Write-Host '   Invoke-RestMethod -Uri "http://localhost:3000/auth/reset-password" -Method POST -Body $body -ContentType "application/json"'
Write-Host ""
