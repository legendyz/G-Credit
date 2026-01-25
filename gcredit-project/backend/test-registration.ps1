# Test User Registration Endpoint
# Story 2.2 - Task 2.2.7: Test Registration Flow

Write-Host "Testing POST /auth/register endpoint..." -ForegroundColor Cyan

# Test 1: Valid Registration
Write-Host "`n1. Testing valid registration..." -ForegroundColor Yellow
try {
    $body = @{
        email = "john.doe@gcredit.com"
        password = "SecurePass123"
        firstName = "John"
        lastName = "Doe"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "User ID: $($response.id)"
    Write-Host "Email: $($response.email)"
    Write-Host "Name: $($response.firstName) $($response.lastName)"
    Write-Host "Role: $($response.role)"
    Write-Host "Password hash in response: $(if ($response.passwordHash) { 'YES (SHOULD BE NO)' } else { 'NO (CORRECT)' })" `
        -ForegroundColor $(if ($response.passwordHash) { 'Red' } else { 'Green' })
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Duplicate Email
Write-Host "`n2. Testing duplicate email (should fail with 409)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "john.doe@gcredit.com"
        password = "AnotherPass123"
        firstName = "Jane"
        lastName = "Smith"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "❌ Should have failed but succeeded!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Correctly rejected duplicate email (409 Conflict)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 3: Weak Password
Write-Host "`n3. Testing weak password (should fail with 400)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "jane.doe@gcredit.com"
        password = "weak"
        firstName = "Jane"
        lastName = "Doe"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "❌ Should have failed but succeeded!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected weak password (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 4: Invalid Email Format
Write-Host "`n4. Testing invalid email format (should fail with 400)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "not-an-email"
        password = "SecurePass123"
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "❌ Should have failed but succeeded!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected invalid email (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 5: Missing Required Fields
Write-Host "`n5. Testing missing firstName (should fail with 400)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@gcredit.com"
        password = "SecurePass123"
        lastName = "User"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "❌ Should have failed but succeeded!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected missing firstName (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Suite Complete ===" -ForegroundColor Cyan
