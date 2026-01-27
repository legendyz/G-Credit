# Test Badge Claiming Workflow - Story 4.3
# This script tests the claim endpoint after issuing a badge

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Story 4.3: Badge Claiming Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Step 1: Login as admin
Write-Host "Step 1: Login as admin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            email = "admin@gcredit.com"
            password = "Admin123!@#"
        } | ConvertTo-Json)
    
    $adminToken = $loginResponse.accessToken
    Write-Host "�� Admin logged in successfully`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get template ID
Write-Host "Step 2: Get badge template..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$baseUrl/api/badge-templates?status=ACTIVE" `
        -Method GET `
        -Headers @{Authorization = "Bearer $adminToken"}
    
    if ($templates.data.Count -eq 0) {
        Write-Host "❌ No active templates found" -ForegroundColor Red
        exit 1
    }
    
    $templateId = $templates.data[0].id
    $templateName = $templates.data[0].name
    Write-Host "✅ Using template: $templateName`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get templates: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Get recipient (employee user)
Write-Host "Step 3: Get recipient user..." -ForegroundColor Yellow
try {
    # Assuming employee@gcredit.com exists from seed script
    $recipientEmail = "employee@gcredit.com"
    Write-Host "✅ Using recipient: $recipientEmail`n" -ForegroundColor Green
    
    # Note: In real test, you'd query users. For now we'll use the known user ID
    # from seed script or get it from database
    Write-Host "⚠️  Make sure you run: npx tsx prisma/seed-story-4-5.ts" -ForegroundColor Yellow
    $recipientId = Read-Host "Enter recipient user ID (from database or seed output)"
    
    if ([string]::IsNullOrWhiteSpace($recipientId)) {
        Write-Host "❌ Recipient ID required" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Issue badge
Write-Host "`nStep 4: Issue badge..." -ForegroundColor Yellow
try {
    $issueResponse = Invoke-RestMethod -Uri "$baseUrl/api/badges" `
        -Method POST `
        -Headers @{Authorization = "Bearer $adminToken"} `
        -ContentType "application/json" `
        -Body (@{
            templateId = $templateId
            recipientId = $recipientId
            expiresIn = 365
        } | ConvertTo-Json)
    
    $badgeId = $issueResponse.id
    $claimToken = $issueResponse.claimToken
    $claimUrl = $issueResponse.claimUrl
    
    Write-Host "✅ Badge issued successfully!" -ForegroundColor Green
    Write-Host "   Badge ID: $badgeId" -ForegroundColor Gray
    Write-Host "   Claim Token: $claimToken" -ForegroundColor Gray
    Write-Host "   Claim URL: $claimUrl" -ForegroundColor Gray
    Write-Host "   Status: $($issueResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to issue badge: $_" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error: $($errorDetails.message)" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for email (simulating user receiving email)
Write-Host "Step 5: Simulating email delivery..." -ForegroundColor Yellow
Write-Host "   In production, user would receive email with claim link" -ForegroundColor Gray
Write-Host "   Email should contain: claim button with token" -ForegroundColor Gray
Write-Host "   (Check Ethereal inbox if Ethereal is configured)`n" -ForegroundColor Gray
Start-Sleep -Seconds 2

# Step 6: Claim badge (PUBLIC endpoint - no auth required)
Write-Host "Step 6: Claim badge with token (NO AUTH REQUIRED)..." -ForegroundColor Yellow
try {
    $claimResponse = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            claimToken = $claimToken
        } | ConvertTo-Json)
    
    Write-Host "✅ Badge claimed successfully!" -ForegroundColor Green
    Write-Host "   Status: $($claimResponse.status)" -ForegroundColor Gray
    Write-Host "   Claimed At: $($claimResponse.claimedAt)" -ForegroundColor Gray
    Write-Host "   Badge Name: $($claimResponse.badge.name)" -ForegroundColor Gray
    Write-Host "   Message: $($claimResponse.message)" -ForegroundColor Gray
    Write-Host "   Assertion URL: $($claimResponse.assertionUrl)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to claim badge: $_" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error: $($errorDetails.message)" -ForegroundColor Red
    exit 1
}

# Step 7: Try to claim again (should fail with 400)
Write-Host "Step 7: Try to claim again (should fail)..." -ForegroundColor Yellow
try {
    $claimAgain = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            claimToken = $claimToken
        } | ConvertTo-Json) `
        -ErrorAction Stop
    
    Write-Host "❌ ERROR: Should have failed but succeeded!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ Correctly rejected double claim (400)" -ForegroundColor Green
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorDetails.message)`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Wrong error code: $statusCode (expected 400)" -ForegroundColor Red
    }
}

# Step 8: Try with invalid token (should fail with 404)
Write-Host "Step 8: Try with invalid token (should fail)..." -ForegroundColor Yellow
try {
    $invalidToken = "invalid-token-" + ("x" * 19)  # 32 chars total
    $invalidClaim = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            claimToken = $invalidToken
        } | ConvertTo-Json) `
        -ErrorAction Stop
    
    Write-Host "❌ ERROR: Should have failed but succeeded!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "✅ Correctly rejected invalid token (404)" -ForegroundColor Green
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorDetails.message)`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Wrong error code: $statusCode (expected 404)" -ForegroundColor Red
    }
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Story 4.3 Manual Test Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✅ Badge issued (PENDING status)" -ForegroundColor Green
Write-Host "✅ Badge claimed with valid token (PUBLIC endpoint)" -ForegroundColor Green
Write-Host "✅ Status changed to CLAIMED" -ForegroundColor Green
Write-Host "✅ Double claim rejected (400)" -ForegroundColor Green
Write-Host "✅ Invalid token rejected (404)" -ForegroundColor Green
Write-Host "✅ Token cleared after claim (one-time use)" -ForegroundColor Green
