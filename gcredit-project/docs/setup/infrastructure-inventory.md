# G-Credit Infrastructure Inventory

**Last Updated:** 2026-02-28  
**Project:** G-Credit - Enterprise Internal Digital Credentialing System  
**Environment:** Development

This document maintains a comprehensive inventory of all infrastructure resources, configurations, and dependencies created throughout the G-Credit project lifecycle. It serves as the single source of truth for resource management and prevents duplicate resource creation.

---

## 📋 Table of Contents

1. [Azure Resources](#azure-resources)
2. [Database Schema](#database-schema)
3. [Environment Variables](#environment-variables)
4. [NPM Dependencies](#npm-dependencies)
5. [Git Repositories](#git-repositories)
6. [External Services](#external-services)
7. [Change Log](#change-log)

---

## 🌐 Azure Resources

### Storage Accounts

#### gcreditdevstoragelz
- **Type:** Azure Storage Account (General Purpose v2)
- **Created in:** Sprint 0 (2026-01-24)
- **Region:** East Asia / Southeast Asia
- **Performance:** Standard
- **Redundancy:** LRS (Locally Redundant Storage)
- **Purpose:** Badge images and evidence file storage
- **Public Access:** Enabled (for blob-level access)
- **Cost:** ~$0.02/GB/month + operations
- **Used in Sprints:** 0, 2, 3, 4

**Containers:**
```
gcreditdevstoragelz/
├── badges/          (Public: Blob-level anonymous read)
│   Purpose: All badge-related images
│   - Badge template images (Sprint 2+)
│   - Issued badge images (Sprint 3+)
│   - Format: PNG, recommended 400x400px or 512x512px
│   - Max size: 2MB per file
│   - Naming: template-{uuid}.png, issued-{badgeId}-{userId}.png
│
└── evidence/        (Private: No anonymous access)
    Purpose: Badge issuance evidence files (Sprint 4+)
    - Supporting documents (PDF, PNG, JPG, DOCX)
    - Certificates, transcripts, project deliverables
    - Max size: 10MB per file
    - SAS token access with 5-minute expiry
    - Naming: {badgeId}/{fileId}-{sanitized-filename}.ext
    - Security: Verify badge ownership before token generation
```

**Environment Variables:**
```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=gcreditdevstoragelz;AccountKey=***;EndpointSuffix=core.windows.net"
AZURE_STORAGE_ACCOUNT_NAME="gcreditdevstoragelz"
AZURE_STORAGE_CONTAINER_BADGES="badges"
AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
```

**Access Patterns:**
- **Read (Public):** `https://gcreditdevstoragelz.blob.core.windows.net/badges/{filename}`
- **Write:** Via SDK with connection string authentication
- **Delete:** Admin only, via SDK

---

### Databases

#### gcredit-dev-db-lz
- **Type:** Azure Database for PostgreSQL Flexible Server
- **Created in:** Sprint 0 (2026-01-23)
- **PostgreSQL Version:** 16
- **Region:** Same as Storage Account
- **Tier:** Burstable (B1ms or B2s)
- **Storage:** 32 GB
- **Backup Retention:** 7 days
- **High Availability:** No (development)
- **Purpose:** Primary application database
- **Used in Sprints:** 0, 1, 2, 3, 4, 5, 6, 7

**Connection Details:**
```
Host: gcredit-dev-db-lz.postgres.database.azure.com
Port: 5432
Database: postgres
User: gcreditadmin
SSL Mode: require
```

**Environment Variable:**
```env
DATABASE_URL="postgresql://gcreditadmin:***@gcredit-dev-db-lz.postgres.database.azure.com:5432/postgres?sslmode=require"
```

**Firewall Rules:**
- ✅ Allow public access from any Azure service
- ✅ Add client IP addresses as needed for local development

**Maintenance Windows:** Default (managed by Azure)

---

## 🗄️ Database Schema

### Current Models (as of Sprint 1 completion)

**Sprint 0: Initial Setup**
- No models (infrastructure only)

**Sprint 1: Authentication & User Management**

#### User Model
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  role          UserRole  @default(EMPLOYEE)
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  passwordResetTokens PasswordResetToken[]
  refreshTokens       RefreshToken[]

  @@index([email])
  @@index([role])
  @@map("users")
}
```

**Roles:** ADMIN, ISSUER, EMPLOYEE (Sprint 14: MANAGER removed from enum, see ADR-015)

#### PasswordResetToken Model
```prisma
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
```

#### RefreshToken Model
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("refresh_tokens")
}
```

**Total Tables:** 3  
**Total Migrations:** 2
- `20260124000000_init_user_model` (Sprint 1)
- `20260124000001_add_password_reset_refresh_tokens` (Sprint 1)

---

### Sprint 2-4 Database Models (Added)

#### BadgeTemplate Model (Sprint 2)
```prisma
model BadgeTemplate {
  id                 String   @id @default(uuid())
  name               String   @db.VarChar(200)
  description        String?  @db.Text
  imageUrl           String?
  issuanceCriteria   Json     // JSONB
  category           String?
  skillIds           String[] // Array of skill UUIDs
  validityPeriod     Int?     // Days
  status             String   @default("DRAFT")
  createdBy          String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  creator User   @relation("BadgeTemplateCreator", fields: [createdBy], references: [id])
  badges  Badge[]

  @@index([status])
  @@index([createdBy])
  @@map("badge_templates")
}
```

#### Skill & SkillCategory Models (Sprint 2)
```prisma
model SkillCategory {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  skills Skill[]

  @@map("skill_categories")
}

model Skill {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(200)
  description String?  @db.Text
  categoryId  String?

  category SkillCategory? @relation(fields: [categoryId], references: [id])

  @@index([categoryId])
  @@map("skills")
}
```

#### Badge Model (Sprint 3)
```prisma
model Badge {
  id             String      @id @default(uuid())
  templateId     String
  recipientId    String
  issuerId       String
  evidenceUrl    String?
  issuedAt       DateTime    @default(now())
  expiresAt      DateTime?
  claimedAt      DateTime?
  status         BadgeStatus @default(PENDING)
  claimToken     String?     @unique
  recipientHash  String
  assertionJson  Json

  template  BadgeTemplate @relation(fields: [templateId], references: [id])
  recipient User          @relation("BadgeRecipient", fields: [recipientId], references: [id])
  issuer    User          @relation("BadgeIssuer", fields: [issuerId], references: [id])
  evidenceFiles EvidenceFile[]

  @@index([recipientId])
  @@index([templateId])
  @@index([status])
  @@index([claimToken])
  @@map("badges")
}

enum BadgeStatus {
  PENDING
  CLAIMED
  EXPIRED
  REVOKED
}
```

#### Evidence Files Model (Sprint 4)
```prisma
model EvidenceFile {
  id           String   @id @default(uuid())
  badgeId      String
  fileName     String   @db.VarChar(500)
  originalName String   @db.VarChar(500)
  fileSize     Int
  mimeType     String   @db.VarChar(100)
  blobUrl      String
  uploadedBy   String
  uploadedAt   DateTime @default(now())

  badge    Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  uploader User  @relation("EvidenceUploader", fields: [uploadedBy], references: [id])

  @@index([badgeId])
  @@map("evidence_files")
}
```

#### Milestone Models (Sprint 4)
```prisma
model MilestoneConfig {
  id          String        @id @default(uuid())
  type        MilestoneType
  title       String        @db.VarChar(200)
  description String        @db.Text
  trigger     Json          // JSONB trigger config
  icon        String        @db.VarChar(10) // Emoji
  isActive    Boolean       @default(true)
  createdBy   String
  createdAt   DateTime      @default(now())

  creator      User                   @relation("MilestoneCreator", fields: [createdBy], references: [id])
  achievements MilestoneAchievement[]

  @@index([isActive])
  @@map("milestone_configs")
}

model MilestoneAchievement {
  id          String   @id @default(uuid())
  milestoneId String
  userId      String
  achievedAt  DateTime @default(now())

  milestone MilestoneConfig @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  user      User            @relation("MilestoneAchiever", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([milestoneId, userId]) // One achievement per user per milestone
  @@index([userId, achievedAt])
  @@map("milestone_achievements")
}

enum MilestoneType {
  BADGE_COUNT
  SKILL_TRACK
  ANNIVERSARY
  CUSTOM
}
```

**Total Tables:** 10 (3 Sprint 1 + 3 Sprint 2 + 1 Sprint 3 + 3 Sprint 4)  
**Total Migrations:** 5
- `20260124000000_init_user_model` (Sprint 1)
- `20260124000001_add_password_reset_refresh_tokens` (Sprint 1)
- `20260126000000_badge_template_system` (Sprint 2)
- `20260128000000_badge_issuance` (Sprint 3)
- `20260128000001_sprint4_wallet_tables` (Sprint 4)

---

### Planned Models (Sprint 5+)

**Sprint 2: Badge Template Management**
- BadgeTemplate (Epic 3)
- SkillCategory (Epic 3)
- Skill (Epic 3)

**Sprint 3-4: User Badge Management**
- UserBadge (Epic 4) - ✅ Implemented as Badge model (Sprint 3)
- BadgeIssuance (Epic 4) - ✅ Implemented as Badge model (Sprint 3)
- EvidenceFile (Epic 5) - ✅ Implemented (Sprint 4)
- MilestoneConfig (Epic 5) - ✅ Implemented (Sprint 4)
- MilestoneAchievement (Epic 5) - ✅ Implemented (Sprint 4)

**Sprint 5+: Display & Sharing**
- BadgeDisplay (Epic 6)
- ShareSettings (Epic 7)

---

## ⚙️ Environment Variables

### Current Configuration (backend/.env)

**Database:**
```env
DATABASE_URL="postgresql://gcreditadmin:***@gcredit-dev-db-lz.postgres.database.azure.com:5432/postgres?sslmode=require"
```

**JWT Configuration:**
```env
JWT_SECRET="gcredit-jwt-secret-key-change-this-in-production-2026-min-32-chars-required"
JWT_REFRESH_SECRET="gcredit-refresh-token-secret-different-from-access-token-2026-security"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

**Server Configuration:**
```env
PORT=3000
NODE_ENV="development"
```

**Frontend URL:**
```env
FRONTEND_URL="http://localhost:5173"
```

**Email Configuration (Development - Console Only):**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@gcredit.com"
```
*Note: Emails are logged to console in development, not actually sent*

**Azure Blob Storage:**
```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=gcreditdevstoragelz;AccountKey=***;EndpointSuffix=core.windows.net"
AZURE_STORAGE_ACCOUNT_NAME="gcreditdevstoragelz"
AZURE_STORAGE_CONTAINER_BADGES="badges"
AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
```

**Azure AD SSO (Sprint 13):**
```env
AZURE_AD_CLIENT_ID="your-azure-ad-app-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-app-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"
AZURE_AD_REDIRECT_URI="http://localhost:3000/api/auth/sso/callback"
INITIAL_ADMIN_EMAIL="admin@yourdomain.com"
```
*Note: SSO is optional — if env vars are missing, `/auth/sso/login` returns 503*

---

## 📦 NPM Dependencies

### Frontend (gcredit-web/)

**Framework & Build:**
- react: 19.0.0
- react-dom: 19.0.0
- vite: 7.2.4
- typescript: 5.9.3

**UI & Styling:**
- tailwindcss: 4.1.18
- @radix-ui/* (Shadcn/ui components)

**State & Data:**
- @tanstack/react-query: 5.x
- zustand: (planned)

**Routing:**
- react-router-dom: 6.x

**Forms:**
- react-hook-form: 7.x
- zod: 3.x

**Dev Dependencies:**
- @vitejs/plugin-react: 4.x
- eslint: 9.x
- prettier: 3.x

### Backend (gcredit-project/backend/)

**Framework:**
- @nestjs/core: 11.0.16
- @nestjs/common: 11.0.16
- @nestjs/platform-express: 11.0.16
- typescript: 5.7.3

**Database & ORM:**
- @prisma/client: 6.19.2
- prisma: 6.19.2 (dev)

**Authentication:**
- @nestjs/jwt: 11.x
- @nestjs/passport: 11.x
- passport: 0.7.x
- passport-jwt: 4.x
- bcrypt: 5.x

**Configuration:**
- @nestjs/config: 3.x

**Azure Integration:**
- @azure/storage-blob: 12.30.0
- @azure/msal-node: 5.0.5 (Sprint 13 — Azure AD SSO)

**Image Processing (Sprint 2+):**
- sharp: (to be installed)

**Validation:**
- class-validator: 0.14.x
- class-transformer: 0.5.x
- ajv: (to be installed for JSON Schema)

**Dev Dependencies:**
- @nestjs/cli: 11.x
- @nestjs/testing: 11.x
- jest: 29.x
- supertest: 7.x
- ts-node: 10.x

**Known Issues:**
- lodash@4.17.21: 1 moderate vulnerability (Prototype Pollution)
  - Status: Accepted for development
  - Remediation: Deferred to production deployment

---

## 📚 Git Repositories

### Main Repository
- **URL:** https://github.com/legendyz/G-Credit.git
- **Default Branch:** main
- **Created:** 2026-01-23
- **Structure:** Monorepo
  ```
  G-Credit/
  ├── gcredit-project/      (Application code)
  │   ├── backend/          (NestJS API)
  │   └── frontend/         (React Web App - to be created)
  ├── _bmad-output/         (Documentation & Planning)
  │   └── implementation-artifacts/
  └── docs/                 (Additional documentation)
  ```

### Branches

**Main Branches:**
- `main` - Production-ready code

**Sprint Branches:**
- `sprint-0/infrastructure-setup` - Completed, merged
- `sprint-1/auth-user-management` - Completed, merged
- `sprint-2/epic-3-badge-templates` - Active

**Branch Strategy:**
- Feature branches: `sprint-{n}/{epic-name}`
- Merge to main after sprint completion
- Tag releases: `v0.1.0`, `v0.2.0`, etc.

---

## 🔗 External Services

### Development Tools

**Azure Portal:**
- URL: https://portal.azure.com
- Subscription: (User's Azure subscription)
- Resource Group: rg-gcredit-dev

**Prisma Studio:**
- Command: `npx prisma studio`
- URL: http://localhost:5555
- Purpose: Database GUI for development

**Swagger API Docs (Planned):**
- URL: http://localhost:3000/api/docs
- Implementation: Sprint 2+

### Third-Party Services (Planned)

**Email Service (Production):**
- Provider: TBD (SendGrid, AWS SES, or Azure Communication Services)
- Implementation: Sprint 8+

**CDN (Optional):**
- Provider: Azure CDN
- Purpose: Badge image distribution
- Implementation: Post-MVP

---

## 📝 Change Log

### 2026-02-28 (Sprint 14 Completion)
- ✅ Prisma migration: Removed MANAGER from UserRole enum (ADR-015)
- ✅ Existing MANAGER users migrated to EMPLOYEE
- ✅ UserRole now: ADMIN | ISSUER | EMPLOYEE
- ✅ `isManager` derived from `directReportsCount > 0` (ADR-017)
- ✅ ManagerGuard + @RequireManager() decorator added
- ✅ 1,757 tests (932 BE + 794 FE + 31 E2E), 100% pass rate
- ✅ Tagged v1.4.0

### 2026-02-27 (Sprint 13 Completion)
- ✅ Added Azure AD SSO via MSAL Auth Code Flow + PKCE
- ✅ New dependency: `@azure/msal-node` ^5.0.5
- ✅ New env vars: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID, AZURE_AD_REDIRECT_URI, INITIAL_ADMIN_EMAIL
- ✅ New endpoints: GET /auth/sso/login, GET /auth/sso/callback
- ✅ JIT user provisioning + login-time mini-sync for SSO users
- ✅ Session management: 401 interceptor, token refresh queue, idle timeout
- ✅ Removed `axios` dependency (migrated to fetch/ky)
- ✅ Total: 20 controllers, ~100 API endpoints
- ✅ 1,708 tests (914 BE + 794 FE), 100% pass rate
- ✅ Tagged v1.3.0

### 2026-02-24 (Sprint 12 Completion)
- ✅ EvidenceFile model enhanced: added `type` (FILE|URL), `sourceUrl`, `badgeTemplateId` fields
- ✅ Two-phase migration: Prisma schema + standalone data migration script
- ✅ New admin endpoints: Skill Category CRUD (6), Skill CRUD (enhanced), User Management (8), Milestones (5), Evidence (4)
- ✅ Total: 19 controllers, 97 API endpoints
- ✅ 1,549 tests (847 BE + 702 FE), 100% pass rate
- ✅ Tagged v1.2.0

### 2026-02-18 (Sprint 11 Completion)
- ✅ Added `failedLoginAttempts` and `lockedUntil` fields to User model (account lockout)
- ✅ Added `isPublic` field to Badge model (visibility toggle)
- ✅ JWT migrated from localStorage to httpOnly cookies (SameSite=Lax)
- ✅ Security: Magic-byte validation, PII log sanitization, HTML sanitization pipe
- ✅ 1,307 tests (756 BE + 551 FE), 100% pass rate
- ✅ Tagged v1.1.0

### 2026-02-11 (Sprint 10 Completion)
- ✅ v1.0.0 Released (UAT 33/33 PASS)
- ✅ ESLint zero-tolerance CI gate (0 errors, 0 warnings)
- ✅ 1,061 tests (534 BE + 527 FE)
- ✅ Tagged v1.0.0

### 2026-01-28 (Sprint 4 Completion)
- ✅ Added 3 database tables: evidence_files, milestone_configs, milestone_achievements
- ✅ Implemented evidence file storage with Azure Blob SAS tokens
- ✅ Created admin-configurable milestone system with 3 trigger types
- ✅ Updated evidence container documentation with SAS token security
- ✅ 58 backend tests passing (19 milestone + 11 evidence + 8 recommendations)
- ✅ Timeline View API with badge + milestone merging
- ✅ Badge Detail Modal backend support (9 new endpoints)
- ✅ Similar badge recommendation algorithm implemented

### 2026-01-28 (Sprint 3 Completion)
- ✅ Added Badge model with BadgeStatus enum
- ✅ Implemented Open Badges 2.0 assertion system
- ✅ Integrated Azure Communication Services for email
- ✅ 46 backend tests passing
- ✅ Tagged v0.3.0

### 2026-01-26 (Sprint 2 Day 1)
- ✅ Created infrastructure-inventory.md
- ✅ Verified Azure Blob Storage resources from Sprint 0
- ✅ Confirmed no duplicate resources needed for Sprint 2
- ✅ Updated Sprint 2 documentation to use existing `badges` container

### 2026-01-25 (Sprint 1 Completion)
- ✅ Added 3 database models (User, PasswordResetToken, RefreshToken)
- ✅ Completed 14 API endpoints
- ✅ Implemented JWT dual-token authentication
- ✅ 40/40 tests passed

### 2026-01-24 (Sprint 0 Completion)
- ✅ Created Azure PostgreSQL Flexible Server (gcredit-dev-db-lz)
- ✅ Created Azure Storage Account (gcreditdevstoragelz)
- ✅ Created 2 blob containers (badges, evidence)
- ✅ Installed @azure/storage-blob SDK
- ✅ Configured all environment variables
- ✅ Verified all infrastructure with health checks

### 2026-01-23 (Sprint 0 Start)
- ✅ Initialized frontend (React 19 + Vite 7 + TypeScript 5.9)
- ✅ Initialized backend (NestJS 11 + Prisma 6)
- ✅ Created GitHub repository

---

## 🔍 Resource Verification Commands

### Check Azure Resources
```bash
# Test Azure Blob Storage connection
cd backend
npx ts-node scripts/test-azure-blob.ts

# Expected output: "All tests passed! Azure Blob Storage is ready."
```

### Check Database Connection
```bash
cd backend
npx prisma migrate status

# Expected output: Database in sync, all migrations applied
```

### Check Environment Variables
```bash
# Backend
cd backend
cat .env | grep -E "DATABASE_URL|AZURE_STORAGE|JWT_SECRET"

# Verify all critical variables are set
```

### Check Installed Packages
```bash
# Backend
cd backend
npm list @azure/storage-blob @prisma/client @nestjs/core

# Verify versions match this inventory
```

---

## 📊 Resource Usage & Cost Estimates

### Azure Resources (Development)

**PostgreSQL Flexible Server:**
- Tier: B1ms or B2s
- Estimated Cost: $15-30/month
- Storage: $0.115/GB/month (32 GB = ~$3.68/month)

**Storage Account:**
- Storage: $0.02/GB/month
- Operations: $0.065/10k writes, $0.0043/10k reads
- Estimated Cost: <$5/month for development

**Total Estimated Azure Cost:** ~$20-40/month

**Note:** Actual costs may vary. Review Azure Cost Management regularly.

---

## ⚠️ Important Notes

### Security
- 🔒 Never commit `.env` files to Git
- 🔒 Rotate Azure Storage keys periodically
- 🔒 Update JWT secrets before production deployment
- 🔒 Configure proper firewall rules for PostgreSQL

### Backup & Recovery
- ✅ Azure PostgreSQL: Automatic backups (7 days retention)
- ✅ Azure Blob Storage: LRS provides local redundancy
- ⚠️ Code: Backed up in GitHub repository
- ⚠️ Manual backups recommended before major migrations

### Scaling Considerations
- Current setup suitable for: <100 users (MVP phase)
- Scale up when: >1000 active users or >100GB storage
- Upgrade paths:
  - PostgreSQL: B1ms → General Purpose tiers
  - Storage: LRS → GRS for geo-redundancy
  - Add CDN for global badge image distribution

---

## 📞 Support & Resources

### Documentation
- Sprint Backlogs: `_bmad-output/implementation-artifacts/sprint-*-backlog.md`
- Retrospectives: `_bmad-output/implementation-artifacts/sprint-*-retrospective.md`
- API Documentation: `gcredit-project/backend/README.md`

### Azure Support
- Portal: https://portal.azure.com
- Documentation: https://docs.microsoft.com/azure
- Support: Azure Portal → Help + support

### Prisma
- Documentation: https://www.prisma.io/docs
- Studio: `npx prisma studio`
- Migrations: `npx prisma migrate dev`

---

**Document Owner:** Scrum Master / Product Manager  
**Review Frequency:** After each Sprint completion  
**Next Review:** After Sprint 15 completion
