# Sprint 11 Version Manifest

**Sprint:** Sprint 11 — Security & Quality Hardening  
**Created:** Sprint 11 Planning  
**Updated:** 2026-02-14 (Sprint 11 Complete)  
**Previous:** Sprint 10 (v1.0.0 Release)

---

## Runtime Environment

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | v20.20.0 | LTS |
| npm | 10.8.2 | |
| TypeScript (BE) | ^5.7.3 | |
| TypeScript (FE) | ~5.9.3 | |
| PostgreSQL | 16 | Azure Flexible Server |

---

## Backend Stack

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| @nestjs/core | ^11.0.1 | |
| @nestjs/common | ^11.0.1 | |
| @nestjs/platform-express | ^11.1.12 | |
| @nestjs/config | ^4.0.2 | |
| @nestjs/swagger | ^11.2.5 | |
| @nestjs/throttler | ^6.5.0 | |

### Database & ORM
| Package | Version | Notes |
|---------|---------|-------|
| @prisma/client | ^6.19.2 | 🔒 LOCKED — Prisma 7 has breaking changes |
| prisma | ^6.19.2 | 🔒 LOCKED |

### Auth & Security
| Package | Version | Notes |
|---------|---------|-------|
| @nestjs/jwt | ^11.0.2 | |
| @nestjs/passport | ^11.0.5 | |
| passport | ^0.7.0 | |
| passport-jwt | ^4.0.1 | |
| bcrypt | ^6.0.0 | |
| helmet | ^8.1.0 | |
| sanitize-html | ^2.17.0 | Story 11.9 (already installed) |

### Azure
| Package | Version | Notes |
|---------|---------|-------|
| @azure/storage-blob | ^12.30.0 | |
| @azure/identity | ^4.13.0 | |
| @microsoft/microsoft-graph-client | ^3.0.7 | |

### Testing (BE)
| Package | Version | Notes |
|---------|---------|-------|
| jest | ^30.0.0 | |
| ts-jest | ^29.2.5 | |
| supertest | ^7.2.2 | |

### Candidates for Removal
| Package | Version | Reason |
|---------|---------|--------|
| ~~keyv~~ | ~~^5.0.0~~ | ✅ **Removed** (Story 11.14) |

---

## Frontend Stack

### Core
| Package | Version | Notes |
|---------|---------|-------|
| react | ^19.2.0 | |
| react-dom | ^19.2.0 | |
| react-router-dom | ^6.30.3 | |
| vite | ^7.2.4 | |
| @vitejs/plugin-react | ^5.1.1 | |

### State & Data
| Package | Version | Notes |
|---------|---------|-------|
| zustand | ^5.0.10 | Client state |
| @tanstack/react-query | ^5.90.20 | Server state |
| axios | ^1.13.4 | HTTP client |

### UI / Design System
| Package | Version | Notes |
|---------|---------|-------|
| tailwindcss | ^4.1.18 | |
| @tailwindcss/postcss | ^4.1.18 | |
| lucide-react | ^0.563.0 | Icons |
| @radix-ui/react-dialog | ^1.1.15 | Shadcn/ui primitive |
| @radix-ui/react-label | ^2.1.8 | Shadcn/ui primitive |
| @radix-ui/react-select | ^2.2.6 | Shadcn/ui primitive |
| @radix-ui/react-slot | ^1.2.4 | Shadcn/ui primitive |
| class-variance-authority | ^0.7.1 | |
| clsx | ^2.1.1 | |
| tailwind-merge | ^3.4.0 | |
| recharts | ^3.7.0 | Charts |
| sonner | ^2.0.7 | Toast notifications |

### Testing (FE)
| Package | Version | Notes |
|---------|---------|-------|
| vitest | ^4.0.18 | |
| @vitest/coverage-v8 | ^4.0.18 | |
| @testing-library/react | ^16.3.2 | |
| @testing-library/jest-dom | ^6.9.1 | |
| @testing-library/user-event | ^14.6.1 | |
| jsdom | ^27.4.0 | |
| @axe-core/react | ^4.11.0 | a11y |

### Candidates for Removal
| Package | Version | Reason |
|---------|---------|--------|
| ~~framer-motion~~ | ~~^12.29.2~~ | ✅ **Kept** (used by sonner toasts) |
| ~~tailwindcss-animate~~ | ~~^1.0.7~~ | ✅ **Kept** (used by shadcn/ui) |

---

## New Dependencies for Sprint 11

| Package | Story | Install Command | Status |
|---------|-------|----------------|--------|
| cookie-parser | 11.6 | `npm install cookie-parser @types/cookie-parser` | ✅ Installed |
| husky | 11.22 | `npm install -D husky` (root) | ✅ Installed (^9.0.0) |
| lint-staged | 11.22 | `npm install -D lint-staged` (root) | ✅ Installed (^15.0.0) |

**Note:** `sanitize-html` already installed (^2.17.0). `@types/sanitize-html` already installed (^2.16.0).

---

## DB Migrations Completed

| Story | Migration | Fields | Status |
|-------|-----------|--------|--------|
| 11.1 | AddAccountLockout | `failedLoginAttempts Int @default(0)`, `lockedUntil DateTime?` on User | ✅ Applied |
| 11.4 | AddBadgeVisibility | `isPublic Boolean @default(true)` on Badge | ✅ Applied |

---

## Security Status (Post-Sprint 11)

| Issue | Severity | Status |
|-------|----------|--------|
| lodash Prototype Pollution | Moderate (CVSS 6.5) | ✅ Risk Accepted (ADR-002) |
| `npm audit` (backend) | — | ✅ 0 vulnerabilities |
| `npm audit` (frontend) | — | ✅ 0 vulnerabilities |
| SEC-001: Account Lockout | HIGH | ✅ Fixed (Story 11.1) |
| SEC-002: localStorage JWT | HIGH | ✅ Fixed (Story 11.6 → httpOnly cookies) |
| SEC-003: Issuer Email PII | MEDIUM | ✅ Fixed (Story 11.7) |
| SEC-004: PII in Logs | LOW | ✅ Fixed (Story 11.8) |
| SEC-005: Mimetype Bypass | MEDIUM | ✅ Fixed (Story 11.2) |
| SEC-006: HTML Sanitization | MEDIUM | ✅ Fixed (Story 11.9) |
| SEC-007: Swagger in Prod | LOW | ✅ Fixed (Story 11.3) |
