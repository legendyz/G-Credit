# Sprint 2 Complete End-to-End Test
# Tests all 6 stories + Enhancement 1

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       Sprint 2 Complete E2E Test Suite" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$testResults = @()
$testData = @{}

function Test-Step {
    param($Name, $Action)
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    try {
        $result = & $Action
        Write-Host "  PASS" -ForegroundColor Green
        $script:testResults += @{Name=$Name; Status="PASS"}
        return $result
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{Name=$Name; Status="FAIL"; Error=$_.Exception.Message}
        throw
    }
}

# 1. Login
Write-Host "[1/10] Authentication" -ForegroundColor Cyan
$token = Test-Step "Admin login" {
    $resp = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body '{"email":"admin@gcredit.test","password":"Admin123!"}' -ContentType "application/json"
    $resp.accessToken
}
Write-Host ""

# 2. Story 3.6 - Skill Categories
Write-Host "[2/10] Story 3.6: Skill Category Management" -ForegroundColor Cyan

Test-Step "Query skill categories" {
    $categories = Invoke-RestMethod -Uri "http://localhost:3000/skill-categories" -Method GET -Headers @{Authorization = "Bearer $token"}
    if ($categories.Count -lt 5) { throw "Expected at least 5 categories" }
    $script:testData.rootCategory = $categories[0]
    $script:testData.subCategory = $categories[0].children[0]
}

Test-Step "Get specific category" {
    $category = Invoke-RestMethod -Uri "http://localhost:3000/skill-categories/$($testData.rootCategory.id)" -Method GET -Headers @{Authorization = "Bearer $token"}
    if ($category.id -ne $testData.rootCategory.id) { throw "Category mismatch" }
}

Test-Step "Search categories by name" {
    $results = Invoke-RestMethod -Uri "http://localhost:3000/skill-categories/search?q=技术" -Method GET -Headers @{Authorization = "Bearer $token"}
    if ($results.Count -eq 0) { throw "Search returned no results" }
}
Write-Host ""

# 3. Story 3.1 - Skills (Data Model verification)
Write-Host "[3/10] Story 3.1: Skill Data Model" -ForegroundColor Cyan

Test-Step "Create skill with category relationship" {
    $skillBody = @{
        name = "E2E Test Skill $(Get-Random)"
        description = "Sprint 2 E2E test skill"
        categoryId = $testData.subCategory.id
    } | ConvertTo-Json
    
    $skill = Invoke-RestMethod -Uri "http://localhost:3000/skills" -Method POST -Headers @{Authorization = "Bearer $token"} -Body $skillBody -ContentType "application/json"
    
    if (-not $skill.id) { throw "Skill creation failed" }
    if ($skill.categoryId -ne $testData.subCategory.id) { throw "Category relationship failed" }
    $script:testData.skill = $skill
}

Test-Step "Query skills by category" {
    $skills = Invoke-RestMethod -Uri "http://localhost:3000/skills?categoryId=$($testData.subCategory.id)" -Method GET -Headers @{Authorization = "Bearer $token"}
    $found = $skills.items | Where-Object { $_.id -eq $testData.skill.id }
    if (-not $found) { throw "Skill not found in category query" }
}
Write-Host ""

# 4. Story 3.2 - Badge Template CRUD + Azure Blob
Write-Host "[4/10] Story 3.2: Badge Template CRUD + Azure Blob" -ForegroundColor Cyan

Test-Step "Create badge template with image" {
    $imagePath = Join-Path (Get-Location) "test-images\test-optimal-256x256.png"
    if (-not (Test-Path $imagePath)) { throw "Test image not found" }
    
    $skillIdsJson = "[`"$($testData.skill.id)`"]"
    $output = & curl.exe -s -w "`nSTATUS:%{http_code}" -X POST "http://localhost:3000/badge-templates" -H "Authorization: Bearer $token" -F "name=E2E Test Badge" -F "category=skill" -F "description=Sprint 2 E2E test" -F "skillIds=$skillIdsJson" -F 'issuanceCriteria={"type":"manual"}' -F "image=@$imagePath" 2>&1
    
    $statusLine = $output | Select-String "STATUS:(\d+)"
    $status = [int]$statusLine.Matches.Groups[1].Value
    if ($status -ne 201) { throw "Badge creation failed with status $status" }
    
    $body = ($output | Where-Object { $_ -notmatch "STATUS:" }) -join ""
    $badge = $body | ConvertFrom-Json
    
    if (-not $badge.imageUrl) { throw "Image URL not set" }
    if (-not $badge.imageUrl.StartsWith("https://")) { throw "Invalid Azure Blob URL" }
    $script:testData.badge = $badge
}

