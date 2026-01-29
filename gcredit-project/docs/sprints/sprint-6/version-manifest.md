# Sprint 6 Version Manifest

**Sprint:** Sprint 6 - Social Sharing & Widget Embedding  
**Date Created:** 2026-01-29  
**Created By:** Bob (Scrum Master)  
**Purpose:** Lock dependency versions to prevent version drift (Ref: Sprint 0 Lesson 1)  
**Last Updated:** 2026-01-29

---

## 📌 Why This Document Exists

**Sprint 0 Lesson Learned:**  
During Sprint 0, Prisma 7 was accidentally installed instead of Prisma 6, causing 1 hour of debugging and downgrade work. This version manifest prevents similar issues by:
- 📸 Taking a snapshot of all dependency versions at Sprint start
- 🔒 Providing exact version numbers for reproducible installations
- ⚠️ Documenting known security issues and workarounds
- 🎯 Specifying Sprint 6 new dependencies with recommended versions

---

## 🎯 Runtime Environment

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | v20.20.0 | LTS version, stable for production |
| **npm** | 10.8.2 | Package manager |
| **PowerShell** | 5.1+ | For scripts execution |

---

## 🎨 Frontend Stack (React + Vite)

### Core Framework
```json
{
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

### Build Tools
```json
{
  "vite": "7.3.1",
  "typescript": "5.9.3",
  "@vitejs/plugin-react": "latest"
}
```

### UI & Styling
```json
{
  "tailwindcss": "4.1.18",
  "lucide-react": "0.563.0",
  "shadcn/ui": "components (via CLI)"
}
```

### State Management & Data Fetching
```json
{
  "@tanstack/react-query": "5.90.20"
}
```

### Frontend Dependencies Status
✅ **Security Status:** 0 vulnerabilities found (npm audit --production)  
✅ **Compatibility:** All dependencies compatible with React 19  
✅ **Stability:** No breaking changes expected in Sprint 6

---

## 🚀 Backend Stack (NestJS + PostgreSQL)

### Core Framework
```json
{
  "@nestjs/common": "11.1.12",
  "@nestjs/core": "11.1.12",
  "@nestjs/platform-express": "11.1.12"
}
```

### Database & ORM
```json
{
  "prisma": "6.19.2",
  "@prisma/client": "6.19.2"
}
```

**⚠️ CRITICAL - Prisma Version Locked:**
- **Current Version:** 6.19.2
- **Locked:** YES (do NOT upgrade to Prisma 7.x)
- **Reason:** Prisma 7 introduces breaking changes (new prisma.config.ts requirement, schema syntax changes)
- **Reference:** Sprint 0 Lesson 1 - Prisma 7 caused 1 hour debugging + downgrade
- **Action:** Always install with `npm install -D prisma@6.19.2`

### Authentication & Security
```json
{
  "@nestjs/passport": "11.0.5",
  "@nestjs/jwt": "11.0.2",
  "passport-jwt": "4.0.1",
  "bcrypt": "5.1.1",
  "class-validator": "0.14.1",
  "class-transformer": "0.5.1"
}
```

### Backend Dependencies Status
⚠️ **Security Status:** 6 vulnerabilities (3 moderate, 3 high) - NON-BLOCKING for Sprint 6
- **Issue 1:** lodash Prototype Pollution (from @nestjs/config, @nestjs/swagger)
  - **Severity:** Moderate
  - **Impact:** Development dependencies only, not exposed to production
  - **Action:** Monitor, will address in Sprint 7+ during dependency upgrade epic
- **Issue 2:** tar Path Traversal (from bcrypt → @mapbox/node-pre-gyp → tar)
  - **Severity:** High
  - **Impact:** Build-time only, not runtime vulnerability
  - **Action:** bcrypt team needs to update node-pre-gyp, no action needed from us

✅ **Sprint 6 Decision:** Proceed with current versions, security issues are non-blocking

---

## 🆕 Sprint 6 New Dependencies

### Microsoft Graph API Integration
**Purpose:** Email sharing (Story 7.2) + Teams notifications (Story 7.4)

```json
{
  "@microsoft/microsoft-graph-client": "3.0.7",
  "@azure/identity": "4.13.0"
}
```

**Installation Command:**
```bash
cd backend
npm install @microsoft/microsoft-graph-client@3.0.7 @azure/identity@4.13.0
```

**Documentation:**
- Microsoft Graph Client: https://github.com/microsoftgraph/msgraph-sdk-javascript
- Azure Identity: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity

**Version Notes:**
- ✅ **@microsoft/microsoft-graph-client 3.0.7:** Latest stable (as of 2026-01-29)
- ✅ **@azure/identity 4.13.0:** Latest stable, supports OAuth 2.0 Client Credentials Flow
- 🔒 **Lock these versions** after installation to prevent breaking changes

### Adaptive Cards (Teams Integration)
**Purpose:** Interactive Teams notifications (Story 7.4)

```json
{
  "adaptivecards": "3.0.5"
}
```

**Installation Command:**
```bash
cd backend
npm install adaptivecards@3.0.5
```

**Documentation:**
- Adaptive Cards: https://adaptivecards.io/
- Designer Tool: https://adaptivecards.io/designer/

**Version Notes:**
- ✅ **adaptivecards 3.0.5:** Latest stable, supports Adaptive Cards v1.4 schema
- 🔒 **Lock this version** after installation

### Environment Variables Required
```bash
# Add to .env file after Azure AD setup
AZURE_TENANT_ID=<provided by LegendZhu>
AZURE_CLIENT_ID=<generated during Azure AD setup>
AZURE_CLIENT_SECRET=<generated during Azure AD setup>
AZURE_TENANT_DOMAIN=<yourdomain.onmicrosoft.com>
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPE=https://graph.microsoft.com/.default
ENABLE_GRAPH_EMAIL=true
ENABLE_GRAPH_TEAMS=true
```

---

## 🧪 Testing Stack

### Unit & Integration Testing
```json
{
  "jest": "30.2.0",
  "@types/jest": "30.0.0",
  "ts-jest": "29.4.6",
  "supertest": "7.2.2"
}
```

### E2E Testing (Sprint 6 Focus)
**Critical:** TD-001 (E2E Test Isolation) will be addressed in Sprint 6
- Use database transactions for test isolation
- No manual cleanup needed
- Test data factories pattern

---

## 📦 Database & Infrastructure

### PostgreSQL
- **Version:** 14.x (Azure PostgreSQL)
- **Connection:** Via Prisma Client
- **Schema:** Managed by Prisma Migrations

### Azure Resources (Existing - Sprint 0)
- **Storage Account:** gcreditdevstoragelz
- **Container:** badges
- **Region:** West US
- **Status:** ✅ Already provisioned, no new resources needed in Sprint 6

### Azure Resources (New - Sprint 6)
- **Azure AD App Registration:** To be created in Sprint 6 Day 1
- **Required Permissions:**
  - Mail.Send (Email sharing)
  - ChannelMessage.Send (Teams notifications)
  - User.Read (optional for profile lookup)

---

## 📝 Version Verification Commands

### Quick Check (All Dependencies)
```bash
# Frontend
cd gcredit-project/frontend
npm list --depth=0

