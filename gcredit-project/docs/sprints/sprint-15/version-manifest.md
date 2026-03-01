# Sprint 15 Version Manifest

**Sprint:** Sprint 15 — UI Overhaul + Dashboard Composite View  
**Created:** 2026-03-01  
**Baseline Version:** v1.4.0 (Sprint 14)  
**Target Version:** v1.5.0

---

## Infrastructure & Tools

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | v20.20.0 | LTS |
| npm | 10.8.2 | |
| TypeScript (BE) | ^5.7.3 | |
| TypeScript (FE) | ~5.9.3 | |
| Git | (system) | |

---

## Backend Stack

### Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| @nestjs/common | ^11.0.1 | |
| @nestjs/core | ^11.0.1 | |
| @nestjs/config | ^4.0.2 | |
| @nestjs/platform-express | ^11.1.12 | |
| @nestjs/cli | ^11.0.0 | devDep |
| @nestjs/schematics | ^11.0.0 | devDep |

### Database & ORM

| Package | Version | Notes |
|---------|---------|-------|
| @prisma/client | ^6.19.2 | ⚠️ Locked — Prisma 7.x incompatible (Sprint 0 lesson) |
| prisma | ^6.19.2 | devDep |

### Authentication & Security

| Package | Version | Notes |
|---------|---------|-------|
| @nestjs/jwt | ^11.0.2 | |
| @nestjs/passport | ^11.0.5 | |
| @nestjs/throttler | ^6.5.0 | TD-038 target — make configurable |
| passport | ^0.7.0 | |
| passport-jwt | ^4.0.1 | |
| bcrypt | ^6.0.0 | |
| helmet | ^8.1.0 | |
| sanitize-html | ^2.17.0 | |
| cookie-parser | ^1.4.7 | |

### Azure & Microsoft

| Package | Version | Notes |
|---------|---------|-------|
| @azure/identity | ^4.13.0 | |
| @azure/msal-node | ^5.0.5 | |
| @azure/storage-blob | ^12.30.0 | |
| @microsoft/microsoft-graph-client | ^3.0.7 | |

### API & Utilities

| Package | Version | Notes |
|---------|---------|-------|
| @nestjs/swagger | ^11.2.5 | |
| @nestjs/cache-manager | ^3.1.0 | |
| class-transformer | ^0.5.1 | |
| class-validator | ^0.14.1 | |
| swagger-ui-express | ^5.0.1 | |
| rxjs | ^7.8.1 | |
| reflect-metadata | ^0.2.2 | |
| uuid | ^13.0.0 | |
| csv-parse | ^6.1.0 | |
| handlebars | ^4.7.8 | |
| sharp | ^0.33.0 | |
| adaptivecards | ^3.0.5 | |

### Testing (Backend)

| Package | Version | Notes |
|---------|---------|-------|
| jest | ^30.0.0 | |
| ts-jest | ^29.2.5 | |
| @nestjs/testing | ^11.1.12 | |
| supertest | ^7.2.2 | |
| @types/jest | ^30.0.0 | |

### Linting (Backend)

| Package | Version | Notes |
|---------|---------|-------|
| eslint | ^9.18.0 | |
| prettier | ^3.4.2 | |
| typescript-eslint | ^8.20.0 | |

---

## Frontend Stack

### Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| react | ^19.2.0 | |
| react-dom | ^19.2.0 | |
| react-router-dom | ^6.30.3 | |
| vite | ^7.2.4 | |
| @vitejs/plugin-react | ^5.1.1 | devDep |

### UI & Styling

| Package | Version | Notes |
|---------|---------|-------|
| tailwindcss | ^4.1.18 | ADR-009: CSS-first config |
| @tailwindcss/postcss | ^4.1.18 | |
| tailwind-merge | ^3.4.0 | |
| tailwindcss-animate | ^1.0.7 | |
| class-variance-authority | ^0.7.1 | shadcn/ui utility |
| clsx | ^2.1.1 | |
| lucide-react | ^0.563.0 | Sprint 15: full-site icon migration |
| @radix-ui/react-dialog | ^1.1.15 | shadcn/ui |
| @radix-ui/react-label | ^2.1.8 | shadcn/ui |
| @radix-ui/react-select | ^2.2.6 | shadcn/ui |
| @radix-ui/react-slot | ^1.2.4 | shadcn/ui |
| @radix-ui/react-switch | ^1.2.6 | shadcn/ui |

### State & Data

| Package | Version | Notes |
|---------|---------|-------|
| zustand | ^5.0.10 | Global state management |
| @tanstack/react-query | ^5.90.20 | Server state / data fetching |
| date-fns | ^4.1.0 | Date utilities |

### DnD & Visualization

| Package | Version | Notes |
|---------|---------|-------|
| @dnd-kit/core | ^6.3.1 | Category tree drag-and-drop |
| @dnd-kit/sortable | ^10.0.0 | |
| @dnd-kit/utilities | ^3.2.2 | |
| recharts | ^3.7.0 | Analytics charts |

### Notifications

| Package | Version | Notes |
|---------|---------|-------|
| sonner | ^2.0.7 | Toast notifications |

### Testing (Frontend)

| Package | Version | Notes |
|---------|---------|-------|
| vitest | ^4.0.18 | |
| @vitest/coverage-v8 | ^4.0.18 | |
| @testing-library/react | ^16.3.2 | |
| @testing-library/jest-dom | ^6.9.1 | |
| @testing-library/user-event | ^14.6.1 | |
| jsdom | ^27.4.0 | |

### Accessibility Testing

| Package | Version | Notes |
|---------|---------|-------|
| @axe-core/react | ^4.11.0 | Runtime a11y checking |
| axe-core | ^4.11.1 | |
| eslint-plugin-jsx-a11y | ^6.10.2 | |

### Linting (Frontend)

| Package | Version | Notes |
|---------|---------|-------|
| eslint | ^9.39.1 | |
| prettier | ^3.8.1 | |
| typescript-eslint | ^8.46.4 | |

---

## New Dependencies for Sprint 15

**No new npm packages expected.** Sprint 15 is UI refactoring using existing dependencies:
- shadcn/ui Sidebar component (`npx shadcn@latest add sidebar` — may generate new files but not new npm deps)
- IntersectionObserver — native browser API, no package needed
- `useBlocker` — from existing react-router-dom

**Potential addition (verify):**
- shadcn/ui components that may need installation: `sidebar`, `alert-dialog` (if not already present)

---

## Database & Infrastructure

| Component | Version/Config | Notes |
|-----------|---------------|-------|
| PostgreSQL | Azure Flexible Server (B1ms) | gcredit-dev-db-lz |
| Prisma Schema | 19 models | No schema changes in Sprint 15 |
| Azure Storage | gcreditdevstoragelz | badges + evidence containers |
| Azure AD | App Registration | SSO (Sprint 13) |

---

## Test Baseline

| Area | Count | Status |
|------|-------|--------|
| Backend Unit/Integration | 932 | ✅ All pass |
| Frontend Unit | 794 | ✅ All pass |
| E2E Tests | 31 | ✅ All pass |
| **Total** | **1,757** | **100% pass rate** |

---

## Version Lock Notes

| Package | Locked Version | Reason |
|---------|---------------|--------|
| @prisma/client | 6.19.2 | Prisma 7.x incompatible — Sprint 0 incident |
| react | 19.x | Do not upgrade to future 20.x during pilot prep |

---

**Script Note:** `check-versions.ps1` has encoding corruption (Sprint 14 retro item #2). Version data collected manually from `package.json` files.
