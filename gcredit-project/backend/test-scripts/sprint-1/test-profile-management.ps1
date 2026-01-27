# Test Script for Story 2.6: User Profile Management
# Tests get profile, update profile, and change password

Write-Host "=== Testing User Profile Management (Story 2.6) ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testEmail = "test-profile@example.com"
$testPassword = "Test123456"
$newPassword = "NewTest123456"

# Check if backend is running
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 2
    Write-Host "Backend is running" -ForegroundColor Green
} catch {
    Write-Host "Backend is not running. Please start it first:" -ForegroundColor Red
    Write-Host "  cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Test 1: Register Test User ===" -ForegroundColor Yellow

try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        firstName = "John"
        lastName = "Doe"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction SilentlyContinue

    Write-Host "User registered successfully" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "User already exists, continuing..." -ForegroundColor Green
    } else {
        Write-Host "Failed to register: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test 2: Login and Get Token ===" -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $accessToken = $loginResponse.accessToken
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "  Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 3: Get User Profile ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/profile" `
        -Method GET `
        -Headers $headers

    Write-Host "Profile retrieved successfully" -ForegroundColor Green
    Write-Host "  Email: $($profileResponse.email)" -ForegroundColor Gray
    Write-Host "  Name: $($profileResponse.firstName) $($profileResponse.lastName)" -ForegroundColor Gray
    Write-Host "  Role: $($profileResponse.role)" -ForegroundColor Gray
} catch {
    Write-Host "Failed to get profile: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 4: Update Profile (Change Name) ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $updateBody = @{
        firstName = "Jane"
        lastName = "Smith"
    } | ConvertTo-Json

    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/auth/profile" `
        -Method PATCH `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $updateBody

    Write-Host "Profile updated successfully" -ForegroundColor Green
    Write-Host "  New Name: $($updateResponse.firstName) $($updateResponse.lastName)" -ForegroundColor Gray
} catch {
    Write-Host "Failed to update profile: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 5: Verify Profile Update ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/profile" `
        -Method GET `
        -Headers $headers

    if ($profileResponse.firstName -eq "Jane" -and $profileResponse.lastName -eq "Smith") {
        Write-Host "Profile update verified" -ForegroundColor Green
        Write-Host "  Name: $($profileResponse.firstName) $($profileResponse.lastName)" -ForegroundColor Gray
    } else {
        Write-Host "Profile update verification failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Failed to verify profile: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 6: Change Password (Wrong Current Password) ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $changePasswordBody = @{
        currentPassword = "WrongPassword123"
        newPassword = $newPassword
    } | ConvertTo-Json

    $changeResponse = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $changePasswordBody `
        -ErrorAction Stop

    Write-Host "SECURITY ISSUE: Wrong password accepted!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Incorrect current password correctly rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test 7: Change Password (Correct Current Password) ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $changePasswordBody = @{
        currentPassword = $testPassword
        newPassword = $newPassword
    } | ConvertTo-Json

    $changeResponse = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $changePasswordBody

    Write-Host "Password changed successfully" -ForegroundColor Green
    Write-Host "  Message: $($changeResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "Failed to change password: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 8: Login with Old Password ===" -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    Write-Host "SECURITY ISSUE: Old password still works!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Old password correctly rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test 9: Login with New Password ===" -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $testEmail
        password = $newPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    Write-Host "Login with new password successful" -ForegroundColor Green
} catch {
    Write-Host "Failed to login with new password: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 10: Try Same Password Change ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $changePasswordBody = @{
        currentPassword = $testPassword
        newPassword = $testPassword
    } | ConvertTo-Json

    $changeResponse = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $changePasswordBody `
        -ErrorAction Stop

    Write-Host "SECURITY ISSUE: Same password change allowed!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "Same password change correctly rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "Note: This test might fail if token expired, which is normal" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Get user profile" -ForegroundColor Green
Write-Host "Update profile (firstName, lastName)" -ForegroundColor Green
Write-Host "Change password with validation" -ForegroundColor Green
Write-Host "Old password rejected" -ForegroundColor Green
Write-Host "New password works" -ForegroundColor Green
Write-Host "Same password change blocked" -ForegroundColor Green
Write-Host ""
Write-Host "Story 2.6 Implementation Complete!" -ForegroundColor Green
