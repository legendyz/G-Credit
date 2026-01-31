# Get Teams Information using Graph API
# This script lists all Teams you can access

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Get Teams Information" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Load environment variables
$envPath = "../../.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2] -replace '^"(.*)"$', '$1'
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✅ Environment variables loaded`n" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

$tenantId = $env:AZURE_TENANT_ID
$clientId = $env:AZURE_CLIENT_ID
$clientSecret = $env:AZURE_CLIENT_SECRET

Write-Host "Tenant ID: $tenantId" -ForegroundColor Gray
Write-Host "Client ID: $clientId`n" -ForegroundColor Gray

# Get access token
Write-Host "[Step 1] Getting access token..." -ForegroundColor Yellow
$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"
$tokenBody = @{
    client_id     = $clientId
    scope         = "https://graph.microsoft.com/.default"
    client_secret = $clientSecret
    grant_type    = "client_credentials"
}

try {
    $tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    Write-Host "✅ Access token obtained`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get access token" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# List all Teams in the organization
Write-Host "[Step 2] Fetching all Teams..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    # Using /groups endpoint with Team filter
    $teamsUrl = "https://graph.microsoft.com/v1.0/groups?`$filter=resourceProvisioningOptions/Any(x:x eq 'Team')"
    $teamsResponse = Invoke-RestMethod -Uri $teamsUrl -Headers $headers -Method GET
    
    Write-Host "✅ Found $($teamsResponse.value.Count) Team(s)`n" -ForegroundColor Green
    
    if ($teamsResponse.value.Count -eq 0) {
        Write-Host "⚠️  No Teams found in your organization." -ForegroundColor Yellow
        Write-Host "`nYou need to create a Team first:" -ForegroundColor Yellow
        Write-Host "1. Go to https://teams.microsoft.com" -ForegroundColor Gray
        Write-Host "2. Click 'Teams' in left sidebar" -ForegroundColor Gray
        Write-Host "3. Look for 'Join or create a team' at the bottom" -ForegroundColor Gray
        Write-Host "4. Click 'Create team' and follow the wizard`n" -ForegroundColor Gray
        exit 0
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Available Teams:" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $teamNumber = 1
    foreach ($team in $teamsResponse.value) {
        Write-Host "[$teamNumber] Team Name: $($team.displayName)" -ForegroundColor White
        Write-Host "    Team ID: $($team.id)" -ForegroundColor Green
        Write-Host "    Description: $($team.description)" -ForegroundColor Gray
        
        # Get channels for this team
        try {
            $channelsUrl = "https://graph.microsoft.com/v1.0/teams/$($team.id)/channels"
            $channelsResponse = Invoke-RestMethod -Uri $channelsUrl -Headers $headers -Method GET
            
            Write-Host "    Channels: $($channelsResponse.value.Count)" -ForegroundColor Cyan
            foreach ($channel in $channelsResponse.value) {
                Write-Host "      - $($channel.displayName) (ID: $($channel.id))" -ForegroundColor DarkCyan
            }
        } catch {
            Write-Host "    ⚠️  Could not fetch channels" -ForegroundColor Yellow
        }
        
        Write-Host ""
        $teamNumber++
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "1. Choose a Team from the list above" -ForegroundColor White
    Write-Host "2. Copy the Team ID (the long UUID)" -ForegroundColor White
    Write-Host "3. Copy a Channel ID (usually use 'General' channel)" -ForegroundColor White
    Write-Host "4. Add to your .env file:" -ForegroundColor White
    Write-Host "   DEFAULT_TEAMS_TEAM_ID=`"<team-id>`"" -ForegroundColor Gray
    Write-Host "   DEFAULT_TEAMS_CHANNEL_ID=`"<channel-id>`"`n" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to fetch Teams" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