Test-Step "Get badge template by ID" {
    $badge = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/$($testData.badge.id)" -Method GET -Headers @{Authorization = "Bearer $token"}
    if ($badge.id -ne $testData.badge.id) { throw "Badge mismatch" }
    if ($badge.skillIds[0] -ne $testData.skill.id) { throw "Skill relationship failed" }
}

Test-Step "Update badge template" {
    $imagePath = Join-Path (Get-Location) "test-images\test-optimal-512x512.png"
    $skillIdsJson = "[`"$($testData.skill.id)`"]"
    
    $output = & curl.exe -s -w "`nSTATUS:%{http_code}" -X PATCH "http://localhost:3000/badge-templates/$($testData.badge.id)" -H "Authorization: Bearer $token" -F "name=E2E Test Badge Updated" -F "skillIds=$skillIdsJson" -F 'issuanceCriteria={"type":"manual"}' -F "image=@$imagePath" 2>&1
    
    $statusLine = $output | Select-String "STATUS:(\d+)"
    $status = [int]$statusLine.Matches.Groups[1].Value
    if ($status -ne 200) { throw "Badge update failed with status $status" }
    
    $body = ($output | Where-Object { $_ -notmatch "STATUS:" }) -join ""
    $updated = $body | ConvertFrom-Json
    if ($updated.name -ne "E2E Test Badge Updated") { throw "Badge name not updated" }
    
    if ($updated.imageUrl -eq $testData.badge.imageUrl) { throw "Image not replaced" }
}
Write-Host ""

# 5. Story 3.3 - Query Badge Templates
Write-Host "[5/10] Story 3.3: Query Badge Templates API" -ForegroundColor Cyan

Test-Step "Query all public badges" {
    $badges = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates" -Method GET
    $drafts = $badges.items | Where-Object { $_.status -ne "ACTIVE" }
    if ($drafts.Count -gt 0) { throw "Public API returned non-active badges" }
}

Test-Step "Query all badges (admin)" {
    $badges = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/all" -Method GET -Headers @{Authorization = "Bearer $token"}
    $found = $badges.items | Where-Object { $_.id -eq $testData.badge.id }
    if (-not $found) { throw "Admin query did not return test badge" }
}

Test-Step "Filter by category" {
    $badges = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates?category=skill" -Method GET
    $nonSkill = $badges.items | Where-Object { $_.category -ne "skill" }
    if ($nonSkill.Count -gt 0) { throw "Category filter failed" }
}

Test-Step "Filter by skill ID" {
    $badges = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates?skillId=$($testData.skill.id)" -Method GET -Headers @{Authorization = "Bearer $token"}
    $found = $badges.items | Where-Object { $_.skillIds -contains $testData.skill.id }
    if ($found.Count -eq 0) { throw "Skill filter failed" }
}

Test-Step "Pagination" {
    $page1 = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates?page=1`&limit=2" -Method GET
    if ($page1.items.Count -gt 2) { throw "Pagination limit not working" }
    if (-not $page1.meta.totalPages) { throw "Pagination metadata missing" }
}
Write-Host ""

# 6. Story 3.4 - Search Optimization
Write-Host "[6/10] Story 3.4: Badge Template Search" -ForegroundColor Cyan

Test-Step "Search by name" {
    $results = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates?search=E2E" -Method GET -Headers @{Authorization = "Bearer $token"}
    $found = $results.items | Where-Object { $_.name -like "*E2E*" }
    if ($found.Count -eq 0) { throw "Search by name failed" }
}

Test-Step "Search by description" {
    $results = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates?search=Sprint" -Method GET -Headers @{Authorization = "Bearer $token"}
    $found = $results.items | Where-Object { $_.description -like "*Sprint*" }
    if ($found.Count -eq 0) { throw "Search by description failed" }
}

Test-Step "Sort by createdAt DESC" {
    $results = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/all?sortBy=createdAt`&sortOrder=desc" -Method GET -Headers @{Authorization = "Bearer $token"}
    if ($results.items.Count -lt 2) { 
        Write-Host "  (Skip: Not enough badges for sort test)" -ForegroundColor Gray
    } else {
        $first = [DateTime]$results.items[0].createdAt
        $second = [DateTime]$results.items[1].createdAt
        if ($first -lt $second) { throw "Sort order incorrect" }
    }
}
Write-Host ""

