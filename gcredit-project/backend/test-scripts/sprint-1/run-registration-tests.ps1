# Registration Endpoint Test Suite
# Story 2.2 - User Registration Testing

$baseUrl = "http://localhost:3000/auth/register"
$testsPassed = 0
$testsFailed = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " POST /auth/register - Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Valid Registration
Write-Host "Test 1: Valid Registration" -ForegroundColor Yellow
try {
    $body = @{
        email = "alice.smith@gcredit.com"
        password = "SecurePass123"
        firstName = "Alice"
        lastName = "Smith"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ PASS - User created successfully" -ForegroundColor Green
    Write-Host "   User ID: $($response.id)" -ForegroundColor Gray
    Write-Host "   Email: $($response.email)" -ForegroundColor Gray
    Write-Host "   Name: $($response.firstName) $($response.lastName)" -ForegroundColor Gray
    Write-Host "   Role: $($response.role)" -ForegroundColor Gray
    Write-Host "   Active: $($response.isActive)" -ForegroundColor Gray
    Write-Host "   Created: $($response.createdAt)" -ForegroundColor Gray
    
    if ($response.passwordHash) {
        Write-Host "   ❌ SECURITY ISSUE: Password hash exposed in response!" -ForegroundColor Red
        $testsFailed++
    } else {
        Write-Host "   ✅ Password hash correctly excluded from response" -ForegroundColor Green
        $testsPassed++
    }
    
    $global:testUserId = $response.id
    $global:testEmail = $response.email
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    $testsFailed++
}

Start-Sleep -Seconds 1

# Test 2: Duplicate Email (should fail with 409)
Write-Host "`nTest 2: Duplicate Email (should return 409 Conflict)" -ForegroundColor Yellow
try {
    $body = @{
        email = $global:testEmail
        password = "AnotherPass123"
        firstName = "Jane"
        lastName = "Doe"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected duplicate email but succeeded" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "✅ PASS - Correctly returned 409 Conflict" -ForegroundColor Green
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 409, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 3: Weak Password (should fail with 400)
Write-Host "`nTest 3: Weak Password (should return 400 Bad Request)" -ForegroundColor Yellow
try {
    $body = @{
        email = "bob.jones@gcredit.com"
        password = "weak"
        firstName = "Bob"
        lastName = "Jones"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected weak password but succeeded" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS - Correctly returned 400 Bad Request" -ForegroundColor Green
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 400, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 4: Invalid Email Format (should fail with 400)
Write-Host "`nTest 4: Invalid Email Format (should return 400)" -ForegroundColor Yellow
try {
    $body = @{
        email = "not-an-email"
        password = "SecurePass123"
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected invalid email but succeeded" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS - Correctly returned 400 Bad Request" -ForegroundColor Green
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 400, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 5: Missing Required Fields (should fail with 400)
Write-Host "`nTest 5: Missing Required Field (firstName)" -ForegroundColor Yellow
try {
    $body = @{
        email = "incomplete@gcredit.com"
        password = "SecurePass123"
        lastName = "User"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected missing firstName but succeeded" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS - Correctly returned 400 Bad Request" -ForegroundColor Green
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 400, got $statusCode" -ForegroundColor Red
        $testsFailed++
    }
}

Start-Sleep -Seconds 1

# Test 6: Password without uppercase (should fail with 400)
Write-Host "`nTest 6: Password Missing Uppercase (should return 400)" -ForegroundColor Yellow
try {
    $body = @{
        email = "charlie@gcredit.com"
        password = "lowercase123"
        firstName = "Charlie"
        lastName = "Brown"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL - Should have rejected password without uppercase" -ForegroundColor Red
    $testsFailed++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ PASS - Correctly returned 400 Bad Request" -ForegroundColor Green
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "❌ FAIL - Expected 400, got $statusCode" -ForegroundColor Red
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
    Write-Host "`n✅ All tests passed! Registration endpoint is working correctly.`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Please review the errors above.`n" -ForegroundColor Yellow
}
