# Developer Getting Started Guide

Welcome to the GCredit Digital Badge Platform! This guide will help you set up your development environment and get productive quickly.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 20.20.0 LTS+ | Runtime environment |
| **npm** | 10.x+ | Package manager (comes with Node.js) |
| **Git** | 2.x+ | Version control |
| **PostgreSQL** | 16.x | Database (local or Azure) |
| **VS Code** | Latest | Recommended IDE |

### Optional Tools

- **Postman** - API testing
- **Azure Storage Explorer** - View Azure Blob Storage
- **pgAdmin** - PostgreSQL GUI management
- **GitKraken** - Git GUI client

### Azure Requirements

For production or staging environments:
- Azure subscription
- Azure PostgreSQL Flexible Server
- Azure Blob Storage account
- Azure Communication Services (for emails)

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/legendyz/G-Credit.git
cd G-Credit/gcredit-project
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

**Time estimate:** 2-3 minutes per folder

### 3. Set Up Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

Required variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gcredit_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER_NAME="badge-images"

# Azure Communication Services (Email)
AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://..."
AZURE_COMMUNICATION_SENDER_ADDRESS="noreply@yourdomain.com"

# Server
PORT=3000
```

**Frontend (.env):**
```bash
cd ../frontend
cp .env.example .env
```

Required variables:
```env
VITE_API_URL=http://localhost:3000
```

### 4. Set Up Database

**Option A: Local PostgreSQL**

1. Install PostgreSQL 16:
   - **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **Mac:** `brew install postgresql@16`
   - **Linux:** `sudo apt-get install postgresql-16`

2. Create database:
```bash
psql -U postgres
CREATE DATABASE gcredit_dev;
CREATE USER gcredit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gcredit_dev TO gcredit_user;
\q
```

3. Run migrations:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # Seed initial data
```

**Option B: Azure PostgreSQL**

See [Azure Setup Guide](../setup/azure-setup-guide.md) for detailed instructions.

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

Server starts at: `http://localhost:3000`  
Swagger docs: `http://localhost:3000/api`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend starts at: `http://localhost:5173`

### 6. Verify Setup

**Test backend:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Test database:**
```bash
curl http://localhost:3000/ready
# Expected: {"status":"ok","database":"connected"}
```

**Test frontend:**  
Open browser to `http://localhost:5173` - you should see the login page.

### 7. Create Test User

**Register via API:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'

# Save the accessToken from response
```

---

## Project Structure

```
gcredit-project/
├── backend/                   # NestJS backend
│   ├── src/
│   │   ├── badge-issuance/   # Badge issuance module
│   │   ├── badge-templates/  # Badge template management
│   │   ├── modules/
│   │   │   └── auth/         # Authentication module
│   │   ├── common/           # Shared utilities, guards, decorators
│   │   ├── config/           # Configuration
│   │   ├── skills/           # Skills module
│   │   ├── skill-categories/ # Skill categories module
│   │   └── main.ts           # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Database migrations
│   │   └── seed.ts           # Seed data
│   ├── test/                 # E2E tests
│   │   ├── app.e2e-spec.ts
│   │   ├── auth.e2e-spec.ts
│   │   ├── badge-templates.e2e-spec.ts
│   │   └── badge-issuance.e2e-spec.ts
│   ├── docs/                 # API documentation
│   │   └── api/
│   └── package.json
├── frontend/                  # React frontend (planned)
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/                      # Project documentation
│   ├── README.md             # Documentation hub
│   ├── api/                  # API documentation
│   ├── sprints/              # Sprint documentation
│   ├── architecture/         # Architecture docs
│   ├── decisions/            # Architecture Decision Records
│   └── development/          # Developer guides (this file!)
└── README.md                 # Project README
```

### Key Backend Files

| File | Purpose |
|------|---------|
| `main.ts` | Application bootstrap, CORS, Swagger setup |
| `app.module.ts` | Root module, imports all feature modules |
| `prisma/schema.prisma` | Database schema definition |
| `.env` | Environment variables (not committed) |
| `tsconfig.json` | TypeScript configuration |

---

## Development Workflow

### 1. Pick a Task

Check project board or sprint backlog in `/docs/sprints/sprint-N/backlog.md`

### 2. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/badge-validation
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

### 3. Develop & Test

**Run tests automatically:**
```bash
cd backend
npm run test:watch
```

**Run specific test:**
```bash
npm test -- badge-issuance.service
```

**Run E2E tests:**
```bash
npm run test:e2e
```

### 4. Database Changes

**Create migration:**
```bash
cd backend
npx prisma migrate dev --name add_badge_expiration
```

**Reset database (dev only):**
```bash
npx prisma migrate reset
```

**View database:**
```bash
npx prisma studio
```

### 5. Code Quality

**Lint code:**
```bash
npm run lint
```

**Format code:**
```bash
npm run format
```

**Check types:**
```bash
npx tsc --noEmit
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add badge expiration validation

