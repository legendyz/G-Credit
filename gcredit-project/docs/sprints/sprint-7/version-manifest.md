# Sprint 7 - Version Manifest

**Sprint:** Sprint 7 - Badge Revocation & Complete Lifecycle UAT  
**Date Created:** January 31, 2026  
**Purpose:** Snapshot of all dependency versions at Sprint 7 start

---

## 📦 Backend Dependencies (NestJS)

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| `@nestjs/common` | ^11.0.1 | Core NestJS package |
| `@nestjs/core` | ^11.0.1 | Core NestJS package |
| `@nestjs/platform-express` | ^11.1.12 | HTTP platform |
| `@nestjs/config` | ^4.0.2 | Configuration module |
| `@nestjs/jwt` | ^11.0.2 | JWT authentication |
| `@nestjs/passport` | ^11.0.5 | Passport integration |
| `@nestjs/swagger` | ^11.2.5 | API documentation |

### Database & ORM
| Package | Version | Notes |
|---------|---------|-------|
| `@prisma/client` | ^6.19.2 | **🔒 Version locked** - Prisma 7 has breaking changes |
| `prisma` (dev) | ^6.19.2 | **🔒 Version locked** |

**⚠️ Critical Note:** Prisma locked at 6.19.2 due to Prisma 7.x breaking changes:
- Requires `prisma.config.ts` file
- Schema syntax changes
- Migration incompatibilities
- **Do NOT upgrade without full testing**

### Authentication & Security
| Package | Version | Notes |
|---------|---------|-------|
| `bcrypt` | ^5.1.1 | Password hashing |
| `passport` | ^0.7.0 | Authentication middleware |
| `passport-jwt` | ^4.0.1 | JWT strategy |

### Azure Services (Sprint 0 + Sprint 6)
| Package | Version | Notes |
|---------|---------|-------|
| `@azure/storage-blob` | ^12.30.0 | Azure Blob Storage (Sprint 0) |
| `@azure/identity` | ^4.13.0 | Azure AD authentication (Sprint 6) |
| `@azure/communication-email` | ^1.1.0 | Email service (Sprint 6) |
| `@microsoft/microsoft-graph-client` | ^3.0.7 | Microsoft Graph API (Sprint 6) |

### Utilities
| Package | Version | Notes |
|---------|---------|-------|
| `class-validator` | ^0.14.1 | DTO validation |
| `class-transformer` | ^0.5.1 | Object transformation |
| `csv-parse` | ^6.1.0 | CSV parsing for bulk operations |
| `handlebars` | ^4.7.8 | Email template engine (Sprint 6) |
| `nodemailer` | ^7.0.12 | Email sending (Sprint 6) |
| `adaptivecards` | ^3.0.5 | Teams Adaptive Cards (Sprint 6) |
| `reflect-metadata` | ^0.2.2 | Metadata reflection |
| `rxjs` | ^7.8.1 | Reactive programming |

### Development Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| `@nestjs/cli` | ^11.0.16 | NestJS CLI tool |
| `@nestjs/schematics` | ^11.0.4 | Code generators |
| `@nestjs/testing` | ^11.0.1 | Testing utilities |
| `typescript` | ~5.9.3 | TypeScript compiler |
| `ts-node` | ^10.9.1 | TypeScript execution |
| `ts-loader` | ^9.4.3 | TypeScript loader |
| `tsconfig-paths` | ^4.2.0 | Path mapping |
| `jest` | ^29.6.1 | Testing framework |
| `@types/jest` | ^29.5.2 | Jest TypeScript types |
| `@types/node` | ^24.9.5 | Node.js TypeScript types |
| `@types/bcrypt` | ^5.0.2 | bcrypt types |
| `@types/passport-jwt` | ^4.1.0 | Passport JWT types |
| `eslint` | ^9.39.1 | Code linting |
| `prettier` | ^3.8.1 | Code formatting |

---

## 🎨 Frontend Dependencies (React)

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| `react` | ^19.2.0 | **React 19** - Latest version |
| `react-dom` | ^19.2.0 | React DOM rendering |
| `react-router-dom` | ^6.30.3 | Client-side routing |

### Build Tools
| Package | Version | Notes |
|---------|---------|-------|
| `vite` | ^7.2.4 | **Vite 7** - Build tool |
| `@vitejs/plugin-react` | ^5.1.1 | Vite React plugin |
| `typescript` | ~5.9.3 | TypeScript compiler |

### UI Framework & Components
| Package | Version | Notes |
|---------|---------|-------|
| `tailwindcss` | ^4.1.18 | **Tailwind CSS 4** - Utility-first CSS |
| `@tailwindcss/postcss` | ^4.1.18 | PostCSS plugin |
| `postcss` | ^8.5.6 | CSS processor |
| `autoprefixer` | ^10.4.23 | CSS autoprefixer |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `@radix-ui/react-slot` | ^1.2.4 | Radix UI primitives |
| `lucide-react` | ^0.563.0 | Icon library |
| `framer-motion` | ^12.29.2 | Animation library |

### State Management
| Package | Version | Notes |
|---------|---------|-------|
| `zustand` | ^5.0.10 | Client-side state |
| `@tanstack/react-query` | ^5.90.20 | Server state management |

