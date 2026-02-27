$base = 'http://localhost:3000'
$out = @()

# Wait for login rate limit window (5/min, ttl=60s) to reset before any login attempts
Write-Host "Waiting 65s for rate limit window to reset..."
Start-Sleep -Seconds 65
Write-Host "Rate limit window cleared. Starting tests..."

function Get-SsoResult($url) {
  $p = @{ Uri=$url; Method='GET'; MaximumRedirection=0; UseBasicParsing=$true; ErrorAction='Stop'; TimeoutSec=10 }
  try {
    $r = Invoke-WebRequest @p
    $loc = $r.Headers['Location']; if ($loc -is [array]) { $loc=[string]$loc[0] } else { $loc=[string]$loc }
    return @{ Code=[int]$r.StatusCode; Location=$loc; SetCookie=[string]$r.Headers['Set-Cookie'] }
  } catch {
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      $loc = $_.Exception.Response.Headers['Location']
      if ($loc -is [array]) { $loc=[string]$loc[0] } else { $loc=[string]$loc }
      return @{ Code=$code; Location=$loc; SetCookie=[string]$_.Exception.Response.Headers['Set-Cookie'] }
    }
    return @{ Code=0; Location=''; SetCookie='' }
  }
}

# T3.1-T3.4 SSO
$sso = @(
  (Get-SsoResult "$base/api/auth/sso/login"),
  (Get-SsoResult "$base/api/auth/sso/callback"),
  (Get-SsoResult "$base/api/auth/sso/callback?error=access_denied&error_description=User+cancelled"),
  (Get-SsoResult "$base/api/auth/sso/callback?code=fake_code&state=invalid_state")
)
$out += "T3.1|$($sso[0].Code)|$($sso[0].Location)|SC=$($sso[0].SetCookie)"
$out += "T3.2|$($sso[1].Code)|$($sso[1].Location)|"
$out += "T3.3|$($sso[2].Code)|$($sso[2].Location)|"
$out += "T3.4|$($sso[3].Code)|$($sso[3].Location)|"

# T11.6 retest — DB was reset, so employee password is back to password123
# Must simulate T11.3 first (change password123 → newPassword456), then T11.6 (newPassword456 → Password123)
$empS = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Step 0: login with seed default password
$step0Code = 0
try {
  $r = Invoke-WebRequest "$base/api/auth/login" -Method POST -Body '{"email":"employee@gcredit.com","password":"password123"}' -ContentType 'application/json' -WebSession $empS -UseBasicParsing -ErrorAction Stop
  $step0Code = [int]$r.StatusCode
} catch {
  if ($_.Exception.Response) { $step0Code = [int]$_.Exception.Response.StatusCode }
}
$out += "T11.6-step0|$step0Code|login-password123"

# Step 1a: change to newPassword456 (simulate T11.3 setup)
$step1aCode = 0; $step1aBody = ''
try {
  $r = Invoke-WebRequest "$base/api/auth/change-password" -Method POST -Body '{"currentPassword":"password123","newPassword":"newPassword456"}' -ContentType 'application/json' -WebSession $empS -UseBasicParsing -ErrorAction Stop
  $step1aCode = [int]$r.StatusCode; $step1aBody = $r.Content
} catch {
  if ($_.Exception.Response) {
    $step1aCode = [int]$_.Exception.Response.StatusCode
    $st = $_.Exception.Response.GetResponseStream()
    $step1aBody = (New-Object System.IO.StreamReader($st)).ReadToEnd()
  }
}
$out += "T11.6-step1a-setup|$step1aCode|$($step1aBody -replace '\|','/')"

# Step 1: verify new password works (T11.4 equivalent)
$step1Code = 0
try {
  $r = Invoke-WebRequest "$base/api/auth/login" -Method POST -Body '{"email":"employee@gcredit.com","password":"newPassword456"}' -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
  $step1Code = [int]$r.StatusCode
} catch {
  if ($_.Exception.Response) { $step1Code = [int]$_.Exception.Response.StatusCode }
}
$out += "T11.6-step1|$step1Code|login-newPassword456"

# Step 2: restore to Password123 (meets policy: uppercase + digit)
$step2Code = 0; $step2Body = ''
try {
  $r = Invoke-WebRequest "$base/api/auth/change-password" -Method POST -Body '{"currentPassword":"newPassword456","newPassword":"Password123"}' -ContentType 'application/json' -WebSession $empS -UseBasicParsing -ErrorAction Stop
  $step2Code = [int]$r.StatusCode; $step2Body = $r.Content
} catch {
  if ($_.Exception.Response) {
    $step2Code = [int]$_.Exception.Response.StatusCode
    $st = $_.Exception.Response.GetResponseStream()
    $step2Body = (New-Object System.IO.StreamReader($st)).ReadToEnd()
  }
}
$out += "T11.6-step2|$step2Code|$($step2Body -replace '\|','/')"

# Step 3: verify restored password works
$step3Code = 0
try {
  $r = Invoke-WebRequest "$base/api/auth/login" -Method POST -Body '{"email":"employee@gcredit.com","password":"Password123"}' -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
  $step3Code = [int]$r.StatusCode
} catch {
  if ($_.Exception.Response) { $step3Code = [int]$_.Exception.Response.StatusCode }
}
$out += "T11.6-step3|$step3Code|login-Password123"

# T12.2 concurrent sessions with employee2
$sAdmin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sEmp2  = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try { $null = Invoke-WebRequest "$base/api/auth/login" -Method POST -Body '{"email":"admin@gcredit.com","password":"password123"}' -ContentType 'application/json' -WebSession $sAdmin -UseBasicParsing -ErrorAction Stop } catch {}
try { $null = Invoke-WebRequest "$base/api/auth/login" -Method POST -Body '{"email":"employee2@gcredit.com","password":"password123"}' -ContentType 'application/json' -WebSession $sEmp2 -UseBasicParsing -ErrorAction Stop } catch {}

$pAdminCode = 0; $pAdminRole = ''
try {
  $r = Invoke-WebRequest "$base/api/auth/profile" -WebSession $sAdmin -UseBasicParsing -ErrorAction Stop
  $pAdminCode = [int]$r.StatusCode; $pAdminRole = ($r.Content | ConvertFrom-Json).role
} catch { if ($_.Exception.Response) { $pAdminCode = [int]$_.Exception.Response.StatusCode } }

$pEmp2Code = 0; $pEmp2Role = ''
try {
  $r = Invoke-WebRequest "$base/api/auth/profile" -WebSession $sEmp2 -UseBasicParsing -ErrorAction Stop
  $pEmp2Code = [int]$r.StatusCode; $pEmp2Role = ($r.Content | ConvertFrom-Json).role
} catch { if ($_.Exception.Response) { $pEmp2Code = [int]$_.Exception.Response.StatusCode } }

$out += "T12.2|$pAdminCode/$pEmp2Code|admin=$pAdminRole,emp2=$pEmp2Role"

# T12.4 rate limiting - wait 65s first to reset window
Start-Sleep -Seconds 65
$rl = @()
for ($i=1; $i -le 6; $i++) {
  $code = 0
  try { $null = Invoke-WebRequest "$base/api/auth/login" -Method POST -Body '{"email":"admin@gcredit.com","password":"rl_wrong_pw"}' -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop; $code = 200 } catch {
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  }
  $rl += $code
}
$out += "T12.4|$($rl -join ',')|expect-4x401-2x429"

$out | Set-Content 'C:\G_Credit\CODE\gcredit-project\scripts\retest_raw.txt' -Encoding UTF8
Write-Output "RETEST_COMPLETE"
