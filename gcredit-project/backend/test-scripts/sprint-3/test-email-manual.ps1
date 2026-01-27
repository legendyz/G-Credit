# MANUAL TEST - Story 4.5 Email
# You need to provide template and user IDs manually

param(
    [Parameter(Mandatory=$false)]
    [string]$TemplateId,
    [Parameter(Mandatory=$false)]
    [string]$RecipientId
)

$BaseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  📧 Manual Email Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# If IDs not provided, show instructions
if (-not $TemplateId -or -not $RecipientId) {
    Write-Host "📋 STEP 1: Get IDs from Prisma Studio" -ForegroundColor Yellow
    Write-Host "   Run: npx prisma studio" -ForegroundColor White
    Write-Host "   Open: http://localhost:5555" -ForegroundColor White
    Write-Host ""
    Write-Host "   1. Click 'BadgeTemplate' table" -ForegroundColor Gray
    Write-Host "      Copy the 'id' field (UUID)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Click 'User' table" -ForegroundColor Gray
    Write-Host "      Find employee@gcredit.com" -ForegroundColor Gray
    Write-Host "      Copy the 'id' field (UUID)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 STEP 2: Run this script with IDs:" -ForegroundColor Yellow
    Write-Host "   .\test-email-manual.ps1 -TemplateId '<UUID>' -RecipientId '<UUID>'`n" -ForegroundColor White
    exit 0
}

# Login
Write-Host "Logging in..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
    email = "admin@gcredit.com"
    password = "Admin123!@#"
} | ConvertTo-Json) -ContentType "application/json"

$token = if ($login.access_token) { $login.access_token } else { $login.accessToken }
Write-Host "✅ Logged in`n" -ForegroundColor Green

# Issue badge
Write-Host "Issuing badge..." -ForegroundColor Yellow
Write-Host "  Template ID: $TemplateId" -ForegroundColor Gray
Write-Host "  Recipient ID: $RecipientId" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⚡ SENDING EMAIL NOW...`n" -ForegroundColor Cyan

try {
    $badge = Invoke-RestMethod -Uri "$BaseUrl/api/badges" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
    } -Body (@{
        templateId = $TemplateId
        recipientId = $RecipientId
        evidenceUrl = "https://example.com/test.pdf"
        expiresIn = 365
    } | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    Write-Host "Badge ID: $($badge.id)" -ForegroundColor White
    Write-Host "Claim URL: $($badge.claimUrl)`n" -ForegroundColor White
    
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  📧 CHECK SERVER CONSOLE!" -ForegroundColor Yellow -BackgroundColor DarkRed  
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Find this line:" -ForegroundColor White
    Write-Host "  '📧 Preview URL: https://ethereal.email/...'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Open that URL in browser to see email!`n" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
