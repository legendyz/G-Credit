# =============================================================================
# Sprint 1 Comprehensive Test Suite
# Tests all implemented authentication and user management features
# =============================================================================
# Stories Covered:
# - Story 2.1: Enhanced User Data Model
# - Story 2.2: User Registration
# - Story 2.3: JWT Login
# - Story 2.4: RBAC (Role-Based Access Control)
# - Story 2.5: Password Reset via Email
# - Story 2.6: User Profile Management
# - Story 2.7: Session Management and Logout
# =============================================================================

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0
$testResults = @()

# Test user data
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$adminUser = @{
    email = "admin-$timestamp@test.com"
    password = "Admin123456"
    firstName = "Admin"
    lastName = "User"
    role = "ADMIN"
}

$employeeUser = @{
    email = "employee-$timestamp@test.com"
    password = "Employee123456"
    firstName = "Employee"
    lastName = "User"
    role = "EMPLOYEE"
}

$issuerUser = @{
    email = "issuer-$timestamp@test.com"
    password = "Issuer123456"
    firstName = "Issuer"
    lastName = "User"
    role = "ISSUER"
}

$managerUser = @{
    email = "manager-$timestamp@test.com"
    password = "Manager123456"
    firstName = "Manager"
    lastName = "User"
    role = "MANAGER"
}

function Write-TestHeader {
    param([string]$Message)
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
}

function Write-TestSection {
    param([string]$Message)
    Write-Host ""
    Write-Host "--- $Message ---" -ForegroundColor Yellow
}

function Test-Endpoint {
    param(
        [string]$TestName,
        [scriptblock]$TestBlock
    )
    
    Write-Host "  Testing: $TestName" -NoNewline
    
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host " [PASS]" -ForegroundColor Green
            $script:testsPassed++
            $script:testResults += @{ Name = $TestName; Result = "PASS"; Error = $null }
            return $true
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            $script:testsFailed++
            $script:testResults += @{ Name = $TestName; Result = "FAIL"; Error = "Test returned false" }
            return $false
        }
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        if ($Verbose) {
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        $script:testsFailed++
        $script:testResults += @{ Name = $TestName; Result = "FAIL"; Error = $_.Exception.Message }
        return $false
    }
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

Write-TestHeader "Sprint 1 Comprehensive Test Suite"
Write-Host "Test run started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

Write-TestSection "Pre-flight Checks"

