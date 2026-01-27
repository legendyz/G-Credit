# Sprint 1 Backlog: JWT Authentication & User Management
## Epic 2 - Complete Implementation

**Sprint Number:** Sprint 1  
**Sprint Goal:** Implement complete JWT-based authentication system with user management, enabling secure access and role-based permissions for all G-Credit features  
**Epic:** Epic 2 - 基础认证与用户管理 (Basic JWT Authentication & User Management)  
**Team:** Solo Full-Stack Developer (Part-time, 业余时间)  
**Sprint Duration:** 2 weeks (2026-01-27 to 2026-02-09)  
**Estimated Capacity:** 21 hours  
**Created:** 2026-01-24  
**Status:** Planning

---

## � Technology Version Manifest

> **Purpose:** Explicit version tracking to avoid Sprint 0 issues (Prisma 7→6, NestJS 10→11 version drift)  
> **Last Verified:** 2026-01-25 (Sprint 1 Kickoff Preparation)  
> **Action Item:** AI-1 from Sprint 0 Retrospective

### **Frontend Stack (Actual Versions from Sprint 0)**
- **React:** `19.2.3` ✅ Installed & Verified (⚠️ Updated from 18.3.1 during Sprint 0)
- **Vite:** `7.3.1` ✅ Installed & Verified (⚠️ Updated from 7.2.4)
- **TypeScript:** `5.9.3` ✅ Installed & Verified
- **Tailwind CSS:** `4.1.18` + `@tailwindcss/postcss@4.1.18` ✅ Installed & Verified
- **Shadcn/ui:** Components installed (Button, Card, etc.) ✅
- **Node.js:** `20.20.0 LTS` ✅ Runtime Environment

### **Backend Stack (Actual Versions from Sprint 0)**
- **NestJS Core:** `11.1.12` ✅ Installed & Verified (⚠️ Updated from 11.0.16)
- **NestJS CLI:** `11.0.16` ✅ Installed & Verified
- **@nestjs/config:** `4.0.2` ✅ Installed & Verified (⚠️ Updated from 3.2.3, lodash still present)
- **TypeScript:** `5.9.3` ✅ Installed & Verified (Backend uses same as frontend)
- **Prisma:** `6.19.2` 🔒 **VERSION LOCKED** (Prisma 7 has breaking changes, see Sprint 0 Retrospective)
- **Node.js:** `20.20.0 LTS` ✅ Runtime Environment
- **npm:** `10.8.2` ✅ Package Manager

### **Azure Infrastructure (Deployed & Operational)**
- **PostgreSQL:** Azure Flexible Server B1ms, PostgreSQL 16 ✅
  - Database: `gcredit-dev-db-lz`
  - Connection: Verified via Prisma Studio
- **Blob Storage:** Azure Storage Account Standard LRS ✅
  - Account: `gcreditdevstoragelz`
  - Containers: `badges` (public), `evidence` (private)

### **Sprint 1 New Dependencies (To Be Installed)**

#### **Backend Authentication Packages:**
```bash
# Install exact versions to avoid conflicts
npm install @nestjs/jwt@10.2.0 @nestjs/passport@10.0.3
npm install passport@0.7.0 passport-jwt@4.0.1 passport-local@1.0.0
npm install bcrypt@5.1.1
npm install @types/passport-jwt@4.0.1 @types/passport-local@1.1.0 @types/bcrypt@5.0.2 --save-dev

# Email (Story 2.5 - defer if complex)
npm install nodemailer@6.9.9
npm install @types/nodemailer@6.4.14 --save-dev
```

#### **Frontend State Management (Story 2.7):**
```bash
# Install exact versions
npm install @tanstack/react-query@5.17.9
npm install zustand@4.4.7
npm install react-router-dom@6.21.1
```

### **Known Security Issues (From Sprint 0)**
- ✅ **lodash Prototype Pollution Vulnerability:** 2 moderate severity issues in `@nestjs/config` dependency
  - **Status:** ✅ Risk Accepted (ADR-002, decided 2026-01-25)
  - **Decision:** Accept risk for MVP development (Sprint 1-7), isolated dev environment
  - **CVSS Score:** 6.5 (Medium) - Low exploit risk in current context
  - **Fix Available:** `npm audit fix --force` (breaking change: downgrade @nestjs/config 3.2.3→1.1.5)
  - **Re-evaluation:** Before production deployment (Sprint 8+) or severity escalation
  - **Reference:** [ADR-002](../../docs/decisions/002-lodash-security-risk-acceptance.md)

### **Version Management Best Practices (Learned from Sprint 0)**
1. ✅ **Use exact versions** in package.json (no `^` or `~` for critical packages)
2. ✅ **Lock Prisma at 6.19.2** until post-MVP (Sprint 10+)
3. ✅ **Test all npm installs** in dev environment before committing
4. ✅ **Document version choices** when deviating from latest stable
5. ✅ **Use local binaries** (`node_modules\.bin\prisma`) instead of `npx` to avoid cache issues

