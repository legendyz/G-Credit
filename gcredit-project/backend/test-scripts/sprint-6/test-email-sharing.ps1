# Sprint 6 - Story 7.2: Email Badge Sharing - E2E Test Script
# Tests email sending via Microsoft Graph API with real badge data
# Prerequisites: Backend running, valid badge ID, Azure AD configured

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$BadgeId = "",
    [string]$RecipientEmail = "",
    [string]$IssuerEmail = "issuer@gcredit.com",
    [string]$IssuerPassword = "SecurePassword123!"
)

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Story 7.2: Email Badge Sharing - E2E Test" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Authenticate as Issuer
Write-Host "[Step 1] Authenticating as issuer..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body (@{
    email = $IssuerEmail
    password = $IssuerPassword
} | ConvertTo-Json) -ContentType "application/json"

if (-not $loginResponse.accessToken) {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    exit 1
}

$token = $loginResponse.accessToken
Write-Host "✅ Authenticated successfully" -ForegroundColor Green
Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# Step 2: Get Badge Details (if BadgeId provided)
if ($BadgeId) {
    Write-Host "[Step 2] Fetching badge details..." -ForegroundColor Yellow
    
    try {
        $badgeResponse = Invoke-RestMethod -Uri "$BaseUrl/api/badges/wallet" -Method GET `
            -Headers @{ Authorization = "Bearer $token" }
        
        $badge = $badgeResponse.badges | Where-Object { $_.id -eq $BadgeId } | Select-Object -First 1
        
        if ($badge) {
            Write-Host "✅ Badge found:" -ForegroundColor Green
            Write-Host "   ID: $($badge.id)" -ForegroundColor Gray
            Write-Host "   Name: $($badge.template.name)" -ForegroundColor Gray
            Write-Host "   Status: $($badge.status)" -ForegroundColor Gray
            Write-Host "   Recipient: $($badge.recipient.firstName) $($badge.recipient.lastName)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  Badge ID $BadgeId not found in issued badges" -ForegroundColor Yellow
            Write-Host "   Available badges:" -ForegroundColor Gray
            $badgeResponse.badges | ForEach-Object {
                Write-Host "   - $($_.id): $($_.template.name) ($($_.status))" -ForegroundColor Gray
            }
            
            # Use first available badge
            $BadgeId = $badgeResponse.badges[0].id
            Write-Host "   Using first badge: $BadgeId" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to fetch badge details: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[Step 2] No BadgeId provided - will fetch from API..." -ForegroundColor Yellow
    
    try {
        $badgeResponse = Invoke-RestMethod -Uri "$BaseUrl/api/badges/wallet" -Method GET `
            -Headers @{ Authorization = "Bearer $token" }
        
        if ($badgeResponse.badges.Count -eq 0) {
            Write-Host "❌ No badges available for testing!" -ForegroundColor Red
            Write-Host "   Please issue a badge first using:" -ForegroundColor Yellow
            Write-Host "   POST $BaseUrl/badge-issuance/issue" -ForegroundColor Gray
            exit 1
        }
        
        $BadgeId = $badgeResponse.badges[0].id
        Write-Host "✅ Using first available badge:" -ForegroundColor Green
        Write-Host "   ID: $BadgeId" -ForegroundColor Gray
        Write-Host "   Name: $($badgeResponse.badges[0].template.name)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed to fetch badges: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 3: Prompt for recipient email if not provided
if (-not $RecipientEmail) {
    Write-Host "[Step 3] Recipient email required" -ForegroundColor Yellow
    $RecipientEmail = Read-Host "   Enter recipient email (e.g., test@example.com)"
    
    if (-not $RecipientEmail) {
        Write-Host "❌ Recipient email is required!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "   Recipient: $RecipientEmail" -ForegroundColor Gray
Write-Host ""

# Step 4: Share Badge via Email
Write-Host "[Step 4] Sharing badge via email..." -ForegroundColor Yellow

$sharePayload = @{
    badgeId = $BadgeId
    recipientEmail = $RecipientEmail
    personalMessage = "Hi! I wanted to share this achievement with you. Check out this badge from G-Credit! (E2E Test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
} | ConvertTo-Json

Write-Host "   Payload:" -ForegroundColor Gray
Write-Host $sharePayload -ForegroundColor DarkGray
Write-Host ""

try {
    $shareResponse = Invoke-RestMethod -Uri "$BaseUrl/api/badges/share/email" -Method POST `
        -Headers @{ 
            Authorization = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $sharePayload
    
    Write-Host "✅ Badge shared successfully!" -ForegroundColor Green
    Write-Host "   Success: $($shareResponse.success)" -ForegroundColor Gray
    Write-Host "   Message: $($shareResponse.message)" -ForegroundColor Gray
    Write-Host "   Recipient: $($shareResponse.recipientEmail)" -ForegroundColor Gray
    Write-Host "   Badge ID: $($shareResponse.badgeId)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to share badge!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    
    exit 1
}

# Step 5: Verification Instructions
Write-Host "[Step 5] Email Verification" -ForegroundColor Yellow
Write-Host ""
Write-Host "   📧 Check the recipient's inbox at: $RecipientEmail" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Expected Email:" -ForegroundColor White
Write-Host "   ✓ Subject: '🎉 [Sender Name] shared a badge with you: [Badge Name]'" -ForegroundColor Gray
Write-Host "   ✓ HTML formatting with G-Credit branding" -ForegroundColor Gray
Write-Host "   ✓ Badge image displayed (200x200px)" -ForegroundColor Gray
Write-Host "   ✓ Badge name and issuer shown" -ForegroundColor Gray
Write-Host "   ✓ Personal message: 'Hi! I wanted to share...'" -ForegroundColor Gray
Write-Host "   ✓ 'View Badge Details' button (primary CTA)" -ForegroundColor Gray
Write-Host "   ✓ 'Claim Badge Now' button (if badge is PENDING)" -ForegroundColor Gray
Write-Host "   ✓ Badge details table (recipient, issue date, verification link)" -ForegroundColor Gray
Write-Host "   ✓ Footer with help/privacy links" -ForegroundColor Gray
Write-Host ""
Write-Host "   If email not received:" -ForegroundColor Yellow
Write-Host "   1. Check spam/junk folder" -ForegroundColor Gray
Write-Host "   2. Verify ENABLE_GRAPH_EMAIL=true in .env" -ForegroundColor Gray
Write-Host "   3. Verify Azure AD credentials configured" -ForegroundColor Gray
Write-Host "   4. Check backend logs for Graph API errors" -ForegroundColor Gray
Write-Host ""

# Step 6: Test Summary
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "E2E Test Summary" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✅ Authentication: PASSED" -ForegroundColor Green
Write-Host "✅ Badge retrieval: PASSED" -ForegroundColor Green
Write-Host "✅ Email sharing API: PASSED" -ForegroundColor Green
Write-Host "⏳ Email delivery: PENDING MANUAL VERIFICATION" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "1. Check $RecipientEmail inbox" -ForegroundColor Gray
Write-Host "2. Verify email formatting and content" -ForegroundColor Gray
Write-Host "3. Click 'View Badge Details' button" -ForegroundColor Gray
Write-Host "4. Verify badge verification page loads" -ForegroundColor Gray
Write-Host "5. (Optional) Click 'Claim Badge Now' if available" -ForegroundColor Gray
Write-Host ""
Write-Host "Test completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan
