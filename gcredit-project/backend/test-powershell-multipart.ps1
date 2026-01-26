# Test with PowerShell multipart (proper JSON handling)

Write-Host "=== PowerShell Multipart Test ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Login..." -NoNewline
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST `
    -Body '{"email":"admin@gcredit.test","password":"Admin123!"}' `
    -ContentType "application/json"
$token = $response.accessToken
Write-Host " OK" -ForegroundColor Green

# 2. Use existing skill
$skillId = "88eb8c69-0e5e-4639-96c4-5e80a9401e3d"
Write-Host "`n2. Using skill: $skillId" -ForegroundColor Gray

# 3. Prepare multipart form data
Write-Host "`n3. Creating multipart request..." -ForegroundColor Cyan

$imagePath = Join-Path (Get-Location) "test-images\test-optimal-256x256.png"
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)

# Create boundary
$boundary = [System.Guid]::NewGuid().ToString()

# Build multipart body manually
$LF = "`r`n"
$bodyLines = @(
    "--$boundary",
    'Content-Disposition: form-data; name="name"',
    "",
    "PowerShellTest",
    "--$boundary",
    'Content-Disposition: form-data; name="category"',
    "",
    "skill",
    "--$boundary",
    'Content-Disposition: form-data; name="description"',
    "",
    "Testing with PowerShell multipart",
    "--$boundary",
    'Content-Disposition: form-data; name="skillIds"',
    "Content-Type: application/json",
    "",
    '["' + $skillId + '"]',
    "--$boundary",
    'Content-Disposition: form-data; name="issuanceCriteria"',
    "Content-Type: application/json",
    "",
    '{"type":"manual"}',
    "--$boundary",
    'Content-Disposition: form-data; name="image"; filename="test-optimal-256x256.png"',
    "Content-Type: image/png",
    ""
)

# Combine text parts
$bodyText = ($bodyLines -join $LF) + $LF

# Add binary image data
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyText)
$bodyBytes += $imageBytes
$bodyBytes += [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")

# Send request
Write-Host "   Sending request..." -ForegroundColor Gray
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } `
        -Body $bodyBytes
    
    Write-Host "`n✓ SUCCESS!" -ForegroundColor Green
    Write-Host "   Badge created: $($result.id)" -ForegroundColor Green
    Write-Host "   Name: $($result.name)" -ForegroundColor Gray
    Write-Host "   Image URL: $($result.imageUrl)" -ForegroundColor Gray
    
} catch {
    Write-Host "`n✗ FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Response: $errorBody" -ForegroundColor Red
        $reader.Close()
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