### **Compatibility Matrix**
| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| Prisma | 6.19.2 | NestJS 10-11, PostgreSQL 12-16 | ✅ Stable, locked |
| NestJS | 11.0.16 | Node.js 18-20, Prisma 5-6 | ✅ Latest LTS |
| React | 18.3.1 | Node.js 18-20, Vite 5-7 | ✅ Latest stable |
| Vite | 7.2.4 | React 18, Node.js 18-20 | ✅ Latest stable |
| Tailwind | 4.1.18 | Vite 7, PostCSS 8 | ✅ v4 new architecture |

---

## �📋 Sprint Overview

### Sprint Goal Statement
By the end of Sprint 1, the G-Credit system will have a fully functional authentication system where users can register, login with JWT tokens, access features based on their roles (Admin/Issuer/Manager/Employee), reset passwords, manage their profiles, and securely log out. This provides the security foundation required for all subsequent badge management features.

### Success Criteria
- ✅ Users can register and login with email/password
- ✅ JWT access tokens (15 min) and refresh tokens (7 days) working
- ✅ Four RBAC roles enforced (Admin, Issuer, Manager, Employee)
- ✅ Password reset via email operational
- ✅ User profile management working
- ✅ Logout and session invalidation functional
- ✅ All endpoints protected with auth guards
- ✅ Comprehensive audit logging implemented

### Key Dependencies
- ✅ Sprint 0 infrastructure complete (PostgreSQL, NestJS, React)
- ⚠️ SMTP email service configuration (Story 2.5)
- ⚠️ bcrypt, jsonwebtoken, passport-jwt packages

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SMTP email config issues | Medium | High | Use console logging fallback for dev; defer email to Story 2.5 end |
| JWT library version conflicts | Low | Medium | Lock exact versions from start (learned from Sprint 0 Prisma issue) |
| Frontend auth state management complexity | Medium | Medium | Use simple localStorage first, optimize later if needed |
| 21 hours vs 10 hours Sprint 0 (2x workload) | High | High | Internal prioritization (P0/P1/P2), daily progress tracking |

---

## 🎯 Story Breakdown & Execution Plan

### **Phase 1: Database Foundation (Day 1-2, 2 hours)**

#### ✅ **Story 2.1: 创建用户数据模型和数据库表**
**Priority:** P0 (Blocker for all other stories)  
**Estimated Time:** 2 hours  
**Dependencies:** Sprint 0 Prisma setup

**As a Developer, I want to define User entity with Prisma schema and create database tables, so that I can store user accounts with role-based access control.**

**Acceptance Criteria:**
- [x] User model defined in `backend/prisma/schema.prisma`
- [x] User table includes fields: id, email, passwordHash, firstName, lastName, role, isActive, createdAt, updatedAt
- [x] Role enum defined with values: ADMIN, ISSUER, MANAGER, EMPLOYEE
- [x] Email field has unique constraint
- [x] Prisma migration creates User table in PostgreSQL
- [x] Timestamps (createdAt, updatedAt) with auto-generation
- [x] Password field stored as hashed value (bcrypt preparation)
- [x] Database indexes created on email and role fields for performance

**Technical Implementation:**

**Task 2.1.1: Update Prisma Schema** (30 min)
```prisma
// backend/prisma/schema.prisma

enum UserRole {
  ADMIN
  ISSUER
  MANAGER
  EMPLOYEE
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  firstName    String?
  lastName     String?
  role         UserRole  @default(EMPLOYEE)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([email])
  @@index([role])
  @@map("users")
}
```

**Task 2.1.2: Create Migration** (30 min)
```powershell
cd backend
node_modules\.bin\prisma migrate dev --name add_user_model
```
**⚠️ Important:** Use local Prisma binary (not npx) - learned from Sprint 0

**Task 2.1.3: Verify Migration** (30 min)
- Check PostgreSQL table structure
- Test PrismaService connection
- Verify indexes created
- Test basic CRUD operations

**Task 2.1.4: Update PrismaService** (30 min)
- Add User model type exports
- Test in NestJS controller
- Verify TypeScript types

**Definition of Done:**
- ✅ Migration applied successfully in dev database
- ✅ User table visible in Prisma Studio (`npm run prisma:studio`)
- ✅ Email unique constraint tested (duplicate insert fails)
- ✅ Indexes verified with `EXPLAIN` query
- ✅ Git commit: `feat(auth): add User model with RBAC roles`

---

### **Phase 2: Core Authentication (Day 3-7, 12 hours)**

#### ✅ **Story 2.2: 实现用户注册功能**
**Priority:** P0 (Core authentication flow)  
**Estimated Time:** 3 hours  
**Dependencies:** Story 2.1 complete

**As an Administrator, I want to register new users with email and password, so that employees can create accounts to access the G-Credit system.**

**Acceptance Criteria:**
- [x] Password validated for strength (min 8 chars, uppercase, lowercase, number)
- [x] Email format validated and checked for uniqueness
- [x] Password hashed using bcrypt before storage
- [x] User record created with default role EMPLOYEE
- [x] Registration API endpoint `POST /auth/register` returns 201 Created
- [x] Sensitive data (password) not returned in API response
- [x] Registration failure returns appropriate error messages
- [x] Audit log entry created for new user registration

**Technical Implementation:**

