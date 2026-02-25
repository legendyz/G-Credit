# Sprint 13 Version Manifest

**Sprint:** Sprint 13  
**Target Version:** v1.3.0  
**Created:** 2026-02-25  
**Baseline From:** v1.2.1 (Sprint 12.5)

---

## Runtime Environment

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | v20.20.0 | LTS |
| npm | 10.8.2 | |
| TypeScript (BE) | 5.7.3 | |
| TypeScript (FE) | 5.9.3 | Different version from BE |
| PostgreSQL | 16 | Azure Flexible Server |

---

## Backend Dependencies

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| @nestjs/core | 11.0.1 | |
| @nestjs/common | 11.0.1 | |
| @nestjs/platform-express | 11.0.1 | |
| @nestjs/config | 4.0.2 | |
| @nestjs/swagger | 11.2.0 | |
| @nestjs/passport | 11.0.5 | |
| @nestjs/jwt | 11.0.0 | |

### Authentication & Security
| Package | Version | Notes |
|---------|---------|-------|
| passport | 0.7.0 | |
| passport-jwt | 4.0.1 | |
| passport-local | 1.0.0 | |
| bcrypt | 6.0.0 | |
| class-validator | 0.14.1 | |
| class-transformer | 0.5.1 | |

### Azure Integration
| Package | Version | Notes |
|---------|---------|-------|
| @azure/identity | 4.13.0 | Client Credentials flow (Graph API) |
| @azure/storage-blob | 12.27.0 | Badge image storage |
| @microsoft/microsoft-graph-client | 3.0.7 | M365 sync |

### Database
| Package | Version | Notes |
|---------|---------|-------|
| @prisma/client | ^6.19.2 | ORM |
| prisma (CLI) | 7.4.1 | Schema management. Note: CLI 7.x but client ^6.19.2 |

### Testing
| Package | Version | Notes |
|---------|---------|-------|
| jest | 30.0.0 | |
| @nestjs/testing | 11.0.1 | |
| supertest | 7.1.0 | |

---

## Frontend Dependencies

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| react | 19.2.0 | |
| react-dom | 19.2.0 | |
| react-router-dom | 7.6.1 | |
| vite | 7.2.4 | |

### State Management & Data Fetching
| Package | Version | Notes |
|---------|---------|-------|
| @tanstack/react-query | 5.90.20 | |
| zustand | 5.0.10 | |

### UI Components
| Package | Version | Notes |
|---------|---------|-------|
| tailwindcss | 4.1.18 | |
| lucide-react | 0.563.0 | Icons |
| sonner | 2.0.7 | Toast notifications |
| @dnd-kit/core | 6.3.1 | Drag-and-drop |
| @dnd-kit/sortable | 10.0.0 | Sortable lists |
| @radix-ui/* | various | shadcn/ui primitives |

### Testing
| Package | Version | Notes |
|---------|---------|-------|
| vitest | 4.0.18 | |
| @testing-library/react | 16.3.0 | |
| @testing-library/jest-dom | 6.6.3 | |
| jsdom | 26.1.0 | |

---

## Dependency Changes for Sprint 13

### New Dependencies (to add)

| Package | Target Version | Project | Story | Reason |
|---------|---------------|---------|-------|--------|
| @azure/msal-node | latest stable | Backend | 13.1 | Azure AD SSO Authorization Code Flow (Confidential Client) |

**Install Command:**
```bash
cd gcredit-project/backend
npm install @azure/msal-node
```

### Dependencies to Remove

| Package | Current Version | Project | Story | Reason |
|---------|---------------|---------|-------|--------|
| axios | 1.13.4 | Frontend | 13.7 | Dead dependency — 0 active imports, all calls use `apiFetch()` |

**Remove Command:**
```bash
cd gcredit-project/frontend
npm uninstall axios
```

---

## New Environment Variables

| Variable | Story | Required | Description |
|----------|-------|----------|-------------|
| `AZURE_SSO_CLIENT_ID` | 13.1 | Yes | Azure AD App Client ID for SSO (may reuse existing or new app) |
| `AZURE_SSO_CLIENT_SECRET` | 13.1 | Yes | Azure AD App Client Secret for SSO |
| `AZURE_SSO_REDIRECT_URI` | 13.1 | Yes | OAuth callback URL: `http://localhost:3001/api/auth/sso/callback` |
| `AZURE_SSO_SCOPES` | 13.1 | No | Default: `openid profile email User.Read` |
| `INITIAL_ADMIN_EMAIL` | 13.2 | No | Email for JIT admin bootstrap (DEC-005) |

---

## Database Schema Changes (Potential)

| Change | Story | Type | Notes |
|--------|-------|------|-------|
| Add `azureId` field to `User` model | 13.1 | Migration | Unique nullable string — maps to Azure AD `oid` claim |
| Add `lastSyncedAt` field to `User` model | 13.3 | Migration (optional) | Timestamp for debugging/audit |

**Note:** Verify if `azureId` already exists in Prisma schema (may have been added in M365 sync setup).

---

## Known Issues & Warnings

- **Prisma CLI/Client version mismatch:** CLI is 7.4.1 but client is ^6.19.2 — works but may emit deprecation warnings
- **TypeScript version difference:** Backend uses 5.7.3, Frontend uses 5.9.3 — no compatibility issues expected
- **28 skipped tests (TD-006):** Teams ChannelMessage.Send permission blocked — not Sprint 13 scope

---

## Test Baseline

| Project | Tests | Passing | Failing | Skipped |
|---------|-------|---------|---------|---------|
| Backend | 855 | 827 | 0 | 28 (TD-006) |
| Frontend | 738 | 738 | 0 | 0 |
| **Total** | **1593** | **1565** | **0** | **28** |

---

**Created By:** SM Agent (Bob)  
**Reviewed:** Pending
