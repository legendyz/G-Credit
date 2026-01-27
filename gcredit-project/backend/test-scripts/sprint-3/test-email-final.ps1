# Story 4.5 Email Test - Ultra Simple
# Just issue a badge with hardcoded IDs from seed

$BaseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📧 Story 4.5 Email Notification Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
Write-Host "Step 1: Admin login..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
    email = "admin@gcredit.com"
    password = "Admin123!@#"
} | ConvertTo-Json) -ContentType "application/json"

$token = if ($login.access_token) { $login.access_token } else { $login.accessToken }
Write-Host "✅ Logged in as admin`n" -ForegroundColor Green

# Get template ID
Write-Host "Step 2: Get badge template..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$BaseUrl/badge-templates" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    $templateId = $templates[0].id
    $templateName = $templates[0].name
    Write-Host "✅ Template: $templateName" -ForegroundColor Green
    Write-Host "   ID: $templateId`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get template: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Error details: $($_.ErrorDetails.Message)`n" -ForegroundColor Yellow
    exit 1
}

# Get employee ID  
Write-Host "Step 3: Get employee user..." -ForegroundColor Yellow
$empLogin = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
    email = "employee@gcredit.com"
    password = "Employee123!"
} | ConvertTo-Json) -ContentType "application/json"
$recipientId = $empLogin.user.id
$recipientEmail = $empLogin.user.email
Write-Host "✅ Recipient: $recipientEmail" -ForegroundColor Green
Write-Host "   ID: $recipientId`n" -ForegroundColor Gray

# Issue badge (THIS SENDS EMAIL!)
Write-Host "Step 4: Issue badge..." -ForegroundColor Yellow
Write-Host "" 
Write-Host "   ⚡ SENDING EMAIL NOW..." -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host ""

try {
    $badge = Invoke-RestMethod -Uri "$BaseUrl/api/badges" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
    } -Body (@{
        templateId = $templateId
        recipientId = $recipientId
        evidenceUrl = "https://example.com/evidence/story-4-5-test.pdf"
        expiresIn = 365
    } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✅ Badge issued successfully!`n" -ForegroundColor Green
    Write-Host "Badge Details:" -ForegroundColor Cyan
    Write-Host "  Badge ID: $($badge.id)"
    Write-Host "  Status: $($badge.status)"
    Write-Host "  Issued At: $($badge.issuedAt)"
    Write-Host "  Claim URL: $($badge.claimUrl)"
    
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "  📧 CHECK YOUR SERVER WINDOW!" -ForegroundColor Yellow -BackgroundColor DarkRed
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Look for this line in your server PowerShell:" -ForegroundColor White
    Write-Host "  '📧 Preview URL: https://ethereal.email/message/...'`n" -ForegroundColor Cyan
    Write-Host "Copy that URL and open it in your browser!" -ForegroundColor White
    Write-Host "You'll see the beautiful HTML email with:" -ForegroundColor White
    Write-Host "  - Badge image" -ForegroundColor Gray
    Write-Host "  - Recipient name (John Doe)" -ForegroundColor Gray
    Write-Host "  - Claim button" -ForegroundColor Gray
    Write-Host "  - 7-day expiration notice" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to issue badge: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ TEST COMPLETED!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