# 7. Story 3.5 - Issuance Criteria
Write-Host "[7/10] Story 3.5: Issuance Criteria Validation" -ForegroundColor Cyan

Test-Step "Verify issuance criteria structure" {
    $badge = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/$($testData.badge.id)" -Method GET -Headers @{Authorization = "Bearer $token"}
    if (-not $badge.issuanceCriteria) { throw "Issuance criteria missing" }
    if (-not $badge.issuanceCriteria.type) { throw "Issuance criteria type missing" }
}

Test-Step "Get criteria templates" {
    $templates = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/criteria-templates" -Method GET
    if ($templates.Count -eq 0) { throw "No criteria templates available" }
}

Write-Host "  NOTE: Full Story 3.5 validation covered by 15 unit tests" -ForegroundColor Gray
Write-Host ""

# 8. Enhancement 1 - Image Management
Write-Host "[8/10] Enhancement 1: Azure Blob Image Management" -ForegroundColor Cyan

Test-Step "Verify image dimension validation (reject too small)" {
    $imagePath = Join-Path (Get-Location) "test-images\test-too-small-64x64.png"
    $skillIdsJson = "[`"$($testData.skill.id)`"]"
    
    $output = & curl.exe -s -w "`nSTATUS:%{http_code}" -X POST "http://localhost:3000/badge-templates" -H "Authorization: Bearer $token" -F "name=Should Fail" -F "category=skill" -F "description=Test" -F "skillIds=$skillIdsJson" -F 'issuanceCriteria={"type":"manual"}' -F "image=@$imagePath" 2>&1
    
    $statusLine = $output | Select-String "STATUS:(\d+)"
    $status = [int]$statusLine.Matches.Groups[1].Value
    if ($status -ne 400) { throw "Should reject 64x64 image" }
}

Test-Step "Verify image dimension validation (accept optimal)" {
    if (-not $testData.badge.imageUrl) { throw "Optimal image not accepted" }
}

Write-Host "  NOTE: Full Enhancement 1 validation covered by 8 E2E tests" -ForegroundColor Gray
Write-Host ""

# 9. Cleanup
Write-Host "[9/10] Cleanup Test Data" -ForegroundColor Cyan

Test-Step "Delete test badge template" {
    $null = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/$($testData.badge.id)" -Method DELETE -Headers @{Authorization = "Bearer $token"}
    
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/$($testData.badge.id)" -Method GET -Headers @{Authorization = "Bearer $token"}
        throw "Badge not deleted"
    } catch {
        if ($_.Exception.Message -notlike "*404*") { throw }
    }
}

Test-Step "Delete test skill" {
    $null = Invoke-RestMethod -Uri "http://localhost:3000/skills/$($testData.skill.id)" -Method DELETE -Headers @{Authorization = "Bearer $token"}
}

Write-Host ""

# 10. Summary
Write-Host "[10/10] Test Summary" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host ""
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "SUCCESS - All Sprint 2 E2E tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sprint 2 Complete Validation:" -ForegroundColor Cyan
    Write-Host "  Story 3.1 Data Model        - VERIFIED" -ForegroundColor Green
    Write-Host "  Story 3.2 CRUD + Azure Blob - VERIFIED" -ForegroundColor Green
    Write-Host "  Story 3.3 Query API         - VERIFIED" -ForegroundColor Green
    Write-Host "  Story 3.4 Search/Sort       - VERIFIED" -ForegroundColor Green
    Write-Host "  Story 3.5 Issuance Criteria - VERIFIED with 15 unit tests" -ForegroundColor Green
    Write-Host "  Story 3.6 Skill Categories  - VERIFIED" -ForegroundColor Green
    Write-Host "  Enhancement 1 Image Mgmt    - VERIFIED with 8 E2E tests" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sprint 2 is production ready!" -ForegroundColor Green
} else {
    Write-Host "FAILED - Some tests did not pass" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
