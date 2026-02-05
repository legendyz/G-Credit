# Sprint 9 - Version Manifest

**Generated:** 2026-02-05  
**Sprint:** Sprint 9 (2026-02-06 to 2026-02-20)  
**Project Version (Baseline):** v0.8.0 (Sprint 8 ending version)  
**Target Version:** v0.9.0 (Sprint 9 completion)

---

## 🎯 Version Management Strategy

### Version Numbering
- **Format:** Semantic Versioning (SemVer) - `MAJOR.MINOR.PATCH`
- **Sprint 9:** v0.9.0 (Minor version bump for Epic 8 features)
- **Rationale:** Adding bulk badge issuance is significant new functionality

### Version Consistency
All components share the same version number for unified release tracking.

---

## 📦 Backend Dependencies

### Runtime Dependencies (Production)

#### Core Framework
- **@nestjs/common:** ^11.0.1
- **@nestjs/core:** ^11.0.1
- **@nestjs/platform-express:** ^11.1.12
- **@nestjs/config:** ^4.0.2
- **@nestjs/swagger:** ^11.2.5

#### Database & ORM
- **@prisma/client:** ^6.19.2 ⚠️ **LOCKED** (see notes below)
- **prisma:** ^6.19.2 (dev)

#### Authentication & Security
- **@nestjs/jwt:** ^11.0.2
- **@nestjs/passport:** ^11.0.5
- **passport:** ^0.7.0
- **passport-jwt:** ^4.0.1
- **bcrypt:** ^6.0.0
- **helmet:** ^8.1.0

#### Microsoft Integration
- **@microsoft/microsoft-graph-client:** ^3.0.7
- **@azure/identity:** ^4.13.0
- **@azure/communication-email:** ^1.1.0
- **@azure/storage-blob:** ^12.30.0

#### Utilities
- **class-validator:** ^0.14.1
- **class-transformer:** ^0.5.1
- **uuid:** ^13.0.0
- **csv-parse:** ^6.1.0
- **handlebars:** ^4.7.8
- **sharp:** ^0.33.0

#### Caching & Throttling
- **@nestjs/cache-manager:** ^3.1.0
- **cache-manager:** ^6.0.0
- **keyv:** ^5.0.0
- **@nestjs/throttler:** ^6.5.0

#### Legacy Email (TO BE REMOVED in Sprint 9)
- **nodemailer:** ^7.0.12 ❌ **DEPRECATED**
- **@types/nodemailer:** ^7.0.5 ❌ **DEPRECATED**

### Dev Dependencies
- **typescript:** ^5.7.3
- **typescript-eslint:** ^8.20.0
- **eslint:** ^9.18.0
- **prettier:** ^3.4.2
- **jest:** ^30.0.0
- **ts-jest:** ^29.2.5
- **@nestjs/testing:** ^11.1.12

---

## 🎨 Frontend Dependencies

### Runtime Dependencies (Production)

#### Core Framework
- **react:** ^19.2.0
- **react-dom:** ^19.2.0
- **react-router-dom:** ^6.30.3

#### State Management & Data Fetching
- **zustand:** ^5.0.10
- **@tanstack/react-query:** ^5.90.20
- **axios:** ^1.13.4

#### UI Components & Styling
- **@radix-ui/react-dialog:** ^1.1.15
- **@radix-ui/react-label:** ^2.1.8
- **@radix-ui/react-select:** ^2.2.6
- **@radix-ui/react-slot:** ^1.2.4
- **lucide-react:** ^0.563.0
- **framer-motion:** ^12.29.2
- **sonner:** ^2.0.7 (toast notifications)

#### Styling Utilities
- **tailwind-merge:** ^3.4.0
- **tailwindcss-animate:** ^1.0.7
- **class-variance-authority:** ^0.7.1
- **clsx:** ^2.1.1

#### Utilities
- **date-fns:** ^4.1.0

