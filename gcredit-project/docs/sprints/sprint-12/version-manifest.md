# Sprint 12 — Version Manifest

**Generated:** Phase 1 Sprint Planning  
**Baseline:** v1.1.0 (Sprint 11 release)

---

## Runtime Environment

| Component | Version |
|-----------|---------|
| Node.js | v20.20.0 |
| npm | 10.8.2 |
| PostgreSQL | 16 |

---

## Frontend Dependencies

| Package | Version (package.json) |
|---------|----------------------|
| react | ^19.2.0 |
| react-dom | ^19.2.0 |
| vite | ^7.2.4 |
| typescript | ~5.9.3 |
| tailwindcss | ^4.1.18 |
| react-router-dom | ^6.30.3 |
| zustand | ^5.0.10 |
| lucide-react | ^0.563.0 |
| sonner | ^2.0.7 |
| axios | ^1.13.4 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| date-fns | ^4.1.0 |
| vitest | ^4.0.18 |

---

## Backend Dependencies

| Package | Version (package.json) |
|---------|----------------------|
| @nestjs/core | ^11.0.1 |
| @nestjs/common | ^11.0.1 |
| typescript | ^5.7.3 |
| @prisma/client | ^6.19.2 |
| prisma | ^6.19.2 |
| @azure/storage-blob | ^12.30.0 |
| passport | ^0.7.0 |
| jest | ^30.0.0 |

---

## Infrastructure

| Resource | Service | Notes |
|----------|---------|-------|
| Database | Azure PostgreSQL 16 | No changes expected |
| Blob Storage | Azure Storage | Existing — used by Evidence files |
| Auth | JWT + httpOnly cookies | No changes (DEC-001~006 deferred) |

---

## Sprint 12 Upgrade Strategy

**No dependency upgrades planned for Sprint 12.**

This sprint is focused on management UI completion and evidence unification. Dependency upgrades (if any) will be handled as tech debt in a future sprint.

---

## Pre-Sprint Validation

- [ ] `npm ci` in frontend — clean install
- [ ] `npm ci` in backend — clean install
- [ ] `npx prisma generate` — schema up to date
- [ ] Full test suite passes (pre-push hook)
