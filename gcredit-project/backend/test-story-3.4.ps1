# Story 3.4: Badge Template Query Optimization Test
# Simplified test without complex nested objects

$baseUrl = "http://localhost:3000"
$testResults = @()

Write-Host "`n=== Story 3.4: Query Optimization Test ===" -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = '{"email":"admin@gcredit.test","password":"Admin123!"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST -Body $loginBody -ContentType "application/json"
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

# Step 2: Create test skill category
Write-Host "`n2. Creating skill category..." -ForegroundColor Yellow
$categoryBody = '{"name":"测试类别优化","nameEn":"Test Category Opt","description":"For Story 3.4"}'

try {
    $category = Invoke-RestMethod -Uri "$baseUrl/skill-categories" `
        -Method POST -Body $categoryBody -Headers $headers
    $categoryId = $category.id
    Write-Host "   OK Category ID: $categoryId" -ForegroundColor Green
    $testResults += @{Test="Create Category"; Status="PASS"}
} catch {
    Write-Host "   FAIL $_" -ForegroundColor Red
    $testResults += @{Test="Create Category"; Status="FAIL"}
}

# Step 3: Create test skill
Write-Host "`n3. Creating skill..." -ForegroundColor Yellow
$skillBody = "{`"name`":`"测试技能优化`",`"nameEn`":`"Test Skill Opt`",`"description`":`"For Story 3.4`",`"categoryId`":`"$categoryId`"}"

try {
    $skill = Invoke-RestMethod -Uri "$baseUrl/skills" `
        -Method POST -Body $skillBody -Headers $headers
    $skillId = $skill.id
    Write-Host "   OK Skill ID: $skillId" -ForegroundColor Green
    $testResults += @{Test="Create Skill"; Status="PASS"}
} catch {
    Write-Host "   FAIL $_" -ForegroundColor Red
    $testResults += @{Test="Create Skill"; Status="FAIL"}
}

# Step 4: Create badge template
Write-Host "`n4. Creating badge template..." -ForegroundColor Yellow
$badgeBody = "{`"name`":`"测试徽章优化`",`"description`":`"Testing optimized query`",`"category`":`"技术认证`",`"skillIds`":[`"$skillId`"],`"issuanceCriteria`":{`"type`":`"manual`"},`"status`":`"ACTIVE`"}"

try {
    $badge = Invoke-RestMethod -Uri "$baseUrl/badge-templates" `
        -Method POST -Body $badgeBody -Headers $headers
    $badgeId = $badge.id
    Write-Host "   OK Badge ID: $badgeId" -ForegroundColor Green
    $testResults += @{Test="Create Badge"; Status="PASS"}
} catch {
    Write-Host "   FAIL $_" -ForegroundColor Red
    $testResults += @{Test="Create Badge"; Status="FAIL"}
    exit 1
}

# Step 5: Test optimized findOne with skills
Write-Host "`n5. Testing optimized findOne with skills..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    $badgeDetail = Invoke-RestMethod -Uri "$baseUrl/badge-templates/$badgeId" `
        -Method GET -Headers $headers
    
    $endTime = Get-Date
    $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
    
    if ($badgeDetail.skills -and $badgeDetail.skills.Count -gt 0) {
        $skill = $badgeDetail.skills[0]
        
        if ($skill.category -and $skill.category.name) {
            Write-Host "   OK Skills with category loaded" -ForegroundColor Green
            Write-Host "   Query time: ${duration}ms" -ForegroundColor Cyan
            
            if ($duration -lt 150) {
                Write-Host "   OK Performance target met" -ForegroundColor Green
                $testResults += @{Test="Optimized Query"; Status="PASS"; Time="${duration}ms"}
            } else {
                Write-Host "   WARN Performance slow" -ForegroundColor Yellow
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
    Write-Host "   FAIL $_" -ForegroundColor Red
    $testResults += @{Test="Optimized Query"; Status="FAIL"}
}

# Step 6: Test composite index
Write-Host "`n6. Testing composite index..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    $filterResponse = Invoke-RestMethod -Uri "$baseUrl/badge-templates?category=技术认证&status=ACTIVE" `
        -Method GET -Headers $headers
    
    $endTime = Get-Date
    $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
    
    Write-Host "   OK Filtered query successful" -ForegroundColor Green
    Write-Host "   Query time: ${duration}ms" -ForegroundColor Cyan
    Write-Host "   Results: $($filterResponse.data.Count) templates" -ForegroundColor Cyan
    
    if ($duration -lt 150) {
        Write-Host "   OK Performance target met" -ForegroundColor Green
        $testResults += @{Test="Composite Index"; Status="PASS"; Time="${duration}ms"}
    } else {
        Write-Host "   WARN Performance slow" -ForegroundColor Yellow
        $testResults += @{Test="Composite Index"; Status="SLOW"; Time="${duration}ms"}
    }
} catch {
    Write-Host "   FAIL $_" -ForegroundColor Red
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
    Write-Host "`nStory 3.4 - SOME TESTS FAILED" -ForegroundColor Yellow
    exit 1
}
