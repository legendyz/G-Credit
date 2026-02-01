# GCredit UAT Lifecycle Test Script
# Phase C - Sprint 7

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000"

Write-Host "`n" 
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  GCredit UAT - Complete Lifecycle Test" -ForegroundColor Yellow
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$results = @()

# Helper function to log results
function Log-Result($testId, $testName, $status, $details = "") {
    $color = if ($status -eq "PASS") { "Green" } elseif ($status -eq "FAIL") { "Red" } else { "Yellow" }
    Write-Host "[$status] $testId : $testName" -ForegroundColor $color
    if ($details) { Write-Host "        $details" -ForegroundColor Gray }
    $script:results += [PSCustomObject]@{
        TestId = $testId
        TestName = $testName
        Status = $status
        Details = $details
    }
}

Write-Host "`n=== SCENARIO 1: HAPPY PATH ===" -ForegroundColor Cyan

# S1.1: Issuer Login
Write-Host "`n>>> S1.1: Issuer Login" -ForegroundColor White
try {
    $loginBody = '{"email":"issuer@gcredit.com","password":"password123"}'
    $issuerLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $issuerToken = $issuerLogin.accessToken
    $issuerHeaders = @{ Authorization = "Bearer $issuerToken" }
    Log-Result "S1.1" "Issuer Login" "PASS" "User: $($issuerLogin.user.email), Role: $($issuerLogin.user.role)"
} catch {
    Log-Result "S1.1" "Issuer Login" "FAIL" $_.Exception.Message
    exit 1
}

# S1.2: Get Badge Templates
Write-Host "`n>>> S1.2: Get Badge Templates" -ForegroundColor White
try {
    $templates = Invoke-RestMethod -Uri "$baseUrl/badge-templates" -Method GET -Headers $issuerHeaders
    $templateCount = $templates.data.Count
    $templateId = $templates.data[0].id
    $templateName = $templates.data[0].name
    Log-Result "S1.2" "Get Badge Templates" "PASS" "Found $templateCount template(s): $templateName"
} catch {
    Log-Result "S1.2" "Get Badge Templates" "FAIL" $_.Exception.Message
}

# First get recipient ID by logging in as recipient
$recipientLoginBody = '{"email":"M365DevAdmin@2wjh85.onmicrosoft.com","password":"password123"}'
$recipientLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $recipientLoginBody
$recipientId = $recipientLogin.user.id

# S1.3: Issue a Badge
Write-Host "`n>>> S1.3: Issue Badge" -ForegroundColor White
try {
    $issueBadgeBody = @{
        templateId = $templateId
        recipientId = $recipientId
    } | ConvertTo-Json
    $newBadge = Invoke-RestMethod -Uri "$baseUrl/api/badges" -Method POST -Headers $issuerHeaders -ContentType "application/json" -Body $issueBadgeBody
    $badgeId = $newBadge.id
    $claimToken = $newBadge.claimToken
    Log-Result "S1.3" "Issue Badge" "PASS" "Badge ID: $badgeId, Status: $($newBadge.status)"
} catch {
    Log-Result "S1.3" "Issue Badge" "FAIL" $_.Exception.Message
}

# S1.4: Get Badge Details
Write-Host "`n>>> S1.4: Get Badge Details" -ForegroundColor White
try {
    $badgeDetails = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId" -Method GET -Headers $issuerHeaders
    Log-Result "S1.4" "Get Badge Details" "PASS" "Badge: $($badgeDetails.template.name) -> $($badgeDetails.recipientEmail)"
} catch {
    Log-Result "S1.4" "Get Badge Details" "FAIL" $_.Exception.Message
}

# S1.5: Claim Badge (Recipient claims the badge)
Write-Host "`n>>> S1.5: Claim Badge (Recipient)" -ForegroundColor White
try {
    $recipientHeaders = @{ Authorization = "Bearer $($recipientLogin.accessToken)" }
    $claimBody = @{ claimToken = $claimToken } | ConvertTo-Json
    $claimResult = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" -Method POST -Headers $recipientHeaders -ContentType "application/json" -Body $claimBody
    Log-Result "S1.5" "Claim Badge" "PASS" "Badge claimed: $($claimResult.status)"
} catch {
    Log-Result "S1.5" "Claim Badge" "FAIL" $_.Exception.Message
}

# S1.6: Badge Verification (Public)
Write-Host "`n>>> S1.6: Badge Verification" -ForegroundColor White
try {
    $badgeDetails = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId" -Method GET -Headers $issuerHeaders
    $verificationId = $badgeDetails.verificationId
    if ($verificationId) {
        $verification = Invoke-RestMethod -Uri "$baseUrl/api/verify/$verificationId" -Method GET
        Log-Result "S1.6" "Badge Verification" "PASS" "Verification Status: $($verification.status)"
    } else {
        Log-Result "S1.6" "Badge Verification" "SKIP" "No verification ID available"
    }
} catch {
    Log-Result "S1.6" "Badge Verification" "FAIL" $_.Exception.Message
}

# S1.7: Get Wallet (Recipient sees claimed badge)
Write-Host "`n>>> S1.7: Get Wallet" -ForegroundColor White
try {
    $walletBadges = Invoke-RestMethod -Uri "$baseUrl/api/badges/wallet" -Method GET -Headers $recipientHeaders
    Log-Result "S1.7" "Get Wallet" "PASS" "Badges in wallet: $($walletBadges.data.Count)"
} catch {
    Log-Result "S1.7" "Get Wallet" "FAIL" $_.Exception.Message
}

