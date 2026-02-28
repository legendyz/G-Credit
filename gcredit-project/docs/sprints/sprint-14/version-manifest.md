# Sprint 14 — Version Manifest

**Sprint:** Sprint 14  
**Target Version:** v1.4.0  
**Generated:** 2026-02-27  
**Previous Sprint:** Sprint 13 (v1.3.0)

---

## Infrastructure & Tools

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | v20.20.0 | LTS |
| **npm** | 10.8.2 | |
| **PostgreSQL** | 16 | Azure Flexible Server |
| **Git** | (system) | |

---

## Backend Stack (v1.3.0 → v1.4.0)

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| **@nestjs/common** | ^11.0.1 | |
| **@nestjs/core** | ^11.0.1 | |
| **@nestjs/platform-express** | ^11.1.12 | |
| **@nestjs/cli** | ^11.0.0 | Dev |
| **@nestjs/config** | ^4.0.2 | |
| **@nestjs/swagger** | ^11.2.5 | |
| **@nestjs/testing** | ^11.1.12 | Dev |
| **typescript** | ^5.7.3 | |
| **rxjs** | ^7.8.1 | |
| **reflect-metadata** | ^0.2.2 | |

### Database & ORM
| Package | Version | Notes |
|---------|---------|-------|
| **prisma** | ^6.19.2 | ⚠️ **Version locked** — Prisma 7 has breaking changes |
| **@prisma/client** | ^6.19.2 | ⚠️ **Version locked** |

### Authentication & Security
| Package | Version | Notes |
|---------|---------|-------|
| **@nestjs/jwt** | ^11.0.2 | JWT generation/validation |
| **@nestjs/passport** | ^11.0.5 | Passport integration |
| **passport** | ^0.7.0 | |
| **passport-jwt** | ^4.0.1 | JWT strategy |
| **bcrypt** | ^6.0.0 | Password hashing |
| **cookie-parser** | ^1.4.7 | Session cookies |
| **helmet** | ^8.1.0 | Security headers |
| **@nestjs/throttler** | ^6.5.0 | Rate limiting |
| **sanitize-html** | ^2.17.0 | XSS prevention |

### Azure & Microsoft
| Package | Version | Notes |
|---------|---------|-------|
| **@azure/storage-blob** | ^12.30.0 | Blob storage |
| **@azure/identity** | ^4.13.0 | Azure auth |
| **@azure/msal-node** | ^5.0.5 | MSAL for SSO |
| **@microsoft/microsoft-graph-client** | ^3.0.7 | Graph API |
| **adaptivecards** | ^3.0.5 | Teams cards |

### Utilities
| Package | Version | Notes |
|---------|---------|-------|
| **class-validator** | ^0.14.1 | DTO validation |
| **class-transformer** | ^0.5.1 | DTO transformation |
| **csv-parse** | ^6.1.0 | CSV bulk import |
| **handlebars** | ^4.7.8 | Email templates |
| **sharp** | ^0.33.0 | Image processing |
| **uuid** | ^13.0.0 | |
| **cache-manager** | ^6.0.0 | |

### Testing & Linting
| Package | Version | Notes |
|---------|---------|-------|
| **jest** | ^30.0.0 | |
| **ts-jest** | ^29.2.5 | |
| **supertest** | ^7.2.2 | E2E |
| **eslint** | ^9.18.0 | |
| **prettier** | ^3.4.2 | |
| **typescript-eslint** | ^8.20.0 | |

---

## Frontend Stack (v1.3.0 → v1.4.0)

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| **react** | ^19.2.0 | React 19 |
| **react-dom** | ^19.2.0 | |
| **typescript** | ~5.9.3 | |
| **vite** | ^7.2.4 | Build tool |
| **@vitejs/plugin-react** | ^5.1.1 | |

### UI Framework
| Package | Version | Notes |
|---------|---------|-------|
| **tailwindcss** | ^4.1.18 | Tailwind v4 |
| **@tailwindcss/postcss** | ^4.1.18 | |
| **postcss** | ^8.5.6 | |
| **tailwindcss-animate** | ^1.0.7 | |
| **tailwind-merge** | ^3.4.0 | |
| **class-variance-authority** | ^0.7.1 | shadcn/ui |
| **clsx** | ^2.1.1 | |
| **lucide-react** | ^0.563.0 | Icons |

### Radix UI (shadcn/ui primitives)
| Package | Version | Notes |
|---------|---------|-------|
| **@radix-ui/react-dialog** | ^1.1.15 | |
| **@radix-ui/react-label** | ^2.1.8 | |
| **@radix-ui/react-select** | ^2.2.6 | |
| **@radix-ui/react-slot** | ^1.2.4 | |
| **@radix-ui/react-switch** | ^1.2.6 | |

### State & Routing
| Package | Version | Notes |
|---------|---------|-------|
| **zustand** | ^5.0.10 | Client state |
| **@tanstack/react-query** | ^5.90.20 | Server state |
| **react-router-dom** | ^6.30.3 | Routing |

### Utilities
| Package | Version | Notes |
|---------|---------|-------|
| **date-fns** | ^4.1.0 | Date formatting |
| **recharts** | ^3.7.0 | Charts |
| **sonner** | ^2.0.7 | Toast notifications |

### Drag & Drop
| Package | Version | Notes |
|---------|---------|-------|
| **@dnd-kit/core** | ^6.3.1 | |
| **@dnd-kit/sortable** | ^10.0.0 | |
| **@dnd-kit/utilities** | ^3.2.2 | |

### Testing & Linting
| Package | Version | Notes |
|---------|---------|-------|
| **vitest** | ^4.0.18 | |
| **@vitest/coverage-v8** | ^4.0.18 | |
| **jsdom** | ^27.4.0 | |
| **@testing-library/react** | ^16.3.2 | |
| **@testing-library/jest-dom** | ^6.9.1 | |
| **@testing-library/user-event** | ^14.6.1 | |
| **@axe-core/react** | ^4.11.0 | Accessibility |
| **eslint** | ^9.39.1 | |
| **prettier** | ^3.8.1 | |

### Accessibility
| Package | Version | Notes |
|---------|---------|-------|
| **axe-core** | ^4.11.1 | A11y testing |
| **eslint-plugin-jsx-a11y** | ^6.10.2 | A11y lint rules |

---

## New Dependencies for Sprint 14

**None** — Sprint 14 is a pure refactoring sprint. No new packages required.

---

## Version Lock Notes

| Package | Locked Version | Reason |
|---------|---------------|--------|
| **prisma** | 6.19.2 | Prisma 7 has breaking changes (Lesson 1) |
| **@prisma/client** | 6.19.2 | Must match prisma version |

---

## Sprint 14 Specific Notes

- **Prisma Migration:** Story 14.2 modifies `UserRole` enum — do NOT run `npx prisma format` (Lesson 22)
- **No `npm install` needed:** All dependencies already present
- **Target version bump:** `1.3.0` → `1.4.0` (at sprint closeout)
