# Story 3.5: Issuance Criteria Validation Test Script
# Tests validation of different criteria types and templates

$baseUrl = "http://localhost:3000"
$testResults = @()

Write-Host "=== Story 3.5: Issuance Criteria Validation Test ===" -ForegroundColor Cyan
Write-Host ""

# Helper function to add test result
function Add-TestResult {
    param($name, $status, $message, $time = $null)
    $script:testResults += [PSCustomObject]@{
        Name = $name
        Status = $status
        Message = $message
        Time = $time
    }
}

# Helper function to test criteria
function Test-Criteria {
    param($name, $criteria, $shouldPass = $true)
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        $body = @{
            name = "Test Badge - $name"
            description = "Testing $name"
            category = "skill"
            skillIds = @($script:skillId)
            issuanceCriteria = $criteria
            validityPeriod = 365
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$baseUrl/badge-templates" `
            -Method Post `
            -Headers $script:authHeaders `
            -Body $body `
            -ContentType "application/json"
        
        $stopwatch.Stop()
        
        if ($shouldPass) {
            Add-TestResult $name "PASS" "Criteria accepted" $stopwatch.ElapsedMilliseconds
            Write-Host "  ✓ $name - PASS ($($stopwatch.ElapsedMilliseconds)ms)" -ForegroundColor Green
            return $response.id
        } else {
            Add-TestResult $name "FAIL" "Should have rejected invalid criteria" $stopwatch.ElapsedMilliseconds
            Write-Host "  ✗ $name - FAIL (should have rejected)" -ForegroundColor Red
            return $null
        }
    } catch {
        $stopwatch.Stop()
        
        if (-not $shouldPass) {
            $errorMsg = $_.Exception.Response
            if ($errorMsg) {
                $reader = New-Object System.IO.StreamReader($errorMsg.GetResponseStream())
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                Add-TestResult $name "PASS" "Rejected as expected: $($errorBody.message)" $stopwatch.ElapsedMilliseconds
                Write-Host "  ✓ $name - PASS (rejected: $($errorBody.message))" -ForegroundColor Green
                return $null
            }
        }
        
        # Get detailed error message
        $errorDetail = ""
        try {
            $errorMsg = $_.Exception.Response
            if ($errorMsg) {
                $reader = New-Object System.IO.StreamReader($errorMsg.GetResponseStream())
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $errorDetail = $errorBody.message
            }
        } catch {
            $errorDetail = $_.Exception.Message
        }
        
        Add-TestResult $name "FAIL" "Error: $errorDetail" $stopwatch.ElapsedMilliseconds
        Write-Host "  ✗ $name - FAIL: $errorDetail" -ForegroundColor Red
        return $null
    }
}

# Test 1: Login
Write-Host "1. Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@gcredit.test"
        password = "Admin123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"

    $token = $loginResponse.accessToken
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }

    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Add-TestResult "Login" "PASS" "Authentication successful"
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Login" "FAIL" $_.Exception.Message
    exit 1
}

Write-Host ""

# Test 2: Get parent category
Write-Host "2. Getting parent category..." -ForegroundColor Yellow
try {
    $parentId = "da721a77-18c0-40e7-a7aa-269efe8e26bb"
    Write-Host "  ✓ Using parent category: $parentId" -ForegroundColor Green
    Add-TestResult "Get Parent" "PASS" "Using existing parent"
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Get Parent" "FAIL" $_.Exception.Message
    exit 1
}

Write-Host ""

# Test 3: Create skill category
Write-Host "3. Creating skill category..." -ForegroundColor Yellow
try {
    $categoryBody = @{
        name = "Story 3.5 Test Category"
        description = "Test category for Story 3.5"
        parentId = $parentId
    } | ConvertTo-Json

    $categoryResponse = Invoke-RestMethod -Uri "$baseUrl/skill-categories" `
        -Method Post `
        -Headers $authHeaders `
        -Body $categoryBody `
        -ContentType "application/json"

    $categoryId = $categoryResponse.id
    Write-Host "  ✓ Category created: $categoryId" -ForegroundColor Green
    Add-TestResult "Create Category" "PASS" "Category ID: $categoryId"
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Create Category" "FAIL" $_.Exception.Message
    exit 1
}

Write-Host ""

# Test 4: Create skill
Write-Host "4. Creating skill..." -ForegroundColor Yellow
try {
    $skillBody = @{
        name = "Story 3.5 Test Skill"
        description = "Test skill for Story 3.5"
        categoryId = $categoryId
    } | ConvertTo-Json

    $skillResponse = Invoke-RestMethod -Uri "$baseUrl/skills" `
        -Method Post `
        -Headers $authHeaders `
        -Body $skillBody `
        -ContentType "application/json"

    $skillId = $skillResponse.id
    Write-Host "  ✓ Skill created: $skillId" -ForegroundColor Green
    Add-TestResult "Create Skill" "PASS" "Skill ID: $skillId"
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Create Skill" "FAIL" $_.Exception.Message
    exit 1
}

Write-Host ""

# Test 5: Valid Manual Criteria
Write-Host "5. Testing valid manual criteria..." -ForegroundColor Yellow
$manualCriteria = @{
    type = "manual"
    description = "Manual approval by administrator"
}
$manualBadgeId = Test-Criteria "Manual Criteria" $manualCriteria $true

Write-Host ""

# Test 6: Valid Exam Score Criteria
Write-Host "6. Testing valid exam score criteria..." -ForegroundColor Yellow
$examCriteria = @{
    type = "auto_exam_score"
    conditions = @(
        @{ field = "examId"; operator = "=="; value = "exam-123" },
        @{ field = "score"; operator = ">="; value = 85 }
    )
    logicOperator = "all"
    description = "Score 85% or higher on exam"
}
$examBadgeId = Test-Criteria "Exam Score Criteria" $examCriteria $true

Write-Host ""

# Test 7: Valid Task Completion Criteria
Write-Host "7. Testing valid task completion criteria..." -ForegroundColor Yellow
$taskCriteria = @{
    type = "auto_task"
    conditions = @(
        @{ field = "taskId"; operator = "=="; value = "task-456" },
        @{ field = "status"; operator = "=="; value = "completed" }
    )
    logicOperator = "all"
    description = "Complete specific task"
}
$taskBadgeId = Test-Criteria "Task Completion Criteria" $taskCriteria $true

Write-Host ""

# Test 8: Valid Learning Hours Criteria
Write-Host "8. Testing valid learning hours criteria..." -ForegroundColor Yellow
$learningCriteria = @{
    type = "auto_learning_time"
    conditions = @(
        @{ field = "courseId"; operator = "=="; value = "course-789" },
        @{ field = "hours"; operator = ">="; value = 20 }
    )
    logicOperator = "all"
    description = "Complete 20+ hours of learning"
}
$learningBadgeId = Test-Criteria "Learning Hours Criteria" $learningCriteria $true

Write-Host ""

# Test 9: Valid Combined Criteria
Write-Host "9. Testing valid combined criteria..." -ForegroundColor Yellow
$combinedCriteria = @{
    type = "combined"
    conditions = @(
        @{ field = "courseId"; operator = "=="; value = "course-123" },
        @{ field = "hours"; operator = ">="; value = 15 },
        @{ field = "examScore"; operator = ">="; value = 80 }
    )
    logicOperator = "all"
    description = "Complete 15+ hours AND score 80%+"
}
$combinedBadgeId = Test-Criteria "Combined Criteria" $combinedCriteria $true

Write-Host ""

# Test 10: Invalid Type
Write-Host "10. Testing invalid criteria type..." -ForegroundColor Yellow
$invalidType = @{
    type = "invalid_type"
    conditions = @()
}
Test-Criteria "Invalid Type" $invalidType $false

Write-Host ""

# Test 11: Missing Conditions for Auto Type
Write-Host "11. Testing missing conditions for auto type..." -ForegroundColor Yellow
$missingConditions = @{
    type = "auto_exam_score"
}
Test-Criteria "Missing Conditions" $missingConditions $false

Write-Host ""

# Test 12: Invalid Operator
Write-Host "12. Testing invalid operator..." -ForegroundColor Yellow
$invalidOperator = @{
    type = "auto_exam_score"
    conditions = @(
        @{ field = "examId"; operator = "=="; value = "exam-123" },
        @{ field = "score"; operator = "invalid"; value = 85 }
    )
    logicOperator = "all"
}
Test-Criteria "Invalid Operator" $invalidOperator $false

Write-Host ""

# Test 13: Missing Required Field (examId for exam_score type)
Write-Host "13. Testing missing required field..." -ForegroundColor Yellow
$missingField = @{
    type = "auto_exam_score"
    conditions = @(
        @{ field = "score"; operator = ">="; value = 85 }
    )
    logicOperator = "all"
}
Test-Criteria "Missing Required Field" $missingField $false

Write-Host ""

# Test 14: Get Criteria Templates
Write-Host "14. Testing criteria templates API..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$baseUrl/badge-templates/criteria-templates" `
        -Method Get

    $templateCount = ($templates.keys | Measure-Object).Count
    
    if ($templateCount -gt 0) {
        Write-Host "  ✓ Templates API working ($templateCount templates)" -ForegroundColor Green
        Add-TestResult "Get Templates" "PASS" "Found $templateCount templates"
    } else {
        Write-Host "  ✗ No templates returned" -ForegroundColor Red
        Add-TestResult "Get Templates" "FAIL" "No templates found"
    }
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Get Templates" "FAIL" $_.Exception.Message
}

Write-Host ""

# Test 15: Get Specific Template
Write-Host "15. Testing specific template API..." -ForegroundColor Yellow
try {
    $template = Invoke-RestMethod -Uri "$baseUrl/badge-templates/criteria-templates/exam_score" `
        -Method Get

    if ($template.type -eq "auto_exam_score") {
        Write-Host "  ✓ Specific template retrieved correctly" -ForegroundColor Green
        Add-TestResult "Get Specific Template" "PASS" "exam_score template retrieved"
    } else {
        Write-Host "  ✗ Template type mismatch" -ForegroundColor Red
        Add-TestResult "Get Specific Template" "FAIL" "Type mismatch"
    }
} catch {
    Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Get Specific Template" "FAIL" $_.Exception.Message
}

Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

foreach ($result in $testResults) {
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    $timeStr = if ($result.Time) { " ($($result.Time)ms)" } else { "" }
    Write-Host "$($result.Status) - $($result.Name)$timeStr" -ForegroundColor $color
}

Write-Host ""
Write-Host "Results: $passCount/$totalCount tests passed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "Story 3.5 - ALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Story 3.5 - SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