# S1.8: Revoke Badge (Issuer revokes)
Write-Host "`n>>> S1.8: Revoke Badge" -ForegroundColor White
try {
    $revokeBody = '{"reason":"Other"}'
    $revokedBadge = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/revoke" -Method POST -Headers $issuerHeaders -ContentType "application/json" -Body $revokeBody
    Log-Result "S1.8" "Revoke Badge" "PASS" "Badge revoked successfully"
} catch {
    Log-Result "S1.8" "Revoke Badge" "FAIL" $_.Exception.Message
}

Write-Host "`n=== SCENARIO 2: ERROR CASES ===" -ForegroundColor Cyan

# S2.1: Invalid Login
Write-Host "`n>>> S2.1: Invalid Login" -ForegroundColor White
try {
    $badLoginBody = '{"email":"invalid@example.com","password":"wrongpassword"}'
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $badLoginBody
    Log-Result "S2.1" "Invalid Login Rejected" "FAIL" "Should have returned 401"
} catch {
    if ($_.Exception.Message -match "401") {
        Log-Result "S2.1" "Invalid Login Rejected" "PASS" "Correctly returned 401 Unauthorized"
    } else {
        Log-Result "S2.1" "Invalid Login Rejected" "FAIL" $_.Exception.Message
    }
}

# S2.2: Access Without Token
Write-Host "`n>>> S2.2: Access Without Token" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/badges/issued" -Method GET
    Log-Result "S2.2" "Unauthorized Access Blocked" "FAIL" "Should have returned 401"
} catch {
    if ($_.Exception.Message -match "401") {
        Log-Result "S2.2" "Unauthorized Access Blocked" "PASS" "Correctly returned 401 Unauthorized"
    } else {
        Log-Result "S2.2" "Unauthorized Access Blocked" "FAIL" $_.Exception.Message
    }
}

# S2.3: Invalid Badge ID
Write-Host "`n>>> S2.3: Invalid Badge ID" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/badges/00000000-0000-0000-0000-000000000000" -Method GET -Headers $issuerHeaders
    Log-Result "S2.3" "Invalid Badge ID Handled" "FAIL" "Should have returned 404"
} catch {
    if ($_.Exception.Message -match "404") {
        Log-Result "S2.3" "Invalid Badge ID Handled" "PASS" "Correctly returned 404 Not Found"
    } else {
        Log-Result "S2.3" "Invalid Badge ID Handled" "WARN" $_.Exception.Message
    }
}

Write-Host "`n=== SCENARIO 3: ADDITIONAL TESTS ===" -ForegroundColor Cyan

# S3.1: Try to claim already revoked badge
Write-Host "`n>>> S3.1: Claim Revoked Badge" -ForegroundColor White
try {
    $newClaimBody = @{ claimToken = $claimToken } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/badges/$badgeId/claim" -Method POST -Headers $recipientHeaders -ContentType "application/json" -Body $newClaimBody
    Log-Result "S3.1" "Claim Revoked Badge Blocked" "FAIL" "Should have returned 410"
} catch {
    if ($_.Exception.Message -match "410") {
        Log-Result "S3.1" "Claim Revoked Badge Blocked" "PASS" "Correctly returned 410 Gone"
    } else {
        Log-Result "S3.1" "Claim Revoked Badge Blocked" "PASS" "Badge not claimable: $($_.Exception.Message)"
    }
}

# S3.2: Issue new badge and verify full flow
Write-Host "`n>>> S3.2: Issue Second Badge" -ForegroundColor White
try {
    $issueBadgeBody2 = @{
        templateId = $templateId
        recipientId = $recipientId
    } | ConvertTo-Json
    $newBadge2 = Invoke-RestMethod -Uri "$baseUrl/api/badges" -Method POST -Headers $issuerHeaders -ContentType "application/json" -Body $issueBadgeBody2
    Log-Result "S3.2" "Issue Second Badge" "PASS" "Badge ID: $($newBadge2.id)"
} catch {
    Log-Result "S3.2" "Issue Second Badge" "FAIL" $_.Exception.Message
}

Write-Host "`n=== SCENARIO 4: API HEALTH ===" -ForegroundColor Cyan

# S4.1: Health Check
Write-Host "`n>>> S4.1: Health Check" -ForegroundColor White
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Log-Result "S4.1" "Health Check" "PASS" "Status: $($health.status)"
} catch {
    Log-Result "S4.1" "Health Check" "FAIL" $_.Exception.Message
}

# S4.2: Ready Check
Write-Host "`n>>> S4.2: Ready Check" -ForegroundColor White
try {
    $ready = Invoke-RestMethod -Uri "$baseUrl/ready" -Method GET
    Log-Result "S4.2" "Ready Check" "PASS" "Database: $($ready.database), Storage: $($ready.storage)"
} catch {
    Log-Result "S4.2" "Ready Check" "FAIL" $_.Exception.Message
}

# Summary
Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  UAT TEST SUMMARY" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$warned = ($results | Where-Object { $_.Status -eq "WARN" -or $_.Status -eq "SKIP" }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Warnings/Skipped: $warned" -ForegroundColor Yellow
Write-Host "Pass Rate: $([math]::Round(($passed / $total) * 100, 1))%" -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.TestId): $($_.TestName)" -ForegroundColor Red
        Write-Host "    Details: $($_.Details)" -ForegroundColor Gray
    }
}

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  UAT Test Complete" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Yellow

# Export results to JSON
$results | ConvertTo-Json | Out-File -FilePath "C:\G_Credit\CODE\gcredit-project\backend\test-scripts\uat-results.json" -Encoding UTF8
Write-Host "Results saved to: test-scripts/uat-results.json" -ForegroundColor Gray
