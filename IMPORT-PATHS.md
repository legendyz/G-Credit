# Import Paths Cheatsheet

**Quick Reference for G-Credit Backend Development**  
**Last Updated:** 2026-01-26 (Sprint 2)  
**Purpose:** Copy-paste ready import statements - NO MORE PATH GUESSING! 🎯

---

## 🚀 Most Common Imports (Copy-Paste Ready)

### Prisma Database
```typescript
import { PrismaService } from '../common/prisma.service';
import { PrismaModule } from '../common/prisma.module';
```

### Authentication & Authorization
```typescript
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
```

### Azure Blob Storage
```typescript
import { BlobStorageService } from '../common/services/blob-storage.service';
import { StorageModule } from '../common/storage.module';
```

### Email Service
```typescript
import { EmailService } from '../common/email.service';
```

### Prisma Generated Types
```typescript
import { User, BadgeTemplate, Skill, SkillCategory } from '@prisma/client';
import { BadgeStatus, UserRole, SkillLevel, Prisma } from '@prisma/client';
```

---

## 📦 NestJS Common Imports

### Controllers
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

### Services & Exceptions
```typescript
import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
```

### Validation & DTOs
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
  Matches
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
```

### Swagger/OpenAPI
```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
```

### File Upload (Multer)
```typescript
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
```

---

## 🎯 Feature Module Template (Complete Starter)

When creating a new feature module, copy this template:

### Controller Template
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
}
```

### Service Template
```typescript
// src/your-feature/your-feature.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateYourFeatureDto, UpdateYourFeatureDto } from './dto';

@Injectable()
export class YourFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.yourModel.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.yourModel.findUnique({ where: { id } });
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
    return this.prisma.yourModel.delete({ where: { id } });
  }
}
```

### Module Template
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
  exports: [YourFeatureService],
})
export class YourFeatureModule {}
```

### DTO Template
```typescript
// src/your-feature/dto/create-your-feature.dto.ts
import { IsString, IsOptional, Length, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateYourFeatureDto {
  @ApiProperty({ description: 'Name of the item', example: 'My Item' })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Item description' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;
}
```

---

## ⚠️ Common Mistakes - Quick Fix

### ❌ WRONG
```typescript
import { PrismaService } from '../prisma/prisma.service';  // NO!
import { PrismaService } from '../modules/prisma/prisma.service';  // NO!
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';  // NO!
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';  // NO!
```

### ✅ CORRECT
```typescript
import { PrismaService } from '../common/prisma.service';  // YES!
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';  // YES!
```

---

## 🔍 Path Rules (Remember These)

| What | Where | Import Path |
|------|-------|-------------|
| **Prisma** | `src/common/` | `'../common/prisma.service'` |
| **Guards** | `src/common/guards/` | `'../common/guards/jwt-auth.guard'` |
| **Decorators** | `src/common/decorators/` | `'../common/decorators/roles.decorator'` |
| **Shared Services** | `src/common/services/` | `'../common/services/blob-storage.service'` |
| **Auth Module** | `src/modules/auth/` | `'../modules/auth/...'` (rarely used) |
| **Prisma Types** | Generated | `'@prisma/client'` |
| **Own DTOs** | Same module | `'./dto/create-*.dto'` |

---

## 💡 Pro Tips

1. **When in doubt, check existing code**
   - Look at `badge-templates/`, `skill-categories/`, or `skills/` modules
   - Copy their import statements

2. **Use IDE autocomplete**
   - Type `import { PrismaService } from '../` and let IDE suggest paths
   - If path is red-underlined, it's wrong!

3. **Never cross-import features**
   - ❌ Don't: `import { SkillsService } from '../skills/skills.service'`
   - ✅ Do: Use `PrismaService` to query skills directly

4. **Keep imports organized**
   ```typescript
   // 1. NestJS core
   import { Controller, Get } from '@nestjs/common';
   
   // 2. Third-party
   import { ApiTags } from '@nestjs/swagger';
   
   // 3. Shared infrastructure (common/)
   import { PrismaService } from '../common/prisma.service';
   import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
   
   // 4. Prisma types
   import { User, UserRole } from '@prisma/client';
   
   // 5. Local imports (same module)
   import { YourFeatureService } from './your-feature.service';
   import { CreateYourFeatureDto } from './dto';
   ```

---

## ⚠️ Common Pitfalls & Solutions (Story 3.5 Learnings)

### 1. Prisma Json Fields - DTO Conversion Required

**Problem:** Prisma rejects class-validator DTO instances for Json fields
```typescript
// ❌ WRONG - Prisma error: Type 'IssuanceCriteriaDto' not assignable
issuanceCriteria: createDto.issuanceCriteria
```

**Solution:** Convert DTO to plain object
```typescript
// ✅ CORRECT - Convert to plain object first
issuanceCriteria: createDto.issuanceCriteria 
  ? JSON.parse(JSON.stringify(createDto.issuanceCriteria))
  : null
```

**When to use:**
- Any DTO with `@Type()` or `@ValidateNested()` decorators
- Mapping DTO to Prisma model with `Json` field type
- Nested objects, polymorphic data

---

### 2. Union Types in DTOs - Add Validation Decorator

**Problem:** class-validator rejects union types without decorators
```typescript
// ❌ WRONG - Error: "property value should not exist"
value: string | number | boolean | string[];
```

**Solution:** Add at least @IsNotEmpty() decorator
```typescript
// ✅ CORRECT - Validates any non-empty value
import { IsNotEmpty } from 'class-validator';

@IsNotEmpty()
value: string | number | boolean | string[];
```

**When to use:**
- Any DTO field with union types
- Optional polymorphic fields
- Runtime type validation needed

---

### 3. NestJS Route Order - Specific Before Dynamic

**Problem:** Dynamic routes (`:id`) intercept specific routes
```typescript
// ❌ WRONG ORDER - :id catches "criteria-templates"
@Get(':id')                    // Defined first = matches first
async findOne() {}

@Get('criteria-templates')     // Never reached!
getCriteriaTemplates() {}
```

**Solution:** Define specific routes before dynamic ones
```typescript
// ✅ CORRECT ORDER
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

---

### 4. Global Guards - Mark Public Endpoints

**Problem:** All endpoints protected by default due to global APP_GUARD
```typescript
// ❌ WRONG - Returns 401 even without @UseGuards()
@Get('public-endpoint')
getPublicData() {}
```

**Solution:** Use @Public() decorator for open endpoints
```typescript
// ✅ CORRECT - Bypass global JWT guard
import { Public } from '../common/decorators/public.decorator';

@Public()
@Get('public-endpoint')
getPublicData() {}
```

**Common Public Endpoints:**
- Authentication endpoints (login, register)
- Public badge/skill browsing
- Template libraries
- Health checks

**Checklist for new endpoints:**
- [ ] Public? → Add `@Public()`
- [ ] Authenticated? → Add `@Roles(UserRole.X)`
- [ ] Test without auth token

---

## 📚 Related Documentation

- [Backend Code Structure Guide](./docs/backend-code-structure-guide.md) - Full explanation
- [Project Context](./project-context.md) - High-level overview
- [Sprint 2 Path Corrections](./docs/sprint-2-path-corrections.md) - Why this exists
- [Lessons Learned](./docs/lessons-learned.md) - Detailed explanations of all patterns

---

**🎯 Remember:** When writing new code, just open this file and copy-paste! No more guessing paths.

*Last updated: Sprint 2 - Story 3.5 (2026-01-26) - Keep this updated as patterns evolve*
