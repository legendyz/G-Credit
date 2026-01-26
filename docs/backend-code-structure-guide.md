# Backend Code Structure Guide

**Project:** G-Credit  
**Last Updated:** 2026-01-26 (Sprint 2)  
**Purpose:** 开发者快速参考 - Backend模块组织和Import路径规范

---

## 📁 Directory Structure Overview

```
gcredit-project/backend/src/
├── common/              # 🔧 SHARED INFRASTRUCTURE (cross-cutting concerns)
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   ├── storage.module.ts
│   ├── storage.service.ts
│   ├── email.service.ts
│   ├── guards/          # JWT auth guard, roles guard
│   ├── decorators/      # @Roles(), @GetUser()
│   └── services/        # BlobStorageService
├── modules/             # 🏛️ COMPLEX DOMAIN MODULES (advanced patterns)
│   └── auth/            # Authentication (Passport strategies, JWT config)
├── badge-templates/     # 📦 FLAT FEATURE MODULE (Sprint 2)
├── skill-categories/    # 📦 FLAT FEATURE MODULE (Sprint 2)
├── skills/              # 📦 FLAT FEATURE MODULE (Sprint 2)
├── config/              # ⚙️ Configuration files (Azure Blob, JWT, etc.)
├── app.module.ts
└── main.ts
```

---

## 🎯 Module Organization Pattern (Established Sprint 0-2)

### 1. `src/common/` - Shared Infrastructure
**When to use:**
- Database access (Prisma)
- Auth guards & decorators (JWT, RBAC)
- Storage services (Azure Blob)
- Email service
- Any service used by 3+ feature modules

**Characteristics:**
- No business logic
- Pure technical infrastructure
- Injected as dependencies into feature modules

**Import examples:**
```typescript
import { PrismaService } from '../common/prisma.service';
import { PrismaModule } from '../common/prisma.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BlobStorageService } from '../common/services/blob-storage.service';
```

---

### 2. `src/modules/` - Complex Domain Modules
**When to use:**
- Requires Passport strategies
- Implements CQRS/Event Sourcing patterns
- Has complex configuration (JWT module, OAuth config)
- Needs sub-modules or advanced NestJS patterns

**Currently contains:**
- `auth/` - Authentication module (JWT strategies, passport config)

**Future candidates:**
- `notifications/` (if using CQRS + event handlers)
- `analytics/` (if using complex aggregations + caching strategies)

**Import examples:**
```typescript
import { AuthModule } from '../modules/auth/auth.module';
import { JwtStrategy } from '../modules/auth/strategies/jwt.strategy';
```

---

### 3. Flat Feature Modules (Sprint 2 Pattern)
**When to use:**
- Standard CRUD operations
- Simple business logic
- Single responsibility (no sub-modules)
- REST API endpoints

**Currently contains:**
- `badge-templates/` - Badge template management
- `skill-categories/` - Skill category hierarchy
- `skills/` - Skill CRUD

**Structure per module:**
```
badge-templates/
├── badge-templates.controller.ts   # REST endpoints
├── badge-templates.service.ts      # Business logic
├── badge-templates.module.ts       # Module definition
└── dto/
    ├── create-badge-template.dto.ts
    ├── update-badge-template.dto.ts
    └── query-badge-template.dto.ts
```

**Import examples WITHIN feature module:**
```typescript
// Import shared infrastructure
import { PrismaModule } from '../common/prisma.module';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BlobStorageService } from '../common/services/blob-storage.service';

// Import own DTOs
import { CreateBadgeTemplateDto } from './dto/create-badge-template.dto';
```

**❌ AVOID cross-feature imports:**
```typescript
// BAD: Direct import from another feature module
import { SkillsService } from '../skills/skills.service';

// GOOD: Use events or shared services
// this.eventEmitter.emit('badge.created', { skillIds });
```

---

## 📋 Import Path Quick Reference

