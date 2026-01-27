# Test with correct multipart JSON handling

Write-Host "=== Correct Multipart Test ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Login..." -NoNewline
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST `
    -Body '{"email":"admin@gcredit.test","password":"Admin123!"}' `
    -ContentType "application/json"
$token = $response.accessToken
Write-Host " OK (token: $($token.Length) chars)" -ForegroundColor Green

# 2. Use existing skill
$skillId = "88eb8c69-0e5e-4639-96c4-5e80a9401e3d"
Write-Host "`n2. Using skill: $skillId" -ForegroundColor Gray

# 3. Test upload with proper JSON in multipart
Write-Host "`n3. Testing upload with properly formatted multipart..." -ForegroundColor Cyan

$imagePath = Join-Path (Get-Location) "test-images\test-optimal-256x256.png"

# Create temp files for JSON data
$skillIdsJson = "[$($skillId | ConvertTo-Json)]"
$issuanceCriteriaJson = '{"type":"manual"}'

$skillIdsFile = [System.IO.Path]::GetTempFileName()
$issuanceCriteriaFile = [System.IO.Path]::GetTempFileName()

[System.IO.File]::WriteAllText($skillIdsFile, $skillIdsJson)
[System.IO.File]::WriteAllText($issuanceCriteriaFile, $issuanceCriteriaJson)

Write-Host "   Temp files created:" -ForegroundColor Gray
Write-Host "   - skillIds: $skillIdsJson" -ForegroundColor Gray
Write-Host "   - issuanceCriteria: $issuanceCriteriaJson" -ForegroundColor Gray

try {
    Write-Host "`n--- Executing curl ---" -ForegroundColor Yellow
    
    # Use file uploads for JSON with proper content-type
    $output = & curl.exe -v -X POST "http://localhost:3000/badge-templates" `
        -H "Authorization: Bearer $token" `
        -F "name=CorrectMultipartTest" `
        -F "category=skill" `
        -F "description=Testing with correct multipart JSON" `
        -F "skillIds=<$skillIdsFile;type=application/json" `
        -F "issuanceCriteria=<$issuanceCriteriaFile;type=application/json" `
        -F "image=@$imagePath" 2>&1
    
    Write-Host "`n--- Response ---" -ForegroundColor Yellow
    $output | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    
} finally {
    # Cleanup temp files
    Remove-Item $skillIdsFile -ErrorAction SilentlyContinue
    Remove-Item $issuanceCriteriaFile -ErrorAction SilentlyContinue
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