**Task 2.2.1: Install Dependencies** (15 min)
```powershell
cd backend
npm install bcrypt @types/bcrypt class-validator class-transformer
```
**⚠️ Version Lock:** Specify exact versions to avoid Sprint 0 Prisma issue:
```json
"bcrypt": "^5.1.1",
"class-validator": "^0.14.0",
"class-transformer": "^0.5.1"
```

**Task 2.2.2: Create Auth Module** (30 min)
```powershell
cd backend/src
mkdir -p modules/auth
# Create: auth.module.ts, auth.controller.ts, auth.service.ts
```

**Task 2.2.3: Implement Registration DTO** (20 min)
```typescript
// backend/src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
```

**Task 2.2.4: Implement AuthService.register()** (45 min)
```typescript
// backend/src/modules/auth/auth.service.ts
import * as bcrypt from 'bcrypt';

async register(dto: RegisterDto) {
  // 1. Check email uniqueness
  const exists = await this.prisma.user.findUnique({
    where: { email: dto.email }
  });
  if (exists) throw new ConflictException('Email already registered');

  // 2. Hash password (10 salt rounds)
  const passwordHash = await bcrypt.hash(dto.password, 10);

  // 3. Create user with EMPLOYEE role
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'EMPLOYEE', // Default role
    },
  });

  // 4. Create audit log (Story 2.2.8)
  
  // 5. Return user without password
  const { passwordHash: _, ...result } = user;
  return result;
}
```

**Task 2.2.5: Create Auth Controller** (20 min)
```typescript
// backend/src/modules/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

**Task 2.2.6: Frontend Registration Form** (45 min)
```typescript
// frontend/src/pages/RegisterPage.tsx
// - Form with email, password, firstName, lastName fields
// - Client-side password validation
// - API call to POST /auth/register
// - Success redirect to login page
// - Error handling and display
```

**Task 2.2.7: Test Registration Flow** (30 min)
- Valid registration succeeds
- Duplicate email fails with 409
- Weak password fails with 400
- Invalid email format fails
- Empty fields fail validation

**Task 2.2.8: Add Audit Logging** (15 min)
- Create simple audit log utility
- Log: timestamp, action, userId, ipAddress, success/failure

**Definition of Done:**
- ✅ Can register new user via API and frontend form
- ✅ Password stored as bcrypt hash (never plain text)
- ✅ Duplicate email registration fails gracefully
- ✅ All validation rules enforced
- ✅ Postman/Thunder Client request tested
- ✅ Git commit: `feat(auth): implement user registration with bcrypt`

---

#### ✅ **Story 2.3: 实现JWT登录认证**
**Priority:** P0 (Core authentication flow)  
**Estimated Time:** 4 hours  
**Dependencies:** Story 2.2 complete

**As an Employee, I want to log in with email and password to receive authentication tokens, so that I can access protected features of the application.**

**Acceptance Criteria:**
- [x] Backend validates credentials against database
- [x] JWT access token generated with user id, email, role in payload
- [x] JWT refresh token generated with longer expiration
- [x] Access token expires in 15 minutes
- [x] Refresh token expires in 7 days
- [x] Login API endpoint `POST /auth/login` returns tokens and user profile
- [x] Invalid credentials return 401 Unauthorized
- [x] Inactive users cannot log in (isActive check)
- [x] Rate limiting prevents brute force (max 5 failed attempts per 15 min per IP)
- [x] Account locked after 5 consecutive failed attempts (15 min lockout)
- [x] Audit log entry for successful/failed login attempts

**Technical Implementation:**

**Task 2.3.1: Install JWT Dependencies** (15 min)
```powershell
cd backend
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

**Task 2.3.2: Configure JWT Module** (30 min)
```typescript
// backend/src/modules/auth/auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
})
```

**Task 2.3.3: Add JWT Secrets to .env** (10 min)
```env
# backend/.env
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-access
```
**⚠️ Security:** Generate strong random secrets, never commit to Git

**Task 2.3.4: Implement Login DTO** (15 min)
```typescript
// backend/src/modules/auth/dto/login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**Task 2.3.5: Implement AuthService.login()** (60 min)
```typescript
// backend/src/modules/auth/auth.service.ts
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

async login(dto: LoginDto) {
  // 1. Find user by email
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email }
  });
  if (!user) throw new UnauthorizedException('Invalid credentials');

  // 2. Check isActive status
  if (!user.isActive) {
    throw new UnauthorizedException('Account is inactive');
  }

  // 3. Verify password
  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) {
    // Log failed attempt (rate limiting - Task 2.3.9)
    throw new UnauthorizedException('Invalid credentials');
  }

  // 4. Generate access token (15 min expiry)
  const accessToken = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  // 5. Generate refresh token (7 days expiry)
  const refreshToken = this.jwtService.sign(
    { sub: user.id },
    { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' }
  );

  // 6. Create audit log
  
  // 7. Return tokens + user profile
  const { passwordHash: _, ...userProfile } = user;
  return {
    accessToken,
    refreshToken,
    user: userProfile,
  };
}
```

**Task 2.3.6: Create JWT Strategy** (45 min)
```typescript
// backend/src/modules/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

**Task 2.3.7: Frontend Login Form** (60 min)
```typescript
// frontend/src/pages/LoginPage.tsx
// - Email and password fields
// - Form submission to POST /auth/login
// - Store accessToken and refreshToken in localStorage
// - Navigate to dashboard on success
// - Display error messages on failure
// - "Forgot Password?" link (Story 2.5)
```

**Task 2.3.8: Frontend Auth Context** (45 min)
```typescript
// frontend/src/contexts/AuthContext.tsx
// - Store current user and tokens
// - Login/logout functions
// - isAuthenticated computed property
// - Axios interceptor for auth header
```

**Task 2.3.9: Implement Rate Limiting** (30 min)
```typescript
// Use @nestjs/throttler or simple in-memory cache
// Track failed attempts by IP address
// Lock account after 5 failures for 15 minutes
```

**Definition of Done:**
- ✅ Can login with valid credentials via API and frontend
- ✅ Receive access token and refresh token
- ✅ JWT payload contains userId, email, role
- ✅ Invalid credentials return 401
- ✅ Inactive users cannot login
- ✅ Tokens stored in localStorage (frontend)
- ✅ Rate limiting prevents brute force
- ✅ Git commit: `feat(auth): implement JWT login with rate limiting`

---

#### ✅ **Story 2.4: 实现RBAC角色权限系统**
**Priority:** P0 (Security foundation)  
**Estimated Time:** 3 hours  
**Dependencies:** Story 2.3 complete

**As a Developer, I want to implement role-based access control with four roles and permission guards, so that different user types have appropriate access levels.**

**Acceptance Criteria:**
- [x] JWT token validated on each request
- [x] User role extracted from JWT payload
- [x] Four roles enforced: ADMIN (full access), ISSUER (badge management), MANAGER (nominations), EMPLOYEE (wallet access)
- [x] Role-based guards/decorators implemented in NestJS
- [x] Unauthorized access returns 403 Forbidden
- [x] Admin role can access all endpoints
- [x] Role hierarchy documented in code comments
- [x] Protected endpoints include role requirements in API documentation

**Technical Implementation:**

**Task 2.4.1: Create JWT Auth Guard** (30 min)
```typescript
// backend/src/common/guards/jwt-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Task 2.4.2: Create Roles Decorator** (20 min)
```typescript
// backend/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Task 2.4.3: Create Roles Guard** (45 min)
```typescript
// backend/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles) return true; // No roles required

    const { user } = context.switchToHttp().getRequest();
    
    // Admin has access to everything
    if (user.role === 'ADMIN') return true;

    // Check if user has required role
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**Task 2.4.4: Create Current User Decorator** (15 min)
```typescript
// backend/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Task 2.4.5: Apply Guards to AppModule** (20 min)
```typescript
// backend/src/app.module.ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply to all routes by default
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
```

**Task 2.4.6: Mark Public Routes** (15 min)
```typescript
// backend/src/common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Use on auth routes:
@Public()
@Post('login')
login() {}

@Public()
@Post('register')
register() {}
```

**Task 2.4.7: Create Test Protected Endpoint** (30 min)
```typescript
// backend/src/app.controller.ts
@Get('profile')
@Roles('EMPLOYEE', 'MANAGER', 'ISSUER', 'ADMIN')
getProfile(@CurrentUser() user: any) {
  return user;
}

@Get('admin-only')
@Roles('ADMIN')
adminRoute() {
  return { message: 'Admin access granted' };
}
```

**Task 2.4.8: Test RBAC** (45 min)
- Login as EMPLOYEE, try admin route → 403
- Login as ADMIN, try admin route → 200
- Access public routes without token → 200
- Access protected routes without token → 401
- Verify JWT strategy validates tokens correctly

**Definition of Done:**
- ✅ All routes protected by JwtAuthGuard by default
- ✅ Public routes (login, register) work without token
- ✅ Role-based access enforced (403 for unauthorized roles)
- ✅ @CurrentUser() decorator extracts user from JWT
- ✅ Admin can access all endpoints
- ✅ Role hierarchy documented
- ✅ Git commit: `feat(auth): implement RBAC with four roles`

---

### **Phase 3: Enhanced Features (Day 8-12, 9 hours)**

#### ✅ **Story 2.7: 实现会话管理和登出**
**Priority:** P1 (Essential for good UX)  
**Estimated Time:** 2 hours  
**Dependencies:** Story 2.3 complete

**As an Employee, I want to securely log out and invalidate my authentication tokens, so that my session is terminated when I leave the application.**

**Acceptance Criteria:**
- [x] Logout API endpoint `POST /auth/logout` called
- [x] Refresh token invalidated/removed from system
- [x] Client-side tokens (access and refresh) cleared from storage
- [x] User redirected to login page
- [x] Subsequent API requests with old tokens return 401 Unauthorized
- [x] Token refresh endpoint `POST /auth/refresh` validates refresh token
- [x] New access token issued when valid refresh token provided
- [x] Expired refresh tokens cannot be used
- [x] Audit log entry created for logout actions

**Technical Implementation:**

**Task 2.7.1: Create RefreshToken Model** (30 min)
```prisma
// backend/prisma/schema.prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  isRevoked Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

// Add to User model:
model User {
  // ... existing fields
  refreshTokens RefreshToken[]
}
```

