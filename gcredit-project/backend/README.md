# G-Credit Backend API

NestJS-based REST API for the G-Credit digital credentialing system.

## ✨ Current Features

### Sprint 2 (v0.2.0) - Badge Template Management ✅
- **Badge Template CRUD** - Create, read, update, delete badge templates
- **Azure Blob Storage** - Image upload and management (5MB limit, MIME validation)
- **Skill Management** - Associate skills with badge templates
- **Skill Categories** - Hierarchical skill categorization (parent/child)
- **Advanced Search** - Full-text search across name/description
- **Query API** - Public and admin endpoints with pagination and filtering
- **Issuance Criteria** - Define and validate badge earning requirements

### Sprint 1 (v0.1.0) - Authentication & Authorization ✅
- **JWT Authentication** - Secure token-based authentication
- **User Management** - User CRUD with role-based access control
- **Role System** - ADMIN, ISSUER, MANAGER, EMPLOYEE roles
- **Password Security** - bcrypt hashing with salt rounds

### Sprint 0 (v0.0.1) - Foundation ✅
- **NestJS Setup** - Modern TypeScript framework
- **Prisma ORM** - Type-safe database access
- **Azure PostgreSQL** - Cloud database with SSL
- **Swagger Documentation** - Auto-generated API docs at `/api-docs`

## 🚀 Tech Stack

- **NestJS** 11.0.16 - Progressive Node.js framework
- **TypeScript** 5.7.3 - Strict mode enabled
- **Prisma** 6.19.2 - Next-generation ORM
- **PostgreSQL** 16 - Azure Flexible Server
- **Azure Blob Storage** - Badge and evidence file storage
- **@nestjs/config** - Environment configuration
- **Jest** - Testing framework

## 📋 Prerequisites

- Node.js 20.20.0 LTS
- npm 10+
- Azure PostgreSQL Flexible Server
- Azure Blob Storage Account

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://username:password@host:5432/postgres?sslmode=require"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_ACCOUNT_NAME="your-storage-account"
AZURE_STORAGE_CONTAINER_BADGES="badges"
AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### 3. Run Database Migrations

**Important:** Use local Prisma (not npx) to avoid version conflicts:

```bash
node_modules\.bin\prisma migrate dev
```

### 4. Start Development Server

```bash
npm run start:dev
```

Server will start at **http://localhost:3000**

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in watch mode (auto-reload) |
| `npm run start` | Start in production mode |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |

## 🗄️ Prisma Commands

**Always use local Prisma to avoid version conflicts:**

```bash
# Create and apply migration
node_modules\.bin\prisma migrate dev --name <migration-name>

# Open Prisma Studio (database GUI)
node_modules\.bin\prisma studio

# Regenerate Prisma Client
node_modules\.bin\prisma generate

# Push schema without creating migration (dev only)
node_modules\.bin\prisma db push

# Reset database (warning: deletes all data!)
node_modules\.bin\prisma migrate reset
```

## 📡 API Endpoints

### Authentication Endpoints (Sprint 1 ✅)

**POST /auth/register** - User registration
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE"
}
```

**POST /auth/login** - JWT login
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "id": "...", "email": "...", "role": "..." }
}
```

**POST /auth/request-reset** - Request password reset
```json
{
  "email": "user@example.com"
}
```

**POST /auth/reset-password** - Reset password
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123"
}
```

**POST /auth/refresh** - Refresh access token
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**POST /auth/logout** - Logout (revoke refresh token)
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**GET /auth/profile** - Get user profile (requires authentication)

**PATCH /auth/profile** - Update user profile (requires authentication)
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**POST /auth/change-password** - Change password (requires authentication)
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

### Health Check Endpoints

**GET /health** - Liveness probe
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T..."
}
```

**GET /ready** - Readiness probe
```json
{
  "database": "connected",
  "storage": "connected"
}
```

### Test Endpoints (Development Only)
- GET /profile - Test protected route (all authenticated users)
- GET /admin-only - Test admin role
- GET /issuer-only - Test issuer role
- GET /manager-only - Test manager role

### Coming in Sprint 2
- Badge Template Management (CRUD)
- Badge Catalog
- Badge Criteria Definition

## � API Endpoints