- Add expiresAt field to badge schema
- Implement expiration check in claim flow
- Add unit tests for expiration logic
- Update API documentation

Closes #42"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Testing
- `refactor:` - Code refactoring
- `style:` - Formatting
- `chore:` - Maintenance

### 7. Push & Create PR

```bash
git push origin feature/badge-validation
```

Then create Pull Request on GitHub.

---

## Common Tasks

### Create a New Module

```bash
cd backend/src
nest generate module badges
nest generate service badges
nest generate controller badges
```

### Create a New Endpoint

1. **Add DTO (Data Transfer Object):**
```typescript
// src/badges/dto/create-badge.dto.ts
import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBadgeDto {
  @ApiProperty({ example: 'template-uuid' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: 'recipient-uuid' })
  @IsUUID()
  recipientId: string;
}
```

2. **Add Service Method:**
```typescript
// src/badges/badges.service.ts
async create(dto: CreateBadgeDto, issuerId: string) {
  return this.prisma.badge.create({
    data: {
      templateId: dto.templateId,
      recipientId: dto.recipientId,
      issuerId,
      status: 'ISSUED',
    },
  });
}
```

3. **Add Controller Endpoint:**
```typescript
// src/badges/badges.controller.ts
@Post()
@Roles(UserRole.ADMIN, UserRole.ISSUER)
@ApiOperation({ summary: 'Issue a badge' })
@ApiResponse({ status: 201, description: 'Badge issued' })
async create(@Body() dto: CreateBadgeDto, @Request() req) {
  return this.badgesService.create(dto, req.user.userId);
}
```

4. **Add Tests:**
```typescript
// src/badges/badges.service.spec.ts
it('should create a badge', async () => {
  const result = await service.create(createDto, 'issuer-id');
  expect(result).toBeDefined();
  expect(result.status).toBe('ISSUED');
});
```

### Add a Database Field

1. **Update Prisma schema:**
```prisma
model Badge {
  id          String   @id @default(uuid())
  // ... existing fields
  evidenceUrl String?  // New field
}
```

2. **Create migration:**
```bash
npx prisma migrate dev --name add_evidence_url
```

3. **Update DTOs and service:**
```typescript
export class CreateBadgeDto {
  // ... existing fields
  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;
}
```

### Run Seed Data

```bash
cd backend
npx prisma db seed
```

Seed file: `backend/prisma/seed.ts`

### Test API Endpoint

**Using cURL:**
```bash
export TOKEN="your-jwt-token"

curl -X GET http://localhost:3000/api/badges/my-badges \
  -H "Authorization: Bearer $TOKEN"
```

**Using Postman:**
1. Create request: `GET http://localhost:3000/api/badges/my-badges`
2. Add header: `Authorization: Bearer {{token}}`
3. Send request

**Using tests:**
```bash
npm run test:e2e -- --testNamePattern="should get my badges"
```

### Debug Application

