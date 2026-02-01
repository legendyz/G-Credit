# G-Credit - Internal Digital Credentialing System

🎓 Open Badges 2.0 compliant digital credentialing platform for enterprise badge issuance and verification.

## 📊 Project Status

**Current Sprint:** ✅ Sprint 7 Complete (100%, 10/10 stories, Epic 9 - Badge Revocation + Lifecycle UAT)  
**Sprint 7:** ✅ Complete (100%, 10/10 stories, actual 38.5h / estimated 41-47h, 2026-02-02, v0.7.0)  
**Sprint 6:** ✅ Complete (100%, actual 35h / estimated 56-76h, 2026-01-31, Badge Sharing & Social Proof)  
**Sprint 5:** ✅ Complete (100%, 30h/28h, 2026-01-29, Badge Verification & Open Badges 2.0)  
**Sprint 4:** ✅ Complete (100%, 48h/48h, 2026-01-28, Employee Badge Wallet)  
**Sprint 3:** ✅ Complete (100%, 13h/12.5h, 2026-01-28, Badge Issuance)  
**Sprint 2:** ✅ Complete (100%, 29h/32h, 2026-01-26, Badge Templates)  
**Sprint 1:** ✅ Complete (100%, 21h/21h, 2026-01-25, Authentication)  
**Sprint 0:** ✅ Complete (100%, 9.5h/10h, 2026-01-24, Infrastructure)  
**Version:** v0.7.0 (Sprint 7 complete, 334 tests total, 302 passing core tests, UAT 100%)  
**License:** MIT

## 🚀 Tech Stack

### Frontend
- **React** 19.2.3
- **TypeScript** 5.9.3 (strict mode)
- **Vite** 7.3.1
- **Tailwind CSS** 4.1.18
- **Shadcn/ui** components
- **React Router** (TBD in Sprint 1)

### Backend
- **NestJS** 11.1.12 (Core), 11.0.16 (CLI)
- **TypeScript** 5.9.3 (strict mode)
- **Prisma** 6.19.2 ORM 🔒 Version Locked
- **PostgreSQL** 16
- **JWT** Authentication (TBD in Sprint 1)

### Infrastructure (Phase 1 - MVP)
- **Azure PostgreSQL Flexible Server** (B1ms, ~$15/month)
- **Azure Blob Storage** (Standard LRS, ~$3/month)
- **Estimated Monthly Cost:** ~$20

## 📋 Prerequisites

- **Node.js** 20.20.0 LTS or higher
- **npm** 10+ (comes with Node.js)
- **Git** 2.x
- **Azure Subscription** (for PostgreSQL and Blob Storage)
- **Windows/Mac/Linux** (development tested on Windows 11)

## ⚡ Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/legendyz/G-Credit.git
cd G-Credit/gcredit-project
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### 3. Setup Backend

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your Azure credentials:
# - DATABASE_URL (Azure PostgreSQL connection string)
# - AZURE_STORAGE_CONNECTION_STRING
# - JWT_SECRET (generate a secure random string)
```

**Configure .env:**
```env
DATABASE_URL="postgresql://username:password@your-server.postgres.database.azure.com:5432/postgres?sslmode=require"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx;EndpointSuffix=core.windows.net"
AZURE_STORAGE_ACCOUNT_NAME="your-storage-account"
AZURE_STORAGE_CONTAINER_BADGES="badges"
AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

**Run Database Migration:**
```bash
node_modules\.bin\prisma migrate dev
```

**Start Backend Server:**
```bash
npm run start:dev
```

Backend will be available at: **http://localhost:3000**

### 4. Verify Setup

**Check Health Endpoints:**
```bash
# Liveness probe
curl http://localhost:3000/health

# Readiness probe (should show database and storage connected)
curl http://localhost:3000/ready
```

**Expected Response:**
```json
{
  "database": "connected",
  "storage": "connected"
}
```

## 🗂️ Project Structure

```
gcredit-project/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   └── ui/          # Shadcn/ui components
│   │   ├── lib/             # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── modules/         # Feature modules (by Epic)
│   │   ├── common/          # Shared services
│   │   │   ├── prisma.service.ts
│   │   │   ├── prisma.module.ts
│   │   │   ├── storage.service.ts
│   │   │   └── storage.module.ts
│   │   ├── config/          # Configuration
│   │   ├── app.module.ts    # Root module
│   │   └── main.ts          # Entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── package.json
│   └── .env.example         # Environment template
│
└── README.md                # This file
```

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

**Backend:**
```bash
npm run start:dev   # Start in watch mode (auto-reload)
npm run start       # Start in production mode
npm run build       # Build for production
npm run lint        # Run ESLint
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
```

**Prisma Commands:**
```bash
node_modules\.bin\prisma migrate dev           # Create and apply migration
node_modules\.bin\prisma migrate dev --name <name>  # Named migration
node_modules\.bin\prisma studio                # Open Prisma Studio (GUI)
node_modules\.bin\prisma generate              # Regenerate Prisma Client
```

