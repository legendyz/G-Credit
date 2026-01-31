# Sprint 6 - Story 7.4: Teams Notifications - E2E Test Script
# Prerequisites: Backend running, Azure AD configured, Teams integration enabled

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$BadgeId = "",
    [string]$TeamId = "",
    [string]$ChannelId = "",
    [string]$IssuerEmail = "issuer@gcredit.com",
    [string]$IssuerPassword = "SecurePassword123!"
)

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Story 7.4: Teams Notifications - E2E Test" -ForegroundColor Cyan
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
if (-not $BadgeId) {
    Write-Host "[Step 2] No BadgeId provided - fetching from API..." -ForegroundColor Yellow
    try {
        $badgeResponse = Invoke-RestMethod -Uri "$BaseUrl/api/badges/wallet" -Method GET `
            -Headers @{ Authorization = "Bearer $token" }

        if ($badgeResponse.badges.Count -eq 0) {
            Write-Host "❌ No badges available for testing!" -ForegroundColor Red
            exit 1
        }

        $BadgeId = $badgeResponse.badges[0].id
        Write-Host "✅ Using first available badge: $BadgeId" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to fetch badges: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Prompt for Team/Channel ID
if (-not $TeamId) {
    $TeamId = Read-Host "[Step 3] Enter Teams Team ID"
}
if (-not $ChannelId) {
    $ChannelId = Read-Host "[Step 3] Enter Teams Channel ID"
}

if (-not $TeamId -or -not $ChannelId) {
    Write-Host "❌ Team ID and Channel ID are required" -ForegroundColor Red
    exit 1
}

# Step 4: Share Badge via Teams
Write-Host "[Step 4] Sharing badge to Teams..." -ForegroundColor Yellow

$sharePayload = @{
    teamId = $TeamId
    channelId = $ChannelId
    personalMessage = "E2E Test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} | ConvertTo-Json

try {
    $shareResponse = Invoke-RestMethod -Uri "$BaseUrl/api/badges/$BadgeId/share/teams" -Method POST `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body $sharePayload

    Write-Host "✅ Teams share request sent successfully!" -ForegroundColor Green
    Write-Host "   Response: $($shareResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to share badge to Teams!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Manual Verification
Write-Host "[Step 5] Manual verification required" -ForegroundColor Yellow
Write-Host "   1) Check Teams channel for Adaptive Card" -ForegroundColor Gray
Write-Host "   2) Verify badge image, name, issuer, date" -ForegroundColor Gray
Write-Host "   3) Click 'View Badge' button" -ForegroundColor Gray
Write-Host "   4) Click 'Claim Badge' button (if PENDING)" -ForegroundColor Gray

Write-Host ""
Write-Host "Test completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan
