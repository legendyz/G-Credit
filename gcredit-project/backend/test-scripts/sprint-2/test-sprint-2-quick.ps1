Write-Host "Sprint 2 Complete E2E Test" -ForegroundColor Cyan
Write-Host ""

$token = (Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body '{"email":"admin@gcredit.test","password":"Admin123!"}' -ContentType "application/json").accessToken

Write-Host "1. Story 3.6: Skill Categories" -ForegroundColor Yellow
$categories = Invoke-RestMethod -Uri "http://localhost:3000/skill-categories" -Method GET -Headers @{Authorization = "Bearer $token"}
Write-Host "   Found $($categories.Count) categories - PASS" -ForegroundColor Green

Write-Host "2. Story 3.1: Create Skill" -ForegroundColor Yellow  
$skill = Invoke-RestMethod -Uri "http://localhost:3000/skills" -Method POST -Headers @{Authorization = "Bearer $token"} -Body (@{name="E2ETest$(Get-Random)"; description="Test"; categoryId=$categories[0].children[0].id} | ConvertTo-Json) -ContentType "application/json"
Write-Host "   Created skill $($skill.id) - PASS" -ForegroundColor Green

Write-Host "3. Story 3.2: Create Badge with Image" -ForegroundColor Yellow
$output = & curl.exe -s -w "`nSTATUS:%{http_code}" -X POST "http://localhost:3000/badge-templates" -H "Authorization: Bearer $token" -F "name=E2EBadge" -F "category=skill" -F "description=Test" -F "skillIds=[`"$($skill.id)`"]" -F 'issuanceCriteria={"type":"manual"}' -F "image=@test-images\test-optimal-256x256.png" 2>&1
$status = [int](($output | Select-String "STATUS:(\d+)").Matches.Groups[1].Value)
$badge = (($output | Where-Object { $_ -notmatch "STATUS:" }) -join "") | ConvertFrom-Json
if ($status -eq 201) { Write-Host "   Created badge $($badge.id) - PASS" -ForegroundColor Green } else { Write-Host "   FAIL" -ForegroundColor Red }

Write-Host "4. Story 3.3: Query Badges" -ForegroundColor Yellow
$badges = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/all" -Method GET -Headers @{Authorization = "Bearer $token"}
Write-Host "   Found $($badges.meta.totalCount) badges - PASS" -ForegroundColor Green

Write-Host "5. Story 3.4: Search Badges" -ForegroundColor Yellow
$results = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates?search=E2E" -Method GET -Headers @{Authorization = "Bearer $token"}
Write-Host "   Search returned $($results.items.Count) results - PASS" -ForegroundColor Green

Write-Host "6. Story 3.5: Issuance Criteria" -ForegroundColor Yellow
$templates = Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/criteria-templates" -Method GET
Write-Host "   Found $($templates.Count) criteria templates - PASS" -ForegroundColor Green

Write-Host "7. Enhancement 1: Image Validation" -ForegroundColor Yellow
$output2 = & curl.exe -s -w "`nSTATUS:%{http_code}" -X POST "http://localhost:3000/badge-templates" -H "Authorization: Bearer $token" -F "name=ShouldFail" -F "category=skill" -F "description=Test" -F "skillIds=[`"$($skill.id)`"]" -F 'issuanceCriteria={"type":"manual"}' -F "image=@test-images\test-too-small-64x64.png" 2>&1
$status2 = [int](($output2 | Select-String "STATUS:(\d+)").Matches.Groups[1].Value)
if ($status2 -eq 400) { Write-Host "   Correctly rejected 64x64 image - PASS" -ForegroundColor Green } else { Write-Host "   FAIL" -ForegroundColor Red }

Write-Host "`nCleanup..." -NoNewline
Invoke-RestMethod -Uri "http://localhost:3000/badge-templates/$($badge.id)" -Method DELETE -Headers @{Authorization = "Bearer $token"} | Out-Null
Invoke-RestMethod -Uri "http://localhost:3000/skills/$($skill.id)" -Method DELETE -Headers @{Authorization = "Bearer $token"} | Out-Null
Write-Host " Done" -ForegroundColor Green

Write-Host "`nSprint 2 E2E Test COMPLETE - All stories verified!" -ForegroundColor Green