**Task 2.7.2: Run Migration** (10 min)
```powershell
node_modules\.bin\prisma migrate dev --name add_refresh_tokens
```

**Task 2.7.3: Update AuthService.login()** (20 min)
```typescript
// Store refresh token in database
async login(dto: LoginDto) {
  // ... existing code

  const refreshToken = this.jwtService.sign(
    { sub: user.id },
    { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' }
  );

  // Store in database
  await this.prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { accessToken, refreshToken, user: userProfile };
}
```

**Task 2.7.4: Implement Token Refresh** (30 min)
```typescript
// backend/src/modules/auth/auth.service.ts
async refreshAccessToken(refreshToken: string) {
  // 1. Verify refresh token JWT signature
  let payload;
  try {
    payload = this.jwtService.verify(refreshToken, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 2. Check if token exists in database and not revoked
  const tokenRecord = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.isRevoked) {
    throw new UnauthorizedException('Refresh token revoked');
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token expired');
  }

  // 3. Generate new access token
  const accessToken = this.jwtService.sign({
    sub: tokenRecord.user.id,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role,
  });

  return { accessToken };
}
```

**Task 2.7.5: Implement Logout** (20 min)
```typescript
// backend/src/modules/auth/auth.service.ts
async logout(refreshToken: string) {
  // Revoke refresh token in database
  await this.prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });

  // Create audit log
  
  return { message: 'Logged out successfully' };
}
```

**Task 2.7.6: Create Auth Endpoints** (15 min)
```typescript
// backend/src/modules/auth/auth.controller.ts
@Post('refresh')
@Public()
async refresh(@Body('refreshToken') token: string) {
  return this.authService.refreshAccessToken(token);
}

@Post('logout')
async logout(@Body('refreshToken') token: string) {
  return this.authService.logout(token);
}
```

**Task 2.7.7: Frontend Logout Function** (20 min)
```typescript
// frontend/src/contexts/AuthContext.tsx
const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  await api.post('/auth/logout', { refreshToken });
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
  navigate('/login');
};
```

**Task 2.7.8: Frontend Token Refresh Interceptor** (35 min)
```typescript
// frontend/src/lib/axios.ts
// Intercept 401 responses
// Attempt token refresh with refreshToken
// Retry original request with new accessToken
// If refresh fails, redirect to login
```

**Definition of Done:**
- ✅ Logout button clears tokens and redirects
- ✅ Refresh token stored in database
- ✅ Token refresh works when access token expires
- ✅ Revoked tokens cannot be used
- ✅ Axios interceptor handles 401 gracefully
- ✅ Git commit: `feat(auth): implement logout and token refresh`

---

#### ✅ **Story 2.5: 实现密码重置流程**
**Priority:** P2 (Important but not blocking)  
**Estimated Time:** 4 hours  
**Dependencies:** Story 2.2 complete, SMTP configured

**As an Employee, I want to reset my password via email verification, so that I can regain access if I forget my credentials.**

**Acceptance Criteria:**
- [x] User requests password reset with email address
- [x] System generates secure reset token with 1-hour expiration
- [x] Reset token stored in database with userId and expiresAt
- [x] Email sent with password reset link containing token
- [x] Reset link directs to password reset form
- [x] User submits new password with valid token
- [x] New password validated and hashed with bcrypt
- [x] User password updated in database
- [x] Reset token invalidated after successful use
- [x] Expired or invalid tokens return appropriate error messages
- [x] Audit log entry created for password reset actions

**Technical Implementation:**

**Task 2.5.1: Install Email Library** (15 min)
```powershell
cd backend
npm install nodemailer @types/nodemailer
```

**Task 2.5.2: Configure SMTP in .env** (20 min)
```env
# backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@gcredit.com
```
**⚠️ Dev Tip:** For development, use console logging fallback if SMTP fails

**Task 2.5.3: Create PasswordResetToken Model** (30 min)
```prisma
// backend/prisma/schema.prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("password_reset_tokens")
}

// Add to User model:
model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]
}
```
Run migration: `node_modules\.bin\prisma migrate dev --name add_password_reset_tokens`

**Task 2.5.4: Create Email Service** (45 min)
```typescript
// backend/src/common/email/email.service.ts
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get('SMTP_PORT'),
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
    
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: email,
      subject: 'G-Credit Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}
```

**Task 2.5.5: Implement Request Reset** (40 min)
```typescript
// backend/src/modules/auth/auth.service.ts
async requestPasswordReset(email: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists (security)
    return { message: 'If email exists, reset link sent' };
  }

  // Generate secure token
  const token = randomBytes(32).toString('hex');

  // Store in database
  await this.prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // Send email
  await this.emailService.sendPasswordReset(user.email, token);

  return { message: 'If email exists, reset link sent' };
}
```

**Task 2.5.6: Implement Reset Password** (40 min)
```typescript
// backend/src/modules/auth/auth.service.ts
async resetPassword(token: string, newPassword: string) {
  // 1. Find token in database
  const resetToken = await this.prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.used) {
    throw new BadRequestException('Invalid or expired token');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new BadRequestException('Token has expired');
  }

  // 2. Validate new password (same rules as registration)
  // ... password strength validation

  // 3. Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // 4. Update user password
  await this.prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  // 5. Mark token as used
  await this.prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  // 6. Create audit log

  return { message: 'Password reset successfully' };
}
```