### Database Schema

**Current Models:**

**User**
- `id` (UUID, primary key)
- `email` (string, unique)
- `password` (string, hashed)
- `name` (string, optional)
- `role` (enum: ADMIN, ISSUER, MANAGER, EMPLOYEE)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🏗️ Azure Infrastructure Setup

### PostgreSQL Flexible Server

1. Create PostgreSQL server in Azure Portal
2. Configuration:
   - Resource Group: `rg-gcredit-dev`
   - Server name: `gcredit-dev-db-<your-initials>`
   - Region: East Asia / Southeast Asia
   - PostgreSQL version: 16
   - Compute: Burstable B1ms (1 vCore, 2 GiB RAM)
   - Storage: 32 GiB
3. Networking: Allow all IPs for development (0.0.0.0-255.255.255.255)
4. Copy connection string to `.env`

### Blob Storage

1. Create Storage Account in Azure Portal
2. Configuration:
   - Resource Group: `rg-gcredit-dev` (same as database)
   - Storage account name: `gcreditdevstorage<your-initials>`
   - Performance: Standard
   - Redundancy: Locally-redundant storage (LRS)
3. Create containers:
   - `badges` (Public access: Blob)
   - `evidence` (Public access: Private)
4. Copy connection string to `.env`

## 🐛 Troubleshooting

### Prisma Version Issues

**Problem:** TypeScript errors mentioning `prisma.config.ts`

**Solution:** Ensure Prisma 6 is installed (not Prisma 7)
```bash
npm uninstall prisma @prisma/client
npm install -D prisma@6
npm install @prisma/client@6
```

### Database Connection Fails

**Problem:** Migration fails with connection timeout

**Solutions:**
- Check Azure firewall rules (add your current IP)
- Verify connection string format includes `?sslmode=require`
- Check password doesn't contain unencoded special characters

### Git Submodule Error

**Problem:** `git add backend/` fails with submodule error

**Solution:** Remove NestJS-created .git directory
```bash
Remove-Item -Recurse -Force backend\.git
```

## 📚 Documentation

**Sprint Documentation:**
- [Sprint 0 Backlog](docs/sprints/sprint-0/backlog.md) ✅ Complete (Infrastructure)
- [Sprint 1 Backlog](docs/sprints/sprint-1/backlog.md) ✅ Complete (Authentication)
- [Sprint 2 Documentation](docs/sprints/sprint-2/) ✅ Complete (Badge Templates)
- [Sprint 3 Documentation](docs/sprints/sprint-3/) ✅ Complete (Badge Issuance)
- [Sprint 4 Documentation](docs/sprints/sprint-4/) ✅ Complete (Employee Badge Wallet)
- [Sprint 5 Documentation](docs/sprints/sprint-5/) ✅ Complete (Badge Verification & Open Badges 2.0)
- [Sprint 6 Documentation](docs/sprints/sprint-6/) 🟡 Planning Complete (Badge Sharing & Social Proof)
- [All Sprints Index](docs/sprints/README.md)

**Planning Documentation:**
- [Architecture Document](docs/architecture/system-architecture.md)
- [Epics Overview](docs/planning/epics.md)
- [UX Design Specification](docs/planning/ux-design-specification.md)
- [Implementation Readiness Report](docs/planning/implementation-readiness-report-2026-01-22.md)
- [Project Context](../project-context.md) (Single Source of Truth)
- [API Documentation](./backend/README.md)

## 🧪 Testing

**Health Check Endpoints:**
- `GET /health` - Liveness probe (simple status check)
- `GET /ready` - Readiness probe (checks database and storage)

**Expected Responses:**
```json
// GET /health
{
  "status": "ok",
  "timestamp": "2026-01-24T..."
}

// GET /ready
{
  "database": "connected",
  "storage": "connected"
}
```

## 🔐 Security Notes

- **Never commit `.env`** to Git (already in `.gitignore`)
- Use `.env.example` as template for other developers
- Change `JWT_SECRET` in production
- Restrict Azure firewall rules in production
- Use Azure Private Endpoint for production database

## 🚧 Sprint Roadmap

### ✅ Sprint 0: Infrastructure Setup (Complete - 2026-01-24)
- ✅ Frontend initialization (React 19.2.3 + Vite 7.3.1 + Tailwind 4.1.18 + Shadcn/ui)
- ✅ Backend initialization (NestJS 11.1.12 + Prisma 6.19.2 + ConfigModule)
- ✅ Azure PostgreSQL Flexible Server (B1ms, gcredit-dev-db-lz)
- ✅ Azure Blob Storage (gcreditdevstoragelz, 2 containers)
- ✅ Health check endpoints (/health, /ready)
- ✅ Comprehensive README documentation
- **Actual Time:** 9.5h / 10h estimated (95% accuracy)
- **Retrospective:** [Sprint 0 Retrospective](docs/sprints/sprint-0/retrospective.md)

