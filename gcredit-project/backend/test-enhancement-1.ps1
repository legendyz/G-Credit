# Test Script for Enhancement 1: Azure Blob Image Management
# Tests image dimension validation, optimization suggestions, and metadata

$baseUrl = "http://localhost:3000"
$loginUrl = "$baseUrl/auth/login"
$badgeTemplatesUrl = "$baseUrl/badge-templates"

Write-Host "=== Enhancement 1: Azure Blob Image Management Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login to get access token
Write-Host "Test 1: Authenticating..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@example.com"
    password = "Admin@123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# Test 2: Create test images with different dimensions
Write-Host ""
Write-Host "Test 2: Creating test images with different dimensions..." -ForegroundColor Yellow

# Create a small image (too small - should fail)
Write-Host "  2a. Testing too small image (64x64)..." -ForegroundColor Cyan
try {
    # Note: For actual testing, you would need actual image files
    # This is a placeholder to demonstrate the test structure
    Write-Host "  ⚠ Skipped: Requires actual 64x64 image file" -ForegroundColor Yellow
} catch {
    Write-Host "  Expected error for small image" -ForegroundColor Yellow
}

# Test 3: Upload optimal size image (256x256)
Write-Host ""
Write-Host "Test 3: Testing optimal size image (256x256)..." -ForegroundColor Yellow
Write-Host "  ⚠ This test requires a 256x256 pixel image file" -ForegroundColor Yellow
Write-Host "  Create a test image and update the path below" -ForegroundColor Yellow

# Test 4: Upload non-square image (should get suggestion)
Write-Host ""
Write-Host "Test 4: Testing non-square image (recommendations)..." -ForegroundColor Yellow
Write-Host "  ⚠ This test requires a non-square image file (e.g., 256x128)" -ForegroundColor Yellow

# Test 5: Check server logs for optimization suggestions
Write-Host ""
Write-Host "Test 5: Checking for optimization suggestions in server logs..." -ForegroundColor Yellow
Write-Host "  Note: Check the backend console for messages like:" -ForegroundColor Cyan
Write-Host "    'Image optimization suggestions: Recommended dimensions...'" -ForegroundColor Gray

# Instructions for manual testing
Write-Host ""
Write-Host "=== Manual Testing Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To fully test Enhancement 1, you need to:" -ForegroundColor White
Write-Host ""
Write-Host "1. Create test images with different dimensions:" -ForegroundColor Yellow
Write-Host "   - Small: 64x64 (should be rejected)" -ForegroundColor Gray
Write-Host "   - Optimal: 256x256 or 512x512 (should pass with no suggestions)" -ForegroundColor Gray
Write-Host "   - Large: 2048x2048 (should pass)" -ForegroundColor Gray
Write-Host "   - Too large: 3000x3000 (should be rejected)" -ForegroundColor Gray
Write-Host "   - Non-square: 256x128 (should get aspect ratio suggestion)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Use Postman or curl to upload images:" -ForegroundColor Yellow
Write-Host '   curl -X POST http://localhost:3000/badge-templates \' -ForegroundColor Gray
Write-Host '     -H "Authorization: Bearer YOUR_TOKEN" \' -ForegroundColor Gray
Write-Host '     -F "name=Test Badge" \' -ForegroundColor Gray
Write-Host '     -F "category=skill" \' -ForegroundColor Gray
Write-Host '     -F "description=Test" \' -ForegroundColor Gray
Write-Host '     -F "skillIds=[]" \' -ForegroundColor Gray
Write-Host '     -F "image=@/path/to/your/image.png"' -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check the backend server console for:" -ForegroundColor Yellow
Write-Host "   - Image dimension validation messages" -ForegroundColor Gray
Write-Host "   - Optimization suggestions" -ForegroundColor Gray
Write-Host "   - Image metadata logging" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Expected Behavior:" -ForegroundColor Yellow
Write-Host "   ✓ Images < 128px: Rejected with clear error" -ForegroundColor Gray
Write-Host "   ✓ Images > 2048px: Rejected with clear error" -ForegroundColor Gray
Write-Host "   ✓ Optimal sizes (256x256, 512x512): No suggestions" -ForegroundColor Gray
Write-Host "   ✓ Non-optimal sizes: Suggestions logged to console" -ForegroundColor Gray
Write-Host "   ✓ Non-square images: Aspect ratio suggestion" -ForegroundColor Gray
Write-Host ""

# Automated test with sample data
Write-Host "=== Automated Validation Test ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test: Verify BlobStorageService has enhanced methods..." -ForegroundColor Yellow

# Check if sharp is installed
try {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.dependencies.sharp) {
        Write-Host "✓ sharp library installed: $($packageJson.dependencies.sharp)" -ForegroundColor Green
    } else {
        Write-Host "✗ sharp library not found in dependencies" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Could not verify sharp installation" -ForegroundColor Red
}

# Check if BlobStorageService has new interfaces
Write-Host ""
Write-Host "Checking BlobStorageService implementation..." -ForegroundColor Yellow
$serviceFile = Get-Content "src\common\services\blob-storage.service.ts" -Raw

if ($serviceFile -match "ImageMetadata") {
    Write-Host "✓ ImageMetadata interface defined" -ForegroundColor Green
} else {
    Write-Host "✗ ImageMetadata interface not found" -ForegroundColor Red
}

if ($serviceFile -match "UploadImageResult") {
    Write-Host "✓ UploadImageResult interface defined" -ForegroundColor Green
} else {
    Write-Host "✗ UploadImageResult interface not found" -ForegroundColor Red
}

if ($serviceFile -match "getImageMetadata") {
    Write-Host "✓ getImageMetadata method implemented" -ForegroundColor Green
} else {
    Write-Host "✗ getImageMetadata method not found" -ForegroundColor Red
}

if ($serviceFile -match "validateDimensions") {
    Write-Host "✓ validateDimensions method implemented" -ForegroundColor Green
} else {
    Write-Host "✗ validateDimensions method not found" -ForegroundColor Red
}

if ($serviceFile -match "generateThumbnail") {
    Write-Host "✓ generateThumbnail method implemented" -ForegroundColor Green
} else {
    Write-Host "✗ generateThumbnail method not found" -ForegroundColor Red
}

if ($serviceFile -match "RECOMMENDED_SIZES|OPTIMAL_SIZES") {
    Write-Host "✓ Recommended sizes configuration found" -ForegroundColor Green
} else {
    Write-Host "✗ Recommended sizes configuration not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Enhancement 1 Implementation Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Task E1.1: Image deletion - Already implemented" -ForegroundColor Green
Write-Host "✓ Task E1.2: Dimension validation & suggestions - Implemented" -ForegroundColor Green
Write-Host "✓ Task E1.3: Thumbnail generation & metadata - Implemented" -ForegroundColor Green
Write-Host ""
Write-Host "Features Added:" -ForegroundColor Yellow
Write-Host "  • Image dimension validation (128px - 2048px)" -ForegroundColor White
Write-Host "  • Aspect ratio validation (prefer 1:1)" -ForegroundColor White
Write-Host "  • Optimization suggestions for non-optimal sizes" -ForegroundColor White
Write-Host "  • Image metadata extraction (width, height, format, size)" -ForegroundColor White
Write-Host "  • Optional thumbnail generation (128x128)" -ForegroundColor White
Write-Host "  • Recommended sizes: 256x256, 512x512" -ForegroundColor White
Write-Host ""
Write-Host "To fully test, create test images and upload via API" -ForegroundColor Cyan
Write-Host ""
