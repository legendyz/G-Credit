# RBAC Test Suite for G-Credit
# Tests role-based access control with four roles: ADMIN, ISSUER, MANAGER, EMPLOYEE

$baseUrl = "http://localhost:3000"
$passCount = 0
$failCount = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " RBAC (Role-Based Access Control) Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Helper function to make HTTP requests
function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null,
        [int]$ExpectedStatus,
        [string]$TestName
    )

    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }

        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $headers
            ErrorAction = "Stop"
        }

        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }

        $response = Invoke-RestMethod @params
        $statusCode = 200 # Default for successful responses

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
        } elseif ($statusCode -eq 409 -and $TestName -like "Setup: Register*") {
            # User already exists - treat as success for idempotency
            Write-Host "✅ PASS" -ForegroundColor Green -NoNewline
            Write-Host " - $TestName (User already exists - OK)"
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
# Setup: Create test users for each role
# ============================================

Write-Host "Setting up test users..." -ForegroundColor Yellow

# Create ADMIN user
$adminRegister = @{
    email = "admin.test@gcredit.com"
    password = "AdminPass123!"
    firstName = "Test"
    lastName = "Admin"
    role = "ADMIN"
}
Invoke-ApiTest -Method "POST" -Endpoint "/auth/register" -Body $adminRegister -ExpectedStatus 201 -TestName "Setup: Register ADMIN user" | Out-Null

# Create ISSUER user
$issuerRegister = @{
    email = "issuer.test@gcredit.com"
    password = "IssuerPass123!"
    firstName = "Test"
    lastName = "Issuer"
    role = "ISSUER"
}
Invoke-ApiTest -Method "POST" -Endpoint "/auth/register" -Body $issuerRegister -ExpectedStatus 201 -TestName "Setup: Register ISSUER user" | Out-Null

# Create MANAGER user
$managerRegister = @{
    email = "manager.test@gcredit.com"
    password = "ManagerPass123!"
    firstName = "Test"
    lastName = "Manager"
    role = "MANAGER"
}
Invoke-ApiTest -Method "POST" -Endpoint "/auth/register" -Body $managerRegister -ExpectedStatus 201 -TestName "Setup: Register MANAGER user" | Out-Null

# EMPLOYEE user already exists (Alice)
Write-Host "`n" -NoNewline

# ============================================
# Get tokens for each user
# ============================================

Write-Host "Logging in test users..." -ForegroundColor Yellow

# Create and login EMPLOYEE user (replacing Alice since DB was reset)
$employeeRegister = @{
    email = "employee.test@gcredit.com"
    password = "EmployeePass123!"
    firstName = "Test"
    lastName = "Employee"
    role = "EMPLOYEE"
}
Invoke-ApiTest -Method "POST" -Endpoint "/auth/register" -Body $employeeRegister -ExpectedStatus 201 -TestName "Setup: Register EMPLOYEE user" | Out-Null

Invoke-ApiTest -Method "POST" -Endpoint "/auth/register" -Body $employeeRegister -ExpectedStatus 201 -TestName "Setup: Register EMPLOYEE user" | Out-Null

$employeeLogin = @{ email = "employee.test@gcredit.com"; password = "EmployeePass123!" }
$employeeResponse = Invoke-ApiTest -Method "POST" -Endpoint "/auth/login" -Body $employeeLogin -ExpectedStatus 200 -TestName "Login: EMPLOYEE"
$employeeToken = $employeeResponse.accessToken

$adminLogin = @{ email = "admin.test@gcredit.com"; password = "AdminPass123!" }
$adminResponse = Invoke-ApiTest -Method "POST" -Endpoint "/auth/login" -Body $adminLogin -ExpectedStatus 200 -TestName "Login: ADMIN"
$adminToken = $adminResponse.accessToken

$issuerLogin = @{ email = "issuer.test@gcredit.com"; password = "IssuerPass123!" }
$issuerResponse = Invoke-ApiTest -Method "POST" -Endpoint "/auth/login" -Body $issuerLogin -ExpectedStatus 200 -TestName "Login: ISSUER"
$issuerToken = $issuerResponse.accessToken

$managerLogin = @{ email = "manager.test@gcredit.com"; password = "ManagerPass123!" }
$managerResponse = Invoke-ApiTest -Method "POST" -Endpoint "/auth/login" -Body $managerLogin -ExpectedStatus 200 -TestName "Login: MANAGER"
$managerToken = $managerResponse.accessToken

Write-Host "`n"

# ============================================
# Test 1: Public Routes (No Authentication)
# ============================================

Write-Host "Test Suite 1: Public Routes" -ForegroundColor Cyan
Invoke-ApiTest -Method "GET" -Endpoint "/health" -ExpectedStatus 200 -TestName "Public: /health without token"
Invoke-ApiTest -Method "GET" -Endpoint "/" -ExpectedStatus 200 -TestName "Public: / without token"
Write-Host ""

# ============================================
# Test 2: Authentication Required
# ============================================

Write-Host "Test Suite 2: Authentication Required" -ForegroundColor Cyan
Invoke-ApiTest -Method "GET" -Endpoint "/profile" -ExpectedStatus 401 -TestName "Protected: /profile without token (should return 401)"
Invoke-ApiTest -Method "GET" -Endpoint "/admin-only" -ExpectedStatus 401 -TestName "Protected: /admin-only without token (should return 401)"
Write-Host ""

# ============================================
# Test 3: EMPLOYEE Role Tests
# ============================================

Write-Host "Test Suite 3: EMPLOYEE Role Access" -ForegroundColor Cyan
Invoke-ApiTest -Method "GET" -Endpoint "/profile" -Token $employeeToken -ExpectedStatus 200 -TestName "EMPLOYEE: Can access /profile"
Invoke-ApiTest -Method "GET" -Endpoint "/admin-only" -Token $employeeToken -ExpectedStatus 403 -TestName "EMPLOYEE: Cannot access /admin-only (403)"
Invoke-ApiTest -Method "GET" -Endpoint "/issuer-only" -Token $employeeToken -ExpectedStatus 403 -TestName "EMPLOYEE: Cannot access /issuer-only (403)"
Invoke-ApiTest -Method "GET" -Endpoint "/manager-only" -Token $employeeToken -ExpectedStatus 403 -TestName "EMPLOYEE: Cannot access /manager-only (403)"
Write-Host ""

# ============================================
# Test 4: MANAGER Role Tests
# ============================================

Write-Host "Test Suite 4: MANAGER Role Access" -ForegroundColor Cyan
Invoke-ApiTest -Method "GET" -Endpoint "/profile" -Token $managerToken -ExpectedStatus 200 -TestName "MANAGER: Can access /profile"
Invoke-ApiTest -Method "GET" -Endpoint "/manager-only" -Token $managerToken -ExpectedStatus 200 -TestName "MANAGER: Can access /manager-only"
Invoke-ApiTest -Method "GET" -Endpoint "/admin-only" -Token $managerToken -ExpectedStatus 403 -TestName "MANAGER: Cannot access /admin-only (403)"
Invoke-ApiTest -Method "GET" -Endpoint "/issuer-only" -Token $managerToken -ExpectedStatus 403 -TestName "MANAGER: Cannot access /issuer-only (403)"
Write-Host ""

# ============================================
# Test 5: ISSUER Role Tests
# ============================================

Write-Host "Test Suite 5: ISSUER Role Access" -ForegroundColor Cyan
Invoke-ApiTest -Method "GET" -Endpoint "/profile" -Token $issuerToken -ExpectedStatus 200 -TestName "ISSUER: Can access /profile"
Invoke-ApiTest -Method "GET" -Endpoint "/issuer-only" -Token $issuerToken -ExpectedStatus 200 -TestName "ISSUER: Can access /issuer-only"
Invoke-ApiTest -Method "GET" -Endpoint "/admin-only" -Token $issuerToken -ExpectedStatus 403 -TestName "ISSUER: Cannot access /admin-only (403)"
Invoke-ApiTest -Method "GET" -Endpoint "/manager-only" -Token $issuerToken -ExpectedStatus 403 -TestName "ISSUER: Cannot access /manager-only (403)"
Write-Host ""

# ============================================
# Test 6: ADMIN Role Tests (Full Access)
# ============================================

Write-Host "Test Suite 6: ADMIN Role Access (Full Access)" -ForegroundColor Cyan
Invoke-ApiTest -Method "GET" -Endpoint "/profile" -Token $adminToken -ExpectedStatus 200 -TestName "ADMIN: Can access /profile"
Invoke-ApiTest -Method "GET" -Endpoint "/admin-only" -Token $adminToken -ExpectedStatus 200 -TestName "ADMIN: Can access /admin-only"
Invoke-ApiTest -Method "GET" -Endpoint "/issuer-only" -Token $adminToken -ExpectedStatus 200 -TestName "ADMIN: Can access /issuer-only"
Invoke-ApiTest -Method "GET" -Endpoint "/manager-only" -Token $adminToken -ExpectedStatus 200 -TestName "ADMIN: Can access /manager-only"
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
    Write-Host "`n✅ All tests passed! RBAC is working correctly." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests failed. Please review the errors above." -ForegroundColor Yellow
}
