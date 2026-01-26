# Create Test Images for Enhancement 1
# This script generates test images with different dimensions

Write-Host "=== Creating Test Images for Enhancement 1 ===" -ForegroundColor Cyan
Write-Host ""

# Create test-images directory if not exists
$testDir = "test-images"
if (-not (Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
    Write-Host "Created directory: $testDir" -ForegroundColor Green
}

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

function Create-TestImage {
    param(
        [int]$Width,
        [int]$Height,
        [string]$FileName,
        [System.Drawing.Color]$Color
    )
    
    try {
        $filePath = Join-Path (Get-Location) (Join-Path $testDir $FileName)
        
        # Ensure directory exists
        $dir = Split-Path $filePath -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        
        $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # Fill with solid color
        $brush = New-Object System.Drawing.SolidBrush($Color)
        $graphics.FillRectangle($brush, 0, 0, $Width, $Height)
        
        # Add text label
        $fontSize = [Math]::Max(12, [Math]::Min($Width / 10, 24))
        $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $text = "${Width}x${Height}"
        $textSize = $graphics.MeasureString($text, $font)
        $x = ($Width - $textSize.Width) / 2
        $y = ($Height - $textSize.Height) / 2
        $graphics.DrawString($text, $font, $textBrush, $x, $y)
        
        # Flush graphics
        $graphics.Flush()
        
        # Save as PNG using FileStream to avoid GDI+ permission issues
        $fileStream = [System.IO.File]::Create($filePath)
        $bitmap.Save($fileStream, [System.Drawing.Imaging.ImageFormat]::Png)
        $fileStream.Close()
        $fileStream.Dispose()
        
        # Cleanup
        $graphics.Dispose()
        $bitmap.Dispose()
        $brush.Dispose()
        $textBrush.Dispose()
        $font.Dispose()
        
        Write-Host "✓ Created: $FileName ($Width x $Height)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Failed to create $FileName : $_" -ForegroundColor Red
        return $false
    }
}

# Create test images
Write-Host "Creating test images..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Too small (should be rejected - < 128px)
Create-TestImage -Width 64 -Height 64 -FileName "test-too-small-64x64.png" -Color ([System.Drawing.Color]::FromArgb(255, 231, 76, 60))

# Test 2: Minimum boundary (should pass with suggestions)
Create-TestImage -Width 128 -Height 128 -FileName "test-min-128x128.png" -Color ([System.Drawing.Color]::FromArgb(255, 241, 196, 15))

# Test 3: Optimal size 256x256 (should pass with no suggestions)
Create-TestImage -Width 256 -Height 256 -FileName "test-optimal-256x256.png" -Color ([System.Drawing.Color]::FromArgb(255, 46, 204, 113))

# Test 4: Optimal size 512x512 (should pass with no suggestions)
Create-TestImage -Width 512 -Height 512 -FileName "test-optimal-512x512.png" -Color ([System.Drawing.Color]::FromArgb(255, 52, 152, 219))

# Test 5: Non-square image (should get aspect ratio suggestion)
Create-TestImage -Width 256 -Height 128 -FileName "test-non-square-256x128.png" -Color ([System.Drawing.Color]::FromArgb(255, 155, 89, 182))

# Test 6: Large but acceptable
Create-TestImage -Width 1024 -Height 1024 -FileName "test-large-1024x1024.png" -Color ([System.Drawing.Color]::FromArgb(255, 52, 73, 94))

# Test 7: Maximum boundary (should pass with suggestions)
Create-TestImage -Width 2048 -Height 2048 -FileName "test-max-2048x2048.png" -Color ([System.Drawing.Color]::FromArgb(255, 127, 140, 141))

# Test 8: Too large (should be rejected - > 2048px)
Create-TestImage -Width 3000 -Height 3000 -FileName "test-too-large-3000x3000.png" -Color ([System.Drawing.Color]::FromArgb(255, 192, 57, 43))

Write-Host ""
Write-Host "=== Test Images Created ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test images location: $(Resolve-Path $testDir)" -ForegroundColor White
Write-Host ""
Write-Host "Images created:" -ForegroundColor Yellow
Get-ChildItem -Path $testDir -Filter "*.png" | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  - $($_.Name) (${size} KB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next step: Run test-enhancement-1-api.ps1 to test the API" -ForegroundColor Cyan
