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

### 3. Frontend Dev Server Port
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

### Mistake #3: Hardcoded URLs Instead of Environment Variables
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
3. CORS issues
4. Missing authentication token

**Solution**:
1. Verify backend is running: `curl http://localhost:3000/api-docs`
2. Check frontend API calls use correct port (3000)
3. Check browser console for detailed errors
4. Verify localStorage has valid `access_token` or `accessToken`

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
- [ ] Environment variables used instead of hardcoded URLs
- [ ] CORS properly configured for cross-origin requests
- [ ] Error handling in place for network failures

---

**Remember**: These are recurring issues. Please review this document before making API-related changes.
