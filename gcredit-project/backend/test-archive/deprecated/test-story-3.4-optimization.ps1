# Story 3.4: Badge Template Query Optimization Test
# Tests the optimized findOne() method with skills association

$baseUrl = "http://localhost:3000"
$testResults = @()

Write-Host "`n=== Story 3.4: Query Optimization Test ===" -ForegroundColor Cyan
Write-Host "Testing Badge Template with Skills Association`n" -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@gcredit.test"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "   ✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create test skill category
Write-Host "`n2. Creating test skill category..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$categoryBody = @{
    name = "测试类别-优化"
    nameEn = "Test Category Optimization"
    description = "For Story 3.4 testing"
} | ConvertTo-Json

try {
    $category = Invoke-RestMethod -Uri "$baseUrl/skill-categories" `
        -Method POST -Body $categoryBody -Headers $headers
    $categoryId = $category.id
    Write-Host "   ✅ Category created: $categoryId" -ForegroundColor Green
    
    $testResults += [PSCustomObject]@{
        Test = "Create Skill Category"
        Status = "✅ PASS"
        Details = "ID: $categoryId"
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += [PSCustomObject]@{
        Test = "Create Skill Category"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Step 3: Create test skill
Write-Host "`n3. Creating test skill..." -ForegroundColor Yellow
$skillBody = @{
    name = "测试技能-优化"
    nameEn = "Test Skill Optimization"
    description = "For Story 3.4 testing"
    categoryId = $categoryId
} | ConvertTo-Json

try {
    $skill = Invoke-RestMethod -Uri "$baseUrl/skills" `
        -Method POST -Body $skillBody -Headers $headers
    $skillId = $skill.id
    Write-Host "   ✅ Skill created: $skillId" -ForegroundColor Green
    
    $testResults += [PSCustomObject]@{
        Test = "Create Skill"
        Status = "✅ PASS"
        Details = "ID: $skillId"
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += [PSCustomObject]@{
        Test = "Create Skill"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Step 4: Create badge template with skill
Write-Host "`n4. Creating badge template with skill..." -ForegroundColor Yellow
$badgeBody = @{
    name = "测试徽章-优化"
    description = "Testing optimized query with skills"
    category = "技术认证"
    skillIds = @($skillId)
    issuanceCriteria = @{
        type = "manual"
    }
    status = "ACTIVE"
} | ConvertTo-Json -Depth 10

try {
    $badge = Invoke-RestMethod -Uri "$baseUrl/badge-templates" `
        -Method POST -Body $badgeBody -Headers $headers
    $badgeId = $badge.id
    Write-Host "   ✅ Badge template created: $badgeId" -ForegroundColor Green
    
    $testResults += [PSCustomObject]@{
        Test = "Create Badge Template"
        Status = "✅ PASS"
        Details = "ID: $badgeId"
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += [PSCustomObject]@{
        Test = "Create Badge Template"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
    exit 1
}

# Step 5: Test optimized findOne() with skills association
Write-Host "`n5. Testing optimized findOne() with skills..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    $badgeDetail = Invoke-RestMethod -Uri "$baseUrl/badge-templates/$badgeId" `
        -Method GET -Headers $headers
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    # Verify skills are included
    if ($badgeDetail.skills -and $badgeDetail.skills.Count -gt 0) {
        $skill = $badgeDetail.skills[0]
        
        # Check if skill has category information
        if ($skill.category -and $skill.category.name) {
            Write-Host "   ✅ Skills with category loaded correctly" -ForegroundColor Green
            Write-Host "   ⏱️  Query time: $($duration)ms" -ForegroundColor Cyan
            
            if ($duration -lt 150) {
                Write-Host "   ✅ Performance target met (<150ms)" -ForegroundColor Green
                $perfStatus = "✅ PASS"
            } else {
                Write-Host "   ⚠️  Performance target missed (>150ms)" -ForegroundColor Yellow
                $perfStatus = "⚠️ SLOW"
            }
            
            $testResults += [PSCustomObject]@{
                Test = "Optimized Query with Skills"
                Status = $perfStatus
                Details = "Duration: $($duration)ms, Skills: $($badgeDetail.skills.Count)"
            }
        } else {
            Write-Host "   ❌ Skill category not loaded" -ForegroundColor Red
            $testResults += [PSCustomObject]@{
                Test = "Optimized Query with Skills"
                Status = "❌ FAIL"
                Details = "Category info missing"
            }
        }
    } else {
        Write-Host "   ❌ Skills not included in response" -ForegroundColor Red
        $testResults += [PSCustomObject]@{
            Test = "Optimized Query with Skills"
            Status = "❌ FAIL"
            Details = "Skills array empty or missing"
        }
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += [PSCustomObject]@{
        Test = "Optimized Query with Skills"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Step 6: Test composite index performance (category + status filter)
Write-Host "`n6. Testing composite index (category + status)..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    $filterResponse = Invoke-RestMethod -Uri "$baseUrl/badge-templates?category=技术认证&status=ACTIVE" `
        -Method GET -Headers $headers
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "   ✅ Filtered query successful" -ForegroundColor Green
    Write-Host "   ⏱️  Query time: $($duration)ms" -ForegroundColor Cyan
    Write-Host "   📊 Results: $($filterResponse.data.Count) templates" -ForegroundColor Cyan
    
    if ($duration -lt 150) {
        Write-Host "   ✅ Performance target met (<150ms)" -ForegroundColor Green
        $perfStatus = "✅ PASS"
    } else {
        Write-Host "   ⚠️  Performance target missed (>150ms)" -ForegroundColor Yellow
        $perfStatus = "⚠️ SLOW"
    }
    
    $testResults += [PSCustomObject]@{
        Test = "Composite Index Query"
        Status = $perfStatus
        Details = "Duration: $($duration)ms, Results: $($filterResponse.data.Count)"
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += [PSCustomObject]@{
        Test = "Composite Index Query"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$testResults | Format-Table -AutoSize

$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$totalCount = $testResults.Count
$passRate = [math]::Round(($passCount / $totalCount) * 100, 2)

Write-Host "`n📊 Results: $passCount/$totalCount tests passed ($passRate%)" -ForegroundColor Cyan

if ($passCount -eq $totalCount) {
    Write-Host "`n✅ Story 3.4: Query Optimization - ALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Story 3.4: Query Optimization - SOME TESTS FAILED" -ForegroundColor Yellow
    exit 1
}
