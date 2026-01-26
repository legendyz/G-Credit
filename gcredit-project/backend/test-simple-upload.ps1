# Simple upload test to debug multipart issue

Write-Host "=== Simple Upload Test ===" -ForegroundColor Cyan

# 1. Login and get token
Write-Host "`n1. Login..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST `
        -Body '{"email":"admin@gcredit.test","password":"Admin123!"}' `
        -ContentType "application/json"
    $token = $response.accessToken
    Write-Host " OK" -ForegroundColor Green
    Write-Host "   Token length: $($token.Length)" -ForegroundColor Gray
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Use existing skill ID from previous test
$skillId = "88eb8c69-0e5e-4639-96c4-5e80a9401e3d"
Write-Host "`n2. Using skill ID: $skillId" -ForegroundColor Gray

# 3. Test with curl - show full output
Write-Host "`n3. Testing upload with curl (full verbose output)..." -ForegroundColor Cyan

$imagePath = Join-Path (Get-Location) "test-images\test-optimal-256x256.png"
Write-Host "   Image path: $imagePath" -ForegroundColor Gray

if (-not (Test-Path $imagePath)) {
    Write-Host "   ERROR: Image not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n--- Curl Command ---" -ForegroundColor Yellow
$curlCmd = "curl.exe -v -X POST http://localhost:3000/badge-templates " +
    "-H `"Authorization: Bearer $token`" " +
    "-F `"name=SimpleCurlTest`" " +
    "-F `"category=skill`" " +
    "-F `"description=Test description`" " +
    "-F 'skillIds=[`"$skillId`"]' " +
    "-F 'issuanceCriteria={`"type`":`"manual`"}' " +
    "-F `"image=@$imagePath`""

Write-Host $curlCmd -ForegroundColor Gray

Write-Host "`n--- Executing ---" -ForegroundColor Yellow
& curl.exe -v -X POST "http://localhost:3000/badge-templates" `
    -H "Authorization: Bearer $token" `
    -F "name=SimpleCurlTest" `
    -F "category=skill" `
    -F "description=Test description" `
    -F "skillIds=[`"$skillId`"]" `
    -F "issuanceCriteria={`"type`":`"manual`"}" `
    -F "image=@$imagePath" 2>&1

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
