# get-token.ps1
# Get JWT token for development testing
# Usage: .\get-token.ps1

param(
    [string]$Email = "recipient@example.com",
    [string]$Password = "password123"
)

Write-Host ""
Write-Host "G-Credit Login Helper" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Email: $Email"
Write-Host ""

try {
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    
    $response = Invoke-RestMethod `
        -Uri "http://localhost:3000/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $token = $response.accessToken
    
    Write-Host "[SUCCESS] Login successful!" -ForegroundColor Green
    Write-Host "User: $($response.user.firstName) $($response.user.lastName) ($($response.user.role))"
    Write-Host ""
    Write-Host "Token (first 60 chars): $($token.Substring(0,60))..." -ForegroundColor Gray
    Write-Host ""
    
    $token | Set-Clipboard
    Write-Host "[COPIED] Token copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Open http://localhost:5173 in browser"
    Write-Host "2. Press F12 (open console)"
    Write-Host "3. Paste this command:"
    Write-Host ""
    Write-Host "   localStorage.setItem('accessToken', '$token'); location.reload();" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Login failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}
