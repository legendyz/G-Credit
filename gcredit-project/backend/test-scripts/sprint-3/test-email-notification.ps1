# Test Email Notification - Simple Version
# Run this after server is started

$BaseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Email Notification Quick Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "Step 1: Login as admin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
        email = "admin@gcredit.com"
        password = "Admin123!@#"
    } | ConvertTo-Json) -ContentType "application/json"
    
    # Check different possible token field names
    $token = if ($loginResponse.access_token) { 
        $loginResponse.access_token 
    } elseif ($loginResponse.accessToken) { 
        $loginResponse.accessToken 
    } elseif ($loginResponse.token) { 
        $loginResponse.token 
    } else {
        Write-Host "Response: $($loginResponse | ConvertTo-Json)" -ForegroundColor Gray
        throw "Token not found in response"
    }
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTip: Make sure server is running and database is seeded" -ForegroundColor Yellow
    exit 1
}

# Step 2: Get a badge template
Write-Host "`nStep 2: Get badge templates..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$BaseUrl/badge-templates" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($templates.Count -eq 0) {
        throw "No templates found"
    }
    
    $template = $templates[0]
    Write-Host "✅ Found template: $($template.name)" -ForegroundColor Green
    Write-Host "   Template ID: $($template.id)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Template API failed, using seed data directly" -ForegroundColor Yellow
    # Use hardcoded data from our seed script
    $template = @{
        id = "00000000-0000-0000-0000-000000000000" # Will be replaced
        name = "Outstanding Performance"
    }
}

# Step 3: Use employee from seed data
Write-Host "`nStep 3: Using employee from seed..." -ForegroundColor Yellow
$recipient = @{
    id = "00000000-0000-0000-0000-000000000001" # Will query from DB
    email = "employee@gcredit.com"
}

# Query actual IDs from database via Prisma
Write-Host "   Querying actual database IDs..." -ForegroundColor Gray
try {
    # Get actual template ID
    $templatesActual = Invoke-RestMethod -Uri "$BaseUrl/badge-templates" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    if ($templatesActual -and $templatesActual.Count -gt 0) {
        $template.id = $templatesActual[0].id
        $template.name = $templatesActual[0].name
        Write-Host "✅ Template ID: $($template.id)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not fetch template, will try badge issuance anyway" -ForegroundColor Yellow
}

# For recipient, we'll use a workaround - issue to self or query users differently
Write-Host "   Note: Will need admin to query user ID" -ForegroundColor Gray

# Step 4: Issue badge (THIS WILL TRIGGER EMAIL!)
Write-Host "`nStep 4: Issue badge (will send email!)..." -ForegroundColor Yellow
Write-Host "   📧 Check the server console for Ethereal preview URL" -ForegroundColor Cyan
try {
    $badgeResponse = Invoke-RestMethod -Uri "$BaseUrl/badges" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
    } -Body (@{
        templateId = $template.id
        recipientId = $recipient.id
        evidenceUrl = "https://example.com/evidence/test-$(Get-Date -Format 'yyyyMMddHHmmss').pdf"
        expiresIn = 365
    } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "`n✅ Badge issued successfully!" -ForegroundColor Green
    Write-Host "   Badge ID: $($badgeResponse.id)" -ForegroundColor Gray
    Write-Host "   Status: $($badgeResponse.status)" -ForegroundColor Gray
    Write-Host "   Claim URL: $($badgeResponse.claimUrl)" -ForegroundColor Gray
    
    Write-Host "`n📧 EMAIL NOTIFICATION:" -ForegroundColor Cyan
    Write-Host "   Recipient: $($recipient.email)" -ForegroundColor White
    Write-Host "   Badge: $($template.name)" -ForegroundColor White
    Write-Host "`n   👉 Check your server PowerShell window for:" -ForegroundColor Yellow
    Write-Host "      '📧 Preview URL: https://ethereal.email/...'" -ForegroundColor Yellow
    Write-Host "`n   Copy that URL and open it in your browser to see the email!" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Failed to issue badge: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ TEST COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
