# Coding Standards

This document defines coding standards and best practices for the GCredit project to ensure consistency, maintainability, and code quality across the codebase.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Standards](#typescript-standards)
- [NestJS Backend Standards](#nestjs-backend-standards)
- [React Frontend Standards](#react-frontend-standards)
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
@Controller('badges')
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
export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchBadges() {
    setLoading(true);
    const data = await api.get('/badges/my-badges');
    setBadges(data);
    setLoading(false);
  }

  return { badges, loading, fetchBadges };
}

// Usage in component:
const { badges, loading, fetchBadges } = useBadges();
```

### State Management

**✅ Use React Context for global state:**
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Implementation

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Naming Conventions

### Files & Folders

| Type | Convention | Example |
|------|------------|---------|
| **Modules** | kebab-case | `badge-issuance/` |
| **Components** | PascalCase | `BadgeCard.tsx` |
| **Services** | kebab-case | `badge.service.ts` |
| **DTOs** | kebab-case | `create-badge.dto.ts` |
| **Interfaces** | PascalCase | `Badge.interface.ts` |
| **Tests** | same + .spec | `badge.service.spec.ts` |
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

**✅ Use TODO comments:**
```typescript
// TODO: Implement batch badge revocation
// TODO(username): Add pagination to this endpoint
// FIXME: Race condition when claiming same badge simultaneously
```

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

Already configured in `backend/.eslintrc.js`:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

### Prettier Configuration

`.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "semi": true
}
```

### Pre-commit Hooks (Recommended)

Install husky + lint-staged:
```bash
npm install --save-dev husky lint-staged
npx husky install
```

`.husky/pre-commit`:
```bash
#!/bin/sh
npx lint-staged
```

`package.json`:
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "npm test -- --findRelatedTests"
    ]
  }
}
```

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

---

**Last Updated:** January 27, 2026  
**Questions?** Ask in team chat or create an issue!