# Check backend
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5
    Write-Host "  Backend is running" -ForegroundColor Green
} catch {
    Write-Host "  Backend is NOT running!" -ForegroundColor Red
    Write-Host "  Please start backend: cd backend && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

# Check database
try {
    $ready = Invoke-RestMethod -Uri "$baseUrl/ready" -Method GET -TimeoutSec 5
    if ($ready.database -eq "connected") {
        Write-Host "  Database is connected" -ForegroundColor Green
    } else {
        Write-Host "  Database connection issue: $($ready.database)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not check database status" -ForegroundColor Yellow
}

# =============================================================================
# Story 2.2: User Registration
# =============================================================================

Write-TestHeader "Story 2.2: User Registration"

$adminToken = $null
$employeeToken = $null
$issuerToken = $null
$managerToken = $null

Test-Endpoint "Register Admin user" {
    $body = $adminUser | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body
    $response.email -eq $adminUser.email -and $response.role -eq "ADMIN"
}

Test-Endpoint "Register Employee user" {
    $body = $employeeUser | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body
    $response.email -eq $employeeUser.email -and $response.role -eq "EMPLOYEE"
}

Test-Endpoint "Register Issuer user" {
    $body = $issuerUser | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body
    $response.email -eq $issuerUser.email -and $response.role -eq "ISSUER"
}

Test-Endpoint "Register Manager user" {
    $body = $managerUser | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body
    $response.email -eq $managerUser.email -and $response.role -eq "MANAGER"
}

Test-Endpoint "Reject duplicate email registration" {
    try {
        $body = $adminUser | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 409
    }
}

Test-Endpoint "Reject weak password" {
    try {
        $weakUser = @{
            email = "weak-$timestamp@test.com"
            password = "weak"
            firstName = "Test"
            lastName = "User"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $weakUser -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 400
    }
}

# =============================================================================
# Story 2.3: JWT Login
# =============================================================================

Write-TestHeader "Story 2.3: JWT Login"

Test-Endpoint "Login Admin user and get tokens" {
    $body = @{
        email = $adminUser.email
        password = $adminUser.password
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    $script:adminToken = $response.accessToken
    $script:adminRefreshToken = $response.refreshToken
    $response.accessToken -and $response.refreshToken -and $response.user.role -eq "ADMIN"
}

Test-Endpoint "Login Employee user and get tokens" {
    $body = @{
        email = $employeeUser.email
        password = $employeeUser.password
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    $script:employeeToken = $response.accessToken
    $script:employeeRefreshToken = $response.refreshToken
    $response.accessToken -and $response.refreshToken -and $response.user.role -eq "EMPLOYEE"
}

Test-Endpoint "Login Issuer user and get tokens" {
    $body = @{
        email = $issuerUser.email
        password = $issuerUser.password
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    $script:issuerToken = $response.accessToken
    $script:issuerRefreshToken = $response.refreshToken
    $response.accessToken -and $response.refreshToken -and $response.user.role -eq "ISSUER"
}

Test-Endpoint "Login Manager user and get tokens" {
    $body = @{
        email = $managerUser.email
        password = $managerUser.password
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    $script:managerToken = $response.accessToken
    $script:managerRefreshToken = $response.refreshToken
    $response.accessToken -and $response.refreshToken -and $response.user.role -eq "MANAGER"
}

Test-Endpoint "Reject invalid credentials" {
    try {
        $body = @{
            email = $adminUser.email
            password = "WrongPassword123"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

Test-Endpoint "Reject non-existent user" {
    try {
        $body = @{
            email = "nonexistent@test.com"
            password = "Password123"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

# =============================================================================
# Story 2.4: RBAC (Role-Based Access Control)
# =============================================================================

Write-TestHeader "Story 2.4: RBAC (Role-Based Access Control)"

# Test profile endpoint (all authenticated users)
Test-Endpoint "Admin can access /profile" {
    $headers = @{ "Authorization" = "Bearer $adminToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers
    $response.user.role -eq "ADMIN"
}

Test-Endpoint "Employee can access /profile" {
    $headers = @{ "Authorization" = "Bearer $employeeToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers
    $response.user.role -eq "EMPLOYEE"
}

Test-Endpoint "Issuer can access /profile" {
    $headers = @{ "Authorization" = "Bearer $issuerToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers
    $response.user.role -eq "ISSUER"
}

Test-Endpoint "Manager can access /profile" {
    $headers = @{ "Authorization" = "Bearer $managerToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers
    $response.user.role -eq "MANAGER"
}

# Test admin-only endpoint
Test-Endpoint "Admin can access /admin-only" {
    $headers = @{ "Authorization" = "Bearer $adminToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/admin-only" -Method GET -Headers $headers
    $response.message -eq "Admin access granted"
}

Test-Endpoint "Employee CANNOT access /admin-only" {
    try {
        $headers = @{ "Authorization" = "Bearer $employeeToken" }
        Invoke-RestMethod -Uri "$baseUrl/admin-only" -Method GET -Headers $headers -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 403
    }
}

# Test issuer-only endpoint
Test-Endpoint "Issuer can access /issuer-only" {
    $headers = @{ "Authorization" = "Bearer $issuerToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/issuer-only" -Method GET -Headers $headers
    $response.message -eq "Issuer access granted"
}

Test-Endpoint "Admin can access /issuer-only" {
    $headers = @{ "Authorization" = "Bearer $adminToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/issuer-only" -Method GET -Headers $headers
    $response.message -eq "Issuer access granted"
}

Test-Endpoint "Employee CANNOT access /issuer-only" {
    try {
        $headers = @{ "Authorization" = "Bearer $employeeToken" }
        Invoke-RestMethod -Uri "$baseUrl/issuer-only" -Method GET -Headers $headers -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 403
    }
}

# Test manager-only endpoint
Test-Endpoint "Manager can access /manager-only" {
    $headers = @{ "Authorization" = "Bearer $managerToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/manager-only" -Method GET -Headers $headers
    $response.message -eq "Manager access granted"
}

Test-Endpoint "Admin can access /manager-only" {
    $headers = @{ "Authorization" = "Bearer $adminToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/manager-only" -Method GET -Headers $headers
    $response.message -eq "Manager access granted"
}

Test-Endpoint "Employee CANNOT access /manager-only" {
    try {
        $headers = @{ "Authorization" = "Bearer $employeeToken" }
        Invoke-RestMethod -Uri "$baseUrl/manager-only" -Method GET -Headers $headers -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 403
    }
}

# Test unauthenticated access
Test-Endpoint "Reject access without token" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

Test-Endpoint "Reject access with invalid token" {
    try {
        $headers = @{ "Authorization" = "Bearer invalid.token.here" }
        Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

# =============================================================================
# Story 2.5: Password Reset via Email
# =============================================================================

Write-TestHeader "Story 2.5: Password Reset via Email"

$resetToken = $null

Test-Endpoint "Request password reset" {
    $body = @{ email = $employeeUser.email } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/request-reset" -Method POST -ContentType "application/json" -Body $body
    $response.message -like "*email*"
}

Test-Endpoint "Request reset for non-existent email (no enumeration)" {
    $body = @{ email = "nonexistent@test.com" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/request-reset" -Method POST -ContentType "application/json" -Body $body
    # Should return same message (no email enumeration)
    $response.message -like "*email*"
}

# Note: Cannot test actual reset without accessing database or email
# This would require reading the reset token from database
Write-Host "  Note: Full password reset flow requires database access for token" -ForegroundColor Gray

# =============================================================================
# Story 2.6: User Profile Management
# =============================================================================

Write-TestHeader "Story 2.6: User Profile Management"

Test-Endpoint "Get user profile" {
    $headers = @{ "Authorization" = "Bearer $employeeToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method GET -Headers $headers
    $response.email -eq $employeeUser.email -and $response.firstName -eq $employeeUser.firstName
}

Test-Endpoint "Update user profile" {
    $headers = @{ "Authorization" = "Bearer $employeeToken" }
    $body = @{
        firstName = "UpdatedEmployee"
        lastName = "UpdatedUser"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method PATCH -Headers $headers -ContentType "application/json" -Body $body
    $response.firstName -eq "UpdatedEmployee" -and $response.lastName -eq "UpdatedUser"
}

Test-Endpoint "Verify profile update persisted" {
    $headers = @{ "Authorization" = "Bearer $employeeToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method GET -Headers $headers
    $response.firstName -eq "UpdatedEmployee" -and $response.lastName -eq "UpdatedUser"
}

Test-Endpoint "Change password with correct current password" {
    $headers = @{ "Authorization" = "Bearer $employeeToken" }
    $body = @{
        currentPassword = $employeeUser.password
        newPassword = "NewEmployee123456"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" -Method POST -Headers $headers -ContentType "application/json" -Body $body
    $script:employeeUser.password = "NewEmployee123456" # Update for future tests
    $response.message -like "*success*"
}

Test-Endpoint "Old password rejected after change" {
    try {
        $body = @{
            email = $employeeUser.email
            password = "Employee123456" # Old password
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

Test-Endpoint "New password works" {
    $body = @{
        email = $employeeUser.email
        password = $employeeUser.password # New password
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    $script:employeeToken = $response.accessToken # Update token
    $response.accessToken -and $response.user.email -eq $employeeUser.email
}

Test-Endpoint "Reject wrong current password" {
    try {
        $headers = @{ "Authorization" = "Bearer $employeeToken" }
        $body = @{
            currentPassword = "WrongPassword123"
            newPassword = "AnotherNew123456"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/change-password" -Method POST -Headers $headers -ContentType "application/json" -Body $body -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

# =============================================================================
# Story 2.7: Session Management and Logout
# =============================================================================

Write-TestHeader "Story 2.7: Session Management and Logout"

# Get a fresh token for testing
$testLoginBody = @{
    email = $adminUser.email
    password = $adminUser.password
} | ConvertTo-Json
$testLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $testLoginBody
$testAccessToken = $testLoginResponse.accessToken
$testRefreshToken = $testLoginResponse.refreshToken

Test-Endpoint "Refresh access token" {
    $body = @{ refreshToken = $testRefreshToken } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -ContentType "application/json" -Body $body
    $script:newAccessToken = $response.accessToken
    # Token should exist and be different (though might be same length)
    $response.accessToken -ne $null -and $response.accessToken.Length -gt 0
}

Test-Endpoint "New access token works" {
    $headers = @{ "Authorization" = "Bearer $newAccessToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers
    $response.user.email -eq $adminUser.email
}

Test-Endpoint "Logout and revoke refresh token" {
    $body = @{ refreshToken = $testRefreshToken } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method POST -ContentType "application/json" -Body $body
    $response.message -like "*success*"
}

Test-Endpoint "Revoked refresh token rejected" {
    try {
        $body = @{ refreshToken = $testRefreshToken } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        $false # Should not succeed
    } catch {
        $_.Exception.Response.StatusCode -eq 401
    }
}

Test-Endpoint "Access token still works until expiry" {
    $headers = @{ "Authorization" = "Bearer $newAccessToken" }
    $response = Invoke-RestMethod -Uri "$baseUrl/profile" -Method GET -Headers $headers
    $response.user.email -eq $adminUser.email
}

# =============================================================================
# Test Summary
# =============================================================================

Write-TestHeader "Test Summary"

$totalTests = $testsPassed + $testsFailed
$passRate = if ($totalTests -gt 0) { [math]::Round(($testsPassed / $totalTests) * 100, 2) } else { 0 }

Write-Host ""
Write-Host "Total Tests Run: $totalTests" -ForegroundColor Cyan
Write-Host "Tests Passed:    $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed:    $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Pass Rate:       $passRate%" -ForegroundColor $(if ($passRate -eq 100) { "Green" } elseif ($passRate -ge 90) { "Yellow" } else { "Red" })
Write-Host ""

if ($testsFailed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Red
        if ($Verbose -and $_.Error) {
            Write-Host "    Error: $($_.Error)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# Final verdict
Write-Host "=" * 80 -ForegroundColor Cyan
if ($testsFailed -eq 0) {
    Write-Host "SPRINT 1 VERIFICATION: ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "All authentication and user management features are working correctly." -ForegroundColor Green
} else {
    Write-Host "SPRINT 1 VERIFICATION: SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host "Please review failed tests above and fix issues." -ForegroundColor Yellow
}
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Export results to file
$reportFile = "sprint-1-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$testResults | ForEach-Object {
    "$($_.Result): $($_.Name)" + $(if ($_.Error) { " - Error: $($_.Error)" } else { "" })
} | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "Test report saved to: $reportFile" -ForegroundColor Gray
Write-Host "Test run completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Exit with appropriate code
exit $(if ($testsFailed -eq 0) { 0 } else { 1 })
