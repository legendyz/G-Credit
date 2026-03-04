# ============================================================
# Pilot Smoke Test — Story 16.4
# Validates RBAC ownership isolation with pilot seed data
# Requires: Backend running on localhost:3000 + pilot seed loaded
# Usage:  .\pilot-smoke-test.ps1 [-BaseUrl "http://localhost:3000"]
# ============================================================

param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"
$passed = 0
$failed = 0
$total = 8

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  G-Credit Pilot Smoke Test (Story 16.4)"    -ForegroundColor Yellow
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "  Backend: $BaseUrl"                          -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

# ── Pilot seed IDs (must match seed-pilot.ts) ──
$IssuerA_Id = '00000000-0000-4000-b000-000000000010'
$IssuerB_Id = '00000000-0000-4000-b000-000000000011'
$Emp1_Id    = '00000000-0000-4000-b000-000000000020'
# Issuer-A templates
$TmplCloud  = '00000000-0000-4000-b000-000100000001'
$TmplAgile  = '00000000-0000-4000-b000-000100000002'
# Issuer-B templates (Issuer-A must NOT be able to issue with these)
$TmplPrivacy    = '00000000-0000-4000-b000-000100000003'
$TmplLeadership = '00000000-0000-4000-b000-000100000004'
# A verification ID from pilot seed (badge1 — CLAIMED)
$VerifyId   = '00000000-0000-4000-b000-000300000001'

function Log-Result {
    param([string]$Name, [bool]$Pass, [string]$Detail = "")
    if ($Pass) {
        Write-Host "  PASS: $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  FAIL: $Name -- $Detail" -ForegroundColor Red
        $script:failed++
    }
}

function Login {
    param([string]$Email, [string]$Label)
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    try {
        $body = @{ email = $Email; password = "Password123" } | ConvertTo-Json
        $null = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" `
            -Method POST -ContentType "application/json" -Body $body `
            -WebSession $session -UseBasicParsing -ErrorAction Stop
        return $session
    } catch {
        Write-Host "  LOGIN FAILED ($Label): $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "=== TEST 1/8: Admin login ===" -ForegroundColor Cyan
$adminSession = Login -Email "pilot-admin@gcredit.com" -Label "Admin"
Log-Result "Admin login" ($null -ne $adminSession)

Write-Host ""
Write-Host "=== TEST 2/8: Issuer-A login ===" -ForegroundColor Cyan
$issuerASession = Login -Email "issuer-a@pilot.gcredit.com" -Label "Issuer-A"
Log-Result "Issuer-A login" ($null -ne $issuerASession)

if ($null -eq $adminSession -or $null -eq $issuerASession) {
    Write-Host "`nCRITICAL: Login failed — cannot continue smoke test" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== TEST 3/8: Issuer-A sees ONLY own templates ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/badge-templates" `
        -WebSession $issuerASession -UseBasicParsing -ErrorAction Stop
    $json = $resp.Content | ConvertFrom-Json
    $templates = $json.data
    $allOwned = $true
    foreach ($t in $templates) {
        if ($t.createdBy -ne $IssuerA_Id) {
            $allOwned = $false
            Write-Host "    Unexpected template: $($t.name) owned by $($t.createdBy)" -ForegroundColor Yellow
        }
    }
    $hasCloud = ($templates | Where-Object { $_.id -eq $TmplCloud }).Count -gt 0
    $hasAgile = ($templates | Where-Object { $_.id -eq $TmplAgile }).Count -gt 0
    $noPrivacy = ($templates | Where-Object { $_.id -eq $TmplPrivacy }).Count -eq 0
    $pass = $allOwned -and $hasCloud -and $hasAgile -and $noPrivacy
    Log-Result "Issuer-A sees only own templates" $pass "Count=$($templates.Count), AllOwned=$allOwned"
} catch {
    Log-Result "Issuer-A sees only own templates" $false $_.Exception.Message
}

Write-Host ""
Write-Host "=== TEST 4/8: Issuer-A issues badge with OWN template ===" -ForegroundColor Cyan
$newBadgeId = $null
try {
    # Use an employee that doesn't already have this template badge
    $issueBody = @{ templateId = $TmplCloud; recipientId = $Emp1_Id } | ConvertTo-Json
    # Note: emp1 already has a Cloud badge from seed. Use emp9 (has PENDING Cloud, but different ID).
    # Actually let's use a fresh recipient — emp10 (Mia Taylor, Finance)
    $issueFreshBody = @{
        templateId = $TmplCloud
        recipientId = '00000000-0000-4000-b000-000000000029'  # emp10
    } | ConvertTo-Json
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/badges" `
        -Method POST -ContentType "application/json" -Body $issueFreshBody `
        -WebSession $issuerASession -UseBasicParsing -ErrorAction Stop
    $badge = $resp.Content | ConvertFrom-Json
    $newBadgeId = $badge.id
    Log-Result "Issuer-A issues badge (own template)" $true "BadgeId=$newBadgeId"
} catch {
    $code = 0
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    Log-Result "Issuer-A issues badge (own template)" $false "Status=$code $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== TEST 5/8: Issuer-A CANNOT issue with Issuer-B template ===" -ForegroundColor Cyan
try {
    $crossBody = @{
        templateId = $TmplPrivacy  # Owned by Issuer-B
        recipientId = '00000000-0000-4000-b000-000000000029'  # emp10
    } | ConvertTo-Json
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/badges" `
        -Method POST -ContentType "application/json" -Body $crossBody `
        -WebSession $issuerASession -UseBasicParsing -ErrorAction Stop
    # If we get here, the request succeeded — that's a FAIL (should be 403)
    Log-Result "Issuer-A blocked from Issuer-B template" $false "Expected 403 but got 2xx"
} catch {
    $code = 0
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    $pass = ($code -eq 403)
    Log-Result "Issuer-A blocked from Issuer-B template" $pass "Status=$code (expected 403)"
}

Write-Host ""
Write-Host "=== TEST 6/8: Employee login + wallet contains badge ===" -ForegroundColor Cyan
$empSession = Login -Email "emp01@pilot.gcredit.com" -Label "Employee-1"
if ($null -ne $empSession) {
    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl/api/badges/wallet" `
            -WebSession $empSession -UseBasicParsing -ErrorAction Stop
        $wallet = $resp.Content | ConvertFrom-Json
        # emp1 has badge1 (Cloud), badge2 (Agile), badge9 (Leadership) from seed
        $hasBadges = $false
        if ($wallet.data -and $wallet.data.Count -gt 0) { $hasBadges = $true }
        elseif ($wallet -is [array] -and $wallet.Count -gt 0) { $hasBadges = $true }
        Log-Result "Employee wallet has badges" $hasBadges "Count=$($wallet.data.Count // $wallet.Count)"
    } catch {
        Log-Result "Employee wallet has badges" $false $_.Exception.Message
    }
} else {
    Log-Result "Employee wallet has badges" $false "Employee login failed"
}

