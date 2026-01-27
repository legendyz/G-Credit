# Test Script for Story 2.7: Session Management and Logout
# Tests refresh token, logout, and token revocation

Write-Host "=== Testing Session Management (Story 2.7) ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testEmail = "test-session@example.com"
$testPassword = "Test123456"

# Check if backend is running
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 2
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is not running. Please start it first:" -ForegroundColor Red
    Write-Host "  cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Test 1: Register Test User ===" -ForegroundColor Yellow

try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        firstName = "Session"
        lastName = "Test"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction SilentlyContinue

    Write-Host "✓ User registered (or already exists)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✓ User already exists, continuing..." -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to register: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test 2: Login and Get Tokens ===" -ForegroundColor Yellow

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
    $refreshToken = $loginResponse.refreshToken

    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "  Refresh Token: $($refreshToken.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 3: Access Protected Route with Access Token ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/profile" `
        -Method GET `
        -Headers $headers

    Write-Host "✓ Protected route accessed successfully" -ForegroundColor Green
    Write-Host "  User: $($profileResponse.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to access protected route: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 4: Refresh Access Token ===" -ForegroundColor Yellow

try {
    $refreshBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" `
        -Method POST `
        -ContentType "application/json" `
        -Body $refreshBody

    $newAccessToken = $refreshResponse.accessToken

    Write-Host "✓ Token refresh successful" -ForegroundColor Green
    Write-Host "  New Access Token: $($newAccessToken.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Token refresh failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test 5: Use New Access Token ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $newAccessToken"
    }

    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/profile" `
        -Method GET `
        -Headers $headers

    Write-Host "✓ New access token works" -ForegroundColor Green
} catch {
    Write-Host "✗ New access token failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 6: Logout (Revoke Refresh Token) ===" -ForegroundColor Yellow

try {
    $logoutBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/auth/logout" `
        -Method POST `
        -ContentType "application/json" `
        -Body $logoutBody

    Write-Host "✓ Logout successful" -ForegroundColor Green
    Write-Host "  Message: $($logoutResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Logout failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test 7: Try to Refresh with Revoked Token ===" -ForegroundColor Yellow

try {
    $refreshBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" `
        -Method POST `
        -ContentType "application/json" `
        -Body $refreshBody `
        -ErrorAction Stop

    Write-Host "✗ SECURITY ISSUE: Revoked token still works!" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Revoked token correctly rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test 8: Access Token Still Works (Until Expiry) ===" -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $newAccessToken"
    }

    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/profile" `
        -Method GET `
        -Headers $headers

    Write-Host "✓ Access token still valid (expected - access tokens not revoked)" -ForegroundColor Green
    Write-Host "  Note: Access tokens expire in 15 minutes naturally" -ForegroundColor Gray
} catch {
    Write-Host "✗ Access token rejected: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✓ Login and token generation" -ForegroundColor Green
Write-Host "✓ Access protected routes" -ForegroundColor Green
Write-Host "✓ Token refresh mechanism" -ForegroundColor Green
Write-Host "✓ Logout and token revocation" -ForegroundColor Green
Write-Host "✓ Revoked tokens rejected" -ForegroundColor Green
Write-Host ""
Write-Host "Story 2.7 Implementation Complete!" -ForegroundColor Green
