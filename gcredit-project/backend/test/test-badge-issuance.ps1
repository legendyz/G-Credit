# PowerShell E2E Test Script for Badge Issuance
# This script tests the complete badge issuance workflow

param(
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Badge Issuance E2E Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test Results Tracking
$script:TestResults = @{
    Passed = 0
    Failed = 0
    Total = 0
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = ""
    )
    
    $script:TestResults.Total++
    
    if ($Success) {
        $script:TestResults.Passed++
        Write-Host "[PASS] $TestName" -ForegroundColor Green
        if ($Message -and $Verbose) {
            Write-Host "       $Message" -ForegroundColor Gray
        }
    } else {
        $script:TestResults.Failed++
        Write-Host "[FAIL] $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "       $Message" -ForegroundColor Yellow
        }
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    $uri = "$BaseUrl$Endpoint"
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    if ($Verbose) {
        Write-Host "Request: $Method $uri" -ForegroundColor Gray
    }
    
    try {
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
        }
    } catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
        }
    }
}

# Step 1: Login as Admin
Write-Host "Step 1: Admin Login" -ForegroundColor Yellow
$loginResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/auth/login" -Body @{
    email = "admin@gcredit.com"
    password = "Admin123!"
}

if ($loginResponse.Success) {
    $adminToken = $loginResponse.Data.token
    Write-TestResult -TestName "Admin Login" -Success $true -Message "Token: $($adminToken.Substring(0, 20))..."
} else {
    Write-TestResult -TestName "Admin Login" -Success $false -Message $loginResponse.Error
    Write-Host "`nTest Suite Failed: Cannot proceed without admin authentication" -ForegroundColor Red
    exit 1
}

# Step 2: Create Active Badge Template
Write-Host "`nStep 2: Create Active Badge Template" -ForegroundColor Yellow
$templateResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/badge-templates" `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body @{
        name = "E2E Test Achievement"
        description = "Badge created during E2E testing"
        imageUrl = "https://example.com/test-badge.png"
        category = "achievement"
        issuanceCriteria = @{
            description = "Complete E2E test successfully"
            requiredActions = @("Run PowerShell script", "Verify API endpoints")
        }
        validityPeriod = 365
        status = "ACTIVE"
    }

if ($templateResponse.Success) {
    $templateId = $templateResponse.Data.id
    Write-TestResult -TestName "Create Badge Template" -Success $true -Message "Template ID: $templateId"
} else {
    Write-TestResult -TestName "Create Badge Template" -Success $false -Message $templateResponse.Error
    exit 1
}

# Step 3: Create Recipient User
Write-Host "`nStep 3: Create Recipient User" -ForegroundColor Yellow
$recipientResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/auth/register" -Body @{
    email = "test-recipient-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "Recipient123!"
    firstName = "Test"
    lastName = "Recipient"
}

if ($recipientResponse.Success) {
    $recipientId = $recipientResponse.Data.id
    Write-TestResult -TestName "Create Recipient User" -Success $true -Message "Recipient ID: $recipientId"
} else {
    Write-TestResult -TestName "Create Recipient User" -Success $false -Message $recipientResponse.Error
    exit 1
}

# Step 4: Issue Badge
Write-Host "`nStep 4: Issue Badge" -ForegroundColor Yellow
$badgeResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/badges" `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body @{
        templateId = $templateId
        recipientId = $recipientId
        evidenceUrl = "https://example.com/evidence/test-completion.pdf"
        expiresIn = 365
    }

if ($badgeResponse.Success) {
    $badgeId = $badgeResponse.Data.id
    $claimToken = $badgeResponse.Data.claimToken
    $claimUrl = $badgeResponse.Data.claimUrl
    $assertionUrl = $badgeResponse.Data.assertionUrl
    
    Write-TestResult -TestName "Issue Badge" -Success $true -Message "Badge ID: $badgeId"
    
    # Validate response structure
    $hasRequiredFields = ($badgeResponse.Data.PSObject.Properties.Name -contains "id") -and
                        ($badgeResponse.Data.PSObject.Properties.Name -contains "status") -and
                        ($badgeResponse.Data.PSObject.Properties.Name -contains "claimToken") -and
                        ($badgeResponse.Data.PSObject.Properties.Name -contains "claimUrl") -and
                        ($badgeResponse.Data.PSObject.Properties.Name -contains "assertionUrl")
    
    Write-TestResult -TestName "Badge Response Structure" -Success $hasRequiredFields
    
    # Validate claim token length
    $validTokenLength = $claimToken.Length -eq 32
    Write-TestResult -TestName "Claim Token Length (32 chars)" -Success $validTokenLength -Message "Length: $($claimToken.Length)"
    
    # Validate status
    $validStatus = $badgeResponse.Data.status -eq "PENDING"
    Write-TestResult -TestName "Badge Status is PENDING" -Success $validStatus -Message "Status: $($badgeResponse.Data.status)"
    
    # Validate URLs
    $validClaimUrl = $claimUrl -like "*$claimToken*"
    Write-TestResult -TestName "Claim URL Contains Token" -Success $validClaimUrl
    
    $validAssertionUrl = $assertionUrl -like "*/api/badges/$badgeId/assertion*"
    Write-TestResult -TestName "Assertion URL Format" -Success $validAssertionUrl
    
} else {
    Write-TestResult -TestName "Issue Badge" -Success $false -Message $badgeResponse.Error
    exit 1
}