| What you need | Import path |
|---------------|-------------|
| **Prisma** | `'../common/prisma.service'` |
| | `'../common/prisma.module'` |
| **Auth Guards** | `'../common/guards/jwt-auth.guard'` |
| | `'../common/guards/roles.guard'` |
| **Decorators** | `'../common/decorators/roles.decorator'` |
| | `'../common/decorators/get-user.decorator'` |
| **Blob Storage** | `'../common/services/blob-storage.service'` |
| **Email** | `'../common/email.service'` |
| **Auth Module** | `'../modules/auth/auth.module'` |
| **Feature DTOs** | `'./dto/create-*.dto'` (same module) |
| **Prisma Types** | `'@prisma/client'` (generated) |

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Wrong Prisma path
```typescript
// WRONG (doesn't exist)
import { PrismaService } from '../prisma/prisma.service';
import { PrismaService } from '../modules/prisma/prisma.service';

// CORRECT
import { PrismaService } from '../common/prisma.service';
```

### ❌ Mistake 2: Wrong auth guards path
```typescript
// WRONG (doesn't exist)
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

// CORRECT
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
```

### ❌ Mistake 3: Cross-feature dependencies
```typescript
// WRONG (tight coupling)
@Injectable()
export class BadgeTemplatesService {
  constructor(private skillsService: SkillsService) {} // from another feature
}

// CORRECT (use shared Prisma service)
@Injectable()
export class BadgeTemplatesService {
  constructor(private prisma: PrismaService) {}
  
  async validateSkillIds(ids: string[]) {
    return this.prisma.skill.findMany({ where: { id: { in: ids } } });
  }
}
```

---

## 🔍 Decision Rationale

### Why `common/` instead of `shared/`?
- NestJS convention: `common/` for cross-cutting infrastructure
- `shared/` typically means shared business logic

### Why flat feature modules (Sprint 2)?
- **Simplicity:** Standard CRUD doesn't need complex nesting
- **Discoverability:** Easy to find `badge-templates/` at src level
- **Flexibility:** Can move to `modules/` later if complexity increases
- **DDD Alignment:** Each feature is a bounded context

### When to promote flat module to `modules/`?
Consider moving when:
1. Module needs Passport strategies
2. Implementing CQRS or Event Sourcing
3. Requires multiple sub-modules
4. Has 5+ service files with complex interactions

---

## 📊 Current Module Statistics (Sprint 2)

| Category | Count | Examples |
|----------|-------|----------|
| **Common Infrastructure** | 8 files | prisma, guards, decorators, services |
| **Complex Modules** | 1 module | auth (with strategies) |
| **Flat Feature Modules** | 3 modules | badge-templates, skill-categories, skills |
| **Total Services** | ~12 | PrismaService, BlobStorageService, BadgeTemplatesService, etc. |
| **Total Controllers** | ~4 | AuthController, BadgeTemplatesController, etc. |

---

## 🚀 Sprint 3+ Guidelines

### For new CRUD features:
1. Create as flat feature module (e.g., `assertions/`, `verifications/`)
2. Import infrastructure from `../common/`
3. No cross-feature imports

### For complex features:
1. Evaluate: Does it need strategies/advanced patterns?
2. If yes: Create in `src/modules/`
3. If no: Keep as flat module

### Refactoring trigger:
- When a flat module exceeds 8 files
- When business logic becomes complex (100+ lines per method)
- When you need dependency injection of strategies

---

## 📚 Related Documents

- [Project Context](../project-context.md) - Full project overview
- [Architecture Decisions](./decisions/) - ADRs for major technical choices
- [Infrastructure Inventory](./infrastructure-inventory.md) - Azure resources
- [Sprint 2 Backlog](../_bmad-output/implementation-artifacts/sprint-2-backlog.md)

---

*Keep this guide updated as new patterns emerge. Last review: Sprint 2 (2026-01-26)*
