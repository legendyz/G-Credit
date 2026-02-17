# Developer Onboarding Guide

**Target Audience:** Professional developers joining the G-Credit project  
**Reading Time:** ~10 minutes  
**Last Updated:** 2026-02-17

---

## 1. What Is G-Credit?

G-Credit is an **enterprise internal digital credentialing platform** that lets organizations issue, manage, and verify digital badges for employee skills and achievements — replacing fragmented certificates and reducing dependence on external SaaS platforms (Credly, Accredible).

**Key characteristics:**
- **Open Badges 2.0 compliant** — JSON-LD assertions, baked PNG badges, SHA-256 integrity verification
- **Full badge lifecycle** — Issue → Claim → Share → Verify → Expire/Revoke
- **Role-based access** — 4 roles with distinct dashboards and permissions
- **Enterprise-grade** — Rate limiting, audit logging, cookie-based auth, RBAC guards

---

## 2. Tech Stack at a Glance

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript (strict) | 19.x + TS 5.9 |
| **Build** | Vite | 7.3 |
| **Styling** | Tailwind CSS + shadcn/ui | 4.x |
| **Routing** | React Router | 7.x |
| **State** | React Query (@tanstack/react-query) + Zustand (authStore) | — |
| **Backend** | NestJS + TypeScript (strict) | 11.x + TS 5.9 |
| **ORM** | Prisma (🔒 version-locked) | 6.19 |
| **Database** | PostgreSQL | 16 |
| **Storage** | Azure Blob Storage | Standard LRS |
| **Auth** | JWT (httpOnly cookies) + refresh tokens | — |
| **Testing** | Jest (backend) + Vitest (frontend) | — |
| **Git Hooks** | Husky + lint-staged (pre-commit lint, pre-push CI mirror) | — |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                     http://localhost:5173                        │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Login    │ │Dashboard │ │ Wallet   │ │ Admin (Templates, │  │
│  │          │ │(4 roles) │ │(Timeline)│ │  Badges, Users,   │  │
│  │          │ │          │ │          │ │  Analytics, Bulk)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│         │            │            │               │             │
│         └────────────┴────────────┴───────────────┘             │
│                          │  /api/*  (Vite proxy)                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    BACKEND (NestJS)                              │
│                   http://localhost:3000                          │
│                                                                 │
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Auth   │ │  Badges    │ │Templates │ │  Sharing/Verify  │  │
│  │ Module  │ │ (Issuance, │ │  CRUD    │ │  Email, Teams,   │  │
│  │ JWT +   │ │  Wallet,   │ │          │ │  LinkedIn, Embed │  │
│  │ Cookies │ │  Revoke)   │ │          │ │                  │  │
│  └─────────┘ └────────────┘ └──────────┘ └──────────────────┘  │
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Admin   │ │ Bulk       │ │Analytics │ │  Dashboard       │  │
│  │ Users   │ │ Issuance   │ │          │ │  (4 role views)  │  │
│  └─────────┘ └────────────┘ └──────────┘ └──────────────────┘  │
│        │              │             │              │             │
│  ┌─────┴──────────────┴─────────────┴──────────────┴──────┐     │
│  │  Global Guards: JwtAuthGuard → RolesGuard → Throttler  │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐  ┌─────▼─────┐  ┌──▼──────────────┐
     │ PostgreSQL │  │ Azure     │  │ Microsoft Graph  │
     │ 16         │  │ Blob      │  │ (Email, Teams,   │
     │ (Prisma)   │  │ Storage   │  │  M365 Sync)      │
     └────────────┘  └───────────┘  └──────────────────┘
```

---

## 4. Core Domain Concepts

### Badge Lifecycle

```
                  ┌──────────┐
    Issue badge   │ PENDING  │   Badge created, claim token generated
    ─────────────►│          │   Notification sent to recipient
                  └────┬─────┘
                       │ Recipient clicks claim link
                  ┌────▼─────┐
                  │ CLAIMED  │   Badge is in recipient's wallet
                  │          │   Can share, download, verify
                  └────┬─────┘
                       │
              ┌────────┼────────┐
              │                 │
        ┌─────▼─────┐   ┌──────▼─────┐
        │ EXPIRED   │   │  REVOKED   │
        │ (dynamic) │   │ (explicit) │
        │ gray UI   │   │  red UI    │
        └───────────┘   └────────────┘

  Note: EXPIRED is computed dynamically — the DB status stays CLAIMED,
  but if expiresAt < now, the API returns status: 'EXPIRED'.
```

### User Roles (RBAC)

| Role | Can Do | Dashboard |
|------|--------|-----------|
| **ADMIN** | Everything + user management + M365 sync | Admin overview with system stats |
| **ISSUER** | Create templates, issue badges, view analytics, bulk issuance | Issuer dashboard with issuance stats |
| **MANAGER** | View team badges, issue within team | Manager dashboard with team overview |
| **EMPLOYEE** | View own wallet, claim badges, share badges | Employee dashboard with personal stats |

### Open Badges 2.0

Every issued badge generates a JSON-LD **assertion** containing:
- Badge class (template metadata)
- Issuer profile
- Recipient identity (SHA-256 hashed email)
- Verification URL
- Evidence references

Badges can be **baked** into PNG images (metadata embedded in iTXt chunk) and **verified** via a public URL without authentication.

---

## 5. Project Structure

```
gcredit-project/
├── backend/                          # NestJS API server
│   ├── prisma/
│   │   ├── schema.prisma            # 16 models, enums, indexes
│   │   ├── migrations/              # Prisma migration history
│   │   └── seed.ts                  # Dev seed: 5 users, 9 templates, 11 badges
│   └── src/
│       ├── main.ts                  # Bootstrap, cookie-parser, CORS, Helmet
│       ├── app.module.ts            # Root module — imports all feature modules
│       ├── common/                  # Shared: Prisma, Storage, Guards, Utils
│       │   ├── guards/              # JwtAuthGuard, RolesGuard, ThrottlerGuard
│       │   ├── prisma.service.ts    # Database connection singleton
│       │   └── storage.service.ts   # Azure Blob operations
│       ├── modules/auth/            # Auth: register, login, JWT, refresh, password reset
│       ├── badge-issuance/          # Core: issue, claim, wallet, revoke, download
│       ├── badge-templates/         # CRUD + criteria templates + recommendations
│       ├── badge-verification/      # Public verification (no auth required)
│       ├── badge-sharing/           # Email, Teams, LinkedIn, embed widget, analytics
│       ├── bulk-issuance/           # CSV upload → preview → confirm workflow
│       ├── evidence/                # File upload/download for badge evidence
│       ├── analytics/               # System overview, trends, top performers, export
│       ├── dashboard/               # Role-specific dashboard data (4 endpoints)
│       ├── admin-users/             # User management (role, status, department)
│       ├── milestones/              # Achievement milestones (badge count, skill track)
│       ├── skills/                  # Skill CRUD
│       ├── skill-categories/        # Hierarchical skill categories (3 levels)
│       ├── microsoft-graph/         # MS Graph email + Teams adaptive cards
│       └── m365-sync/               # Azure AD user sync
│
├── frontend/                         # React SPA
│   └── src/
│       ├── App.tsx                   # Route definitions (lazy-loaded)
│       ├── components/
│       │   ├── layout/              # Layout, Navbar, MobileNav, Sidebar
│       │   ├── ui/                  # shadcn/ui primitives (Button, Dialog, Card, etc.)
│       │   ├── TimelineView/        # Badge wallet — timeline cards
│       │   ├── BadgeDetailModal/    # Badge detail — hero, tabs, expiration, share
│       │   ├── BadgeShareModal/     # Share via email, Teams, LinkedIn, embed
│       │   ├── BulkIssuance/        # CSV upload, preview, confirmation
│       │   ├── search/              # Search bar, filters, date picker
│       │   ├── admin/               # Admin components (revoke modal, etc.)
│       │   ├── analytics/           # Charts and analytics widgets
│       │   ├── common/              # BadgeImage, CelebrationModal, ErrorDisplay
│       │   └── ProtectedRoute.tsx   # Auth + role guard wrapper
│       ├── pages/                   # Top-level route pages
│       │   ├── dashboard/           # DashboardPage (role-adaptive)
│       │   ├── admin/               # Badge/Template management pages
│       │   ├── LoginPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── VerifyBadgePage.tsx   # Public badge verification
│       │   └── ...
│       ├── hooks/                   # Custom hooks (useWallet, useDashboard, useAnalytics, etc.)
│       ├── lib/                     # API layer (apiFetch, badgesApi, templatesApi, etc.)
│       ├── stores/                  # Zustand stores (authStore, badgeDetailModal)
│       ├── types/                   # TypeScript type definitions
│       └── utils/                   # Utility functions
│
└── docs/                             # Project documentation
    ├── architecture/                 # System architecture (5,400+ lines)
    ├── planning/                     # Epics, UX spec, readiness reports
    ├── sprints/                      # Sprint 0–11 backlogs & retrospectives
    ├── decisions/                    # Architecture Decision Records (ADRs)
    ├── development/                  # Coding standards, testing guide (you are here)
    ├── security/                     # Security audit, OWASP notes
    └── setup/                        # Email, Azure infrastructure guides
```

---

## 6. Database Models (Key Entities)

The Prisma schema defines **16 models**. The core ones:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | All users (4 roles) | email, role, isActive, azureId, failedLoginAttempts, lockedUntil |
| `BadgeTemplate` | Badge definitions | name, category, skillIds[], issuanceCriteria (JSON), validityPeriod, status (DRAFT/ACTIVE/ARCHIVED) |
| `Badge` | Issued badge instances | templateId, recipientId, issuerId, status (PENDING/CLAIMED/EXPIRED/REVOKED), claimToken, assertionJson, verificationId, metadataHash |
| `EvidenceFile` | Uploaded evidence | badgeId, fileUrl, fileType, fileSize (Azure Blob) |
| `BadgeShare` | Share tracking | badgeId, channel (EMAIL/TEAMS/LINKEDIN/EMBED), metadata |
| `AuditLog` | Badge lifecycle audit trail | badgeId, action (ISSUED/CLAIMED/REVOKED/...) |
| `BulkIssuanceSession` | Bulk CSV upload sessions | templateId, status, totalRecords, successCount, failureCount |
| `MilestoneConfig` | Achievement rules | type (BADGE_COUNT/SKILL_TRACK/ANNIVERSARY), threshold, title |
| `Skill` / `SkillCategory` | Hierarchical skill taxonomy | 3-level hierarchy, name, level (BEGINNER→EXPERT) |

---

## 7. API Endpoints Overview

All endpoints are prefixed with `/api/`. Auth is **httpOnly cookie-based JWT** (global `JwtAuthGuard`). Public endpoints use `@Public()` decorator.

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login → sets httpOnly cookie |
| POST | `/auth/logout` | ✅ | Clear auth cookies |
| POST | `/auth/refresh` | ✅ | Refresh access token |
| GET | `/auth/profile` | ✅ | Get current user profile |
| PATCH | `/auth/profile` | ✅ | Update profile |
| POST | `/auth/change-password` | ✅ | Change password |
| POST | `/auth/request-reset` | Public | Request password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

### Badge Templates (`/api/badge-templates`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/badge-templates` | ✅ | List templates (paginated) |
| GET | `/badge-templates/all` | ✅ | List all templates (no pagination) |
| GET | `/badge-templates/:id` | ✅ | Get template detail |
| POST | `/badge-templates` | Admin/Issuer | Create template |
| PATCH | `/badge-templates/:id` | Admin/Issuer | Update template |
| DELETE | `/badge-templates/:id` | Admin/Issuer | Delete template |

### Badges (`/api/badges`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/badges` | Admin/Issuer | Issue badge to recipient |
| POST | `/badges/claim` | ✅ | Claim badge by token (query param) |
| POST | `/badges/:id/claim` | ✅ | Claim badge by ID |
| GET | `/badges/wallet` | ✅ | Get own badge wallet (timeline data) |
| GET | `/badges/issued` | Admin/Issuer | List badges issued by me |
| GET | `/badges/:id` | ✅ | Get badge detail |
| GET | `/badges/:id/assertion` | Public | Open Badges 2.0 JSON-LD |
| GET | `/badges/:id/download/png` | ✅ | Download baked PNG |
| GET | `/badges/:id/integrity` | ✅ | Verify badge integrity (SHA-256) |
| GET | `/badges/:id/similar` | ✅ | Get similar badge recommendations |
| PATCH | `/badges/:id/visibility` | ✅ | Toggle public/private |
| POST | `/badges/:id/revoke` | Admin/Issuer | Revoke badge |
| POST | `/badges/:id/report` | ✅ | Report badge issue |
| POST | `/badges/bulk` | Admin/Issuer | Bulk issue badges |

### Verification (`/api/verify`) — Public
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify/:verificationId` | Public | Public badge verification page data |

### Sharing (`/api/badges/share`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/badges/share/email` | ✅ | Share badge via email |
| POST | `/badges/:id/share/teams` | ✅ | Share to Teams channel |
| POST | `/badges/:id/share/linkedin` | ✅ | Record LinkedIn share |
| GET | `/badges/:id/embed` | ✅ | Get embeddable badge data |
| GET | `/badges/:id/widget` | Public | Public widget HTML |
| GET | `/badges/:id/analytics/shares` | ✅ | Share statistics |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/employee` | ✅ | Employee dashboard stats |
| GET | `/dashboard/issuer` | Issuer+ | Issuer dashboard stats |
| GET | `/dashboard/manager` | Manager+ | Manager team overview |
| GET | `/dashboard/admin` | Admin | System-wide admin stats |

### Analytics (`/api/analytics`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/system-overview` | Admin/Issuer | System metrics |
| GET | `/analytics/issuance-trends` | Admin/Issuer | Trend data |
| GET | `/analytics/top-performers` | Admin/Issuer | Leaderboard |
| GET | `/analytics/skills-distribution` | Admin/Issuer | Skills breakdown |
| GET | `/analytics/recent-activity` | Admin/Issuer | Activity feed |
| GET | `/analytics/export` | Admin/Issuer | CSV export |

### Admin (`/api/admin/*`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Admin | List users (paginated, filterable) |
| PATCH | `/admin/users/:id/role` | Admin | Change user role |
| PATCH | `/admin/users/:id/status` | Admin | Activate/deactivate user |
| POST | `/admin/m365-sync` | Admin | Trigger M365 user sync |
| GET | `/admin/m365-sync/status` | Admin | Sync status |

### Bulk Issuance (`/api/bulk-issuance`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bulk-issuance/template` | Admin/Issuer | Download CSV template |
| POST | `/bulk-issuance/upload` | Admin/Issuer | Upload CSV for validation |
| GET | `/bulk-issuance/preview/:sessionId` | Admin/Issuer | Preview parsed data |
| POST | `/bulk-issuance/confirm/:sessionId` | Admin/Issuer | Execute bulk issuance |

---

## 8. Frontend Routes

| Path | Access | Page |
|------|--------|------|
| `/login` | Public | Login page |
| `/verify/:verificationId` | Public | Badge verification (no auth) |
| `/badges/:badgeId/embed` | Public | Embeddable badge widget |
| `/claim` | Authenticated | Claim badge (via token in URL) |
| `/` | Authenticated | Role-adaptive dashboard |
| `/wallet` | Authenticated | Badge wallet (timeline view) |
| `/profile` | Authenticated | User profile settings |
| `/admin/badges` | Admin/Issuer/Manager | Badge management table |
| `/admin/badges/issue` | Admin/Issuer | Issue single badge form |
| `/admin/templates` | Admin/Issuer | Template list |
| `/admin/templates/new` | Admin/Issuer | Create template form |
| `/admin/templates/:id/edit` | Admin/Issuer | Edit template form |
| `/admin/bulk-issuance` | Admin/Issuer | Bulk CSV issuance |
| `/admin/analytics` | Admin/Issuer | Analytics dashboard (charts) |
| `/admin/users` | Admin only | User management |
| `/access-denied` | Public | 403 page |
| `*` | Public | 404 page |

All protected routes use lazy loading (code splitting) and `<ProtectedRoute requiredRoles={[...]}>`.

---

## 9. Quick Start (Local Development)

### Prerequisites
- Node.js 20.x LTS, npm 10+
- Git 2.x
- PostgreSQL 16 (or Azure PostgreSQL connection)
- Azure Storage Account (for badge images & evidence)

### Setup

```bash
# 1. Clone
git clone https://github.com/legendyz/G-Credit.git
cd G-Credit

# 2. Install Husky (pre-commit + pre-push hooks)
npm install

# 3. Backend
cd gcredit-project/backend
npm install
cp .env.example .env          # Edit with your DB + Azure credentials
npx prisma migrate dev        # Apply migrations
npx prisma db seed            # Seed dev data (5 users, 9 templates, 11 badges)
npm run start:dev             # http://localhost:3000

# 4. Frontend (new terminal)
cd gcredit-project/frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api → :3000)
```

### Seed Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@gcredit.com | password123 | ADMIN |
| issuer@gcredit.com | password123 | ISSUER |
| manager@gcredit.com | password123 | MANAGER |
| employee@gcredit.com | password123 | EMPLOYEE |
| viewer@gcredit.com | password123 | EMPLOYEE |

### Key Commands

```bash
# Backend
npm run test              # Jest unit tests
npm run test:e2e          # End-to-end tests
npm run lint              # ESLint (strict, --max-warnings=0)

# Frontend
npm run test              # Vitest (540+ tests)
npm run lint              # ESLint (strict)
npm run build             # Production build

# Database
npx prisma studio         # GUI for browsing data
npx prisma migrate dev    # Apply pending migrations
npx prisma generate       # Regenerate Prisma client after schema changes
```

---

## 10. Key Patterns & Conventions

### Backend
- **Global guards** applied in order: `JwtAuthGuard` → `RolesGuard` → `ThrottlerGuard`
- Use `@Public()` decorator to skip JWT auth on a route
- Use `@Roles('ADMIN', 'ISSUER')` decorator for role restrictions
- Services return DTOs; controllers handle HTTP concerns (status codes, headers, cookies)
- All badge status transitions are audited in `AuditLog`
- EXPIRED status is **computed dynamically** (not stored) — if `expiresAt < now` and status ≠ REVOKED

### Frontend
- **API layer:** `src/lib/apiFetch.ts` wraps `fetch()` with cookie auth, error handling, and typing
- **React Query** for all server state (hooks in `src/hooks/`)
- **Zustand** for client state (`authStore` for current user, `badgeDetailModal` for modal state)
- **Component structure:** Pages → Layout wrapper → Feature components → shadcn/ui primitives
- **Status color system:** CLAIMED=green, PENDING=amber, EXPIRED=gray, REVOKED=red (consistent across all components)

### Testing
- Backend: Jest with `@nestjs/testing`, mock Prisma service
- Frontend: Vitest + Testing Library + MSW (Mock Service Worker) for API mocking
- Total test count: **1,263** (722 backend + 541 frontend), 100% pass rate
- Pre-push hook runs full lint + type-check + tests for both FE and BE

### Git Workflow
- Branch per sprint: `sprint-N/<feature-name>`
- Pre-commit: ESLint + Prettier on staged files, Chinese character detection
- Pre-push: Full CI pipeline mirror (lint + type-check + test + build)
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

---

## 11. Where to Go Deeper

| Topic | Document | Lines |
|-------|----------|-------|
| Full system architecture | [docs/architecture/system-architecture.md](../architecture/system-architecture.md) | 5,400+ |
| UX design specification (22 screens) | [docs/planning/ux-design-specification.md](../planning/ux-design-specification.md) | 3,300+ |
| Epics & user stories (14 epics, 85 stories) | [docs/planning/epics.md](../planning/epics.md) | 2,500+ |
| Coding standards | [docs/development/coding-standards.md](../development/coding-standards.md) | — |
| Testing guide | [docs/development/testing-guide.md](../development/testing-guide.md) | — |
| Backend code structure | [docs/development/backend-code-structure-guide.md](../development/backend-code-structure-guide.md) | — |
| Security audit & notes | [docs/security/security-audit-2026-02.md](../security/security-audit-2026-02.md) | — |
| Architecture decisions (ADRs) | [docs/decisions/](../decisions/) | — |
| Sprint history (0–11) | [docs/sprints/README.md](../sprints/README.md) | — |
| v1.0.0 release notes | [docs/sprints/sprint-10/v1.0.0-release-notes.md](../sprints/sprint-10/v1.0.0-release-notes.md) | — |
| Project single source of truth | [project-context.md](../../project-context.md) | 1,500+ |

---

## 12. Quick Reference Card

```
Frontend:  http://localhost:5173    (React 19, Vite, Tailwind, shadcn/ui)
Backend:   http://localhost:3000    (NestJS 11, Prisma 6, PostgreSQL 16)
API Proxy: /api/* → localhost:3000  (Vite dev server proxy)
Health:    GET /health              (liveness)
Ready:     GET /ready               (DB + storage check)
DB GUI:    npx prisma studio        (browse data visually)
Tests:     1,263 total              (722 BE + 541 FE, 100% pass)
Auth:      httpOnly cookies         (not localStorage)
Roles:     ADMIN > ISSUER > MANAGER > EMPLOYEE
Statuses:  PENDING → CLAIMED → EXPIRED | REVOKED
```
