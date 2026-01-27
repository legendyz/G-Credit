# Enhancement 1 API Test Script
# Tests image dimension validation, optimization suggestions, and metadata
# 
# PREREQUISITE: 
# 1. Run this in a SEPARATE terminal from the backend server
# 2. Backend server should be running in another terminal: npm run start:dev
# 3. Run create-test-images.ps1 first to generate test images

$baseUrl = "http://localhost:3000"
$loginUrl = "$baseUrl/auth/login"
$badgeTemplatesUrl = "$baseUrl/badge-templates"
$testImagesDir = "test-images"

# Color helpers
function Write-TestHeader { param([string]$Text) Write-Host "`n=== $Text ===" -ForegroundColor Cyan }
function Write-TestName { param([string]$Text) Write-Host "`n$Text" -ForegroundColor Yellow }
function Write-Success { param([string]$Text) Write-Host "✓ $Text" -ForegroundColor Green }
function Write-Failure { param([string]$Text) Write-Host "✗ $Text" -ForegroundColor Red }
function Write-Warning { param([string]$Text) Write-Host "⚠ $Text" -ForegroundColor Yellow }
function Write-Info { param([string]$Text) Write-Host "  $Text" -ForegroundColor Gray }

Write-TestHeader "Enhancement 1: Image Management Tests"

# Check if server is running
Write-TestName "Checking if backend server is running..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Success "Backend server is running"
} catch {
    Write-Failure "Backend server is NOT running!"
    Write-Warning "Please start the backend server in a separate terminal:"
    Write-Info "cd gcredit-project/backend"
    Write-Info "npm run start:dev"
    Write-Host ""
    exit 1
}

# Check if test images exist
Write-TestName "Checking test images..."
if (-not (Test-Path $testImagesDir)) {
    Write-Failure "Test images directory not found!"
    Write-Warning "Please run create-test-images.ps1 first"
    exit 1
}

$testImages = Get-ChildItem -Path $testImagesDir -Filter "*.png"
if ($testImages.Count -eq 0) {
    Write-Failure "No test images found!"
    Write-Warning "Please run create-test-images.ps1 first"
    exit 1
}

Write-Success "Found $($testImages.Count) test images"
$testImages | ForEach-Object { Write-Info $_.Name }

# Test 1: Login
Write-TestName "Test 1: Authenticating..."
$loginBody = @{
    email = "admin@gcredit.test"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Success "Login successful"
    Write-Info "Token: $($token.Substring(0, 20))..."
} catch {
    Write-Failure "Login failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Info "Response: $responseBody"
    }
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 2: Get existing skill or create test data
Write-TestName "Test 2: Getting test skill..."
try {
    # Try to get existing skills first
    $skills = Invoke-RestMethod -Uri "$baseUrl/skills?page=1&limit=1" -Headers $headers
    
    if ($skills.items.Count -gt 0) {
        $script:testSkillId = $skills.items[0].id
        Write-Success "Using existing skill: $($script:testSkillId)"
    } else {
        # If no skills exist, we need to create one
        # First get root categories
        $categories = Invoke-RestMethod -Uri "$baseUrl/skill-categories?page=1&limit=1" -Headers $headers
        
        if ($categories.items.Count -gt 0) {
            $categoryId = $categories.items[0].id
            Write-Info "Found category: $categoryId"
            
            # Create skill under this category
            $skillBody = @{
                categoryId = $categoryId
                name = "Enhancement Test Skill"
                description = "Test skill for Enhancement 1"
            } | ConvertTo-Json
            
            $skill = Invoke-RestMethod -Uri "$baseUrl/skills" `
                -Method Post `
                -Headers $headers `
                -Body $skillBody `
                -ContentType "application/json"
            
            $script:testSkillId = $skill.id
            Write-Success "Created test skill: $($script:testSkillId)"
        } else {
            Write-Failure "No skills or categories found. Please seed the database first."
            Write-Info "Run: npx prisma db seed"
            exit 1
        }
    }
} catch {
    Write-Failure "Failed to setup test data: $($_.Exception.Message)"
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Info "Error details: $errorBody"
        $reader.Close()
    } catch {}
    exit 1
}