All endpoints require JWT authentication unless marked as public.

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/profile` - Get current user profile

### Badge Templates
- `POST /api/badge-templates` - Create badge template (with image upload)
- `GET /api/badge-templates` - Public: List active badges (paginated)
- `GET /api/badge-templates/admin` - Admin: List all badges (paginated)
- `GET /api/badge-templates/:id` - Get badge by ID
- `PUT /api/badge-templates/:id` - Update badge (with image replacement)
- `DELETE /api/badge-templates/:id` - Delete badge (cascades to Blob)
- `GET /api/badge-templates/search` - Full-text search badges

### Skills
- `POST /api/badge-templates/skills` - Create skill
- `GET /api/badge-templates/skills` - List all skills
- `GET /api/badge-templates/skills/:id` - Get skill by ID
- `PUT /api/badge-templates/skills/:id` - Update skill
- `DELETE /api/badge-templates/skills/:id` - Delete skill

### Skill Categories
- `GET /api/badge-templates/categories` - List all categories (hierarchical)
- `POST /api/badge-templates/categories` - Create category
- `GET /api/badge-templates/categories/:id` - Get category by ID
- `PUT /api/badge-templates/categories/:id` - Update category
- `DELETE /api/badge-templates/categories/:id` - Delete category

## 🧪 Testing

### Test Suite Statistics (Sprint 2 Final)

**Total: 27 Tests (100% Pass Rate)**

| Test Type | Count | Pass Rate | Duration | Purpose |
|-----------|-------|-----------|----------|----------|
| Unit Tests | 1 | 100% | 1.9s | Component isolation testing |
| Jest E2E Tests | 19 | 100% | 21.9s | Automated end-to-end API testing |
| PowerShell E2E | 7 | 100% | ~10s | Quick smoke tests |

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests (requires running server)
npm run test:e2e

# PowerShell E2E tests
.\test-sprint-2-quick.ps1

# Test coverage report
npm run test:cov
```

### Test Coverage

- **Story 3.1**: Data model and migrations ✅
- **Story 3.2**: CRUD operations with Azure Blob ✅ (3 tests)
- **Story 3.3**: Query API with pagination ✅ (3 tests)
- **Story 3.4**: Full-text search ✅ (2 tests)
- **Story 3.5**: Issuance criteria validation ✅ (3 tests)
- **Story 3.6**: Skill categories hierarchy ✅ (1 test)
- **Enhancement 1**: Image validation & management ✅ (5 tests)

See [TESTING.md](./docs/TESTING.md) for detailed testing documentation.

## 📚 Documentation

### Available Documentation

- **[API-GUIDE.md](./docs/API-GUIDE.md)** - Complete API usage guide with curl examples (20.6KB)
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Azure production deployment guide (25.9KB)
- **[TESTING.md](./docs/TESTING.md)** - Comprehensive testing documentation (26.1KB)
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes (11.5KB)
- **Sprint Documentation** (organized by sprint):
  - [Sprint 0 Documentation](./docs/sprints/sprint-0/) - Infrastructure setup
  - [Sprint 1 Documentation](./docs/sprints/sprint-1/) - Authentication & authorization
  - [Sprint 2 Documentation](./docs/sprints/sprint-2/) - Badge template management (9.8/10 rating)
- **[Documentation Index](../docs/README.md)** - Complete project documentation structure

### Skill Categories
- `GET /api/badge-templates/categories` - List all categories (hierarchical)
- `POST /api/badge-templates/categories` - Create category
- `GET /api/badge-templates/categories/:id` - Get category by ID
- `PUT /api/badge-templates/categories/:id` - Update category
- `DELETE /api/badge-templates/categories/:id` - Delete category

**📚 Interactive API Documentation:** http://localhost:3000/api-docs (Swagger UI)

**📖 Detailed Usage Examples:** See [API-GUIDE.md](./docs/API-GUIDE.md)

## �🗂️ Project Structure