**Task 2.5.7: Create DTOs and Endpoints** (30 min)
```typescript
// backend/src/modules/auth/auth.controller.ts
@Post('request-reset')
@Public()
async requestReset(@Body('email') email: string) {
  return this.authService.requestPasswordReset(email);
}

@Post('reset-password')
@Public()
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}
```

**Task 2.5.8: Frontend Forgot Password Page** (40 min)
```typescript
// frontend/src/pages/ForgotPasswordPage.tsx
// - Email input form
// - Submit to POST /auth/request-reset
// - Show success message (don't reveal if email exists)
```

**Task 2.5.9: Frontend Reset Password Page** (40 min)
```typescript
// frontend/src/pages/ResetPasswordPage.tsx
// - Extract token from URL query params
// - New password and confirm password fields
// - Submit to POST /auth/reset-password
// - Redirect to login on success
// - Handle expired/invalid token errors
```

**Definition of Done:**
- ✅ Can request password reset via email
- ✅ Email received with reset link
- ✅ Reset link opens password reset form
- ✅ New password successfully updates account
- ✅ Token expires after 1 hour
- ✅ Used token cannot be reused
- ✅ Git commit: `feat(auth): implement password reset via email`

---

#### ✅ **Story 2.6: 创建用户资料管理页面**
**Priority:** P2 (Nice to have for MVP)  
**Estimated Time:** 3 hours  
**Dependencies:** Story 2.3 complete

**As an Employee, I want to view and edit my profile information, so that I can keep my account details up to date.**

**Acceptance Criteria:**
- [x] Profile page displays current user information (firstName, lastName, email, role)
- [x] User can edit firstName and lastName fields
- [x] Email field is read-only (requires separate verification flow)
- [x] Profile update API endpoint `PUT /users/profile` works
- [x] Updated profile data saved to database
- [x] Success message displayed after profile update
- [x] Profile page is mobile-responsive
- [x] Form validation prevents empty required fields
- [x] Audit log entry created for profile updates

**Technical Implementation:**

**Task 2.6.1: Create Users Module** (20 min)
```powershell
cd backend/src/modules
mkdir users
# Create: users.module.ts, users.controller.ts, users.service.ts
```

**Task 2.6.2: Implement Get Profile** (30 min)
```typescript
// backend/src/modules/users/users.controller.ts
@Controller('users')
export class UsersController {
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.usersService.findById(user.userId);
    const { passwordHash, ...result } = profile;
    return result;
  }
}

// backend/src/modules/users/users.service.ts
async findById(id: string) {
  return this.prisma.user.findUnique({ where: { id } });
}
```

**Task 2.6.3: Implement Update Profile** (40 min)
```typescript
// backend/src/modules/users/dto/update-profile.dto.ts
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

// backend/src/modules/users/users.controller.ts
@Put('profile')
async updateProfile(
  @CurrentUser() user: any,
  @Body() dto: UpdateProfileDto,
) {
  const updated = await this.usersService.update(user.userId, dto);
  const { passwordHash, ...result } = updated;
  return result;
}

// backend/src/modules/users/users.service.ts
async update(id: string, dto: UpdateProfileDto) {
  return this.prisma.user.update({
    where: { id },
    data: dto,
  });
}
```

**Task 2.6.4: Frontend Profile Page** (90 min)
```typescript
// frontend/src/pages/ProfilePage.tsx
// Layout:
// - Display current user info (email read-only, role badge)
// - Editable fields: firstName, lastName
// - Save button
// - Success/error toast notifications
// - Mobile-responsive design (Tailwind CSS)

// API calls:
// - GET /users/profile on mount
// - PUT /users/profile on save
// - Update AuthContext user state after save
```

**Task 2.6.5: Add Navigation Link** (10 min)
```typescript
// frontend/src/components/Layout/Header.tsx
// Add "Profile" link to user dropdown menu
```

**Task 2.6.6: Test Profile Management** (30 min)
- Load profile page shows correct data
- Edit firstName/lastName and save
- Verify changes persist in database
- Email field is disabled
- Form validation works (empty fields)
- Mobile view is responsive

**Definition of Done:**
- ✅ Profile page displays user information
- ✅ Can edit and save firstName/lastName
- ✅ Email is read-only
- ✅ Changes saved to database
- ✅ UI is mobile-responsive
- ✅ Git commit: `feat(users): implement profile management page`

---

## 📊 Sprint Summary

### Total Story Count: 7 Stories
- **P0 (Must Complete):** Stories 2.1-2.4 (12 hours)
- **P1 (Should Complete):** Story 2.7 (2 hours)
- **P2 (Nice to Have):** Stories 2.5-2.6 (7 hours)

### Estimated Effort by Phase
| Phase | Stories | Hours | Days |
|-------|---------|-------|------|
| Phase 1: Database Foundation | 2.1 | 2h | Day 1-2 |
| Phase 2: Core Authentication | 2.2-2.4 | 10h | Day 3-7 |
| Phase 3: Enhanced Features | 2.5-2.7 | 9h | Day 8-12 |
| **Total** | **7 Stories** | **21h** | **12 days** |

