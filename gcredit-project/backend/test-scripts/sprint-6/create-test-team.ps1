# Create a test Team using Graph API
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create Test Team for Badge Notifications" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Load environment variables
$envPath = "../../.env"
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2] -replace '^"(.*)"$', '$1'
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

$tenantId = $env:AZURE_TENANT_ID
$clientId = $env:AZURE_CLIENT_ID
$clientSecret = $env:AZURE_CLIENT_SECRET

Write-Host "Getting access token..." -ForegroundColor Yellow
$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"
$tokenBody = @{
    client_id     = $clientId
    scope         = "https://graph.microsoft.com/.default"
    client_secret = $clientSecret
    grant_type    = "client_credentials"
}

$tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
$accessToken = $tokenResponse.access_token
Write-Host "✅ Token obtained`n" -ForegroundColor Green

# Create Team
Write-Host "Creating Team..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$teamBody = @{
    "template@odata.bind" = "https://graph.microsoft.com/v1.0/teamsTemplates('standard')"
    "displayName" = "G-Credit Badge Notifications"
    "description" = "Test team for G-Credit badge sharing notifications"
    "members" = @(
        @{
            "@odata.type" = "#microsoft.graph.aadUserConversationMember"
            "roles" = @("owner")
            "user@odata.bind" = "https://graph.microsoft.com/v1.0/users('M365DevAdmin@2wjh85.onmicrosoft.com')"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/teams" -Method POST -Headers $headers -Body $teamBody
    Write-Host "✅ Team created successfully!" -ForegroundColor Green
    Write-Host "`nTeam ID will be available shortly..." -ForegroundColor Yellow
    Write-Host "Check your Teams app in a few minutes.`n" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to create team" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`nDetails: $($errorDetails.error.message)" -ForegroundColor Red
        
        if ($errorDetails.error.message -match "Insufficient privileges") {
            Write-Host "`n⚠️  The Azure AD app needs additional permissions:" -ForegroundColor Yellow
            Write-Host "   - Group.ReadWrite.All" -ForegroundColor Gray
            Write-Host "   - Team.Create" -ForegroundColor Gray
            Write-Host "`nPlease add these permissions in Azure Portal and grant admin consent.`n" -ForegroundColor Yellow
        }
    }
}