# Initialize test results
$testResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
}

# Helper function to upload badge with image
function Test-BadgeImageUpload {
    param(
        [string]$ImagePath,
        [string]$TestName,
        [bool]$ShouldSucceed,
        [string]$ExpectedError,
        [bool]$ExpectSuggestions
    )
    
    $script:testResults.Total++
    
    Write-TestName "Test: $TestName"
    Write-Info "Image: $ImagePath"
    
    # Resolve full path
    $fullImagePath = $ImagePath
    if (-not [System.IO.Path]::IsPathRooted($ImagePath)) {
        $fullImagePath = Join-Path (Get-Location) $ImagePath
    }
    
    if (-not (Test-Path $fullImagePath)) {
        $script:testResults.Failed++
        Write-Failure "Image file not found: $fullImagePath"
        return $null
    }
    
    try {
        # Prepare multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        # Read image file
        $imageBytes = [System.IO.File]::ReadAllBytes($fullImagePath)
        $imageName = [System.IO.Path]::GetFileName($ImagePath)
        
        # Build multipart body
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"name`"",
            "",
            "Test Badge - $TestName",
            "--$boundary",
            "Content-Disposition: form-data; name=`"category`"",
            "",
            "skill",
            "--$boundary",
            "Content-Disposition: form-data; name=`"description`"",
            "",
            "Testing Enhancement 1 - $TestName",
            "--$boundary",
            "Content-Disposition: form-data; name=`"skillIds`"",
            "",
            "[$($script:testSkillId)]",
            "--$boundary",
            "Content-Disposition: form-data; name=`"image`"; filename=`"$imageName`"",
            "Content-Type: image/png",
            ""
        ) -join $LF
        
        $bodyLines += $LF
        
        # Combine text and binary parts
        $encoding = [System.Text.Encoding]::UTF8
        $bodyBytes = $encoding.GetBytes($bodyLines)
        $bodyBytes += $imageBytes
        $bodyBytes += $encoding.GetBytes("$LF--$boundary--$LF")
        
        # Send request
        $response = Invoke-WebRequest -Uri $badgeTemplatesUrl `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "multipart/form-data; boundary=$boundary"
            } `
            -Body $bodyBytes `
            -TimeoutSec 30
        
        if ($ShouldSucceed) {
            $script:testResults.Passed++
            Write-Success "Upload successful (Status: $($response.StatusCode))"
            
            # Parse response
            $result = $response.Content | ConvertFrom-Json
            Write-Info "Badge ID: $($result.id)"
            Write-Info "Image URL: $($result.imageUrl.Substring(0, 60))..."
            
            # Check for suggestions in server logs
            if ($ExpectSuggestions) {
                Write-Warning "Expected optimization suggestions (check server logs)"
            } else {
                Write-Info "No optimization suggestions expected"
            }
            
            return $result
        } else {
            $script:testResults.Failed++
            Write-Failure "Expected to fail but succeeded!"
            return $null
        }
        
    } catch {
        if (-not $ShouldSucceed) {
            # Expected to fail
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq 400) {
                $script:testResults.Passed++
                Write-Success "Correctly rejected (Status: 400)"
                
                # Get error message
                try {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $errorResponse = $reader.ReadToEnd() | ConvertFrom-Json
                    Write-Info "Error: $($errorResponse.message)"
                    
                    if ($ExpectedError -and $errorResponse.message -like "*$ExpectedError*") {
                        Write-Success "Error message contains expected text: '$ExpectedError'"
                    }
                    $reader.Close()
                } catch {
                    Write-Info "Could not parse error message"
                }
            } else {
                $script:testResults.Failed++
                Write-Failure "Failed with unexpected status: $statusCode"
            }
        } else {
            $script:testResults.Failed++
            Write-Failure "Upload failed: $($_.Exception.Message)"
            
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorResponse = $reader.ReadToEnd()
                Write-Info "Error response: $errorResponse"
                $reader.Close()
            } catch {
                # Ignore
            }
        }
        
        return $null
    }
}

# Test 2: Too small image (should be rejected)
Test-BadgeImageUpload `
    -ImagePath "test-images\test-too-small-64x64.png" `
    -TestName "Too Small Image (64x64)" `
    -ShouldSucceed $false `
    -ExpectedError "too small" `
    -ExpectSuggestions $false

Start-Sleep -Seconds 1

# Test 3: Minimum boundary (should pass with suggestions)
Test-BadgeImageUpload `
    -ImagePath "test-images\test-min-128x128.png" `
    -TestName "Minimum Size (128x128)" `
    -ShouldSucceed $true `
    -ExpectedError "" `
    -ExpectSuggestions $true

Start-Sleep -Seconds 1

# Test 4: Optimal size 256x256 (should pass without suggestions)
Test-BadgeImageUpload `
    -ImagePath "test-images\test-optimal-256x256.png" `
    -TestName "Optimal Size (256x256)" `
    -ShouldSucceed $true `
    -ExpectedError "" `
    -ExpectSuggestions $false

Start-Sleep -Seconds 1

# Test 5: Optimal size 512x512 (should pass without suggestions)
Test-BadgeImageUpload `
    -ImagePath "test-images\test-optimal-512x512.png" `
    -TestName "Optimal Size (512x512)" `
    -ShouldSucceed $true `
    -ExpectedError "" `
    -ExpectSuggestions $false

Start-Sleep -Seconds 1

# Test 6: Non-square image (should pass with aspect ratio suggestion)
Test-BadgeImageUpload `
    -ImagePath "test-images\test-non-square-256x128.png" `
    -TestName "Non-Square Image (256x128)" `
    -ShouldSucceed $true `
    -ExpectedError "" `
    -ExpectSuggestions $true

Start-Sleep -Seconds 1

# Test 7: Large but acceptable (should pass with suggestions)
Test-BadgeImageUpload `
    -ImagePath "test-images\test-large-1024x1024.png" `
    -TestName "Large Image (1024x1024)" `
    -ShouldSucceed $true `
    -ExpectedError "" `
    -ExpectSuggestions $true

Start-Sleep -Seconds 1

# Test 8: Maximum boundary (should pass with suggestions)
Write-Warning "Skipping 2048x2048 test (large file, slow upload)"
$testResults.Skipped++

# Test 9: Too large image (should be rejected)
Write-Warning "Skipping 3000x3000 test (very large file)"
$testResults.Skipped++

# Print summary
Write-TestHeader "Test Results Summary"
Write-Host ""
Write-Host "Total Tests:   $($testResults.Total)" -ForegroundColor White
Write-Host "Passed:        $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed:        $($testResults.Failed)" -ForegroundColor Red
Write-Host "Skipped:       $($testResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -eq 0) {
    Write-Host "All tests PASSED! ✅" -ForegroundColor Green
} else {
    Write-Host "Some tests FAILED! ❌" -ForegroundColor Red
}

Write-Host ""
Write-TestHeader "What to Check"
Write-Host ""
Write-Host "1. Check backend server console for optimization suggestions" -ForegroundColor Yellow
Write-Host "   Look for messages like:" -ForegroundColor Gray
Write-Host '   "Image optimization suggestions: Recommended dimensions..."' -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Verify image metadata in responses" -ForegroundColor Yellow
Write-Host "   - width, height should match uploaded images" -ForegroundColor Gray
Write-Host "   - format should be 'png'" -ForegroundColor Gray
Write-Host "   - isOptimal should be true for 256x256 and 512x512" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify error messages are clear and helpful" -ForegroundColor Yellow
Write-Host "   - Too small images: mention minimum 128x128" -ForegroundColor Gray
Write-Host "   - Too large images: mention maximum 2048x2048" -ForegroundColor Gray
Write-Host ""
Write-Host "Enhancement 1 testing complete!" -ForegroundColor Cyan
Write-Host ""