# Step 5: Verify Assertion Endpoint (Public Access)
Write-Host "`nStep 5: Verify Assertion Endpoint" -ForegroundColor Yellow
$assertionResponse = Invoke-ApiRequest -Method GET -Endpoint "/api/badges/$badgeId/assertion"

if ($assertionResponse.Success) {
    Write-TestResult -TestName "Get Badge Assertion" -Success $true
    
    # Validate Open Badges 2.0 structure
    $assertion = $assertionResponse.Data
    $hasContext = $assertion.PSObject.Properties.Name -contains "@context"
    $hasType = $assertion.type -eq "Assertion"
    $hasBadge = $assertion.PSObject.Properties.Name -contains "badge"
    $hasRecipient = $assertion.PSObject.Properties.Name -contains "recipient"
    $hasVerification = $assertion.PSObject.Properties.Name -contains "verification"
    
    Write-TestResult -TestName "OB 2.0 Structure (@context)" -Success $hasContext
    Write-TestResult -TestName "OB 2.0 Structure (type=Assertion)" -Success $hasType
    Write-TestResult -TestName "OB 2.0 Structure (badge)" -Success $hasBadge
    Write-TestResult -TestName "OB 2.0 Structure (recipient)" -Success $hasRecipient
    Write-TestResult -TestName "OB 2.0 Structure (verification)" -Success $hasVerification
    
    # Check recipient privacy (hashed email)
    $recipientHashed = $assertion.recipient.identity -like "sha256$*"
    Write-TestResult -TestName "Recipient Email is Hashed" -Success $recipientHashed
    
} else {
    Write-TestResult -TestName "Get Badge Assertion" -Success $false -Message $assertionResponse.Error
}

# Step 6: Test Authorization (Employee should not be able to issue badges)
Write-Host "`nStep 6: Test Authorization (Negative Test)" -ForegroundColor Yellow
$employeeLoginResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/auth/login" -Body @{
    email = "employee@gcredit.com"
    password = "Employee123!"
}

if ($employeeLoginResponse.Success) {
    $employeeToken = $employeeLoginResponse.Data.token
    
    $unauthorizedResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/badges" `
        -Headers @{ Authorization = "Bearer $employeeToken" } `
        -Body @{
            templateId = $templateId
            recipientId = $recipientId
            expiresIn = 365
        }
    
    # Should fail with 403
    $correctlyDenied = -not $unauthorizedResponse.Success -and $unauthorizedResponse.StatusCode -eq 403
    Write-TestResult -TestName "Employee Cannot Issue Badge (403)" -Success $correctlyDenied -Message "Status: $($unauthorizedResponse.StatusCode)"
} else {
    Write-Host "Warning: Could not test employee authorization (employee login failed)" -ForegroundColor Yellow
}

# Step 7: Test Validation (Invalid Template ID)
Write-Host "`nStep 7: Test Validation (Negative Test)" -ForegroundColor Yellow
$invalidResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/badges" `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body @{
        templateId = "00000000-0000-0000-0000-000000000000"
        recipientId = $recipientId
        expiresIn = 365
    }

$correctlyFailed = -not $invalidResponse.Success -and $invalidResponse.StatusCode -eq 404
Write-TestResult -TestName "Invalid Template ID Returns 404" -Success $correctlyFailed -Message "Status: $($invalidResponse.StatusCode)"

# Final Summary
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Total Tests:  $($script:TestResults.Total)" -ForegroundColor White
Write-Host "Passed:       $($script:TestResults.Passed)" -ForegroundColor Green
Write-Host "Failed:       $($script:TestResults.Failed)" -ForegroundColor Red

if ($script:TestResults.Failed -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    Write-Host "`nBadge Details:" -ForegroundColor Cyan
    Write-Host "  Badge ID:      $badgeId"
    Write-Host "  Claim Token:   $claimToken"
    Write-Host "  Claim URL:     $claimUrl"
    Write-Host "  Assertion URL: $assertionUrl"
    exit 0
} else {
    Write-Host "`n❌ Some tests failed" -ForegroundColor Red
    exit 1
}
