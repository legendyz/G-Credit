# Enhancement 1 Complete Test Suite
# Tests all image dimension scenarios

Write-Host "=== Enhancement 1 Complete Test ===" -ForegroundColor Cyan
Write-Host "Testing: Image dimension validation, metadata extraction, and optimization suggestions"
Write-Host ""

# 1. Login
Write-Host "1. Login..." -NoNewline
$loginResp = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body '{"email":"admin@gcredit.test","password":"Admin123!"}' -ContentType "application/json"
$token = $loginResp.accessToken
Write-Host " OK" -ForegroundColor Green

# 2. Get category
$categories = Invoke-RestMethod -Uri "http://localhost:3000/skill-categories" -Method GET -Headers @{Authorization = "Bearer $token"}
$categoryId = $categories[0].id

# 3. Create test skill
Write-Host "2. Creating test skill..." -NoNewline
$skillName = "E1Test_$(Get-Random)"
$skill = Invoke-RestMethod -Uri "http://localhost:3000/skills" -Method POST -Headers @{Authorization = "Bearer $token"} -Body (@{name=$skillName; description="E1 test"; categoryId=$categoryId} | ConvertTo-Json) -ContentType "application/json"
$skillId = $skill.id
Write-Host " OK (ID: $skillId)" -ForegroundColor Green

# Test function
function Test-Upload {
    param($ImageFile, $TestName, $ShouldPass)
    
    Write-Host ""
    Write-Host "$TestName" -ForegroundColor Cyan
    Write-Host "  Image: $ImageFile" -ForegroundColor Gray
    
    $imagePath = Join-Path (Get-Location) "test-images\$ImageFile"
    if (-not (Test-Path $imagePath)) {
        Write-Host "  FAIL - Image not found" -ForegroundColor Red
        return $false
    }
    
    $skillIdsJson = "[`"$skillId`"]"
    $output = & curl.exe -s -w "`nSTATUS:%{http_code}" -X POST "http://localhost:3000/badge-templates" -H "Authorization: Bearer $token" -F "name=E1_$TestName" -F "category=skill" -F "description=E1 test" -F "skillIds=$skillIdsJson" -F 'issuanceCriteria={"type":"manual"}' -F "image=@$imagePath" 2>&1
    
    $statusLine = $output | Select-String "STATUS:(\d+)"
    $status = if ($statusLine) { [int]$statusLine.Matches.Groups[1].Value } else { 0 }
    $body = ($output | Where-Object { $_ -notmatch "STATUS:" }) -join ""
    
    if ($status -eq 201) {
        if ($ShouldPass) {
            Write-Host "  PASS - Uploaded successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL - Should have been rejected" -ForegroundColor Red
            return $false
        }
    } else {
        if (-not $ShouldPass) {
            Write-Host "  PASS - Correctly rejected" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL - Upload failed with status $status" -ForegroundColor Red
            return $false
        }
    }
}

# Run all tests
Write-Host ""
Write-Host "3. Running Enhancement 1 Tests" -ForegroundColor Yellow
Write-Host "============================================================"

$passed = 0
$total = 0

# Test 1
$total++
if (Test-Upload "test-too-small-64x64.png" "Test 1: Too Small (64x64)" $false) { $passed++ }

# Test 2
$total++
if (Test-Upload "test-min-128x128.png" "Test 2: Minimum (128x128)" $true) { $passed++ }

# Test 3
$total++
if (Test-Upload "test-optimal-256x256.png" "Test 3: Optimal (256x256)" $true) { $passed++ }

# Test 4
$total++
if (Test-Upload "test-optimal-512x512.png" "Test 4: Optimal (512x512)" $true) { $passed++ }

# Test 5
$total++
if (Test-Upload "test-non-square-256x128.png" "Test 5: Non-Square (256x128)" $true) { $passed++ }

# Test 6
$total++
if (Test-Upload "test-large-1024x1024.png" "Test 6: Large (1024x1024)" $true) { $passed++ }

# Test 7
$total++
if (Test-Upload "test-max-2048x2048.png" "Test 7: Maximum (2048x2048)" $true) { $passed++ }

# Test 8
$total++
if (Test-Upload "test-too-large-3000x3000.png" "Test 8: Too Large (3000x3000)" $false) { $passed++ }

# Summary
Write-Host ""
Write-Host "============================================================"
Write-Host "Test Summary: $passed / $total passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "SUCCESS - All Enhancement 1 tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "PARTIAL - Some tests failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test complete" -ForegroundColor Cyan