```
backend/
├── src/
│   ├── badge-templates/      # Badge Template Management (Sprint 2)
│   │   ├── badge-templates.controller.ts
│   │   ├── badge-templates.service.ts
│   │   ├── badge-templates.module.ts
│   │   └── dto/              # Data Transfer Objects
│   ├── modules/
│   │   └── auth/             # Authentication & Authorization (Sprint 1)
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.module.ts
│   │       ├── jwt.strategy.ts
│   │       └── guards/
│   ├── common/               # Shared services and utilities
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   ├── storage.service.ts
│   │   ├── storage.module.ts
│   │   └── middleware/       # Custom middleware
│   ├── config/               # Configuration services
│   ├── app.controller.ts     # Root controller (health checks)
│   ├── app.module.ts         # Root module
│   ├── app.service.ts        # Root service
│   └── main.ts               # Application entry point
│
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── seed.ts               # Seed data (skill categories)
│   └── migrations/           # Migration history
│       ├── 20260124035055_init/          # Sprint 0: User model
│       ├── 20260125063945_add_auth/      # Sprint 1: Auth fields
│       └── 20260126070806_badge_template/ # Sprint 2: Badge templates
│
├── test/                     # E2E tests (Jest + PowerShell)
│   ├── badge-templates.e2e-spec.ts  # Jest E2E (19 tests)
│   └── test-sprint-2-quick.ps1      # PowerShell E2E (7 tests)
├── docs/                     # Documentation
│   ├── API-GUIDE.md          # API usage examples
│   ├── DEPLOYMENT.md         # Production deployment guide
│   ├── TESTING.md            # Testing guide
│   └── sprint-2-*.md         # Sprint 2 reports
├── .env                      # Environment variables (not in Git)
├── .env.example              # Environment template
├── CHANGELOG.md              # Version history
└── README.md                 # This file
```

## 🗃️ Database Schema

### Core Models (Sprint 2)

**BadgeTemplate** - Badge template definitions
- `id`, `name`, `description`, `imageUrl`
- `category` (SKILL, ACHIEVEMENT, CERTIFICATION, MEMBERSHIP, PARTICIPATION)
- `status` (DRAFT, ACTIVE, ARCHIVED)
- `skills` (Many-to-many with Skill)
- `issuanceCriteria` (JSON)

**Skill** - Skills associated with badges
- `id`, `name`, `description`, `categoryId`
- `badgeTemplates` (Many-to-many)
- `category` (Relation to SkillCategory)

**SkillCategory** - Hierarchical skill organization
- `id`, `name`, `description`, `parentId`
- `parent`, `children` (Self-referencing)
- Default categories: Technical, Leadership, Business, Creative, Communication

### User Model (Sprint 1)

```prisma
enum UserRole {
  ADMIN
  ISSUER
  MANAGER
  EMPLOYEE
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      UserRole @default(EMPLOYEE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

**Full Schema:** See [prisma/schema.prisma](./prisma/schema.prisma)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection | ✅ Yes |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name | ✅ Yes |
| `AZURE_STORAGE_CONTAINER_BADGES` | Badges container name | ✅ Yes |
| `AZURE_STORAGE_CONTAINER_EVIDENCE` | Evidence container name | ✅ Yes |
| `JWT_SECRET` | JWT signing secret | ✅ Yes |
| `JWT_EXPIRES_IN` | Token expiration time | No (default: 7d) |
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |

### TypeScript Configuration

Strict mode is enabled for better type safety:
- `strictNullChecks: true`
- `noImplicitAny: true`
- `strictBindCallApply: true`
- `noFallthroughCasesInSwitch: true`

## 🐛 Common Issues & Solutions

### Issue 1: Prisma Version Conflicts

**Symptom:** TypeScript errors about `prisma.config.ts`

**Solution:**
```bash
npm uninstall prisma @prisma/client
npm install -D prisma@6
npm install @prisma/client@6
Remove-Item prisma.config.ts  # If exists
```

### Issue 2: Database Connection Fails

**Symptoms:** Migration fails, connection timeout

**Solutions:**
- Verify Azure firewall rules allow your IP
- Check connection string includes `?sslmode=require`
- Ensure password doesn't have unencoded special characters

### Issue 3: npx prisma Uses Wrong Version

**Symptom:** `npx prisma --version` shows Prisma 7

**Solution:** Always use local installation:
```bash
node_modules\.bin\prisma --version
```

### Issue 4: Production Server Cannot Find Module

**Symptom:** `Error: Cannot find module 'C:\...\dist\main'`

**Root Cause:** TypeScript compiler preserves source structure (`dist/src/main.js`)

**Solution:** Use correct path in package.json:
```json
"start:prod": "node dist/src/main"
```

### Issue 5: Unit Test Dependency Injection Fails

**Symptom:** `Nest can't resolve dependencies of the AppController`