### Utilities
| Package | Version | Notes |
|---------|---------|-------|
| `axios` | ^1.13.4 | HTTP client |
| `date-fns` | ^4.1.0 | Date utilities |
| `clsx` | ^2.1.1 | className utility |
| `tailwind-merge` | ^3.4.0 | Tailwind class merging |
| `class-variance-authority` | ^0.7.1 | Variant styling |

### Development Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| `@types/react` | ^19.2.5 | React TypeScript types |
| `@types/react-dom` | ^19.2.3 | React DOM types |
| `@types/node` | ^24.10.1 | Node.js types |
| `eslint` | ^9.39.1 | Code linting |
| `@eslint/js` | ^9.39.1 | ESLint JavaScript config |
| `typescript-eslint` | ^8.46.4 | TypeScript ESLint |
| `eslint-plugin-react-hooks` | ^7.0.1 | React Hooks linting |
| `eslint-plugin-react-refresh` | ^0.4.24 | React Refresh support |
| `eslint-config-prettier` | ^10.1.8 | Prettier integration |
| `eslint-plugin-prettier` | ^5.5.5 | Prettier as ESLint rule |
| `prettier` | ^3.8.1 | Code formatting |
| `globals` | ^16.5.0 | Global variables |

---

## 🗄️ Database

| Component | Version | Notes |
|-----------|---------|-------|
| **PostgreSQL** | 16 | Azure Database for PostgreSQL Flexible Server |
| **Prisma Schema** | Latest | Managed by Prisma migrations |

---

## ☁️ Infrastructure (Azure)

| Service | Configuration | Created In |
|---------|---------------|------------|
| **PostgreSQL Flexible Server** | B1ms tier, 32GB storage | Sprint 0 |
| **Blob Storage Account** | Standard LRS, 2 containers | Sprint 0 |
| **Container: badges** | Public read access | Sprint 0 |
| **Container: evidence** | Private, SAS token access | Sprint 4 |
| **Communication Services** | Email sending | Sprint 6 |
| **Microsoft Graph API** | OAuth 2.0 Client Credentials | Sprint 6 |

---

## 🔧 Runtime Environment

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | 20.20.0 LTS | Required minimum |
| **npm** | 10+ | Comes with Node.js |
| **Git** | 2.x | Version control |

---

## 📝 Sprint 7 Specific Notes

### No New Dependencies
✅ **Sprint 7 does not require any new npm packages**

All revocation functionality can be implemented with existing dependencies:
- Database schema changes only (Prisma migrations)
- UI components reuse existing React/Tailwind setup
- Email notifications reuse existing templates (Sprint 6)

### Sprint 7 Changes
- **Database Schema:** Adding 4 new fields to Badge model (revocationReason, revocationNotes, revokedAt, revokedBy)
- **No npm installs required**
- **No Azure resource changes**

---

## ⚠️ Known Issues

### Security Vulnerabilities
| Package | Issue | Severity | Status | Sprint |
|---------|-------|----------|--------|--------|
| `lodash` (transitive) | Prototype Pollution (CVE-2019-10744) | **Moderate** | **ACCEPTED** | Sprint 1 |

**Decision (ADR-002):** Risk accepted for MVP development (Sprint 1-7)
- **Reason:** Development environment only, no external exposure
- **CVSS Score:** 6.5 (Medium)
- **Re-evaluate:** Before production deployment (Sprint 8+)
- **Reference:** [ADR-002](../../decisions/002-lodash-security-risk-acceptance.md)

---

## 🔒 Version Lock Rationale

### Prisma 6.19.2 Lock
**Locked Since:** Sprint 0  
**Reason:** Prisma 7.x introduces breaking changes:
- Requires new `prisma.config.ts` file
- Changes to schema syntax
- Migration tool incompatibilities
- Team decided to defer upgrade to post-MVP

**Upgrade Path:** Sprint 8+ after MVP pilot completion

---

## 📋 Verification Commands

### Check Backend Versions
```bash
cd gcredit-project/backend
node -p "require('./package.json').version"
npm list @nestjs/core @prisma/client
```

### Check Frontend Versions
```bash
cd gcredit-project/frontend
node -p "require('./package.json').version"
npm list react vite typescript
```

### Check Node.js Version
```bash
node --version  # Should be 20.20.0 or higher
npm --version   # Should be 10+
```

### Check Database Version
```bash
# Connect to PostgreSQL and run:
SELECT version();
# Should show PostgreSQL 16.x
```

---

## 🔄 Update History

| Date | Sprint | Changes | Updated By |
|------|--------|---------|------------|
| 2026-01-31 | Sprint 7 | Initial version manifest creation | Bob (Scrum Master) |

---

## 📚 References

- [Sprint 0 Version Manifest](../sprint-0/version-manifest.md) - Initial setup
- [Sprint 6 Completion Report](../sprint-6/sprint-6-completion-report.md) - Previous sprint versions
- [Infrastructure Inventory](../../setup/infrastructure-inventory.md) - Azure resources
- [ADR-002](../../decisions/002-lodash-security-risk-acceptance.md) - Security risk acceptance

---

**Document Owner:** Scrum Master (Bob)  
**Last Updated:** January 31, 2026  
**Next Review:** Sprint 8 Planning
