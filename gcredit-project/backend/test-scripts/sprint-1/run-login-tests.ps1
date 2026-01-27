# Login Endpoint Test Suite
# Story 2.3 - JWT Login Authentication

$baseUrl = "http://localhost:3000/auth/login"
$testsPassed = 0
$testsFailed = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " POST /auth/login - Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Valid Login
Write-Host "Test 1: Valid Login (alice.smith@gcredit.com)" -ForegroundColor Yellow
try {
    $body = @{
        email = "alice.smith@gcredit.com"
        password = "SecurePass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ PASS - Login successful" -ForegroundColor Green
    Write-Host "   Access Token: $($response.accessToken.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "   Refresh Token: $($response.refreshToken.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "   User: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Gray
    Write-Host "   Email: $($response.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($response.user.role)" -ForegroundColor Gray
    
    if ($response.user.passwordHash) {
        Write-Host "   ❌ SECURITY ISSUE: Password hash exposed!" -ForegroundColor Red
        $testsFailed++
    } else {
        Write-Host "   ✅ Password hash correctly excluded" -ForegroundColor Green
        $testsPassed++
    }
    
    $global:accessToken = $response.accessToken
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    $testsFailed++
}

Start-Sleep -Seconds 1

# Test 2: Invalid Password
Write-Host "`nTest 2: Invalid Password (should return 401)" -ForegroundColor Yellow
try {
    $body = @{
        email = "alice.smith@gcredit.com"
        password = "WrongPassword123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected invalid password" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ PASS - Correctly returned 401 Unauthorized" -ForegroundColor Green
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 401, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 3: Non-existent User
Write-Host "`nTest 3: Non-existent User (should return 401)" -ForegroundColor Yellow
try {
    $body = @{
        email = "nonexistent@gcredit.com"
        password = "SomePassword123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected non-existent user" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ PASS - Correctly returned 401 Unauthorized" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 401, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 4: Invalid Email Format
Write-Host "`nTest 4: Invalid Email Format (should return 400)" -ForegroundColor Yellow
try {
    $body = @{
        email = "not-an-email"
        password = "SecurePass123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected invalid email format" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS - Correctly returned 400 Bad Request" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 400, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 5: Missing Password
Write-Host "`nTest 5: Missing Password (should return 400)" -ForegroundColor Yellow
try {
    $body = @{
        email = "alice.smith@gcredit.com"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected missing password" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS - Correctly returned 400 Bad Request" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 400, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 6: Verify JWT Token Structure
if ($global:accessToken) {
    Write-Host "`nTest 6: JWT Token Structure Validation" -ForegroundColor Yellow
    try {
        $parts = $global:accessToken.Split('.')
        if ($parts.Count -eq 3) {
            Write-Host "✅ PASS - JWT has correct structure (header.payload.signature)" -ForegroundColor Green
            Write-Host "   Parts: $($parts.Count)" -ForegroundColor Gray
            $testsPassed++
        } else {
            Write-Host "❌ FAIL - JWT structure invalid (expected 3 parts, got $($parts.Count))" -ForegroundColor Red
            $testsFailed++
        }
    } catch {
        Write-Host "❌ FAIL - Error validating JWT structure: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ All tests passed! Login endpoint is working correctly.`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Please review the errors above.`n" -ForegroundColor Yellow
}
