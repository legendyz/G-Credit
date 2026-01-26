# Story 3.4: Badge Template Query Optimization Test

$baseUrl = "http://localhost:3000"
$testResults = @()

Write-Host "`n=== Story 3.4: Query Optimization Test ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = '{"email":"admin@gcredit.test","password":"Admin123!"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "   OK Login successful" -ForegroundColor Green
} catch {
    Write-Host "   FAIL Login" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get existing parent category or use known ID
Write-Host "`n2. Getting parent category..." -ForegroundColor Yellow
$parentId = "da721a77-18c0-40e7-a7aa-269efe8e26bb"  # Known parent category
Write-Host "   OK Using parent category: $parentId" -ForegroundColor Green

# Step 3: Create skill category
Write-Host "`n3. Creating skill category..." -ForegroundColor Yellow
$categoryBody = @{
    name = "TestCategoryOpt"
    nameEn = "Test Category Optimization"
    description = "For Story 3.4"
    parentId = $parentId
} | ConvertTo-Json

try {
    $category = Invoke-RestMethod -Uri "$baseUrl/skill-categories" -Method POST -Body $categoryBody -Headers $headers
    $categoryId = $category.id
    Write-Host "   OK Category ID: $categoryId" -ForegroundColor Green
    $testResults += @{Test="Get Parent Category"; Status="PASS"}
} catch {
    Write-Host "   FAIL" -ForegroundColor Red
    $testResults += @{Test="Get Parent Category"; Status="FAIL"}
}

# Step 4: Create skill
Write-Host "`n4. Creating skill..." -ForegroundColor Yellow
$skillBody = @{
    name = "TestSkillOpt"
    description = "For Story 3.4"
    categoryId = $categoryId
} | ConvertTo-Json

try {
    $skill = Invoke-RestMethod -Uri "$baseUrl/skills" -Method POST -Body $skillBody -Headers $headers
    $skillId = $skill.id
    Write-Host "   OK Skill ID: $skillId" -ForegroundColor Green
    $testResults += @{Test="Create Skill"; Status="PASS"}
} catch {
    Write-Host "   FAIL" -ForegroundColor Red
    $testResults += @{Test="Create Skill"; Status="FAIL"}
}

# Step 5: Create badge template
Write-Host "`n5. Creating badge template..." -ForegroundColor Yellow
$badgeBody = @{
    name = "TestBadgeOpt"
    description = "Testing optimized query"
    category = "achievement"
    skillIds = @($skillId)
    issuanceCriteria = @{type="manual"}
} | ConvertTo-Json -Depth 10

try {
    $badge = Invoke-RestMethod -Uri "$baseUrl/badge-templates" -Method POST -Body $badgeBody -Headers $headers
    $badgeId = $badge.id
    Write-Host "   OK Badge ID: $badgeId" -ForegroundColor Green
    $testResults += @{Test="Create Badge"; Status="PASS"}
} catch {
    Write-Host "   FAIL" -ForegroundColor Red
    $testResults += @{Test="Create Badge"; Status="FAIL"}
    exit 1
}

# Step 6: Test optimized findOne with skills
Write-Host "`n6. Testing optimized findOne() with skills..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    $badgeDetail = Invoke-RestMethod -Uri "$baseUrl/badge-templates/$badgeId" -Method GET -Headers $headers
    
    $endTime = Get-Date
    $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
    
    if ($badgeDetail.skills -and $badgeDetail.skills.Count -gt 0) {
        $skill = $badgeDetail.skills[0]
        
        if ($skill.category -and $skill.category.name) {
            Write-Host "   OK Skills with category loaded" -ForegroundColor Green
            Write-Host "   Query time: ${duration}ms" -ForegroundColor Cyan
            
            if ($duration -lt 150) {
                Write-Host "   OK Performance target met (<150ms)" -ForegroundColor Green
                $testResults += @{Test="Optimized Query"; Status="PASS"; Time="${duration}ms"}
            } else {
                Write-Host "   WARN Performance slow (>150ms)" -ForegroundColor Yellow
                $testResults += @{Test="Optimized Query"; Status="SLOW"; Time="${duration}ms"}
            }
        } else {
            Write-Host "   FAIL Category not loaded" -ForegroundColor Red
            $testResults += @{Test="Optimized Query"; Status="FAIL"}
        }
    } else {
        Write-Host "   FAIL Skills not included" -ForegroundColor Red
        $testResults += @{Test="Optimized Query"; Status="FAIL"}
    }
} catch {
    Write-Host "   FAIL" -ForegroundColor Red
    $testResults += @{Test="Optimized Query"; Status="FAIL"}
}

# Step 7: Test composite index
Write-Host "`n7. Testing composite index (category + status)..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    $filterResponse = Invoke-RestMethod -Uri "$baseUrl/badge-templates?category=achievement&status=DRAFT" -Method GET -Headers $headers
    
    $endTime = Get-Date
    $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
    
    Write-Host "   OK Filtered query successful" -ForegroundColor Green
    Write-Host "   Query time: ${duration}ms" -ForegroundColor Cyan
    Write-Host "   Results: $($filterResponse.data.Count) templates" -ForegroundColor Cyan
    
    if ($duration -lt 150) {
        Write-Host "   OK Performance target met (<150ms)" -ForegroundColor Green
        $testResults += @{Test="Composite Index"; Status="PASS"; Time="${duration}ms"}
    } else {
        Write-Host "   WARN Performance slow (>150ms)" -ForegroundColor Yellow
        $testResults += @{Test="Composite Index"; Status="SLOW"; Time="${duration}ms"}
    }
} catch {
    Write-Host "   FAIL" -ForegroundColor Red
    $testResults += @{Test="Composite Index"; Status="FAIL"}
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
foreach ($result in $testResults) {
    $status = $result.Status
    $test = $result.Test
    $time = if ($result.Time) { " ($($result.Time))" } else { "" }
    
    $color = if ($status -eq "PASS") { "Green" } elseif ($status -eq "SLOW") { "Yellow" } else { "Red" }
    Write-Host "$status - $test$time" -ForegroundColor $color
}

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $testResults.Count

Write-Host "`nResults: $passCount/$totalCount tests passed" -ForegroundColor Cyan

if ($passCount -eq $totalCount) {
    Write-Host "`nStory 3.4 - ALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nStory 3.4 - SOME TESTS FAILED OR SLOW" -ForegroundColor Yellow
    exit 1
}