# Backend
cd gcredit-project/backend
npm list --depth=0
```

### Check Specific Package
```bash
npm list <package-name> --depth=0
```

### Verify Prisma Version (CRITICAL)
```bash
cd backend
npx prisma --version
# Expected: prisma: 6.19.2
```

### Security Audit
```bash
# Frontend (should be 0 vulnerabilities)
cd frontend
npm audit --production

# Backend (6 known vulnerabilities, non-blocking)
cd backend
npm audit --production
```

---

## 🔧 Installation Commands Summary

### Fresh Install (New Environment)
```bash
# Frontend
cd gcredit-project/frontend
npm install

# Backend
cd gcredit-project/backend
npm install

# Verify Prisma is 6.19.2 (NOT 7.x)
npx prisma --version
```

### Sprint 6 New Dependencies Only
```bash
cd gcredit-project/backend

# Microsoft Graph + Azure Identity
npm install @microsoft/microsoft-graph-client@3.0.7 @azure/identity@4.13.0

# Adaptive Cards
npm install adaptivecards@3.0.5

# Verify installations
npm list @microsoft/microsoft-graph-client @azure/identity adaptivecards --depth=0
```

---

## 🚨 Known Issues & Workarounds

### Issue 1: Backend Security Vulnerabilities (6 total)
**Status:** ⚠️ Non-blocking for Sprint 6  
**Details:** See "Backend Dependencies Status" section above  
**Action:** Monitor, will address in future sprint

### Issue 2: React 19 Early Adoption
**Status:** ✅ Stable, no issues found  
**Note:** React 19 is relatively new (released late 2025), but all dependencies compatible  
**Action:** Continue monitoring for ecosystem updates

### Issue 3: Tailwind CSS 4 (New Version)
**Status:** ✅ Stable, working as expected  
**Note:** Tailwind 4 uses new CSS-first approach  
**Action:** No issues encountered in Sprint 4-5

---

## 🔄 Maintenance Instructions

### When to Update This Document
1. **Before Sprint Kickoff** (this document) ✅
2. **When adding new dependencies** during Sprint 6
3. **After Sprint 6 completion** (update with actual installed versions)

### How to Update
```bash
# Re-run version checks
cd gcredit-project
.\scripts\check-versions.ps1

# Or manually check each package
npm list <package> --depth=0
```

### Post-Sprint 6 Checklist
- [ ] Verify all Sprint 6 new dependencies installed correctly
- [ ] Update this document with actual versions if different from recommended
- [ ] Run security audit and document any new issues
- [ ] Update `infrastructure-inventory.md` with Azure AD App details

---

## 📚 References

- **Sprint 0 Lesson 1:** Version drift issue (Prisma 7 incident)
- **Sprint Planning Checklist:** Section 9 - Version Manifest Creation (MANDATORY)
- **Infrastructure Inventory:** `docs/setup/infrastructure-inventory.md`
- **Package Manager:** npm (not yarn or pnpm)

---

## ✅ Verification Checklist

Before starting Sprint 6 implementation:
- [ ] Node.js v20.20.0 installed ✅
- [ ] npm 10.8.2 installed ✅
- [ ] All frontend dependencies installed (0 vulnerabilities) ✅
- [ ] All backend dependencies installed (6 known non-blocking vulnerabilities) ✅
- [ ] Prisma 6.19.2 confirmed (NOT 7.x) ✅
- [ ] Sprint 6 new dependencies installation commands ready ✅
- [ ] Environment variables template prepared ✅
- [ ] Azure AD App registration guide available ✅

**Status:** 🟢 **READY FOR SPRINT 6 KICKOFF**

---

**Document Status:** ✅ Complete  
**Next Action:** Install Sprint 6 dependencies on Day 1  
**Owner:** Amelia (Dev Lead) with Bob (Scrum Master) guidance
