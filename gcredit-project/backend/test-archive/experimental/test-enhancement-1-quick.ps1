# Quick Enhancement 1 Test
# Simplified test using existing data

$baseUrl = "http://localhost:3000"

Write-Host "=== Quick Enhancement 1 Test ===" -ForegroundColor Cyan
Write-Host ""

# Login
Write-Host "1. Login..." -ForegroundColor Yellow
$loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -Body (@{email="admin@gcredit.test";password="Admin123!"} | ConvertTo-Json) `
    -ContentType "application/json"
$token = $loginResp.accessToken
Write-Host "   ✓ Logged in" -ForegroundColor Green

# Get category ID (use first one)
$category = (Invoke-RestMethod -Uri "$baseUrl/skill-categories" -Headers @{"Authorization"="Bearer $token"})[0]
$categoryId = $category.id
Write-Host "   Category: $($category.name) ($categoryId)" -ForegroundColor Gray

# Create a test skill
Write-Host ""
Write-Host "2. Creating test skill..." -ForegroundColor Yellow
$skillName = "EnhancementTest_$(Get-Random)"
try {
    $skillResp = Invoke-RestMethod -Uri "$baseUrl/skills" -Method Post `
        -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} `
        -Body (@{categoryId=$categoryId;name=$skillName;description="Test"} | ConvertTo-Json)
    $skillId = $skillResp.id
    Write-Host "   ✓ Created skill: $skillId" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to create skill" -ForegroundColor Red
    exit 1
}

# Test function
function Test-ImageUpload {
    param($ImageFile, $TestName, $ShouldPass)
    
    Write-Host ""
    Write-Host "Testing: $TestName" -ForegroundColor Yellow
    Write-Host "   Image: $ImageFile" -ForegroundColor Gray
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    # Read image with correct path
    $imagePath = Join-Path (Get-Location) "test-images\$ImageFile"
    if (-not (Test-Path $imagePath)) {
        Write-Host "   ✗ FAIL - Image file not found: $imagePath" -ForegroundColor Red
        return $false
    }
    $imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
    
    # Build multipart body
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"name`"",
        "",
        "Test $TestName",
        "--$boundary",
        "Content-Disposition: form-data; name=`"category`"",
        "",
        "skill",
        "--$boundary",
        "Content-Disposition: form-data; name=`"description`"",
        "",
        "Enhancement 1 test",
        "--$boundary",
        "Content-Disposition: form-data; name=`"skillIds`"",
        "Content-Type: application/json",
        "",
        "[$($skillId | ConvertTo-Json)]",
        "--$boundary",
        "Content-Disposition: form-data; name=`"issuanceCriteria`"",
        "Content-Type: application/json",
        "",
        '{"type":"manual"}',
        "--$boundary",
        "Content-Disposition: form-data; name=`"image`"; filename=`"$ImageFile`"",
        "Content-Type: image/png",
        ""
    ) -join $LF
    
    $encoding = [System.Text.Encoding]::UTF8
    $bodyBytes = $encoding.GetBytes($bodyLines + $LF)
    $bodyBytes += $imageBytes
    $bodyBytes += $encoding.GetBytes("$LF--$boundary--$LF")
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/badge-templates" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "multipart/form-data; boundary=$boundary"
            } `
            -Body $bodyBytes
        
        if ($ShouldPass) {
            Write-Host "   ✓ PASS - Upload successful" -ForegroundColor Green
            $result = $response.Content | ConvertFrom-Json
            Write-Host "     Badge ID: $($result.id)" -ForegroundColor Gray
            Write-Host "     Image URL: ...$(($result.imageUrl).Substring([Math]::Max(0, ($result.imageUrl).Length - 40)))" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "   ✗ FAIL - Should have been rejected" -ForegroundColor Red
            return $false
        }
    } catch {
        if (-not $ShouldPass) {
            $errorMsg = ""
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $errorMsg = $errorBody.message
                $reader.Close()
            } catch {}
            
            Write-Host "   ✓ PASS - Correctly rejected" -ForegroundColor Green
            Write-Host "     Error: $errorMsg" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "   ✗ FAIL - Upload failed unexpectedly" -ForegroundColor Red
            Write-Host "     Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd()
                Write-Host "     Error: $errorBody" -ForegroundColor Gray
                $reader.Close()
            } catch {
                Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
            }
            return $false
        }
    }
}

# Run tests
Write-Host ""
Write-Host "=== Running Tests ===" -ForegroundColor Cyan

$results = @()

$results += Test-ImageUpload "test-too-small-64x64.png" "Too Small (64x64)" $false
Start-Sleep -Milliseconds 500

$results += Test-ImageUpload "test-optimal-256x256.png" "Optimal (256x256)" $true
Start-Sleep -Milliseconds 500

$results += Test-ImageUpload "test-optimal-512x512.png" "Optimal (512x512)" $true
Start-Sleep -Milliseconds 500

$results += Test-ImageUpload "test-non-square-256x128.png" "Non-Square (256x128)" $true
Start-Sleep -Milliseconds 500

$results += Test-ImageUpload "test-min-128x128.png" "Minimum (128x128)" $true

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_ -eq $true }).Count
$total = $results.Count
Write-Host "Passed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "✓ All Enhancement 1 tests PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check server console for optimization suggestions:" -ForegroundColor Cyan
    Write-Host "  - 256x256 and 512x512 should have NO suggestions" -ForegroundColor Gray
    Write-Host "  - 256x128 should have aspect ratio suggestion" -ForegroundColor Gray
    Write-Host "  - 128x128 should have size suggestion" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "✗ Some tests failed" -ForegroundColor Red
}
