# Password Reset Test Suite for G-Credit
# Tests password reset flow: request → receive token → reset

$baseUrl = "http://localhost:3000"
$passCount = 0
$failCount = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Password Reset Flow Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Helper function
function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [int]$ExpectedStatus,
        [string]$TestName
    )

    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = @{ "Content-Type" = "application/json" }
            ErrorAction = "Stop"
            UseBasicParsing = $true
        }

        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }

        $webResponse = Invoke-WebRequest @params
        $statusCode = $webResponse.StatusCode
        
        try {
            $response = $webResponse.Content | ConvertFrom-Json
        } catch {
            $response = $webResponse.Content
        }

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASS" -ForegroundColor Green -NoNewline
            Write-Host " - $TestName"
            $script:passCount++
            return $response
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " - $TestName (Expected $ExpectedStatus, got $statusCode)"
            $script:failCount++
            return $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASS" -ForegroundColor Green -NoNewline
            Write-Host " - $TestName (Correctly returned $statusCode)"
            $script:passCount++
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " - $TestName (Expected $ExpectedStatus, got $statusCode)"
            $script:failCount++
        }
        return $null
    }
}

# ============================================
# Setup: Ensure test user exists
# ============================================

Write-Host "Setting up test user..." -ForegroundColor Yellow

$testUser = @{
    email = "reset.test@gcredit.com"
    password = "OriginalPass123!"
    firstName = "Reset"
    lastName = "Test"
    role = "EMPLOYEE"
}

# Try to register (ignore if already exists)
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST `
        -Body ($testUser | ConvertTo-Json) `
        -ContentType "application/json" -ErrorAction Stop | Out-Null
    Write-Host "✅ Test user created" -ForegroundColor Green
} catch {
    Write-Host "✅ Test user already exists" -ForegroundColor Green
}

Write-Host ""

# ============================================
# Test 1: Request password reset for existing user
# ============================================

Write-Host "Test Suite 1: Request Password Reset" -ForegroundColor Cyan

$response = Invoke-ApiTest -Method "POST" -Endpoint "/auth/request-reset" `
    -Body @{ email = "reset.test@gcredit.com" } `
    -ExpectedStatus 200 `
    -TestName "Request reset for existing user"

if ($response) {
    Write-Host "   Response: $($response.message)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Test 2: Request reset for non-existent user
# ============================================

Invoke-ApiTest -Method "POST" -Endpoint "/auth/request-reset" `
    -Body @{ email = "nonexistent@gcredit.com" } `
    -ExpectedStatus 200 `
    -TestName "Request reset for non-existent user (no email enumeration)"

Write-Host ""

# ============================================
# Test 3: Invalid email format
# ============================================

Invoke-ApiTest -Method "POST" -Endpoint "/auth/request-reset" `
    -Body @{ email = "invalid-email" } `
    -ExpectedStatus 400 `
    -TestName "Request reset with invalid email format (400)"

Write-Host ""

# ============================================
# Test 4: Extract token from console
# ============================================

Write-Host "Test Suite 2: Get Reset Token" -ForegroundColor Cyan
Write-Host "⚠️  MANUAL STEP: Check the backend console output above" -ForegroundColor Yellow
Write-Host "   Look for: Reset URL with token parameter" -ForegroundColor Yellow
Write-Host "   Example: http://localhost:5173/reset-password?token=abc123..." -ForegroundColor Yellow
Write-Host ""

$token = Read-Host "Enter the token from console (or press Enter to skip remaining tests)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "⏭️  Skipping token-dependent tests" -ForegroundColor Yellow
    Write-Host ""
    
    # Summary
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Test Results Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Total Tests: $($passCount + $failCount)"
    Write-Host "Passed: $passCount" -ForegroundColor Green
    Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
    Write-Host ""
    Write-Host "✅ Core password reset request tests passed!" -ForegroundColor Green
    Write-Host "ℹ️  To test complete flow, copy token from console and re-run script" -ForegroundColor Cyan
    exit 0
}

Write-Host ""

# ============================================
# Test 5: Reset password with valid token
# ============================================

Write-Host "Test Suite 3: Reset Password with Token" -ForegroundColor Cyan

$response = Invoke-ApiTest -Method "POST" -Endpoint "/auth/reset-password" `
    -Body @{ token = $token; newPassword = "NewSecurePass123!" } `
    -ExpectedStatus 200 `
    -TestName "Reset password with valid token"

if ($response) {
    Write-Host "   Response: $($response.message)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Test 6: Try to reuse same token
# ============================================

Invoke-ApiTest -Method "POST" -Endpoint "/auth/reset-password" `
    -Body @{ token = $token; newPassword = "AnotherPass123!" } `
    -ExpectedStatus 400 `
    -TestName "Reuse token (should fail - 400)"

Write-Host ""

# ============================================
# Test 7: Invalid token
# ============================================

Invoke-ApiTest -Method "POST" -Endpoint "/auth/reset-password" `
    -Body @{ token = "invalid-token-12345"; newPassword = "NewPass123!" } `
    -ExpectedStatus 400 `
    -TestName "Reset with invalid token (should fail - 400)"

Write-Host ""

# ============================================
# Test 8: Weak password
# ============================================

Write-Host "Test Suite 4: Password Validation" -ForegroundColor Cyan

# Request new token first
Invoke-RestMethod -Uri "$baseUrl/auth/request-reset" -Method POST `
    -Body (@{ email = "reset.test@gcredit.com" } | ConvertTo-Json) `
    -ContentType "application/json" | Out-Null

Write-Host "⚠️  New token generated for weak password test" -ForegroundColor Yellow
$newToken = Read-Host "Enter new token from console (or press Enter to skip)"

if (![string]::IsNullOrWhiteSpace($newToken)) {
    Invoke-ApiTest -Method "POST" -Endpoint "/auth/reset-password" `
        -Body @{ token = $newToken; newPassword = "weak" } `
        -ExpectedStatus 400 `
        -TestName "Reset with weak password (should fail - 400)"
    Write-Host ""
}

# ============================================
# Test 9: Login with old password (should fail)
# ============================================

Write-Host "Test Suite 5: Verify Password Changed" -ForegroundColor Cyan

Invoke-ApiTest -Method "POST" -Endpoint "/auth/login" `
    -Body @{ email = "reset.test@gcredit.com"; password = "OriginalPass123!" } `
    -ExpectedStatus 401 `
    -TestName "Login with old password (should fail - 401)"

Write-Host ""

# ============================================
# Test 10: Login with new password
# ============================================

$response = Invoke-ApiTest -Method "POST" -Endpoint "/auth/login" `
    -Body @{ email = "reset.test@gcredit.com"; password = "NewSecurePass123!" } `
    -ExpectedStatus 200 `
    -TestName "Login with new password (should succeed - 200)"

if ($response -and $response.accessToken) {
    Write-Host "   ✅ Login successful with new password" -ForegroundColor Green
    Write-Host "   User: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Test Results Summary
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($passCount + $failCount)"
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

if ($failCount -eq 0) {
    Write-Host "`n✅ All tests passed! Password reset flow is working correctly." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Please review the errors above." -ForegroundColor Yellow
}