**VS Code Launch Configuration (.vscode/launch.json):**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],
  "console": "integratedTerminal",
  "restart": true,
  "sourceMaps": true,
  "skipFiles": ["<node_internals>/**"]
}
```

Set breakpoints in VS Code and press F5.

---

## Troubleshooting

### Common Issues

#### Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   pg_ctl status -D "C:\Program Files\PostgreSQL\16\data"
   
   # Mac/Linux
   pg_ctl status
   ```

2. Verify DATABASE_URL in `.env`:
   ```bash
   cat backend/.env | grep DATABASE_URL
   ```

3. Test connection:
   ```bash
   psql -U gcredit_user -d gcredit_dev -h localhost
   ```

#### Prisma Migration Error

**Error:** `Migration failed`

**Solution:**
```bash
cd backend
npx prisma migrate reset  # ⚠️ Dev only - destroys data
npx prisma migrate dev
```

#### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

Or change port in `.env`:
```env
PORT=3001
```

#### Module Not Found

**Error:** `Cannot find module '@nestjs/...'`

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Type Errors After Prisma Change

**Error:** `Property 'newField' does not exist on type 'Badge'`

**Solution:**
```bash
cd backend
npx prisma generate
npm run build
```

### Getting Help

1. **Check documentation:** `/docs/development/`
2. **Search issues:** GitHub Issues
3. **Check logs:** Backend console output
4. **Ask team:** Team chat or standup
5. **Debugging:** Add `console.log()` or use VS Code debugger

---

## Next Steps

Now that you're set up, explore these resources:

### Learn the Codebase

1. **[API Documentation](../../backend/docs/api/README.md)** - All API endpoints
2. **[Architecture Overview](../architecture/system-design.md)** - System design
3. **[Database Schema](../architecture/database-schema.md)** - Data models
4. **[Testing Guide](./testing-guide.md)** - Write and run tests

### Development Guides

1. **[Coding Standards](./coding-standards.md)** - Code style and best practices
2. **[Testing Guide](./testing-guide.md)** - Unit, integration, E2E tests
3. **[Git Workflow](./git-workflow.md)** - Branching and commit conventions
4. **[Troubleshooting](./troubleshooting.md)** - Common problems and solutions

### Sprint Documentation

- **[Sprint 0](../sprints/sprint-0/README.md)** - Infrastructure setup
- **[Sprint 1](../sprints/sprint-1/README.md)** - Authentication
- **[Sprint 2](../sprints/sprint-2/README.md)** - Badge templates
- **[Sprint 3](../sprints/sprint-3/README.md)** - Badge issuance

### API Endpoints

- **[Authentication API](../../backend/docs/api/authentication.md)** - Login, register, profile
- **[Badge Issuance API](../../backend/docs/api/badge-issuance.md)** - Issue, claim, revoke badges
- **[Badge Templates API](../../backend/docs/api/badge-templates.md)** - CRUD badge templates

---

## Development Tips

### Productivity

- **Use VS Code extensions:** ESLint, Prettier, Prisma, GitLens
- **Set up code snippets** for common patterns (NestJS controller, service)
- **Use Postman collections** for API testing
- **Keep terminal open** for hot-reload during development
- **Use Prisma Studio** for quick database inspection

### Best Practices

- **Write tests first** (TDD) when possible
- **Commit often** with meaningful messages
- **Keep PRs small** (< 500 lines changed)
- **Update docs** when changing APIs
- **Ask for reviews** before merging
- **Run tests** before committing

### Time Savers

```bash
# Backend aliases (add to ~/.bashrc or ~/.zshrc)
alias be="cd ~/G-Credit/gcredit-project/backend"
alias fe="cd ~/G-Credit/gcredit-project/frontend"
alias bdev="cd ~/G-Credit/gcredit-project/backend && npm run start:dev"
alias fdev="cd ~/G-Credit/gcredit-project/frontend && npm run dev"
alias betest="cd ~/G-Credit/gcredit-project/backend && npm test"
```

---

**Estimated Time to Productivity:** < 2 hours  
**Questions?** Check [Troubleshooting](./troubleshooting.md) or ask the team!

**Last Updated:** January 27, 2026