### Daily Breakdown (Suggested)
- **Day 1-2:** Story 2.1 (Database setup)
- **Day 3-4:** Story 2.2 (User registration)
- **Day 5-6:** Story 2.3 (JWT login)
- **Day 7:** Story 2.4 (RBAC)
- **Day 8:** Story 2.7 (Logout & refresh)
- **Day 9-10:** Story 2.5 (Password reset)
- **Day 11-12:** Story 2.6 (Profile management)

---

## ✅ Definition of Done (Sprint Level)

A story is considered **DONE** when:
- [x] All acceptance criteria met
- [x] Code written following TypeScript strict mode
- [x] Backend API tested with Postman/Thunder Client
- [x] Frontend UI tested in browser (Chrome, mobile view)
- [x] No TypeScript compilation errors
- [x] Git commit with descriptive message
- [x] Changes pushed to GitHub
- [x] Basic manual testing completed
- [x] Audit log entries verified (where applicable)

Sprint 1 is considered **COMPLETE** when:
- [x] All P0 stories (2.1-2.4) are DONE
- [x] At least 1 P1/P2 story is DONE
- [x] Full authentication flow works end-to-end
- [x] Can register, login, access protected routes, logout
- [x] Sprint 1 retrospective completed

---

## 🚨 Risks & Mitigation Strategies

### High Priority Risks

**1. SMTP Email Configuration Issues (Story 2.5)**
- **Likelihood:** Medium
- **Impact:** Blocks password reset
- **Mitigation:** 
  - Implement console logging fallback for dev
  - Test with Gmail App Password first (simplest)
  - Defer email testing to end of Story 2.5
  - Can use Mailtrap.io for dev testing

**2. 21 Hour Sprint (2x Sprint 0 workload)**
- **Likelihood:** High
- **Impact:** Sprint failure, burnout
- **Mitigation:**
  - Strict internal prioritization (P0 > P1 > P2)
  - Daily progress check: "Am I on track?"
  - If behind by Day 5, consider dropping P2 stories
  - P0 stories (2.1-2.4) are only 12 hours - achievable

**3. Frontend State Management Complexity**
- **Likelihood:** Medium
- **Impact:** Debugging time, delayed stories
- **Mitigation:**
  - Start simple: localStorage + React Context
  - Don't over-engineer (no Redux needed yet)
  - Copy patterns from successful projects

**4. JWT Security Best Practices**
- **Likelihood:** Low (well-documented)
- **Impact:** Security vulnerabilities
- **Mitigation:**
  - Follow NestJS JWT documentation exactly
  - Use httpOnly cookies (Phase 2 improvement)
  - Store refresh tokens in database (Story 2.7)

---

## 📚 Reference Materials

### Key Documentation
- **NestJS JWT Authentication:** https://docs.nestjs.com/security/authentication
- **Passport.js JWT Strategy:** http://www.passportjs.org/packages/passport-jwt/
- **bcrypt Usage:** https://www.npmjs.com/package/bcrypt
- **Nodemailer Guide:** https://nodemailer.com/
- **React Context API:** https://react.dev/reference/react/useContext

### Sprint 0 Learnings Applied
- ✅ Lock package versions explicitly (no `@latest`)
- ✅ Use `node_modules\.bin\prisma` (not npx)
- ✅ Test after EVERY story completion
- ✅ Commit frequently (per story or task)
- ✅ Document issues in sprint backlog immediately
- ✅ Keep NestJS dev server running (watch mode)

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint + Prettier configured
- No `any` types (use proper interfaces)
- Follow NestJS module structure
- RESTful API conventions
- Consistent error handling

---

## 🎯 Success Metrics

**Sprint Velocity:**
- Target: 21 hours estimated, ±20% variance acceptable (17-25h actual)
- Minimum success: P0 stories (12h) completed

**Quality Metrics:**
- Zero critical bugs blocking Sprint 2
- All endpoints return proper HTTP status codes
- Frontend UX is intuitive (subjective, but test yourself)
- Code is readable and maintainable

**Learning Metrics:**
- Applied at least 3 lessons from Sprint 0 retrospective
- Documented 1+ new learnings for Sprint 1 retrospective

---

## 🔄 Daily Standup Questions (Self-Check)

**Every Day (5 minutes):**
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers or concerns?
4. Am I on track for the 2-week timeline?

**Red Flags (Consider Adjusting Scope):**
- 🚩 Day 5: Still working on Story 2.2 (registration)
- 🚩 Day 8: Haven't started Story 2.4 (RBAC)
- 🚩 Day 10: P0 stories not complete

---

## 📝 Sprint Planning Checklist

**Before Starting Sprint 1:**
- [ ] Review Sprint 0 retrospective action items (AI-1, AI-2, AI-3)
- [ ] Verify Sprint 0 infrastructure still working (database, storage)
- [ ] Check npm audit for new vulnerabilities
- [ ] Lock package versions in package.json
- [ ] Read this backlog document completely
- [ ] Set up calendar reminders for daily progress checks
- [ ] Prepare SMTP credentials for Story 2.5