### Dev Dependencies
- **vite:** ^7.2.4
- **typescript:** ~5.9.3
- **tailwindcss:** ^4.1.18
- **vitest:** ^4.0.18
- **@vitejs/plugin-react:** ^5.1.1
- **@testing-library/react:** ^16.3.2
- **@testing-library/jest-dom:** ^6.9.1
- **eslint:** ^9.39.1
- **prettier:** ^3.8.1

---

## 🛠 Infrastructure & Tools

### Node.js
- **Version:** v20.18.3 LTS (Recommended)
- **Minimum:** v20.0.0
- **Reason:** NestJS 11 requires Node 20+

### Package Manager
- **npm:** 10.x or higher (included with Node 20)
- **Alternative:** pnpm or yarn supported

### Database
- **PostgreSQL:** 16.6
- **Connection:** Azure Database for PostgreSQL - Flexible Server
- **Prisma ORM:** 6.19.2

### Azure Services
- **Azure AD B2C:** Identity provider
- **Azure Communication Services:** Email delivery
- **Azure Blob Storage:** Badge image storage
- **Azure Redis Cache:** Caching layer

### Development Tools
- **VS Code:** Latest stable
- **Git:** 2.40+ recommended
- **Docker:** Optional (for local PostgreSQL)

---

## ⚙️ Build Tools & Configuration

### Backend Build
- **TypeScript Compiler:** 5.7.3
- **NestJS CLI:** ^11.0.0
- **Build Target:** ES2022
- **Module System:** CommonJS

### Frontend Build
- **Vite:** 7.2.4
- **TypeScript Compiler:** 5.9.3
- **Build Target:** ES2020
- **Module System:** ES Modules

### Linting & Formatting
- **ESLint:** 9.x (Flat Config format)
- **Prettier:** 3.x
- **TypeScript ESLint:** 8.x

---

## 📋 Version Notes & Special Considerations

### Critical Version Locks

#### ⚠️ Prisma 6.19.2 - DO NOT UPGRADE
**Reason:** Prisma 6.19.2 is the last version that works with our specific Azure PostgreSQL SSL configuration.  
**Issue:** Versions 6.20.0+ break SSL certificate validation for Azure Flexible Server.  
**Action:** Keep locked at 6.19.2 until Azure SSL compatibility is confirmed in future Prisma releases.  
**Tracking:** TD-019 (future sprint)

**Evidence:**
- Sprint 6: Upgrade to 6.20.1 caused connection failures
- Sprint 7: Rollback to 6.19.2 resolved issues
- Azure support ticket #123456 (pending resolution)

### Deprecated Dependencies

#### ❌ nodemailer (Removal in Sprint 9)
**Status:** Marked for removal in Sprint 9 (TD-014)  
**Replacement:** GraphEmailService (Microsoft Graph API)  
**Impact:** All email sending migrated to Graph API  
**Versions:**
- Current: nodemailer ^7.0.12
- Target: Fully removed

### Upcoming Upgrades (Sprint 10+)

#### React Router 7.0.0
**Status:** Available but deferred  
**Current:** 6.30.3  
**Future:** React Router 7 (data loading improvements)  
**Rationale:** Stable on v6, defer to Sprint 10 to avoid risk

#### Vite 8.0.0
**Status:** Beta  
**Current:** 7.2.4  
**Future:** Vite 8 (ESM improvements)  
**Rationale:** Wait for stable release

---

## 🔄 Dependency Update Strategy

### Update Cadence
- **Minor Updates:** Every sprint (low risk)
- **Major Updates:** Every 2-3 sprints (with testing sprint)
- **Security Updates:** Immediate (via `npm audit fix`)

### Version Review Process
1. **Before Sprint Planning:** Check for available updates
2. **During Planning:** Assess update impact (breaking changes?)
3. **During Sprint:** Update non-critical dependencies
4. **Before Release:** Run full regression test suite

### Security Monitoring
- **npm audit:** Run weekly
- **Dependabot:** Enabled for GitHub repo (auto-PR for security updates)
- **Manual Review:** Critical vulnerabilities addressed within 48 hours

