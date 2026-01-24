# G-Credit Backend API

NestJS-based REST API for the G-Credit digital credentialing system.

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

### Health Check Endpoints

**GET /health** - Liveness probe
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T..."
}
```

**GET /ready** - Readiness probe
```json
{
  "database": "connected",
  "storage": "connected"
}
```

### Future Endpoints (Sprint 1+)
- POST /auth/register
- POST /auth/login
- GET /badges
- POST /badges
- ... (TBD)

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── modules/              # Feature modules (organized by Epic)
│   │   └── (empty for now)
│   ├── common/               # Shared services and utilities
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   ├── storage.service.ts
│   │   └── storage.module.ts
│   ├── config/               # Configuration services
│   ├── app.controller.ts     # Root controller (health checks)
│   ├── app.module.ts         # Root module
│   ├── app.service.ts        # Root service
│   └── main.ts               # Application entry point
│
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   └── migrations/           # Migration history
│       └── 20260124035055_init/  # Initial migration (User model)
│
├── test/                     # E2E tests
├── .env                      # Environment variables (not in Git)
├── .env.example              # Environment template
├── .gitignore
├── nest-cli.json             # NestJS CLI configuration
├── package.json
├── tsconfig.json             # TypeScript configuration (strict mode)
└── README.md                 # This file
```

## 🗃️ Database Schema

### User Model

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

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Production Build

```bash
# Build
npm run build

# Run production server
npm run start:prod
```

## 🔐 Security Notes

- Never commit `.env` file
- Change `JWT_SECRET` in production
- Use strong passwords for Azure resources
- Restrict Azure firewall rules in production
- Enable Azure Private Endpoint for production database

## 📚 Documentation

- [Main README](../README.md)
- [Sprint 0 Backlog](../../_bmad-output/implementation-artifacts/sprint-0-backlog.md)
- [Architecture Document](../../_bmad-output/planning-artifacts/architecture.md)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 📝 License

MIT

---

**Version:** 0.1.0 (Sprint 0)  
**Last Updated:** 2026-01-24