**During Sprint 1:**
- [ ] Commit after each story completion
- [ ] Test manually after each story
- [ ] Update this backlog with actual hours spent
- [ ] Document any issues or surprises
- [ ] Take breaks (avoid burnout)

**After Sprint 1:**
- [ ] Complete Sprint 1 retrospective (copy Sprint 0 format)
- [ ] Update project-context.md with Sprint 1 status
- [ ] Plan Sprint 2 (Epic 3: Badge Template Management)
- [ ] Celebrate completion! 🎉

---

## 🎉 Let's Do This!

**You've got this, LegendZhu!** 💪

Sprint 0 proved you can deliver high-quality work on schedule. Sprint 1 is more ambitious, but Epic 2 is well-defined and the technical path is clear.

**Key Mindset:**
- Focus on P0 stories first (Stories 2.1-2.4)
- Don't over-engineer - MVP first, polish later
- If stuck for >30 min, document the blocker and move on
- Every completed story is progress, even if not all 7 finish

**Next Step:** 
Commit this backlog, take a break, and start Story 2.1 when ready!

```powershell
git add _bmad-output/implementation-artifacts/sprint-1-backlog.md
git commit -m "docs(sprint-1): create comprehensive Sprint 1 backlog for Epic 2

Sprint 1 Planning Complete:
- 7 stories from Epic 2 (JWT Auth & User Management)
- Total estimated effort: 21 hours over 2 weeks
- Prioritized: P0 (12h), P1 (2h), P2 (7h)
- Detailed technical implementation tasks
- Risk mitigation strategies applied
- Sprint 0 lessons integrated

Ready to start development!"
git push origin main
```

---

## 📌 Future Requirements (Deferred from Sprint 1)

### **FR-001: Enterprise Email OAuth2 Integration**
**Created:** 2026-01-25  
**Priority:** Medium (for enterprise deployment)  
**Category:** Production Security Enhancement  
**Estimated Effort:** 2-3 hours

**Background:**
During Sprint 1 Story 2.5 (Password Reset via Email) development, we investigated implementing OAuth2 authentication for Outlook email sending to support enterprise environments. After research, we discovered that:
- Personal Microsoft accounts (outlook.com, hotmail.com) do **not** have Azure Active Directory access
- OAuth2 "Client Credentials Flow" requires Azure AD (enterprise/school accounts only)
- Personal accounts can only use "Authorization Code Flow" (requires user login)
- Current development uses console output mode (no real email sending)

**Decision:**
Deferred OAuth2 implementation to focus on core Sprint 1 authentication features. Current EmailService supports dual mode (dev console output / production SMTP with app password), which is sufficient for MVP demonstration.

**Alternative Solution for Testing/Demo:**
For real email testing during development or demonstrations, **use Gmail with App Password** (recommended):
- ✅ Quick setup: 10-15 minutes
- ✅ No code changes needed (EmailService already supports SMTP)
- ✅ Works with personal accounts (no Azure AD required)
- ✅ Suitable for MVP/demo environments
- Configuration template available: `backend/.env.email-test`
- Setup guide: `backend/EMAIL_SETUP_QUICK.md`

**Steps to enable Gmail testing:**
1. Enable 2-Step Verification in Google Account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Copy `.env.email-test` to `.env` with your Gmail credentials
4. Set `NODE_ENV=production` in `.env`
5. Restart backend and run `test-email-real.ps1`

**Future Requirements:**
When deploying to enterprise environment with Microsoft 365 accounts (which have Azure AD):

1. **Implement OAuth2 Client Credentials Flow:**
   - Register app in Azure Portal (Microsoft Entra ID)
   - Configure API permissions: `Mail.Send`, `offline_access`
   - Obtain tenant admin consent
   - Create OAuth2TokenService to manage token lifecycle
   - Modify EmailService to support OAuth2 authentication
   - Implement token caching and automatic refresh

2. **Technical Dependencies:**
   - `@azure/identity` or `@azure/msal-node` (OAuth2 client library)
   - Azure AD application registration
   - Client ID, Client Secret, Tenant ID configuration
   - Update .env with OAuth2 credentials

3. **Configuration:**
   ```env
   EMAIL_AUTH_METHOD=oauth2  # or 'password' for app password
   AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   AZURE_CLIENT_SECRET=your-client-secret
   ```

4. **Code Changes:**
   - New file: `src/common/oauth2-token.service.ts`
   - Update: `src/common/email.service.ts` (add OAuth2 support)
   - Update: `src/common/common.module.ts` (inject OAuth2TokenService)
   - Test script: `test-oauth2-email.ps1`

**References:**
- Microsoft Docs: [Authenticate IMAP/POP/SMTP using OAuth](https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth)
- SMTP with OAuth2: `smtp-mail.outlook.com:587`
- Scope: `https://outlook.office365.com/.default`

**Suggested Implementation Timeline:**
- Target: Sprint 8+ (Pre-production preparation)
- Or: When enterprise Microsoft 365 account becomes available
- Alternative: Use SendGrid/AWS SES for production (simpler than OAuth2)

**Status:** 🔮 Future / Not Started  
**Owner:** TBD (when enterprise deployment planned)

---

**Good luck with Sprint 1! 🚀 See you at the Sprint 1 retrospective!**
