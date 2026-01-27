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

## 🚀 Copy-Paste Ready Imports

### Most Common Imports

**Prisma Database:**
```typescript
import { PrismaService } from '../common/prisma.service';
import { PrismaModule } from '../common/prisma.module';
```

**Authentication & Authorization:**
```typescript
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Public } from '../common/decorators/public.decorator';
```

**Azure Blob Storage:**
```typescript
import { BlobStorageService } from '../common/services/blob-storage.service';
import { StorageModule } from '../common/storage.module';
```

**Email Service:**
```typescript
import { EmailService } from '../common/email.service';
```

**Prisma Generated Types:**
```typescript
import { User, BadgeTemplate, Skill, SkillCategory, Badge } from '@prisma/client';
import { BadgeStatus, UserRole, SkillLevel, Prisma } from '@prisma/client';
```

---

### NestJS Common Imports

**Controllers:**
```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
```

**Services & Exceptions:**
```typescript
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException, 
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';
```

**Validation & DTOs:**
```typescript
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsInt, 
  IsUUID,
  IsArray,
  IsEnum,
  IsBoolean,
  Min, 
  Max, 
  Length,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsUrl,
  IsDate,
  ValidateNested
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
```

**Swagger/OpenAPI:**
```typescript
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiProperty, 
  ApiPropertyOptional,
  ApiConsumes
} from '@nestjs/swagger';
```

**File Upload (Multer):**
```typescript
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
```

---

### Feature Module Templates

**Controller Template:**
```typescript
// src/your-feature/your-feature.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole, User } from '@prisma/client';

import { YourFeatureService } from './your-feature.service';
import { CreateYourFeatureDto, UpdateYourFeatureDto } from './dto';

@ApiTags('Your Feature')
@Controller('your-feature')
export class YourFeatureController {
  constructor(private readonly yourFeatureService: YourFeatureService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items' })
  async findAll() {
    return this.yourFeatureService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new item' })
  async create(@Body() dto: CreateYourFeatureDto, @GetUser() user: User) {
    return this.yourFeatureService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateYourFeatureDto,
  ) {
    return this.yourFeatureService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete item' })
  async remove(@Param('id') id: string) {
    return this.yourFeatureService.remove(id);
  }
}
```

**Service Template:**
```typescript
// src/your-feature/your-feature.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateYourFeatureDto, UpdateYourFeatureDto } from './dto';

@Injectable()
export class YourFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.yourModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.yourModel.findUnique({ 
      where: { id } 
    });
    
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    
    return item;
  }

  async create(dto: CreateYourFeatureDto, userId: string) {
    return this.prisma.yourModel.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdateYourFeatureDto) {
    await this.findOne(id); // Verify exists
    
    return this.prisma.yourModel.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists
    
    return this.prisma.yourModel.delete({ 
      where: { id } 
    });
  }
}
```

**Module Template:**
```typescript
// src/your-feature/your-feature.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { YourFeatureController } from './your-feature.controller';
import { YourFeatureService } from './your-feature.service';

@Module({
  imports: [PrismaModule],
  controllers: [YourFeatureController],
  providers: [YourFeatureService],
  exports: [YourFeatureService], // If other modules need it
})
export class YourFeatureModule {}
```

---

## 💡 Import Best Practices

### 1. Import Organization
Organize imports in this order:
```typescript
// 1. NestJS core
import { Controller, Get } from '@nestjs/common';

// 2. Third-party libraries
import { ApiTags } from '@nestjs/swagger';

// 3. Shared infrastructure (common/)
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// 4. Prisma types
import { User, UserRole } from '@prisma/client';

// 5. Own feature imports (DTOs, services)
import { YourFeatureService } from './your-feature.service';
import { CreateDto } from './dto';
```

### 2. When in Doubt
1. ✅ Check existing code (badge-templates/, skills/, badge-issuance/)
2. ✅ Copy import statements from similar modules
3. ✅ Use IDE autocomplete (type `import { PrismaService } from '../`)
4. ❌ Never guess paths - verify they exist!

### 3. Avoid Cross-Feature Imports
```typescript
// ❌ WRONG (tight coupling)
import { SkillsService } from '../skills/skills.service';

// ✅ CORRECT (use PrismaService directly)
import { PrismaService } from '../common/prisma.service';

// Query skills directly
const skills = await this.prisma.skill.findMany({ 
  where: { id: { in: skillIds } } 
});
```

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

### ❌ Mistake 4: Prisma Json fields - DTO conversion required
```typescript
// WRONG - Prisma expects Prisma.InputJsonValue, not plain object
async create(dto: CreateBadgeTemplateDto) {
  return this.prisma.badgeTemplate.create({
    data: dto, // ❌ Type error if dto.criteria is plain object
  });
}

// CORRECT - Convert to Prisma.InputJsonValue
async create(dto: CreateBadgeTemplateDto) {
  return this.prisma.badgeTemplate.create({
    data: {
      ...dto,
      criteria: dto.criteria as Prisma.InputJsonValue, // ✅ Explicit cast
    },
  });
}
```

### ❌ Mistake 5: Union types in DTOs need validation
```typescript
// WRONG - No runtime validation
@IsString()
@IsOptional()
expirationPeriod?: string | null;  // ❌ TypeScript only, no runtime check

// CORRECT - Add validation decorator
@IsString()
@IsOptional()
@IsIn([null, ...validValues])  // ✅ Runtime validation
expirationPeriod?: string | null;
```

### ❌ Mistake 6: NestJS route order - specific before dynamic
```typescript
// WRONG - :id catches "criteria-templates"
@Get(':id')                    // Defined first = matches first
async findOne() {}

@Get('criteria-templates')     // Never reached!
getCriteriaTemplates() {}

// CORRECT - Specific routes before dynamic
@Get('all')                          // Most specific
@Get('criteria-templates')           // Specific strings
@Get('criteria-templates/:key')      // Specific + param
@Get(':id')                          // Dynamic - ALWAYS LAST
async findOne() {}
```

**Route Priority Rules:**
1. Exact string matches first
2. Multi-segment paths before single segment
3. Mixed static/dynamic before pure dynamic
4. `:param` routes always last

### ❌ Mistake 7: Global guards - mark public endpoints
```typescript
// WRONG - Returns 401 even without @UseGuards()
@Get('public-endpoint')
getPublicData() {}  // ❌ Global guards apply!

// CORRECT - Use @Public() decorator
import { Public } from '../common/decorators/public.decorator';

@Public()
@Get('public-endpoint')
getPublicData() {}  // ✅ Bypasses global JWT guard
```

**Common Public Endpoints:**
- Authentication endpoints (login, register)
- Public badge/skill browsing
- Badge verification endpoints
- Health checks

**Checklist for new endpoints:**
- [ ] Public? → Add `@Public()`
- [ ] Authenticated? → Add `@Roles(UserRole.X)`
- [ ] Test without auth token

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

- [Project Context](../../project-context.md) - Full project overview
- [Architecture Decisions](../decisions/) - ADRs for major technical choices
- [Setup Guide](../setup/) - Infrastructure setup and configuration
- [Lessons Learned](../lessons-learned/lessons-learned.md) - Detailed patterns and explanations
- [Sprint Documentation](../../backend/docs/sprints/) - Historical sprint work

---

**Last Updated:** 2026-01-28 (Integrated IMPORT-PATHS.md content)  
**Note:** This guide now includes all copy-paste ready imports previously in IMPORT-PATHS.md

*Keep this guide updated as new patterns emerge. Last review: Sprint 2 (2026-01-26)*
