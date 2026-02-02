# Sprint 8 Version Manifest

**Sprint:** Sprint 8 - Production-Ready MVP  
**Created:** 2026-02-02  
**Purpose:** Lock dependency versions to prevent version drift (Lesson 1: Sprint 0)  
**Status:** Sprint 8 Planning

---

## 🎯 Core Runt时间 & Language

| Dependency | Version | Notes |
|------------|---------|-------|
| **Node.js** | 20.20.0 LTS | Locked for project lifetime |
| **npm** | 10.8.2+ | Comes with Node.js |
| **TypeScript** | 5.9.3 | Strict mode enabled |

---

## 🎨 Frontend Stack (React + Vite)

### Core Framework
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **react** | 19.2.3 | Sprint 0 | Concurrent features enabled |
| **react-dom** | 19.2.3 | Sprint 0 | Must match react version |
| **vite** | 7.3.1 | Sprint 0 | Build tool + dev server |

### UI Framework & Components
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **tailwindcss** | 4.1.18 | Sprint 0 | Utility-first CSS |
| **@tailwindcss/postcss** | 4.1.18 | Sprint 0 | PostCSS integration |
| **@radix-ui/react-dialog** | 1.1.15 | Sprint 4 | Modal components |
| **@radix-ui/react-label** | 2.1.8 | Sprint 4 | Form labels |
| **@radix-ui/react-select** | 2.2.6 | Sprint 4 | Select dropdowns |
| **@radix-ui/react-slot** | 1.2.4 | Sprint 4 | Composition utility |
| **lucide-react** | 0.563.0 | Sprint 4 | Icon library |
| **sonner** | 1.7.2 | Sprint 7 | Toast notifications (UX-P0-002) |

### State Management & Data Fetching
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@tanstack/react-query** | 5.90.20 | Sprint 4 | Server state management |
| **zustand** | 5.2.0 | Sprint 7 | Client state (auth store) |
| **axios** | 1.8.2 | Sprint 1 | HTTP client |

### Form Handling & Validation
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **react-hook-form** | 7.54.2 | Sprint 2 | Form management |
| **zod** | 3.24.1 | Sprint 2 | Schema validation |

### Routing
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **react-router** | TBD | Sprint 8 | Client-side routing |
| **react-router-dom** | TBD | Sprint 8 | DOM bindings |

### Testing
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **vitest** | 4.0.18 | Sprint 4 | Unit test runner (Vite-native) |
| **@testing-library/react** | 16.3.2 | Sprint 4 | React component testing |
| **@vitest/coverage-v8** | 4.0.18 | Sprint 4 | Code coverage |
| **jsdom** | 25.3.0 | Sprint 4 | DOM simulation |

### Accessibility
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@axe-core/react** | 4.11.0 | Sprint 8 | Accessibility testing (Story 8.3) |

---

## 🚀 Backend Stack (NestJS + Prisma)

### Core Framework
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@nestjs/core** | 11.1.12 | Sprint 0 | NestJS core |
| **@nestjs/common** | 11.1.12 | Sprint 0 | Common utilities |
| **@nestjs/platform-express** | 11.1.12 | Sprint 0 | Express platform |
| **@nestjs/cli** | 11.0.16 | Sprint 0 | CLI tools |
| **@nestjs/schematics** | 11.0.9 | Sprint 0 | Code generation |

### Database & ORM
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **prisma** | 6.19.2 🔒 | Sprint 0 | **VERSION LOCKED** (Prisma 7 has breaking changes) |
| **@prisma/client** | 6.19.2 🔒 | Sprint 0 | Must match prisma version |

> ⚠️ **CRITICAL:** Prisma 6.19.2 is intentionally locked. Do NOT upgrade to Prisma 7+ without ADR approval.  
> Reason: Prisma 7 requires `prisma.config.ts` and has breaking schema syntax changes.

### Authentication & Security
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@nestjs/jwt** | 11.0.2 | Sprint 1 | JWT token management |
| **@nestjs/passport** | 11.0.5 | Sprint 1 | Passport integration |
| **passport** | 0.7.0 | Sprint 1 | Authentication middleware |
| **passport-jwt** | 4.0.1 | Sprint 1 | JWT strategy |
| **passport-local** | 1.0.0 | Sprint 1 | Local strategy |
| **bcrypt** | 5.1.1 → **6.0.0** | Sprint 1 → **Sprint 8** | ✅ **UPGRADED** (SEC-P1-005 - tar vulnerability fixed) |
| **helmet** | **8.1.0** | **Sprint 8** | **NEW** Security headers (Task 8.6) - ⚠️ Use helmet directly, @nestjs/helmet@1.1.0 does not exist |
| **@nestjs/throttler** | **6.5.0** | **Sprint 8** | **NEW** Rate limiting (Task 8.6) - v5 not compatible with NestJS 11 |
| **@nestjs/cache-manager** | **3.1.0** | **Sprint 8** | **NEW** Caching (Story 8.4) - v2 not compatible with NestJS 11 |

