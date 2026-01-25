# Test Real Email Sending with Outlook
# Make sure you've configured .env with production mode first

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Real Email Sending Test - Outlook" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "  1. Created Outlook app password" -ForegroundColor White
Write-Host "  2. Configured SMTP settings in .env" -ForegroundColor White
Write-Host "  3. Set NODE_ENV=production in .env" -ForegroundColor White
Write-Host "  4. Backend is running`n" -ForegroundColor White

$continue = Read-Host "Continue with test? (y/n)"
if ($continue -ne "y") {
    Write-Host "Test cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nStep 1: Verify backend connection..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "Backend is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Backend is not running!" -ForegroundColor Red
    Write-Host "Please start backend first: npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nStep 2: Enter test email address" -ForegroundColor Yellow
$testEmail = Read-Host "Enter the email address to receive reset email"

if ([string]::IsNullOrWhiteSpace($testEmail)) {
    Write-Host "Email address is required" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Request password reset..." -ForegroundColor Yellow
try {
    $body = @{ email = $testEmail } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/request-reset" `
        -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response: $($response.message)" -ForegroundColor White
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Email Sent!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nPlease check your Outlook inbox:" -ForegroundColor Yellow
    Write-Host "  From: G-Credit System" -ForegroundColor White
    Write-Host "  Subject: Reset Your Password" -ForegroundColor White
    Write-Host "  Content: HTML formatted email with reset button`n" -ForegroundColor White
    
    Write-Host "Note: Email may take 1-3 minutes to arrive" -ForegroundColor Gray
    Write-Host "Check spam folder if not received in 5 minutes`n" -ForegroundColor Gray
    
    Write-Host "If backend console shows email output:" -ForegroundColor Yellow
    Write-Host "  This means NODE_ENV is not set to 'production'" -ForegroundColor White
    Write-Host "  Real email will NOT be sent in development mode`n" -ForegroundColor White
    
} catch {
    Write-Host "`nERROR: Failed to send email" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`nPossible causes:" -ForegroundColor Yellow
    Write-Host "  1. SMTP credentials are incorrect" -ForegroundColor White
    Write-Host "  2. App password not configured properly" -ForegroundColor White
    Write-Host "  3. Two-step verification not enabled" -ForegroundColor White
    Write-Host "  4. Network/firewall blocking port 587" -ForegroundColor White
    Write-Host "`nCheck backend console for detailed error messages`n" -ForegroundColor Cyan
}

Write-Host "Test complete. Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
