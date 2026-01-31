# Important Development Reminders

**Last Updated**: 2026-01-31

---

## ⚠️ Critical Configuration Settings

### 1. API Documentation Path
**IMPORTANT**: The API documentation is NOT at `/api`, it's at **`/api-docs`**

- ✅ **CORRECT**: `http://localhost:3000/api-docs`
- ❌ **WRONG**: `http://localhost:3000/api`

**Why This Matters**: This has been a recurring mistake. Always use `/api-docs` when referring to Swagger UI documentation.

---

### 2. Backend API Port
**IMPORTANT**: Backend server runs on **port 3000**, NOT 3001

- ✅ **CORRECT**: `http://localhost:3000/api/...`
- ❌ **WRONG**: `http://localhost:3001/api/...`

**Recent Fix**: 2026-01-31 - Fixed `useWallet.ts` which was incorrectly pointing to port 3001

---

### 3. Authentication Endpoints
**IMPORTANT**: Auth endpoints do NOT use `/api` prefix

- ✅ **CORRECT**: `http://localhost:3000/auth/login`
- ❌ **WRONG**: `http://localhost:3000/api/auth/login`

**Why Different**: Auth module is mounted at root level, while other modules use `/api` prefix

---

### 4. Token Storage Key
**IMPORTANT**: Backend returns `accessToken` (camelCase), NOT `access_token`

- ✅ **CORRECT**: `localStorage.getItem('accessToken')`
- ❌ **WRONG**: `localStorage.getItem('access_token')`

**Backend Response**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}
```

**Recent Fix**: 2026-01-31 - Unified all frontend files to use `accessToken`

---

### 5. Frontend Dev Server Port
Frontend runs on **port 5173** (Vite default)

- Frontend URL: `http://localhost:5173`
- Must be different from backend port to avoid conflicts

---

## 🔍 Quick Verification Commands

### Check Backend is Running
```powershell
# Should return 200 OK with HTML
curl http://localhost:3000/api-docs -UseBasicParsing | Select-Object StatusCode

# Should return 401 Unauthorized (backend is working, just needs auth)
curl http://localhost:3000/api/badges/wallet -UseBasicParsing
```

### Check Frontend is Running
```powershell
# Should return 200 OK with HTML
curl http://localhost:5173 -UseBasicParsing | Select-Object StatusCode
```

---

## 📝 Common Mistakes to Avoid

### Mistake #1: Wrong API Docs Path
```markdown
# ❌ WRONG
See API documentation at http://localhost:3000/api

# ✅ CORRECT
See API documentation at http://localhost:3000/api-docs
```

### Mistake #2: Wrong Backend Port in Frontend Code
```typescript
// ❌ WRONG
fetch('http://localhost:3001/api/badges/wallet')

// ✅ CORRECT
fetch('http://localhost:3000/api/badges/wallet')
```

### Mistake #3: Wrong Auth Endpoint
```typescript
// ❌ WRONG
fetch('http://localhost:3000/api/auth/login')

// ✅ CORRECT
fetch('http://localhost:3000/auth/login')
```

### Mistake #4: Wrong Token Key
```typescript
// ❌ WRONG
localStorage.getItem('access_token')

// ✅ CORRECT
localStorage.getItem('accessToken')
```

### Mistake #5: Hardcoded URLs Instead of Environment Variables
```typescript
// ❌ WRONG - Hardcoded URL
const API_URL = 'http://localhost:3000/api';

// ✅ CORRECT - Use environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

---

## 🔧 Environment Configuration

### Backend (.env)
```env
PORT=3000
DATABASE_URL="postgresql://..."
NODE_ENV=development
```

### Frontend (.env.local) - Optional
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📚 Related Documentation

- **API Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Setup Guide**: [docs/setup/local-development.md](../setup/local-development.md)
- **Architecture**: [docs/architecture/system-overview.md](../architecture/system-overview.md)

---

## 🚨 When Things Go Wrong

### "Failed to load badges" Error
**Symptoms**: Frontend shows loading spinner, then error message

**Common Causes**:
1. Backend not running on port 3000
2. Frontend pointing to wrong port (e.g., 3001)
3. Missing or invalid authentication token
4. Wrong token storage key (access_token vs accessToken)
5. CORS issues

**Solution**:
1. Verify backend is running: `curl http://localhost:3000/api-docs`
2. Check frontend API calls use correct port (3000)
3. Get fresh token: Run `.\scripts\get-token.ps1`
4. Check browser console for detailed errors
5. Verify localStorage has valid `accessToken` (NOT access_token)

**Quick Fix**:
```powershell
# Run in project root
.\scripts\get-token.ps1

# Then paste the command shown in browser console (F12)
```

### "Cannot connect to API" Error
**Symptoms**: Network errors in browser console

**Common Causes**:
1. Backend server not started
2. Wrong port in API calls
3. Firewall blocking connections

**Solution**:
```powershell
# Terminal 1: Start backend
cd c:\G_Credit\CODE\gcredit-project\backend
npm run start:dev

# Terminal 2: Start frontend
cd c:\G_Credit\CODE\gcredit-project\frontend
npm run dev
```

---

## ✅ Pre-Commit Checklist

Before committing code that interacts with the backend:

- [ ] API calls use port **3000** (not 3001)
- [ ] API docs references use **/api-docs** (not /api)
- [ ] Auth endpoints use **/auth/...** (not /api/auth/...)
- [ ] Token storage uses **accessToken** (not access_token)
- [ ] Environment variables used instead of hardcoded URLs
- [ ] CORS properly configured for cross-origin requests
- [ ] Error handling in place for network failures

---

## 🔑 Quick Login for Development

**Get a valid JWT token in 10 seconds:**

```powershell
# Run this script
.\scripts\get-token.ps1

# Or manually login in browser console:
fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'recipient@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('accessToken', data.accessToken);
  location.reload();
});
```

**Test Users** (from seed data):
- `recipient@example.com` / `password123` (EMPLOYEE role)
- `issuer@gcredit.com` / `password123` (ISSUER role)

See [Quick Login Guide](./quick-login-guide.md) for more methods.

---

**Remember**: These are recurring issues. Please review this document before making API-related changes.
