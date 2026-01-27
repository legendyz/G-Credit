# Test Enhancement 1 with curl
# This script uses curl for cleaner multipart form data handling

Write-Host "=== Enhancement 1 curl Test ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Login..." -NoNewline
$loginBody = @{
    email = "admin@gcredit.test"
    password = "Admin123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host " Done" -ForegroundColor Green
Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray

# 2. Get category
$categories = Invoke-RestMethod -Uri "http://localhost:3000/skill-categories" -Method GET -Headers @{Authorization = "Bearer $token"}
$rootCategory = $categories[0]
$categoryId = $rootCategory.id
Write-Host "`n2. Category: $($rootCategory.name) ($categoryId)" -ForegroundColor Gray

# 3. Create test skill
Write-Host "`n3. Creating test skill..." -NoNewline
$skillName = "CurlTest_$(Get-Random)"
$skillBody = @{
    name = $skillName
    description = "Test skill for curl upload"
    categoryId = $categoryId
} | ConvertTo-Json

$skill = Invoke-RestMethod -Uri "http://localhost:3000/skills" -Method POST -Body $skillBody -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}
$skillId = $skill.id
Write-Host " Done" -ForegroundColor Green
Write-Host "   Skill ID: $skillId" -ForegroundColor Gray

# 4. Test upload with curl
Write-Host "`n4. Testing upload with curl..." -ForegroundColor Cyan

$imagePath = "test-images\test-optimal-256x256.png"
$fullPath = Join-Path (Get-Location) $imagePath

if (-not (Test-Path $fullPath)) {
    Write-Host "   Error: Image not found at $fullPath" -ForegroundColor Red
    exit 1
}

Write-Host "   Image: $imagePath" -ForegroundColor Gray

# Use curl with verbose output
$curlArgs = @(
    "-v",
    "-X", "POST",
    "http://localhost:3000/badge-templates",
    "-H", "Authorization: Bearer $token",
    "-F", "name=Curl Test Badge",
    "-F", "category=skill",
    "-F", "description=Testing with curl",
    "-F", "skillIds=[`"$skillId`"]",
    "-F", "issuanceCriteria={`"type`":`"manual`"}",
    "-F", "image=@$fullPath"
)

Write-Host "`n   Running curl..." -ForegroundColor Gray
$output = & curl.exe @curlArgs 2>&1 | Out-String

# Show relevant parts of output
Write-Host "`n--- Response ---" -ForegroundColor Yellow
$output -split "`n" | Where-Object { 
    $_ -match "HTTP/" -or 
    $_ -match "statusCode" -or 
    $_ -match "message" -or
    $_ -match "error" 
} | ForEach-Object { Write-Host $_ }

Write-Host "`n--- Full Output (last 20 lines) ---" -ForegroundColor Yellow
$output -split "`n" | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