### ✅ Sprint 1: JWT Authentication & User Management (Complete - 2026-01-25)
- ✅ User data model with RBAC roles (Admin, Issuer, Manager, Employee)
- ✅ User registration with password validation
- ✅ JWT login authentication (access + refresh tokens)
- ✅ RBAC role permissions system
- ✅ Session management and logout
- ✅ Password reset via email
- ✅ User profile management page
- **Actual Time:** 21h / 21h estimated (100% accuracy)
- **Retrospective:** [Sprint 1 Retrospective](docs/sprints/sprint-1/retrospective.md)

### ✅ Sprint 2: Badge Template Management (Complete - 2026-01-26)
- ✅ Badge template data model (Open Badges 2.0)
- ✅ Template CRUD operations (Create, Read, Update, Delete)
- ✅ Badge criteria and skills tracking
- ✅ Multi-language template support (en, zh)
- ✅ Badge design customization (colors, icons)
- ✅ Template version control
- ✅ Admin template management UI
- **Actual Time:** 29h / 32h estimated (110% estimation ratio)
- **Test Coverage:** 19 E2E tests passing
- **Retrospective:** [Sprint 2 Retrospective](docs/sprints/sprint-2/retrospective.md)

### ✅ Sprint 3: Badge Issuance System (Complete - 2026-01-28, v0.3.0)
- ✅ Badge issuance workflow (Epic 4)
- ✅ Open Badges 2.0 compliance (assertion, verification)
- ✅ Recipient email management
- ✅ Badge expiration and revocation
- ✅ Evidence attachment support
- ✅ Issuance analytics and reporting
- **Actual Time:** 13h / 12.5h estimated (104%)
- **Test Coverage:** 46 total tests
- **Git Tag:** v0.3.0
- **Retrospective:** [Sprint 3 Retrospective](docs/sprints/sprint-3/retrospective.md)

### ✅ Sprint 4: Employee Badge Wallet (Complete - 2026-01-28, v0.4.0)
- ✅ Timeline view with date navigation (Epic 5)
- ✅ Badge detail modal (10 sub-components)
- ✅ Evidence file management with Azure Blob
- ✅ Similar badge recommendations algorithm
- ✅ Admin-configurable milestones (3 trigger types)
- ✅ Empty state handling (4 scenarios)
- ✅ Badge issue reporting
- **Actual Time:** 48h estimated
- **Test Coverage:** 58 tests (100% pass rate)
- **Git Tag:** v0.4.0
- **Retrospective:** [Sprint 4 Retrospective](docs/sprints/sprint-4/retrospective.md)

### ✅ Sprint 5: Badge Verification & Open Badges 2.0 (Complete - 2026-01-29, v0.5.0)
- ✅ Public verification system (Epic 6)
- ✅ Open Badges 2.0 full compliance (JSON-LD)
- ✅ Baked badge PNG generation (Sharp library)
- ✅ Cryptographic integrity verification (SHA-256)
- ✅ Email masking for privacy
- ✅ 5 new API endpoints (3 public, 2 protected)
- **Actual Time:** 30h / 28h estimated (107% velocity)
- **Test Coverage:** 68 tests (24 unit + 6 integration + 38 E2E)
- **Git Tag:** v0.5.0
- **Retrospective:** [Sprint 5 Retrospective](docs/sprints/sprint-5/retrospective.md)

### � Sprint 6: Badge Sharing & Social Proof (Planning Complete - 2026-01-29, Epic 7)
- Microsoft Graph API email integration (production-ready)
- Embeddable badge widget (production-ready)
- Microsoft Teams Adaptive Cards (production-ready)
- Badge sharing analytics (production-ready)
- LinkedIn sharing (deferred to Sprint 7)
- **Planning Status:** ✅ Complete (3,781 lines of documentation)
- **Estimated Effort:** 56-76 hours
- **Sprint Duration:** 2.5-3 weeks
- **Strategic Decisions:** MS Graph API (not SMTP), Full Adaptive Cards (not mock)
- **UAT:** Full-role UAT scheduled after Sprint 6 implementation
- **Documentation:** [Sprint 6 Planning Artifacts](docs/sprints/sprint-6/)

### 📅 Future Sprints
- **Sprint 7:** LinkedIn Integration, Advanced Analytics
- **Sprint 8+:** Production Deployment, Enterprise Features

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details

## 👥 Contributors

- [Your Name] - Solo Developer (Phase 1)

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/legendyz/G-Credit/issues
- Documentation: See `docs/` directory

---

**Last Updated:** 2026-01-29  
**Version:** v0.5.0 (Sprint 5 Complete - Badge Verification & Open Badges 2.0)  
**Sprint Status:** Sprint 0-5 Complete ✅ | Sprint 6 Planning Complete 🟡 (Awaiting Kickoff)
