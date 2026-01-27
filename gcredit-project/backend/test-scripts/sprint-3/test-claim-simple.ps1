# Simple Badge Claim Test - Story 4.3
# Prerequisite: Server must be running and seed data must exist

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Story 4.3: Badge Claim Simple Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Hardcoded test data - replace with your actual values
Write-Host "Enter test data (from your database):" -ForegroundColor Yellow
$adminEmail = Read-Host "Admin email (default: admin@gcredit.test)"
if ([string]::IsNullOrWhiteSpace($adminEmail)) { $adminEmail = "admin@gcredit.test" }

$adminPassword = Read-Host "Admin password (default: Admin123!)"
if ([string]::IsNullOrWhiteSpace($adminPassword)) { $adminPassword = "Admin123!" }

$recipientId = Read-Host "Recipient user ID (UUID format)"
if ([string]::IsNullOrWhiteSpace($recipientId)) {
    Write-Host "❌ Recipient ID is required!" -ForegroundColor Red
    exit 1
}

# Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            email = $adminEmail
            password = $adminPassword
        } | ConvertTo-Json)
    
    $token = $loginResponse.accessToken
    Write-Host "✅ Logged in as $adminEmail" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Get template
Write-Host "`n2. Getting badge template..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$baseUrl/api/badge-templates?status=ACTIVE" `
        -Method GET `
        -Headers @{Authorization = "Bearer $token"}
    
    if ($templates.data.Count -eq 0) {
        Write-Host "❌ No active templates" -ForegroundColor Red
        exit 1
    }
    
    $templateId = $templates.data[0].id
    Write-Host "✅ Template: $($templates.data[0].name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get template" -ForegroundColor Red
    exit 1
}

# Issue badge
Write-Host "`n3. Issuing badge..." -ForegroundColor Yellow
try {
    $issueResponse = Invoke-RestMethod -Uri "$baseUrl/api/badges" `
        -Method POST `
        -Headers @{Authorization = "Bearer $token"} `
        -ContentType "application/json" `
        -Body (@{
            templateId = $templateId
            recipientId = $recipientId
            expiresIn = 365
        } | ConvertTo-Json)
    
    $badgeId = $issueResponse.id
    $claimToken = $issueResponse.claimToken
    
    Write-Host "✅ Badge issued!" -ForegroundColor Green
    Write-Host "   Badge ID: $badgeId" -ForegroundColor Gray
    Write-Host "   Token: $claimToken" -ForegroundColor Gray
    Write-Host "   Status: $($issueResponse.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to issue badge" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Claim badge (PUBLIC - no auth)
Write-Host "`n4. Claiming badge (PUBLIC endpoint)..." -ForegroundColor Yellow
try {
    $claimResponse = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            claimToken = $claimToken
        } | ConvertTo-Json)
    
    Write-Host "✅ Badge claimed!" -ForegroundColor Green
    Write-Host "   Status: $($claimResponse.status)" -ForegroundColor Gray
    Write-Host "   Claimed At: $($claimResponse.claimedAt)" -ForegroundColor Gray
    Write-Host "   Message: $($claimResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Claim failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Try double claim
Write-Host "`n5. Testing double claim (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            claimToken = $claimToken
        } | ConvertTo-Json) `
        -ErrorAction Stop
    
    Write-Host "❌ Should have failed!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "✅ Correctly rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ Test Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