Write-Host ""
Write-Host "=== TEST 7/8: Public badge verification ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/verify/$VerifyId" `
        -UseBasicParsing -ErrorAction Stop
    $verify = $resp.Content | ConvertFrom-Json
    $isValid = ($verify.status -eq 'CLAIMED') -or ($verify.badge -and $verify.badge.status -eq 'CLAIMED')
    Log-Result "Public badge verification" $isValid "Response contains valid badge data"
} catch {
    $code = 0
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    Log-Result "Public badge verification" $false "Status=$code $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== TEST 8/8: Admin sees ALL templates ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/badge-templates" `
        -WebSession $adminSession -UseBasicParsing -ErrorAction Stop
    $json = $resp.Content | ConvertFrom-Json
    $templates = $json.data
    # Admin should see all 5 pilot templates (and possibly UAT templates too)
    $pilotIds = @($TmplCloud, $TmplAgile, $TmplPrivacy, $TmplLeadership, '00000000-0000-4000-b000-000100000005')
    $foundPilot = 0
    foreach ($pid in $pilotIds) {
        if ($templates | Where-Object { $_.id -eq $pid }) { $foundPilot++ }
    }
    $pass = ($foundPilot -eq 5)
    Log-Result "Admin sees all 5 pilot templates" $pass "Found $foundPilot/5 pilot templates (total=$($templates.Count))"
} catch {
    Log-Result "Admin sees all 5 pilot templates" $false $_.Exception.Message
}

# ── Cleanup: delete the badge we issued in test 4 ──
if ($newBadgeId) {
    try {
        $null = Invoke-WebRequest -Uri "$BaseUrl/api/badges/$newBadgeId" `
            -Method DELETE -WebSession $adminSession -UseBasicParsing -ErrorAction SilentlyContinue
    } catch {
        # Ignore — best-effort cleanup
    }
}

# ── Summary ──
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  Results: $passed/$total PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "============================================" -ForegroundColor Yellow

if ($failed -gt 0) { exit 1 }