**Solution:** Provide mock providers in test module:
```typescript
providers: [
  AppService,
  { provide: PrismaService, useValue: {} },
  { provide: StorageService, useValue: {} },
]
```

## 🧪 Testing

### Test Suite Overview

**Total Test Coverage: 27 tests (100% passing)**

| Test Type | Count | Pass Rate | Duration |
|-----------|-------|-----------|----------|
| Unit Tests | 1 | 100% | 1.9s |
| Jest E2E Tests | 19 | 100% | 21.9s |
| PowerShell E2E Tests | 7 | 100% | ~10s |

### Running Tests

```bash
# Unit tests
npm run test

# Jest E2E tests (all badge template features)
npm run test:e2e -- badge-templates --testTimeout=30000

# PowerShell E2E tests (quick smoke tests)
.\test-sprint-2-quick.ps1

# Test coverage
npm run test:cov
```

### Test Coverage by Feature

**Story 3.1: Data Model** - Prisma migrations verified  
**Story 3.2: CRUD + Blob** - 3 E2E tests (create, update, delete with images)  
**Story 3.3: Query API** - 3 E2E tests (public, admin, pagination)  
**Story 3.4: Search** - 2 E2E tests (full-text search)  
**Story 3.5: Issuance Criteria** - 3 E2E tests (validation)  
**Story 3.6: Skill Categories** - 1 E2E test (hierarchical structure)  
**Enhancement 1: Image Management** - 5 E2E tests (upload, validation, MIME)  

**📖 Detailed Testing Guide:** See [docs/TESTING.md](./docs/TESTING.md)

## 📦 Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Run production server (listens on PORT from .env)
npm run start:prod

# Verify production server is running
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"2026-01-26T...","database":"connected"}
```

**Production Build Path:** `dist/src/main.js` (source structure preserved)  
**Common Issues:** See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for troubleshooting

### Production Checklist
- [ ] Update `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure Azure firewall for production IPs
- [ ] Enable Azure Private Endpoint for database
- [ ] Verify SSL certificates are valid
- [ ] Run database migrations: `npm run migrate:deploy`
- [ ] Test all API endpoints with production data
- [ ] Monitor logs for errors

**📖 Full Deployment Guide:** See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🔐 Security Notes

- Never commit `.env` file
- Change `JWT_SECRET` in production
- Use strong passwords for Azure resources
- Restrict Azure firewall rules in production
- Enable Azure Private Endpoint for production database

## 📚 Documentation

### Living Documentation (Frequently Updated)
- [API Usage Guide](./docs/API-GUIDE.md) - Complete API reference with curl/Postman examples
- [Deployment Guide](./docs/DEPLOYMENT.md) - Azure production deployment procedures
- [Testing Guide](./docs/TESTING.md) - Comprehensive test suite documentation
- [Changelog](./CHANGELOG.md) - Version history and release notes
- [Backend Docs Index](./docs/README.md) - Complete backend documentation index

### Sprint Documentation (Historical)
- [Sprint 0](./docs/sprints/sprint-0/) - Infrastructure setup ✅ Complete
- [Sprint 1](./docs/sprints/sprint-1/) - Authentication & authorization ✅ Complete
- [Sprint 2](./docs/sprints/sprint-2/) - Badge template management ✅ Complete (9.8/10)
  - [Final Report](./docs/sprints/sprint-2/final-report.md)
  - [Retrospective](./docs/sprints/sprint-2/retrospective.md)
  - [Code Review](./docs/sprints/sprint-2/code-review-recommendations.md) - 10/10 (after improvements)
  - [Technical Debt](./docs/sprints/sprint-2/technical-debt-completion.md) - 100% resolved

### Project-Level Documentation
- [Documentation Structure](../DOCUMENTATION-STRUCTURE.md) - How documentation is organized
- [Project Documentation Index](../docs/README.md) - Complete project documentation
- [System Architecture](../docs/architecture/system-architecture.md) - Technical architecture
- [Lessons Learned](../docs/lessons-learned/lessons-learned.md) - 26 key lessons from 3 sprints

### External Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/)

## 📝 License

MIT

---

**Version:** 0.2.0 (Sprint 2 Complete - Badge Template Management)  
**Last Updated:** 2026-01-26  
**Branch:** main  
**Release:** [v0.2.0](https://github.com/legendyz/G-Credit/releases/tag/v0.2.0) - Released 2026-01-26
