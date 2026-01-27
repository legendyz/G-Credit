# UAT Manual Testing Script for Badge Issuance System
# Sprint 3 - Badge Issuance Feature Testing

$baseUrl = "http://localhost:3000"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Badge Issuance System - UAT Test  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Admin
Write-Host "Step 1: Login as Admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@gcredit.com"
    password = "Admin123!@#"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$adminToken = $loginResponse.accessToken

if ($adminToken) {
    Write-Host "✅ Admin login successful!" -ForegroundColor Green
    Write-Host "   Token: $($adminToken.Substring(0,20))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 2: Get badge templates
Write-Host "Step 2: Checking available badge templates..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

try {
    $templatesResponse = Invoke-RestMethod -Uri "$baseUrl/badge-templates" -Method GET -Headers $headers
    $templates = $templatesResponse.data
    Write-Host "✅ Found $($templates.Count) badge template(s)" -ForegroundColor Green
    $templateId = $templates[0].id
    Write-Host "   Using template: $($templates[0].name) ($templateId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get templates: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 3: Issue a single badge
Write-Host "Step 3: Issuing a single badge..." -ForegroundColor Yellow
$issueBadgeBody = @{
    templateId = $templateId
    recipientId = $loginResponse.user.id
    evidenceUrl = "https://example.com/manual-test-evidence.pdf"
    expiresIn = 365
} | ConvertTo-Json

try {
    $badge = Invoke-RestMethod -Uri "$baseUrl/api/badges" -Method POST -Body $issueBadgeBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Badge issued successfully!" -ForegroundColor Green
    Write-Host "   Badge ID: $($badge.id)" -ForegroundColor Gray
    Write-Host "   Status: $($badge.status)" -ForegroundColor Gray
    Write-Host "   Claim URL: $($badge.claimUrl)" -ForegroundColor Cyan
    $claimToken = $badge.claimToken
    $badgeId = $badge.id
} catch {
    Write-Host "❌ Badge issuance failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: View my badges (history)
Write-Host "Step 4: Viewing my badges (history)..." -ForegroundColor Yellow
try {
    $myBadges = Invoke-RestMethod -Uri "$baseUrl/api/badges/my-badges" -Method GET -Headers $headers
    Write-Host "✅ Found $($myBadges.data.Count) badge(s)" -ForegroundColor Green
    Write-Host "   Total: $($myBadges.pagination.totalCount)" -ForegroundColor Gray
    Write-Host "   Page: $($myBadges.pagination.page) of $($myBadges.pagination.totalPages)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get badge history" -ForegroundColor Red
}

Write-Host ""

# Step 5: Claim the badge (public endpoint - no auth needed)
Write-Host "Step 5: Claiming the badge (simulating recipient)..." -ForegroundColor Yellow
$claimBody = @{
    claimToken = $claimToken
} | ConvertTo-Json

try {
    $claimedBadge = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" -Method POST -Body $claimBody -ContentType "application/json"
    Write-Host "✅ Badge claimed successfully!" -ForegroundColor Green
    Write-Host "   Status: $($claimedBadge.status)" -ForegroundColor Gray
    Write-Host "   Claimed at: $($claimedBadge.claimedAt)" -ForegroundColor Gray
    Write-Host "   Message: $($claimedBadge.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Claim failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 6: Get public assertion (Open Badges 2.0)
Write-Host "Step 6: Verifying badge assertion (Open Badges 2.0)..." -ForegroundColor Yellow
try {
    $assertion = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/assertion" -Method GET
    Write-Host "✅ Assertion retrieved successfully!" -ForegroundColor Green
    Write-Host "   Type: $($assertion.type)" -ForegroundColor Gray
    Write-Host "   Context: $($assertion.'@context')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get assertion" -ForegroundColor Red
}

Write-Host ""

# Step 7: Bulk issuance test (CSV)
Write-Host "Step 7: Testing bulk CSV upload..." -ForegroundColor Yellow
$csvContent = @"
recipientEmail,templateId,evidenceUrl,expiresIn
admin@gcredit.com,$templateId,https://example.com/bulk1.pdf,365
admin@gcredit.com,$templateId,https://example.com/bulk2.pdf,730
"@

$csvPath = "$env:TEMP\test-badges.csv"
$csvContent | Out-File -FilePath $csvPath -Encoding UTF8 -NoNewline

try {
    # Create multipart form data manually
    $boundary = "----WebKitFormBoundary" + [System.Guid]::NewGuid().ToString().Replace("-","")
    $fileContent = Get-Content -Path $csvPath -Raw
    
    $bodyLines = 
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test-badges.csv`"",
        "Content-Type: text/csv",
        "",
        $fileContent,
        "--$boundary--",
        ""
    
    $body = $bodyLines -join "`r`n"
    
    $uploadHeaders = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $bulkResult = Invoke-RestMethod -Uri "$baseUrl/api/badges/bulk" -Method POST -Headers $uploadHeaders -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Host "✅ Bulk upload completed!" -ForegroundColor Green
    Write-Host "   Total: $($bulkResult.total)" -ForegroundColor Gray
    Write-Host "   Successful: $($bulkResult.successful)" -ForegroundColor Green
    Write-Host "   Failed: $($bulkResult.failed)" -ForegroundColor Red
} catch {
    Write-Host "❌ Bulk upload failed: $($_.Exception.Message)" -ForegroundColor Red
}

Remove-Item $csvPath -ErrorAction SilentlyContinue

Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "         UAT Test Complete!          " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check your email for badge notifications" -ForegroundColor White
Write-Host "2. Open Swagger UI: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "3. Test revocation and filtering features manually" -ForegroundColor White
Write-Host ""
