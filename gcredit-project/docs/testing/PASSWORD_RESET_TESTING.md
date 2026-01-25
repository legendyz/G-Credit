# Story 2.5 - Password Reset Flow Testing Guide

## Backend Status
✅ All code implemented
✅ All dependencies installed (nodemailer)
✅ Database migration applied (PasswordResetToken table created)
✅ Endpoints registered:
   - POST /auth/request-reset
   - POST /auth/reset-password

## Prerequisites
1. Backend must be running: `npm run start:dev`
2. Database must be ready (migrations applied)
3. A test user must exist

## Testing Steps

### Option 1: Using REST Client (VS Code Extension)

1. **Open** `test-password-reset.http` in VS Code
2. **Ensure backend is running** - check terminal for "Nest application successfully started"
3. **Run Test 1**: Click "Send Request" above Test 1
   - Expected: 200 OK response
   - Message: "If the email exists in our system, you will receive a password reset link"
4. **Check Backend Console**: Look for the email output in dev mode:
   ```
   ================================================================================
   📧 [DEV MODE] Password Reset Email (not sent)
   ================================================================================
   To: reset.test@gcredit.com
   Subject: Reset Your Password
   Reset URL: http://localhost:5173/reset-password?token=<TOKEN_HERE>
   Token: <TOKEN_HERE>
   ================================================================================
   ```
5. **Copy the token** from the console output
6. **Update Test 4** in `test-password-reset.http`: Replace `PASTE_TOKEN_HERE` with the actual token
7. **Run Test 4**: Reset password with the token
   - Expected: 200 OK
   - Message: "Password has been reset successfully"
8. **Run Test 5**: Try to reuse the same token
   - Expected: 400 Bad Request
   - Message: Token already used or invalid
9. **Run Test 8**: Login with old password
   - Expected: 401 Unauthorized
10. **Run Test 9**: Login with new password
    - Expected: 200 OK with access token

### Option 2: Using PowerShell Script

**Important**: Backend must be running in a separate terminal!

1. **Start backend** in one PowerShell window:
   ```powershell
   cd c:\G_Credit\CODE\gcredit-project\backend
   npm run start:dev
   ```

2. **Wait** for "Nest application successfully started" message

3. **Open a NEW PowerShell window** and run:
   ```powershell
   cd c:\G_Credit\CODE\gcredit-project\backend
   .\run-password-reset-tests.ps1
   ```

4. **Follow the prompts**: The script will ask you to copy the token from the backend console

### Option 3: Manual Testing with PowerShell Commands

```powershell
# Step 1: Request password reset
$body = @{ email = "reset.test@gcredit.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/auth/request-reset" `
    -Method POST -Body $body -ContentType "application/json"

# Step 2: Check backend console for token, then run:
$body = @{ 
    token = "PASTE_TOKEN_FROM_CONSOLE"
    newPassword = "NewSecurePass123!" 
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/auth/reset-password" `
    -Method POST -Body $body -ContentType "application/json"

# Step 3: Test login with new password
$body = @{ 
    email = "reset.test@gcredit.com"
    password = "NewSecurePass123!" 
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
    -Method POST -Body $body -ContentType "application/json"
```

## Expected Test Results

| Test | Endpoint | Expected Status | Expected Behavior |
|------|----------|----------------|-------------------|
| 1 | POST /auth/request-reset (valid email) | 200 | Generic success message, email logged to console |
| 2 | POST /auth/request-reset (invalid email) | 200 | Same message (security: no email enumeration) |
| 3 | POST /auth/request-reset (bad format) | 400 | Validation error |
| 4 | POST /auth/reset-password (valid token) | 200 | Password reset success |
| 5 | POST /auth/reset-password (reuse token) | 400 | Token already used |
| 6 | POST /auth/reset-password (invalid token) | 400 | Invalid token |
| 7 | POST /auth/reset-password (weak password) | 400 | Password validation error |
| 8 | POST /auth/login (old password) | 401 | Authentication failed |
| 9 | POST /auth/login (new password) | 200 | Login successful |

## Security Features Verified
✅ Generic response messages (doesn't reveal if email exists)
✅ One-time use tokens (cannot reuse after reset)
✅ Token expiration (1 hour)
✅ Password strength validation on reset
✅ Audit logging for security tracking

## Troubleshooting

### Backend not responding
- Check if backend is running: Look for "Nest application successfully started"
- Check if port 3000 is free: `netstat -ano | findstr :3000`
- Restart backend: Ctrl+C then `npm run start:dev`

### No email output in console
- Verify NODE_ENV is not set to 'production'
- Check EmailService is in dev mode
- Look for console output starting with "📧 [DEV MODE]"

### Token not working
- Verify token is copied correctly (64 hex characters)
- Check if token expired (1 hour from request)
- Ensure token hasn't been used already

## Next Steps After Testing
Once all tests pass:
1. Commit changes with comprehensive commit message
2. Push to sprint-1-authentication branch
3. Update sprint backlog
4. Consider Story 2.6 (Session Management) or wrap up Sprint 1