---

## 🧪 Testing Version Compatibility

### Test Suite Versions
- **Backend:** jest ^30.0.0, supertest ^7.2.2
- **Frontend:** vitest ^4.0.18, @testing-library/react ^16.3.2
- **E2E:** Playwright (separate e2e-tests directory)

### Test Coverage Targets
- **Backend Unit:** >80% (current: 85%)
- **Frontend Component:** >75% (current: 78%)
- **E2E:** >90% critical paths (current: 92%)

### Version-Specific Test Notes
- **React 19.2.0:** Concurrent rendering enabled; all tests passing
- **NestJS 11.1.12:** Controller tests updated for new testing module API
- **Vitest 4.0.18:** Coverage reports compatible with CI/CD

---

## 📊 Version History (Sprint Context)

### Sprint 8 (Completed 2026-02-05)
- **Version:** v0.8.0
- **Key Changes:**
  - Upgraded React 18 → 19
  - Upgraded NestJS 10 → 11
  - Prisma locked at 6.19.2
  - Badge Wallet UI stabilized

### Sprint 9 (Current, 2026-02-06 to 2026-02-20)
- **Target Version:** v0.9.0
- **Key Changes:**
  - Epic 8: Bulk Badge Issuance (CSV upload, validation, batch processing)
  - Remove nodemailer (TD-014)
  - Fix 600 ESLint warnings (TD-015)
  - Bundle size optimization (TD-013)
  - No major dependency upgrades (stability focus)

### Sprint 10 (Planned, 2026-02-21 onwards)
- **Target Version:** v0.10.0
- **Planned Changes:**
  - Consider React Router 7 upgrade
  - Address remaining ESLint warnings
  - Evaluate Prisma upgrade path

---

## 📝 Version Manifest Usage

### For Developers
- **Before Starting Story:** Check dependency versions match this manifest
- **Adding New Dependency:** Document version choice and rationale
- **Encountering Version Mismatch:** Run  `npm install` to sync with package-lock.json

### For DevOps
- **Deployment:** Verify Node.js version on target environment
- **Docker Images:** Use `node:20.18.3-alpine` as base image
- **CI/CD:** Lock pipeline to use Node 20.18.3 for consistency

### For Sprint Planning
- **Review Dependencies:** Check for security updates before sprint start
- **Plan Upgrades:** Schedule dependency upgrades based on risk assessment
- **Track Debt:** Version management technical debt tracked in TD backlog

---

## ✅ Version Verification Checklist

### Pre-Sprint Kickoff
- [ ] All developers have Node 20.18.3 installed
- [ ] Backend `npm install` runs without errors
- [ ] Frontend `npm install` runs without errors
- [ ] Backend tests pass (349 unit + 199 E2E)
- [ ] Frontend tests pass (328 component)
- [ ] No `npm audit` high/critical vulnerabilities
- [ ] Prisma schema synced with database

### During Sprint
- [ ] No unplanned dependency upgrades without team discussion
- [ ] New dependencies documented in this manifest
- [ ] Version conflicts resolved via package-lock.json
- [ ] CI/CD builds green with locked versions

### Pre-Release
- [ ] Final `npm audit` check
- [ ] All tests passing with production builds
- [ ] Bundle size within limits (<400KB frontend)
- [ ] No experimental/beta dependencies in production

---

## 📚 References

- **Package Management:** `backend/package.json`, `frontend/package.json`
- **Lock Files:** `backend/package-lock.json`, `frontend/package-lock.json`
- **Prisma Schema:** `backend/prisma/schema.prisma`
- **Infrastructure Inventory:** `gcredit-project/docs/planning/infrastructure-inventory.md`
- **Technical Debt:** `gcredit-project/docs/sprints/technical-debt-from-reviews.md`

---

**Maintained by:** Scrum Master / Tech Lead  
**Review Frequency:** Start of every sprint  
**Last Updated:** Sprint 9 Planning (2026-02-05)
