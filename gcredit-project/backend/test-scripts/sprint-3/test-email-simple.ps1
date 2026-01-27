# Quick Badge Issuance Test - Story 4.5
# Assumes: Server running, database seeded

$BaseUrl = "http://localhost:3000"

Write-Host "`n🧪 Story 4.5 Email Notification Test`n" -ForegroundColor Cyan

# Login
Write-Host "1. Logging in..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
    email = "admin@gcredit.com"
    password = "Admin123!@#"
} | ConvertTo-Json) -ContentType "application/json"

$token = if ($login.access_token) { $login.access_token } else { $login.accessToken }
Write-Host "   ✅ Logged in`n" -ForegroundColor Green

# Get template
Write-Host "2. Getting badge template..." -ForegroundColor Yellow
$templates = Invoke-RestMethod -Uri "$BaseUrl/api/badge-templates" -Method GET -Headers @{
    "Authorization" = "Bearer $token"
}
$templateId = $templates[0].id
Write-Host "   ✅ Template: $($templates[0].name)`n" -ForegroundColor Green

# Get employee user ID from login (try logging in as employee to get ID)
Write-Host "3. Getting employee user ID..." -ForegroundColor Yellow
$empLogin = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
    email = "employee@gcredit.com"
    password = "Employee123!"
} | ConvertTo-Json) -ContentType "application/json"
$recipientId = $empLogin.user.id
Write-Host "   ✅ Employee ID: $recipientId`n" -ForegroundColor Green

# Issue badge
Write-Host "4. Issuing badge..." -ForegroundColor Yellow
Write-Host "   📧 EMAIL WILL BE SENT NOW!`n" -ForegroundColor Cyan

$badge = Invoke-RestMethod -Uri "$BaseUrl/api/badges" -Method POST -Headers @{
    "Authorization" = "Bearer $token"
} -Body (@{
    templateId = $templateId
    recipientId = $recipientId
    evidenceUrl = "https://example.com/evidence/test.pdf"
    expiresIn = 365
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "   ✅ Badge Issued!`n" -ForegroundColor Green
Write-Host "Badge Details:" -ForegroundColor Cyan
Write-Host "  ID: $($badge.id)"
Write-Host "  Status: $($badge.status)"
Write-Host "  Claim URL: $($badge.claimUrl)"

Write-Host "`n📧 CHECK YOUR SERVER POWERSHELL WINDOW!" -ForegroundColor Yellow -BackgroundColor DarkRed
Write-Host "   Look for: '📧 Preview URL: https://ethereal.email/...'" -ForegroundColor Yellow
Write-Host "   Copy that URL and open in browser to see the email!`n" -ForegroundColor Yellow

Write-Host "✅ TEST COMPLETE!`n" -ForegroundColor Green
