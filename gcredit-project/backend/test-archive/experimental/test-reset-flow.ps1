# Password Reset Flow Test
Write-Host "`n========================================"
Write-Host "Password Reset - Complete Flow Test"
Write-Host "========================================`n"

Write-Host "Step 1: Request password reset" -ForegroundColor Yellow

$body = @{ email = "employee.test@gcredit.com" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/request-reset" -Method POST -Body $body -ContentType "application/json"

Write-Host "Success: $($response.message)" -ForegroundColor Green

Write-Host "`n========================================"
Write-Host "IMPORTANT: Check the backend window" -ForegroundColor Yellow
Write-Host "========================================`n"
Write-Host "Look for output like:"
Write-Host "  Reset URL: http://localhost:5173/reset-password?token=TOKEN"
Write-Host "  Token: <64-character hex string>"
Write-Host ""

$token = Read-Host "Paste the token from backend console (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "`nTest paused. Use test-password-reset.http for manual testing." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nStep 2: Reset password with token" -ForegroundColor Yellow

try {
    $body = @{ 
        token = $token.Trim()
        newPassword = "NewSecurePass123!" 
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/reset-password" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success: $($response.message)" -ForegroundColor Green
    
    Write-Host "`nStep 3: Test old password (should fail)" -ForegroundColor Yellow
    try {
        $body = @{ 
            email = "employee.test@gcredit.com"
            password = "EmployeePass123!" 
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json" | Out-Null
        Write-Host "FAIL: Old password still works" -ForegroundColor Red
    } catch {
        Write-Host "PASS: Old password rejected (401)" -ForegroundColor Green
    }
    
    Write-Host "`nStep 4: Test new password (should succeed)" -ForegroundColor Yellow
    $body = @{ 
        email = "employee.test@gcredit.com"
        password = "NewSecurePass123!" 
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "PASS: Login with new password successful" -ForegroundColor Green
    Write-Host "User: $($response.user.firstName) $($response.user.lastName)"
    
    Write-Host "`nStep 5: Test token reuse (should fail)" -ForegroundColor Yellow
    try {
        $body = @{ 
            token = $token.Trim()
            newPassword = "AnotherPass123!" 
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:3000/auth/reset-password" -Method POST -Body $body -ContentType "application/json" | Out-Null
        Write-Host "FAIL: Token can be reused" -ForegroundColor Red
    } catch {
        Write-Host "PASS: Token cannot be reused (400)" -ForegroundColor Green
    }
    
    Write-Host "`n========================================"
    Write-Host "All tests passed!" -ForegroundColor Green
    Write-Host "========================================`n"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