### API Documentation
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@nestjs/swagger** | 11.2.5 | Sprint 1 | OpenAPI/Swagger docs |
| **swagger-ui-express** | 5.0.1 | Sprint 1 | Swagger UI |

### Configuration & Validation
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@nestjs/config** | 4.0.2 | Sprint 0 | Environment configuration |
| **class-validator** | 0.14.2 | Sprint 1 | DTO validation |
| **class-transformer** | 0.5.1 | Sprint 1 | Object transformation |

### Azure Integration
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@azure/storage-blob** | 12.27.0 | Sprint 2 | Azure Blob Storage |
| **@azure/identity** | 4.13.0 | Sprint 6 | Azure OAuth |
| **@microsoft/microsoft-graph-client** | 3.0.7 | Sprint 6 | Microsoft Graph API |

### Utilities
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **sharp** | 0.33.5 | Sprint 5 | Image processing (baked badges) |
| **date-fns** | 4.2.1 | Sprint 3 | Date utilities |
| **uuid** | 10.0.0 | Sprint 3 | UUID generation |

### Testing
| Dependency | Version | Sprint Added | Notes |
|------------|---------|--------------|-------|
| **@nestjs/testing** | 11.1.12 | Sprint 0 | NestJS testing utilities |
| **jest** | 29.7.0 | Sprint 0 | Test runner |
| **@types/jest** | 29.5.14 | Sprint 0 | Jest TypeScript types |
| **supertest** | 7.0.0 | Sprint 1 | HTTP assertions (E2E) |
| **@types/supertest** | 6.0.3 | Sprint 1 | Supertest TypeScript types |

---

## 🌐 Infrastructure & Tools

### Azure Services
| Service | Configuration | Sprint Added | Notes |
|---------|---------------|--------------|-------|
| **Azure Database for PostgreSQL** | Flexible Server, B1ms | Sprint 0 | gcredit-dev-db-lz |
| **Azure Blob Storage** | General Purpose v2, LRS | Sprint 0 | gcreditdevstoragelz |
| **Microsoft Graph API** | OAuth 2.0 Client Credentials | Sprint 6 | Email + Teams integration |

### Development Tools
| Tool | Version | Notes |
|------|---------|-------|
| **PostgreSQL** | 16 | Azure hosted |
| **Git** | 2.x | Version control |
| **ESLint** | 9.21.0 | Linting |
| **Prettier** | 3.5.0 | Code formatting |

---

## 📋 Sprint 8 Dependency Changes

### New Dependencies (Sprint 8)
```bash
# Backend
npm install @nestjs/helmet@^1.1.0          # Task 8.6: CSP headers
npm install @nestjs/throttler@^5.0.0      # Task 8.6: Rate limiting

# Frontend
npm install @axe-core/react@^4.11.0       # Story 8.3: Accessibility testing
npm install react-router@latest           # Story 8.1: Dashboard routing
npm install react-router-dom@latest       # Story 8.1: DOM bindings
```

### Dependency Upgrades (Sprint 8)
```bash
# Backend
npm install bcrypt@^6.0.0                 # SEC-P1-005: Security fix
npm install @aws-sdk/client-s3@latest     # SEC-P1-005: Security fix (if used)
```

### Locked Versions (NO Changes)
```bash
# Do NOT upgrade these
prisma@6.19.2                             # Locked until ADR decision
@prisma/client@6.19.2                     # Locked (matches prisma)
```

---

## 🔧 Version Lock Commands

```bash
# Backend
cd gcredit-project/backend
npm install prisma@6.19.2 --save-exact
npm install @prisma/client@6.19.2 --save-exact

# Frontend
cd gcredit-project/frontend
npm install react@19.2.3 vite@7.3.1 tailwindcss@4.1.18
```

---

## 📝 Notes & Known Issues

### Prisma 6.19.2 Lock Reason
- **Decision Date:** Sprint 0 (2026-01-24)
- **Reason:** Prisma 7 requires `prisma.config.ts` and new schema syntax
- **Impact:** Major migration required (not worth it for MVP)
- **Review Date:** Post-MVP (Sprint 9+)
- **Reference:** ADR-001 (Dependency Management), Lesson 1 (Version Drift)

### bcrypt 5.x → 6.x Upgrade (Sprint 8)
- **Reason:** Security vulnerability (moderate severity)
- **Breaking Changes:** None (API compatible)
- **Testing Required:** Auth E2E tests must pass
- **Migration:** Automatic (no code changes needed)

### Tailwind CSS 4.x
- **Note:** Uses new PostCSS integration (`@tailwindcss/postcss`)
- **Migration:** Complete (Sprint 0)
- **Compatibility:** No issues with Vite 7.3.1

---

## ✅ Verification Checklist

After dependency changes, verify:
- [ ] `npm install` succeeds (backend + frontend)
- [ ] `npm run build` succeeds (backend + frontend)
- [ ] All tests pass (`npm test`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] Application starts without errors

---

**Last Updated:** 2026-02-02 (Sprint 8 Planning)  
**Verified By:** Bob (Scrum Master)  
**Next Review:** Sprint 9 Planning
