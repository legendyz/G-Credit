# Sprint 10 Version Manifest

**Sprint:** Sprint 10  
**Created:** 2026-02-08  
**Purpose:** Record all dependency versions at Sprint 10 start for reproducibility and drift prevention

---

## Runtime Environment

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | v20.20.0 LTS | Locked to v20 LTS line |
| **npm** | (bundled with Node) | |
| **PostgreSQL** | 16 | Azure Flexible Server |

---

## Backend Dependencies

### Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| **@nestjs/core** | ^11.0.1 | Enterprise Node.js framework |
| **@nestjs/cli** | ^11.0.16 | NestJS CLI tools |
| **TypeScript** | ^5.7.3 | Backend TS version |
| **@prisma/client** | ^6.19.2 | 🔒 **Version locked** — Prisma 7 has breaking changes (prisma.config.ts) |

### Authentication & Security

| Package | Version | Notes |
|---------|---------|-------|
| **passport** | ^0.7.0 | Authentication middleware |
| **bcrypt** | ^6.0.0 | Password hashing (upgraded Sprint 8, fixed tar vuln) |
| **helmet** | ^8.1.0 | CSP headers (added Sprint 8) |
| **@nestjs/throttler** | ^6.5.0 | Rate limiting (added Sprint 8) |
| **sanitize-html** | ^2.17.0 | HTML/XSS sanitization (added Sprint 9) |

### Azure Services

| Package | Version | Notes |
|---------|---------|-------|
| **@azure/storage-blob** | (installed Sprint 0) | Blob Storage client |
| **@microsoft/microsoft-graph-client** | (installed Sprint 6) | Graph API |

---

## Frontend Dependencies

### Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| **react** | ^19.2.0 | React with Concurrent Features |
| **vite** | ^7.2.4 | Build tool |
| **TypeScript** | ~5.9.3 | Frontend TS version |
| **tailwindcss** | ^4.1.18 | CSS framework |

### Routing & State

| Package | Version | Notes |
|---------|---------|-------|
| **react-router-dom** | ^6.30.3 | Client-side routing |
| **@tanstack/react-query** | ^5.90.20 | Server state management |
| **zustand** | ^5.0.10 | Client state management |

### UI Components

| Package | Version | Notes |
|---------|---------|-------|
| **@radix-ui/react-dialog** | ^1.1.15 | Shadcn/ui dialog primitive |
| **lucide-react** | ^0.563.0 | Icon library |
| **date-fns** | ^4.1.0 | Date formatting |
| **clsx** | ^2.1.1 | Class name utility |

---

## Infrastructure

| Component | Resource Name | Notes |
|-----------|--------------|-------|
| **Azure Storage** | gcreditdevstoragelz | 2 containers: badges (public), evidence (private) |
| **Azure PostgreSQL** | gcredit-dev-db-lz | Flexible Server, B1ms, PostgreSQL 16 |
| **Azure AD App** | ceafe2e0-73a9-46b6-a203-1005bfdda11f | Graph API integration |

---

## Database Schema (10 tables)

| Table | Sprint Added | Notes |
|-------|-------------|-------|
| users | Sprint 1 | 4 roles, auth fields |
| password_reset_tokens | Sprint 1 | |
| refresh_tokens | Sprint 1 | |
| badge_templates | Sprint 2 | Status lifecycle |
| skill_categories | Sprint 2 | |
| skills | Sprint 2 | |
| badges | Sprint 3 | BadgeStatus enum |
| evidence_files | Sprint 4 | SAS token access |
| milestone_configs | Sprint 4 | |
| milestone_achievements | Sprint 4 | |
| bulk_issuance_sessions | Sprint 9 | CSV upload sessions |

---

## Version Lock Notes

| Package | Locked Version | Reason | Re-evaluate |
|---------|---------------|--------|-------------|
| **@prisma/client** | 6.19.2 | Prisma 7 requires prisma.config.ts, breaking migration path | Post-MVP (v1.1+) |
| **Node.js** | v20 LTS | Production stability | When v22 LTS is available |

---

## Known Security Issues

| Issue | Severity | Status | Reference |
|-------|----------|--------|-----------|
| lodash Prototype Pollution | Moderate (CVSS 6.5) | ✅ Risk Accepted | ADR-002 |
| AWS SDK upstream vulns | Low | Monitored | npm audit (22 items, non-blocking) |

---

## Sprint 10 Changes

**No new dependencies planned for Sprint 10.** This is a cleanup + UAT + release sprint.

- No new npm packages
- No new Azure resources
- No database schema changes
- No new environment variables (except optional `JWT_ACCESS_TOKEN_EXPIRY_UAT=4h` for UAT)

---

**Previous Version Manifest:** [Sprint 9 Version Manifest](../sprint-9/version-manifest.md)
