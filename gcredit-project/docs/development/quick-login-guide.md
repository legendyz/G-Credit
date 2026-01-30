# Quick Login Script for Development

This script helps you quickly get a JWT token for testing frontend features.

## Test Users (from seed data)

1. **Issuer Account**:
   - Email: `issuer@gcredit.com`
   - Password: `password123`
   - Role: ISSUER

2. **Recipient Account**:
   - Email: `recipient@example.com`
   - Password: `password123`
   - Role: EMPLOYEE

---

## Method 1: Using PowerShell (Quick)

```powershell
# Login as recipient and save token
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"recipient@example.com","password":"password123"}'
$token = $response.access_token
Write-Host "Token: $token"

# Copy to clipboard
$token | Set-Clipboard
Write-Host "Token copied to clipboard!"

# Set in localStorage (run this in browser console)
Write-Host "`nPaste this in browser console (F12):"
Write-Host "localStorage.setItem('access_token', '$token')"
```

---

## Method 2: Using cURL

```bash
# Login as recipient
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"recipient@example.com","password":"password123"}'

# Response will contain:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "...", "email": "recipient@example.com", ... }
# }
```

---

## Method 3: Using Postman

1. Create a new POST request
2. URL: `http://localhost:3000/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "email": "recipient@example.com",
     "password": "password123"
   }
   ```
5. Send request
6. Copy `access_token` from response
7. Open browser console (F12) on `http://localhost:5173`
8. Run: `localStorage.setItem('access_token', 'YOUR_TOKEN_HERE')`
9. Refresh page

---

## Method 4: Automated PowerShell Script

Save this as `get-token.ps1`:

```powershell
# get-token.ps1 - Automatically login and set token in browser storage

param(
    [string]$Email = "recipient@example.com",
    [string]$Password = "password123"
)

Write-Host "🔐 Logging in as $Email..." -ForegroundColor Cyan

try {
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $token = $response.access_token

    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Yellow
    Write-Host "Role: $($response.user.role)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🎫 Token (first 50 chars):" -ForegroundColor Cyan
    Write-Host $token.Substring(0, [Math]::Min(50, $token.Length))... -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Token copied to clipboard!" -ForegroundColor Green
    $token | Set-Clipboard

    Write-Host ""
    Write-Host "🌐 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
    Write-Host "2. Open browser console (F12)" -ForegroundColor White
    Write-Host "3. Paste and run this command:" -ForegroundColor White
    Write-Host ""
    Write-Host "   localStorage.setItem('access_token', '$token')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Refresh the page (F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "Or just paste the token from clipboard!" -ForegroundColor Green

} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
```

Usage:
```powershell
# From backend directory
cd c:\G_Credit\CODE\gcredit-project\scripts
.\get-token.ps1

# Or with custom credentials
.\get-token.ps1 -Email "issuer@gcredit.com" -Password "password123"
```

---

## Quick Fix: Manual Browser Setup

**If you just want to test quickly NOW:**

1. Open browser at `http://localhost:5173`
2. Open console (F12)
3. Run this command:

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'recipient@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('access_token', data.access_token);
  console.log('✅ Token saved! Refreshing...');
  location.reload();
});
```

This will:
- Login
- Save token to localStorage
- Reload the page
- You should see your badges!

---

## Troubleshooting

### "Cannot connect to backend"
- Check backend is running: `npm run start:dev` in `backend/` folder
- Verify port 3000: `curl http://localhost:3000/api-docs`

### "401 Unauthorized after setting token"
- Token might be expired (default 7 days)
- Get a fresh token using any method above
- Check localStorage: `localStorage.getItem('access_token')`

### "No badges showing"
- Make sure you ran seed script: `npm run seed` in `backend/` folder
- Check database has data
- Check browser console for errors

---

## See Also

- [API Documentation](http://localhost:3000/api-docs)
- [Important Reminders](../development/important-reminders.md)
- [Backend README](../../backend/README.md)
