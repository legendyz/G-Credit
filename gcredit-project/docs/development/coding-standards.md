# Coding Standards

This document defines coding standards and best practices for the GCredit project to ensure consistency, maintainability, and code quality across the codebase.

## Table of Contents

- [General Principles](#general-principles)
- [Language & Localization](#language--localization)
- [TypeScript Standards](#typescript-standards)
- [NestJS Backend Standards](#nestjs-backend-standards)
- [React Frontend Standards](#react-frontend-standards)
- [API Path Standards](#api-path-standards)
- [Logging Standards](#logging-standards)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Code Documentation](#code-documentation)
- [Error Handling](#error-handling)
- [Testing Standards](#testing-standards)
- [Git & Version Control](#git--version-control)

---

## General Principles

### Code Quality Fundamentals

1. **KISS (Keep It Simple, Stupid)** - Prefer simple solutions
2. **DRY (Don't Repeat Yourself)** - Extract reusable code
3. **YAGNI (You Aren't Gonna Need It)** - Don't add premature features
4. **SOLID Principles** - Follow object-oriented design principles
5. **Fail Fast** - Validate early and throw clear errors

### Code Review Standards

- Code must pass all linting and formatting checks
- All tests must pass before merging
- At least one approval required for PRs
- Maximum PR size: 500 lines changed (exceptions for generated code)
- Documentation must be updated for API changes

---

## Language & Localization

> **Added:** Sprint 10 (Story 10.4) — Full codebase i18n cleanup revealed Chinese strings in DTOs, comments, and API docs.

### Rule: All Code Must Use English

All source code artifacts must be written in **English only**:

| Artifact | Language | Example |
|----------|----------|--------|
| Variable/function names | English | `getUserName()`, not `获取用户名()` |
| Code comments | English | `// Validate input`, not `// 验证输入` |
| String literals (UI text) | English | `'Submit'`, not `'提交'` |
| Error messages | English | `'Invalid email format'` |
| `@ApiProperty` descriptions | English | `description: 'Skill name'`, not `'技能名称'` |
| Swagger/OpenAPI docs | English | All endpoint descriptions |
| Log messages | English | `logger.log('User created')` |
| Test descriptions | English | `it('should return 401')` |

**❌ Bad:**
```typescript
@ApiProperty({ description: '技能名称' })
name: string;
```

**✅ Good:**
```typescript
@ApiProperty({ description: 'Skill name' })
name: string;
```

### Exceptions

- **Test assertions** that verify absence of Chinese characters are allowed (e.g., `expect(text).not.toMatch(/[\u4e00-\u9fff]/)`)
- **Documentation files** (`.md`) may use Chinese for internal team communication
- **i18n resource files** (if/when i18n framework is added) will contain translations

### Verification

```powershell
# Scan for Chinese characters in source code
Get-ChildItem -Recurse -Include "*.ts","*.tsx" src -Exclude "*.test.*","*.spec.*" |
  Select-String -Pattern "[\u4E00-\u9FFF]"
# Expected: 0 matches
```

---

## TypeScript Standards

### Strict Mode Configuration

**tsconfig.json** (already configured):
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Type Safety

**✅ Good:**
```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function getUser(id: string): Promise<User | null> {
  // Implementation
}
```

**❌ Bad:**
```typescript
function getUser(id: any): any {
  // Avoid 'any' types
}
```

### Type Inference

**✅ Good:** Let TypeScript infer when obvious
```typescript
const count = 42; // TypeScript infers number
const users = await this.prisma.user.findMany(); // Infers User[]
```

**✅ Good:** Explicitly type complex returns
```typescript
async function processData(): Promise<ProcessedResult> {
  // Explicit return type for clarity
}
```

### Enums

**✅ Prefer string enums:**
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  ISSUER = 'ISSUER',
  EMPLOYEE = 'EMPLOYEE',
}
```

**❌ Avoid numeric enums:**
```typescript
enum Status {
  Active,    // Hard to debug
  Inactive,
}
```

### Null vs Undefined

**✅ Prefer `null` for intentional absence:**
```typescript
interface Badge {
  id: string;
  evidenceUrl: string | null; // Explicitly no evidence
  expiresAt: Date | null;     // Explicitly no expiration
}
```

**✅ Use `undefined` for optional parameters:**
```typescript
function createBadge(templateId: string, evidenceUrl?: string) {
  // evidenceUrl is string | undefined
}
```

---

## NestJS Backend Standards

### Module Organization

**Feature Module Structure:**
```
badge-issuance/
├── badge-issuance.module.ts     # Module definition
├── badge-issuance.controller.ts # HTTP endpoints
├── badge-issuance.service.ts    # Business logic
├── dto/                         # Data Transfer Objects
│   ├── issue-badge.dto.ts
│   ├── claim-badge.dto.ts
│   └── query-badge.dto.ts
├── entities/                    # Domain models (if needed)
└── badge-issuance.service.spec.ts  # Unit tests
```

### Dependency Injection

**✅ Good:** Constructor injection
```typescript
@Injectable()
export class BadgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly azureStorage: AzureStorageService,
  ) {}
}
```

**❌ Bad:** Property injection
```typescript
@Injectable()
export class BadgeService {
  @Inject(PrismaService)
  prisma: PrismaService; // Avoid unless necessary
}
```

### DTOs (Data Transfer Objects)

**✅ Always use class-validator:**
```typescript
import { IsString, IsUUID, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueBadgeDto {
  @ApiProperty({ 
    description: 'Badge template ID',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional({ description: 'Evidence URL' })
  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;
}
```

### Controllers

**✅ Keep controllers thin:**
```typescript
@Controller('api/badges')  // All controllers MUST include 'api/' prefix
@UseGuards(JwtAuthGuard, RolesGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Issue a badge' })
  @ApiResponse({ status: 201, description: 'Badge issued' })
  async issueBadge(
    @Body() dto: IssueBadgeDto,
    @Request() req: any,
  ) {
    // Delegate business logic to service
    return this.badgeService.issueBadge(dto, req.user.userId);
  }
}
```

**❌ Bad:** Business logic in controller
```typescript
@Post()
async issueBadge(@Body() dto: IssueBadgeDto) {
  // ❌ Don't put database queries in controller
  const template = await this.prisma.badgeTemplate.findUnique(...);
  const badge = await this.prisma.badge.create(...);
  // Move this to service!
}
```

### Services

**✅ Single Responsibility Principle:**
```typescript
@Injectable()
export class BadgeService {
  constructor(private readonly prisma: PrismaService) {}

  // One method = one responsibility
  async issueBadge(dto: IssueBadgeDto, issuerId: string) {
    // Validation
    await this.validateTemplate(dto.templateId);
    await this.validateRecipient(dto.recipientId);

    // Business logic
    return this.createBadge(dto, issuerId);
  }

  private async validateTemplate(templateId: string) {
    const template = await this.prisma.badgeTemplate.findUnique({
      where: { id: templateId },
    });
    
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    
    return template;
  }

  private async createBadge(dto: IssueBadgeDto, issuerId: string) {
    // Creation logic
  }
}
```

### Error Handling

**✅ Use NestJS built-in exceptions:**
```typescript
import { 
  BadRequestException, 
  NotFoundException, 
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// Examples:
throw new NotFoundException('Badge not found');
throw new BadRequestException('Invalid claim token');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
throw new ConflictException('Email already exists');
```

### Guards & Decorators

**✅ Use custom decorators:**
```typescript
// common/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => 
  SetMetadata('roles', roles);

// common/decorators/public.decorator.ts
export const Public = () => SetMetadata('isPublic', true);

// Usage:
@Public()  // Skip authentication
@Get('health')
getHealth() {
  return { status: 'ok' };
}

@Roles(UserRole.ADMIN, UserRole.ISSUER)  // Require specific roles
@Post('badges')
issueBadge() { ... }
```

### Prisma Best Practices

**✅ Use transactions for multiple operations:**
```typescript
async transferBadge(badgeId: string, newOwnerId: string) {
  return this.prisma.$transaction(async (tx) => {
    const badge = await tx.badge.update({
      where: { id: badgeId },
      data: { recipientId: newOwnerId },
    });

    await tx.badgeHistory.create({
      data: {
        badgeId,
        action: 'TRANSFERRED',
        newOwnerId,
      },
    });

    return badge;
  });
}
```

**✅ Include related data when needed:**
```typescript
const badge = await this.prisma.badge.findUnique({
  where: { id },
  include: {
    template: true,
    recipient: { select: { id: true, email: true, firstName: true } },
    issuer: { select: { id: true, firstName: true, lastName: true } },
  },
});
```

**❌ Avoid N+1 queries:**
```typescript
// ❌ Bad: N+1 query
const badges = await this.prisma.badge.findMany();
for (const badge of badges) {
  badge.template = await this.prisma.badgeTemplate.findUnique({
    where: { id: badge.templateId },
  });
}

// ✅ Good: Single query with include
const badges = await this.prisma.badge.findMany({
  include: { template: true },
});
```

---

## React Frontend Standards

### API Call Standards

> **Added:** Sprint 10 (Story 10.3c) — API path audit found 8 hardcoded `/api/...` URLs bypassing centralized config.

**All API calls must use `API_BASE_URL`** from `@/lib/apiConfig.ts`:

**✅ Good:**
```typescript
import { API_BASE_URL } from '@/lib/apiConfig';

const response = await fetch(`${API_BASE_URL}/badges/${id}`);
```

**❌ Bad:**
```typescript
// Never hardcode /api/ prefix
const response = await fetch(`/api/badges/${id}`);
```

**Why:** `API_BASE_URL` defaults to `/api` but can be overridden via `VITE_API_URL` environment variable for production deployments where the API is on a different domain.

### Component Structure

**✅ Functional components with hooks:**
```typescript
import { useState, useEffect } from 'react';
import { Badge } from '@/types';

interface BadgeCardProps {
  badgeId: string;
  onClaim?: (badgeId: string) => void;
}

export function BadgeCard({ badgeId, onClaim }: BadgeCardProps) {
  const [badge, setBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadge(badgeId);
  }, [badgeId]);

  async function fetchBadge(id: string) {
    // Implementation
  }

  return (
    <div className="badge-card">
      {/* JSX */}
    </div>
  );
}
```

### Hooks Best Practices

**✅ Custom hooks for reusable logic:**
```typescript
// hooks/useBadges.ts
import { API_BASE_URL } from '../lib/apiConfig';

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchBadges() {
    setLoading(true);
    const data = await api.get(`${API_BASE_URL}/badges/my-badges`); // Always use API_BASE_URL
    setBadges(data);
    setLoading(false);
  }

  return { badges, loading, fetchBadges };
}

// Usage in component:
const { badges, loading, fetchBadges } = useBadges();
```

### State Management

**✅ Use Zustand for global state (with `persist` middleware for auth):**
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../lib/apiConfig';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
      },

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// Usage in component:
const { user, login, logout } = useAuthStore();
```

> **Note:** Do NOT use React Context for state management. All global state uses Zustand stores in `src/stores/`.

---

## API Path Standards

> **Added:** Sprint 10 (Story 10.3c) — API path audit found 4 controllers missing `api/` prefix, causing 404s.

### Backend: Controller Route Prefix

**All NestJS controllers must include `api/` in their `@Controller` route prefix:**

**✅ Good:**
```typescript
@Controller('api/badges')
export class BadgeIssuanceController { ... }

@Controller('api/auth')
export class AuthController { ... }
```

**❌ Bad:**
```typescript
// Missing api/ prefix — frontend calls will 404
@Controller('badges')
export class BadgeIssuanceController { ... }
```

**Why:** The project does NOT use `app.setGlobalPrefix('api')`. Each controller individually declares its full route prefix. The Vite dev proxy forwards `/api/*` to `localhost:3000/api/*` without path rewriting, so backend routes must start with `api/`.

### Frontend: Centralized API_BASE_URL

See [React Frontend Standards > API Call Standards](#api-call-standards) above.

### E2E Tests: Path Consistency

E2E tests call `app.getHttpServer()` directly (no Vite proxy). Routes must include `api/` prefix:

```typescript
// ✅ Correct
await request(app.getHttpServer()).get('/api/badges');

// ❌ Wrong — will 404
await request(app.getHttpServer()).get('/badges');
```

---

## Logging Standards

> **Added:** Sprint 10 (Story 10.4) — Migrated ~29 `console.*` calls to NestJS Logger.

### Backend: Use NestJS Logger

**Never use `console.log/error/warn` in backend source code.** Use NestJS `Logger`:

**✅ Good:**
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  async issueBadge(dto: IssueBadgeDto) {
    this.logger.log(`Issuing badge to ${dto.recipientEmail}`);
    // ...
    this.logger.error(`Failed to issue badge: ${error.message}`, error.stack);
  }
}
```

**❌ Bad:**
```typescript
console.log('Issuing badge...');
console.error('Failed:', error);
```

**For static contexts** (outside classes, e.g., config files):
```typescript
const logger = new Logger('AzureBlobConfig');
logger.warn('AZURE_STORAGE_CONNECTION_STRING not set, using local fallback');
```

**For `main.ts` bootstrap:**
```typescript
const logger = new Logger('Bootstrap');
logger.log(`Application running on port ${port}`);
```

**Why:** NestJS Logger provides:
- Structured output with context (class name)
- Log level filtering in production
- Consistent format across the application
- Integration with external log aggregators

### Frontend: No console.log in Production Code

**No `console.log/error/warn` in frontend production source code:**

- Use `toast.success()` / `toast.error()` from `sonner` for user-facing messages
- Remove debug `console.log` before committing
- Dev-only tooling (e.g., `axe-setup.ts`) must be guarded by `import.meta.env.DEV`

### Exceptions

- **Test files** (`.test.ts`, `.spec.ts`) may use `console.log` for debugging
- **Browser-side generated JS** (e.g., widget embed `<script>` tags) may use `console.log` since it runs in the client browser, not the server

### Verification

```powershell
# Backend: should return 0 matches
Get-ChildItem -Recurse -Include "*.ts" backend/src -Exclude "*.spec.*" |
  Select-String "console\.(log|error|warn)"

# Frontend: should return 0 matches (excluding DEV-guarded)
Get-ChildItem -Recurse -Include "*.ts","*.tsx" frontend/src -Exclude "*.test.*","*.spec.*" |
  Select-String "console\.(log|error|warn)"
```

### Files & Folders

| Type | Convention | Example |
|------|------------|---------|
| **Modules** | kebab-case | `badge-issuance/` |
| **Components** | PascalCase | `BadgeCard.tsx` |
| **Services** | kebab-case | `badge.service.ts` |
| **DTOs** | kebab-case | `create-badge.dto.ts` |
| **Interfaces** | PascalCase | `Badge.interface.ts` |
| **Backend Tests** | same + .spec | `badge.service.spec.ts` |
| **Frontend Tests** | same + .test | `BadgeCard.test.tsx` |
| **E2E Tests** | same + .e2e-spec | `badges.e2e-spec.ts` |

### Variables & Functions

**✅ Descriptive names:**
```typescript
// Variables: camelCase
const badgeCount = 42;
const userEmail = 'user@example.com';
const isActive = true;

// Functions: camelCase, verb prefix
function getBadge(id: string) { }
function validateTemplate(template: BadgeTemplate) { }
function createBadgeAssertion(badge: Badge) { }

// Boolean variables: is/has/can prefix
const isValid = true;
const hasPermission = false;
const canEdit = true;
```

### Classes & Interfaces

```typescript
// Classes: PascalCase
class BadgeService { }
class UserController { }

// Interfaces: PascalCase (no 'I' prefix)
interface Badge { }
interface CreateBadgeDto { }

// Enums: PascalCase
enum BadgeStatus {
  ISSUED = 'ISSUED',
  CLAIMED = 'CLAIMED',
  REVOKED = 'REVOKED',
}
```

### Constants

```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_PAGE_SIZE = 10;
const JWT_EXPIRATION = '15m';
```

---

## File Organization

### Import Order

**✅ Organize imports:**
```typescript
// 1. External libraries
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// 2. Internal modules (absolute imports)
import { BadgeService } from './badge.service';
import { PrismaService } from '@/common/prisma.service';

// 3. Types & interfaces
import { Badge, UserRole } from '@prisma/client';
import { CreateBadgeDto } from './dto/create-badge.dto';

// 4. Constants & utilities
import { MAX_FILE_SIZE } from '@/common/constants';
```

### Code Organization in Files

```typescript
// 1. Imports

// 2. Constants
const DEFAULT_LIMIT = 10;

// 3. Interfaces/Types (if not in separate file)
interface ProcessResult {
  success: boolean;
  data?: any;
}

// 4. Class definition
@Injectable()
export class BadgeService {
  // 4a. Properties
  private readonly logger = new Logger(BadgeService.name);

  // 4b. Constructor
  constructor(private readonly prisma: PrismaService) {}

  // 4c. Public methods
  async issueBadge(dto: CreateBadgeDto) { }

  // 4d. Private methods
  private async validateTemplate(id: string) { }
}

// 5. Utility functions (if needed)
function generateClaimToken(): string { }
```

---

## Code Documentation

### JSDoc Comments

**✅ Document complex functions:**
```typescript
/**
 * Issue a badge to a recipient
 * 
 * @param dto - Badge issuance data
 * @param issuerId - ID of the user issuing the badge
 * @returns Newly created badge with claim token
 * @throws {NotFoundException} If template or recipient not found
 * @throws {BadRequestException} If template is not active
 */
async issueBadge(
  dto: IssueBadgeDto,
  issuerId: string,
): Promise<Badge> {
  // Implementation
}
```

### Inline Comments

**✅ Explain "why", not "what":**
```typescript
// ✅ Good: Explains reasoning
// Use bcrypt instead of bcryptjs for better performance
const hash = await bcrypt.hash(password, 10);

// ❌ Bad: States the obvious
// Hash the password
const hash = await bcrypt.hash(password, 10);
```

**✅ Use TODO comments with ticket references:**
```typescript
// TODO(TD-XXX): Implement batch badge revocation — must link to a TD ticket
// FIXME(TD-XXX): Race condition when claiming same badge simultaneously
```

> **Rule:** Every TODO/FIXME MUST reference a Technical Debt ticket (TD-XXX) tracked in `project-context.md`. Orphan TODOs without ticket references will be flagged in code review.

---

## Error Handling

### Controller Error Handling

```typescript
@Get(':id')
async getBadge(@Param('id') id: string) {
  const badge = await this.badgeService.findOne(id);
  
  if (!badge) {
    throw new NotFoundException(`Badge with ID ${id} not found`);
  }
  
  if (badge.status === BadgeStatus.REVOKED) {
    throw new GoneException('Badge has been revoked');
  }
  
  return badge;
}
```

### Service Error Handling

```typescript
async claimBadge(claimToken: string) {
  try {
    // Hash token for database lookup
    const hashedToken = this.hashToken(claimToken);
    
    const badge = await this.prisma.badge.findFirst({
      where: { claimToken: hashedToken },
    });

    if (!badge) {
      throw new NotFoundException('Invalid claim token');
    }

    if (badge.status === BadgeStatus.CLAIMED) {
      throw new BadRequestException('Badge already claimed');
    }

    return this.updateBadgeStatus(badge.id, BadgeStatus.CLAIMED);
    
  } catch (error) {
    // Re-throw known errors
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException) {
      throw error;
    }
    
    // Log and wrap unexpected errors
    this.logger.error(`Failed to claim badge: ${error.message}`, error.stack);
    throw new InternalServerErrorException('Failed to claim badge');
  }
}
```

---

## Testing Standards

See [Testing Guide](./testing-guide.md) for comprehensive testing documentation.

### Key Testing Principles

1. **Test coverage:** Aim for > 80% code coverage
2. **Test pyramid:** Many unit tests, some integration, few E2E
3. **Arrange-Act-Assert:** Structure all tests clearly
4. **Test one thing:** Each test should verify one behavior
5. **Descriptive names:** Test names should describe expected behavior

---

## Git & Version Control

### Branch Naming

```
feature/badge-validation
fix/claim-token-expiration
refactor/badge-service-cleanup
docs/api-documentation-update
test/add-e2e-badge-tests
chore/upgrade-dependencies
```

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example:**
```
feat(badges): add badge expiration validation

- Add expiresAt field to badge schema
- Implement expiration check in claim flow
- Add unit tests for expiration logic
- Update API documentation

Closes #42
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

See [Git Workflow Guide](./git-workflow.md) for more details.

---

## Tools & Linting

### ESLint Configuration

Both backend and frontend use **ESLint flat config** (no legacy `.eslintrc.*` files).

**Backend** — `backend/eslint.config.mjs` (ESM, `tseslint.config()`):
```javascript
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',       // Relaxed for MVP
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
```

**Frontend** — `frontend/eslint.config.js` (ESM, `defineConfig()`):
```javascript
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: { prettier, 'jsx-a11y': jsxA11y },
    rules: {
      'prettier/prettier': 'warn',
      'react-hooks/set-state-in-effect': 'off',  // TD-021
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
    },
  },
]);
```

> **Note:** Backend `no-explicit-any` is `'off'` (not `'warn'`). This is intentional for MVP phase. Plan to tighten to `'warn'` post-v1.0.

### Prettier Configuration

**Backend** — `backend/.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```
> Uses Prettier defaults for the rest (`printWidth: 80`, `tabWidth: 2`, `semi: true`).

**Frontend** — `frontend/.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```
> Frontend uses `printWidth: 100` (wider) and `trailingComma: "es5"` (less aggressive than backend's `"all"`).

### Pre-commit Hooks (Not Yet Implemented)

> **Status:** Husky + lint-staged are NOT currently installed. CI (`npm run lint` + `npm test`) serves as the quality gate for now. Pre-commit hooks may be added post-v1.0.

<!-- Future implementation:
npm install --save-dev husky lint-staged
npx husky install
-->

---

## Summary Checklist

Before committing code, ensure:

- [ ] Code follows naming conventions
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting applied (`npm run format`)
- [ ] Types checked (`npx tsc --noEmit`)
- [ ] DTOs have validation decorators
- [ ] API endpoints have Swagger documentation
- [ ] Complex functions have JSDoc comments
- [ ] Error handling is appropriate
- [ ] No sensitive data in commits
- [ ] Documentation updated (if API changed)
- [ ] No Chinese characters in source code (English only)
- [ ] No `console.log` in production code (use NestJS Logger / toast)
- [ ] All API calls use `API_BASE_URL`, no hardcoded `/api/...`
- [ ] Controller `@Controller()` prefix includes `api/`

---

**Last Updated:** February 9, 2026  
**Questions?** Ask in team chat or create an issue!
