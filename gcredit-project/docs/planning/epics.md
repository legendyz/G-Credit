---
stepsCompleted: [1, 2, 3, 4]
status: 'implementation-ready'
license: 'MIT'
note: 'All 14 epics with 85 detailed user stories completed, validated, and approved. Phased implementation strategy aligned (2026-01-23). Ready for Sprint Planning.'
lastUpdated: '2026-01-23'
validationSummary: 'Party Mode validation completed with Architect, UX Designer, and PM. Stories updated with: integration verification stories, simplified visual designer, empty state criteria, performance optimization, rate limiting, Service Bus infrastructure, schema design document, and workflow clarifications. Final validation passed all 6 checks: FR coverage (33/33), architecture compliance, story quality, epic structure, epic independence, and dependency validation.'
finalValidationDate: '2026-01-22'
phasedStrategyAlignmentDate: '2026-01-23'
phasedStrategyNote: 'Epic 1 simplified to Phase 1 minimal Azure services (PostgreSQL + Blob Storage). Epic 13 (Azure AD SSO) moved to Phase 3. Architecture, UX Design, and Epics now fully aligned.'
totalEpics: 14
totalStories: 85
inputDocuments:
  - "MD_FromCopilot/PRD.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "MD_FromCopilot/product-brief.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# G-Credit - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for G-Credit (Internal Digital Credentialing System), decomposing the requirements from the PRD, Architecture, and Product Brief into implementable stories.

## Requirements Inventory

### Functional Requirements

**Badge Management & Design:**
- FR1: Create badge templates with metadata (title, description, criteria, skills taxonomy)
- FR2: Maintain badge catalog with search and categorization
- FR3: Design badge images and branding with visual designer
- FR4: Configure badge expiration and renewal policies
- FR5: Implement approval and governance workflows for badge templates

**Issuance Workflows:**
- FR6: Issue badges manually to single recipients
- FR7: Perform bulk badge issuance via CSV upload
- FR8: Automate badge issuance via LMS course completion triggers
- FR9: Enable manager nomination and approval workflows for badges
- FR10: Enforce role-based issuing permissions with RBAC

**Verification & Standards Compliance:**
- FR11: Generate Open Badges 2.0 (IMS Global) compliant badge assertions
- FR12: Provide public verification pages with unique URLs per badge
- FR13: Store immutable badge metadata (issuer, recipient, issuance date, criteria)
- FR14: Export badges as JSON-LD assertions
- FR15: Support baked badge PNG format
- FR16: Implement badge revocation with reason tracking

**Employee Experience:**
- FR17: Provide personal badge wallet/profile for employees
- FR18: Implement badge claiming workflow (manual or auto-accept)
- FR19: Enable privacy controls (public/private per badge)
- FR20: Support social sharing to LinkedIn, email, personal sites
- FR21: Allow badge download and export

**Analytics & Insights:**
- FR22: Display admin dashboards with issuance trends, claim rates, share rates
- FR23: Show organizational skill inventory
- FR24: Provide department and role-based skill distribution views
- FR25: Calculate program effectiveness metrics
- FR26: Enable exportable reports for HR planning

**System Integrations:**
- FR27: Integrate Azure AD (Entra ID) for SSO authentication
- FR28: Sync employee directory from HRIS
- FR29: Consume LMS webhooks for automated issuance
- FR30: Send Microsoft Teams notifications and enable bot interactions
- FR31: Send Outlook email notifications
- FR32: Enable LinkedIn sharing integration
- FR33: Provide RESTful APIs for external system access

### Non-Functional Requirements

**Security & Compliance:**
- NFR1: Implement Azure AD SSO with role-based access control (Admin, Issuer, Manager, Employee)
- NFR2: Encrypt data at rest and in transit using TLS 1.2+
- NFR3: Maintain comprehensive audit logging for all issuance and revocation actions
- NFR4: Implement secure API authentication using OAuth 2.0 for external integrations
- NFR5: Ensure Open Badges 2.0 standard compliance for credential portability
- NFR6: Provide GDPR-ready privacy controls with user consent management
- NFR7: Comply with enterprise data governance and Azure region requirements

**Performance & Scalability:**
- NFR8: Achieve responsive UI load times (<2s for page loads)
- NFR9: Process bulk CSV operations efficiently (1000+ badges without timeout)
- NFR10: Design stateless microservices for horizontal scaling
- NFR11: Implement asynchronous processing for long-running operations
- NFR12: Deliver public verification pages and badge images via CDN
- NFR13: Support auto-scaling infrastructure to handle peak issuance periods

**Reliability & Availability:**
- NFR14: Maintain high availability architecture (99.9% uptime target for Phase 1)
- NFR15: Implement graceful degradation for integration failures
- NFR16: Provide retry mechanisms for webhook delivery
- NFR17: Ensure database backup and disaster recovery capabilities
- NFR18: Enable health monitoring and alerting

**Usability & Accessibility:**
- NFR19: Achieve WCAG 2.1 AA compliance for web accessibility
- NFR20: Provide responsive design for desktop, tablet, and mobile devices
- NFR21: Support internationalization (English first, multi-language support later)
- NFR22: Design intuitive workflows for non-technical HR administrators

### Additional Requirements

**Technical Architecture Requirements:**
- Frontend: React 18+ with TypeScript and Vite build tooling
- Backend: NestJS 10+ with Node.js 20 LTS
- Database: PostgreSQL 16 with Prisma 5 ORM
- Cloud: Azure-native deployment (phased approach)
  - Phase 1: PostgreSQL Flexible Server + Blob Storage
  - Phase 2: Add App Service deployment
  - Phase 3: Add Service Bus, Redis, Key Vault, Application Insights
- Authentication: 
  - Phase 1-2: JWT with Passport Local Strategy
  - Phase 3: Azure AD OAuth 2.0 via Passport.js (optional)
- API Documentation: Auto-generated Swagger/OpenAPI documentation
- Testing: Vitest (frontend), Jest (backend), Playwright (E2E)
- Starter Template: Project initialization using Vite for frontend and NestJS CLI for backend
- Open Badges 2.0 data model with JSONB storage in PostgreSQL

**Infrastructure Requirements:**
- Phase 1 (MVP): Azure Resource Group, PostgreSQL Flexible Server, Blob Storage
- Phase 2 (Pilot): Add App Service deployment, CI/CD pipelines
- Phase 3 (Production): Add Service Bus, Application Insights, Key Vault, Private Endpoints
- Docker containers for local development (optional)

**Integration Architecture:**
- Phase 1-2: JWT-based authentication with email/password
- Phase 3: Azure AD Graph API for user authentication and profile data (optional)
- Webhook ingestion API for LMS/HRIS events
- Microsoft Graph API for Teams and Outlook notifications (Phase 3)
- LinkedIn OAuth API for badge sharing
- Public verification API (unauthenticated)

**Data Architecture:**
- Open Badges 2.0 compliant schema (Issuer, BadgeClass, Assertion)
- JSONB fields for flexible metadata storage
- Soft-delete pattern for badge revocations
- Audit trail tables for compliance
- Phase 3: Redis cache for frequently accessed data

**Security Architecture:**
- Four RBAC roles: Admin, Issuer, Manager, Employee
- JWT-based stateless authentication (Phase 1-2)
- API key authentication for external integrations
- Public endpoint exception handling for verification pages
- Rate limiting and DDoS protection (Phase 3)
- Phase 1-2: Secrets in .env file (not committed)
- Phase 3: Secrets management via Azure Key Vault

### FR Coverage Map

| FR ID | Functional Requirement | Covered by Epic(s) |
|-------|------------------------|-------------------|
| FR1 | Create badge templates with metadata | Epic 3 |
| FR2 | Maintain badge catalog | Epic 3 |
| FR3 | Design badge images and branding | Epic 3 |
| FR4 | Configure badge expiration and renewal policies | Epic 3 |
| FR5 | Implement approval workflows for badge templates | Epic 3 |
| FR6 | Issue badges manually to single recipients | Epic 4 |
| FR7 | Perform bulk badge issuance via CSV | Epic 8 |
| FR8 | Automate badge issuance via LMS triggers | Epic 10 |
| FR9 | Enable manager nomination and approval workflows | Epic 11 |
| FR10 | Enforce role-based issuing permissions | Epic 2, Epic 13 |
| FR11 | Generate Open Badges 2.0 compliant assertions | Epic 6 |
| FR12 | Provide public verification pages | Epic 6 |
| FR13 | Store immutable badge metadata | Epic 6 |
| FR14 | Export badges as JSON-LD | Epic 6 |
| FR15 | Support baked badge PNG format | Epic 6 |
| FR16 | Implement badge revocation | Epic 9 |
| FR17 | Provide personal badge wallet/profile | Epic 5 |
| FR18 | Implement badge claiming workflow | Epic 5 |
| FR19 | Enable privacy controls | Epic 5 |
| FR20 | Support social sharing | Epic 7 |
| FR21 | Allow badge download and export | Epic 5 |
| FR22 | Display admin dashboards | Epic 12 |
| FR23 | Show organizational skill inventory | Epic 12 |
| FR24 | Provide department/role-based skill views | Epic 12 |
| FR25 | Calculate program effectiveness metrics | Epic 12 |
| FR26 | Enable exportable reports | Epic 12 |
| FR27 | Integrate Azure AD for SSO | Epic 13 (Phase 3) |
| FR28 | Sync employee directory from HRIS | Epic 10 |
| FR29 | Consume LMS webhooks | Epic 10 |
| FR30 | Send Teams notifications | Epic 7, Epic 10 |
| FR31 | Send Outlook email notifications | Epic 7, Epic 10 |
| FR32 | Enable LinkedIn sharing | Epic 7 |
| FR33 | Provide RESTful APIs for external systems | Epic 14 |

**Coverage Summary:**
- All 33 Functional Requirements mapped to epics
- No gaps in functional coverage
- Authentication strategy phased: Epic 2 (JWT) → Epic 13 (Azure AD)

## Epic List

### Epic 1: 项目基础设施 (Project Infrastructure Setup)
**Value:** Enable all subsequent development by establishing the technical foundation
**Description:** Initialize frontend and backend projects using architecture-specified starter templates, configure Azure resource groups, set up PostgreSQL database, establish CI/CD pipelines, and implement health monitoring. This epic creates the foundational infrastructure on which all features will be built.
**Acceptance Criteria:**
- React 18+ project initialized with Vite and TypeScript
- NestJS 10+ backend initialized with Prisma ORM
- Azure Resource Group created (Phase 1 minimal setup)
- PostgreSQL 16 Flexible Server provisioned (Burstable B1ms tier)
- Azure Blob Storage configured for badge images
- CI/CD pipeline established (GitHub Actions or Azure DevOps)
- Basic health monitoring endpoints implemented (/health, /ready)
- Phase 3: Application Insights and Service Bus deferred

---

### Epic 2: 基础认证与用户管理 (Basic JWT Authentication & User Management)
**Value:** Enable secure access and role-based permissions with simpler implementation suitable for team
**Description:** Implement JWT-based authentication with basic user registration and login, establish RBAC for four roles (Admin, Issuer, Manager, Employee), create user profile management, and build password reset flows. This provides immediate security without the complexity of Azure AD integration.
**Acceptance Criteria:**
- JWT authentication implemented with refresh tokens
- Four RBAC roles configured (Admin, Issuer, Manager, Employee)
- User registration and login flows working
- Password reset via email working
- User profile management UI completed
- Session management and logout working
**Note:** Phase 1 authentication strategy - simpler for team to implement and test

---

### Epic 3: Badge Template Management
**Value:** Enable HR admins and issuers to create reusable badge definitions
**Description:** Build admin portal for creating, editing, and managing badge templates with metadata (title, description, criteria, skills taxonomy), image upload for badge branding, expiration policies, and approval workflows for governance.
**Acceptance Criteria:**
- Badge template CRUD operations working
- Badge image upload and storage integrated
- Skills taxonomy management implemented
- Expiration and renewal policy configuration working
- Badge template approval workflow operational
- Badge catalog with search and filtering functional

---

### Epic 4: Manual Badge Issuance
**Value:** Enable issuers to award badges to individual employees
**Description:** Create manual badge issuance workflow where Issuers can select badge template, choose recipient, provide evidence/justification, and issue single badges. Recipient receives notification and must claim badge.
**Acceptance Criteria:**
- Badge issuance form with template selection working
- Employee search and selection implemented
- Evidence upload and justification fields functional
- Open Badges 2.0 compliant assertion generated
- Notification sent to recipient (email)
- Audit log entry created for issuance action

---

### Epic 5: Employee Badge Wallet & Claiming
**Value:** Give employees personal badge portfolio with privacy controls
**Description:** Build employee-facing badge wallet showing earned, pending, and claimed badges with privacy settings (public/private), claiming workflow (auto or manual accept), badge detail views, and download/export capabilities.
**Acceptance Criteria:**
- Personal badge wallet UI completed
- Badge claiming workflow (accept/reject) working
- Privacy controls per badge implemented
- Badge detail view with metadata displayed
- Badge download (PNG, JSON-LD) working
- Mobile-responsive design validated

---

### Epic 6: Badge Verification & Standards Compliance
**Value:** Ensure badge credibility through public verification and industry standards
**Description:** Implement Open Badges 2.0 full compliance with public verification pages, JSON-LD export, baked PNG support, immutable metadata storage, and cryptographic signing for authenticity.
**Acceptance Criteria:**
- Open Badges 2.0 data model implemented in PostgreSQL
- Public verification pages with unique URLs working (unauthenticated access)
- JSON-LD assertion export working
- Baked badge PNG generation implemented
- Badge metadata immutability enforced
- Verification API endpoint operational

---

### Epic 7: Badge Sharing & Social Integration
**Value:** Maximize badge value through social visibility and recognition
**Description:** Enable employees to share badges to LinkedIn, email, personal websites, and internal Teams channels. Implement sharing analytics tracking and Open Graph meta tags for rich social previews.
**Acceptance Criteria:**
- LinkedIn sharing integration working (OAuth)
- Email sharing with badge preview implemented
- Teams notification integration working
- Embeddable badge widget for personal sites created
- Sharing analytics tracked (share count, platform)
- Open Graph meta tags for rich previews implemented

---

### Epic 8: Bulk Badge Issuance
**Value:** Enable HR to efficiently award badges at scale (e.g., program completions)
**Description:** Build bulk issuance workflow with CSV upload, validation, preview, and batch processing. Support 1000+ badges per operation with progress tracking and error reporting.
**Acceptance Criteria:**
- CSV upload with template validation working
- Bulk issuance preview UI implemented
- Batch processing operational (Phase 1: 50 badges synchronous, Phase 3: 1000+ async)
- Progress tracking and error reporting functional
- Bulk notification sending working (email)
- Audit log entries for bulk operations created
**Phase 1 Limitation:** 50 badges per upload (synchronous processing), user must wait 2-3 minutes
**Phase 3 Upgrade:** Unlimited badges with Azure Service Bus async processing

---

### Epic 9: Badge Revocation
**Value:** Maintain badge integrity by enabling revocation when necessary
**Description:** Implement badge revocation workflow with reason tracking (policy violation, error, expiration), revocation status display on verification pages, and notification to affected employees.
**Acceptance Criteria:**
- Badge revocation form with reason codes working
- Revocation status reflected on verification pages
- Revoked badge visual treatment in employee wallet
- Notification sent to affected employee
- Audit log entry for revocation created
- Soft-delete pattern ensuring data retention

---

### Epic 10: Automated LMS Integration
**Value:** Reduce manual work by auto-issuing badges upon course completion
**Description:** Build webhook ingestion API to receive LMS course completion events, implement mapping logic (course ID → badge template), auto-issue badges, sync employee directory from HRIS, and handle retry mechanisms for failed deliveries.
**Acceptance Criteria:**
- Webhook API endpoint operational with authentication
- LMS course-to-badge mapping configuration UI working
- Automatic badge issuance on webhook receipt working
- HRIS employee directory sync implemented
- Retry logic for failed webhook deliveries working
- Phase 1-2: Synchronous webhook processing (simple, fast MVP)
- Phase 3: Azure Service Bus integration for async processing and scale

---

### Epic 11: Manager Nomination & Approval Workflow
**Value:** Enable distributed badge recognition through manager-driven nominations
**Description:** Create nomination workflow where Managers nominate employees for badges, Issuers/Admins review and approve/reject nominations, and nominees receive badges upon approval. Implement notification chain and approval UI.
**Acceptance Criteria:**
- Manager nomination form working
- Issuer/Admin approval queue UI implemented
- Multi-step approval workflow operational
- Notification chain working (nominee, manager, issuer)
- Nomination history and status tracking functional
- Rejection reason capture and communication working

---

### Epic 12: Analytics & Reporting Dashboard
**Value:** Provide data-driven insights for HR to measure program success
**Description:** Build comprehensive analytics dashboard showing badge issuance trends, claim rates, share rates, organizational skill inventory, department/role distributions, and program effectiveness metrics. Enable exportable reports for HR planning.
**Acceptance Criteria:**
- Admin analytics dashboard UI completed
- Issuance trend charts (time-series) working
- Skill inventory visualization implemented
- Department/role-based skill distribution views working
- Claim rate and engagement metrics displayed
- Exportable reports (CSV, PDF) functional

---

### Epic 13: Enterprise SSO Integration (Phase 3)
**Value:** Enable seamless enterprise authentication with Azure AD for enhanced security
**Description:** Integrate Azure AD (Entra ID) OAuth 2.0 for single sign-on, migrate existing JWT users to Azure AD, synchronize user profiles with Graph API, and maintain backward compatibility during transition. This epic represents Phase 3 after team gains production experience with Phase 1 JWT authentication and Phase 2 deployment.
**Acceptance Criteria:**
- Azure AD OAuth 2.0 authentication flow working
- User profile sync with Azure AD Graph API implemented
- Migration path from JWT to Azure AD completed
- Backward compatibility maintained during transition (both JWT and Azure AD supported)
- Azure AD group-based RBAC mapping working
- Enterprise security audit compliance verified
**Note:** Phase 3 authentication strategy - implemented after team gains experience with simpler JWT auth and validates MVP with pilot users

---

### Epic 14: External API & Extensibility
**Value:** Enable integration with external tools and future platform expansion
**Description:** Build comprehensive RESTful API with OAuth 2.0 authentication for external systems, auto-generate Swagger/OpenAPI documentation, implement rate limiting, provide SDK samples (JavaScript, Python), and create developer documentation portal.
**Acceptance Criteria:**
- RESTful API with full CRUD operations operational
- OAuth 2.0 API key authentication implemented
- Swagger/OpenAPI documentation auto-generated
- Rate limiting and throttling configured
- SDK samples (JavaScript, Python) created
- Developer documentation portal published

---

## Epic Details with User Stories

---

### Epic 1: 项目基础设施 (Project Infrastructure Setup)

**Epic Goal:** Enable all subsequent development by establishing the technical foundation

**Requirements Covered:**
- Technical Architecture Requirements (React 18+, NestJS 10+, PostgreSQL 16, Prisma 5)
- Azure Infrastructure (Resource Group, App Service, Blob Storage, Service Bus)
- CI/CD Pipeline
- NFR18: Health monitoring and alerting

---

#### Story 1.1: 初始化前端项目

As a **Developer**,  
I want **to initialize a React 18+ project using Vite with TypeScript configured**,  
So that **I have a modern, fast development environment for building the G-Credit frontend**.

**Acceptance Criteria:**

**Given** I have Node.js 20 LTS installed  
**When** I run the Vite initialization command with React and TypeScript templates  
**Then** A new React 18+ project is created with Vite build tooling  
**And** TypeScript is configured with strict mode enabled  
**And** ESLint and Prettier are configured for code quality  
**And** Tailwind CSS is installed and configured  
**And** Project structure includes src/, public/, and config files  
**And** Development server starts successfully on `npm run dev`  
**And** Hot module replacement (HMR) works correctly

---

#### Story 1.2: 初始化后端项目

As a **Developer**,  
I want **to initialize a NestJS 10+ backend project with TypeScript and module structure**,  
So that **I have a scalable, enterprise-ready API foundation**.

**Acceptance Criteria:**

**Given** I have Node.js 20 LTS and Nest CLI installed  
**When** I run `nest new` command to create the backend project  
**Then** A NestJS 10+ project is created with TypeScript  
**And** Project structure includes src/modules/, src/common/, test/ directories  
**And** Basic app module, controller, and service are generated  
**And** Jest testing framework is configured  
**And** API documentation setup with Swagger is initialized  
**And** Development server starts successfully on `npm run start:dev`  
**And** Health check endpoint `/health` returns 200 OK

---

#### Story 1.3: 配置PostgreSQL数据库连接

As a **Developer**,  
I want **to configure Prisma ORM with PostgreSQL database connection**,  
So that **I can define data models and perform database operations**.

**Acceptance Criteria:**

**Given** Backend project is initialized  
**When** I install Prisma 5 and configure the database connection  
**Then** Prisma is installed with `@prisma/client` and Prisma CLI  
**And** `prisma/schema.prisma` file is created with PostgreSQL datasource  
**And** Database connection string is configured via environment variables  
**And** Prisma Client is generated successfully  
**And** Database connection test passes (can connect to PostgreSQL)  
**And** Prisma migration commands work (`prisma migrate dev`)  
**And** `.env` file template with `DATABASE_URL` is documented

---

#### Story 1.4: 配置Phase 1 Azure基础资源

As a **DevOps Engineer**,  
I want **to provision Phase 1 minimal Azure resources (PostgreSQL + Blob Storage only)**,  
So that **the development team can start building MVP without infrastructure complexity**.

**Acceptance Criteria:**

**Given** I have Azure CLI installed and authenticated  
**When** I run the Phase 1 infrastructure provisioning script  
**Then** Azure Resource Group is created in the specified region  
**And** Azure PostgreSQL Flexible Server (Burstable B1ms tier) is provisioned  
**And** PostgreSQL public access is enabled for development (Phase 3 will use private endpoint)  
**And** PostgreSQL firewall rules allow Azure services and developer IPs  
**And** SSL/TLS connection is enforced on PostgreSQL  
**And** Azure Blob Storage account (Standard LRS) is created  
**And** Blob Storage container 'badges' is created with public read access  
**And** Blob Storage container 'evidence' is created with private access  
**And** Connection strings are saved to .env.example template (not committed)  
**And** All resource tags are applied (project: G-Credit, environment: dev, phase: 1)  
**And** Infrastructure-as-Code (IaC) scripts are committed to repository  

**Phase 3 Deferred:**
- Virtual Network and Private Endpoints (simplified for MVP)
- Network Security Groups (simplified for MVP)
- Azure Service Bus (no async processing in Phase 1)
- Azure Key Vault (use .env file in Phase 1)

---

#### Story 1.5: 配置CI/CD Pipeline

As a **DevOps Engineer**,  
I want **to establish automated CI/CD pipeline for frontend and backend deployments**,  
So that **code changes are automatically tested and deployed**.

**Acceptance Criteria:**

**Given** GitHub repository exists with frontend and backend code  
**When** I configure GitHub Actions workflow files  
**Then** CI pipeline runs on every pull request  
**And** Frontend build and tests execute successfully  
**And** Backend build and tests execute successfully  
**And** Linting and code quality checks pass  
**And** CD pipeline deploys to Azure App Service on merge to main branch  
**And** Frontend deploys to Azure Static Web Apps or App Service  
**And** Backend deploys to Azure App Service  
**And** Deployment status is visible in GitHub Actions tab  
**And** Rollback procedure is documented

---

#### Story 1.6: 实现健康检查端点和基础日志

As a **SRE/DevOps Engineer**,  
I want **to implement health check endpoints and structured logging for Phase 1 monitoring**,  
So that **I can track application health and performance metrics**.

**Acceptance Criteria:**

**Given** Backend application is deployed to Azure  
**When** I access the health check endpoints  
**Then** `/health` endpoint returns 200 OK with status "healthy"  
**And** `/health/db` endpoint verifies database connectivity  
**And** `/health/storage` endpoint verifies Azure Blob Storage connectivity  
**And** Azure Application Insights instrumentation is installed  
**And** Application telemetry (requests, dependencies, exceptions) is collected  
**And** Custom metrics for key operations are tracked  
**And** Alerts are configured for error rate thresholds  
**And** Application Map shows service dependencies in Azure Portal  
**And** Monitoring dashboard is accessible to the team

---

#### Story 1.7: 配置Azure Service Bus消息队列 (Phase 3 Deferred)

**Note:** This story is deferred to Phase 3. Phase 1 MVP uses synchronous processing for all operations (badge issuance, email notifications). Service Bus is added in Phase 3 when async processing becomes necessary for scale.

As a **Developer**,  
I want **to set up Azure Service Bus with queues and monitoring**,  
So that **async processing infrastructure is ready for bulk operations and webhooks**.

**Phase 3 Acceptance Criteria:**

**Given** Azure Resource Group exists  
**When** Azure Service Bus namespace is provisioned  
**Then** Service Bus namespace is created with Standard or Premium tier  
**And** Queues are created: `bulk-badge-issuance`, `lms-course-completion-events`, `email-notifications`  
**And** Dead letter queues are automatically enabled for all queues  
**And** Message TTL is configured (7 days default)  
**And** Connection string is stored in Azure Key Vault  
**And** Backend application includes Azure Service Bus SDK  
**And** Basic producer/consumer test validates queue functionality  
**And** Queue metrics are visible in Azure Portal and Application Insights  
**And** Alert rules configured for queue depth thresholds  
**And** Documentation explains queue naming conventions and usage patterns  
**And** Retry policies configured (max 5 attempts with exponential backoff)

---

### Epic 2: 基础认证与用户管理 (Basic JWT Authentication & User Management)

**Epic Goal:** Enable secure access and role-based permissions with simpler implementation suitable for team

**Requirements Covered:**
- FR10: Role-based issuing permissions (Admin, Issuer, Manager, Employee)
- NFR1: Implement role-based access control (RBAC)
- NFR2: Data encryption (in transit and at rest)
- NFR3: Audit logging
- NFR4: Secure API authentication

**Note:** Phase 1 authentication strategy - JWT-based to reduce initial complexity

---

#### Story 2.1: 创建用户数据模型和数据库表

As a **Developer**,  
I want **to define User entity with Prisma schema and create database tables**,  
So that **I can store user accounts with role-based access control**.

**Acceptance Criteria:**

**Given** Prisma is configured in the backend project  
**When** I define the User model in schema.prisma  
**Then** User table includes fields: id, email, passwordHash, firstName, lastName, role, isActive, createdAt, updatedAt  
**And** Role enum is defined with values: ADMIN, ISSUER, MANAGER, EMPLOYEE  
**And** Email field has unique constraint  
**And** Prisma migration creates the User table in PostgreSQL  
**And** User model includes timestamps (createdAt, updatedAt) with auto-generation  
**And** Password field is stored as hashed value (bcrypt preparation)  
**And** Database indexes are created on email and role fields for query performance

---

#### Story 2.2: 实现用户注册功能

As an **Administrator**,  
I want **to register new users with email and password**,  
So that **employees can create accounts to access the G-Credit system**.

**Acceptance Criteria:**

**Given** User database table exists  
**When** A new user submits registration form with email, password, firstName, lastName  
**Then** Password is validated for strength (min 8 chars, uppercase, lowercase, number)  
**And** Email format is validated and checked for uniqueness  
**And** Password is hashed using bcrypt before storage  
**And** User record is created with default role EMPLOYEE  
**And** Registration API endpoint POST `/auth/register` returns 201 Created  
**And** Sensitive data (password) is not returned in API response  
**And** Registration failure returns appropriate error messages (duplicate email, weak password)  
**And** Audit log entry is created for new user registration

---

#### Story 2.3: 实现JWT登录认证

As an **Employee**,  
I want **to log in with email and password to receive authentication tokens**,  
So that **I can access protected features of the application**.

**Acceptance Criteria:**

**Given** User has registered account  
**When** User submits login form with valid email and password  
**Then** Backend validates credentials against database  
**And** JWT access token is generated with user id, email, role in payload  
**And** JWT refresh token is generated with longer expiration  
**And** Access token expires in 15 minutes  
**And** Refresh token expires in 7 days  
**And** Login API endpoint POST `/auth/login` returns tokens and user profile  
**And** Invalid credentials return 401 Unauthorized with error message  
**And** Inactive users cannot log in (isActive check)  
**And** Rate limiting prevents brute force attacks (max 5 failed attempts per 15 minutes per IP)  
**And** Account temporarily locked after 5 consecutive failed attempts (15 minute lockout)  
**And** Audit log entry is created for successful/failed login attempts

---

#### Story 2.4: 实现RBAC角色权限系统

As a **Developer**,  
I want **to implement role-based access control with four roles and permission guards**,  
So that **different user types have appropriate access levels**.

**Acceptance Criteria:**

**Given** JWT authentication is working  
**When** Protected API endpoints are accessed  
**Then** JWT token is validated on each request  
**And** User role is extracted from JWT payload  
**And** Four roles are enforced: ADMIN (full access), ISSUER (badge management), MANAGER (nominations), EMPLOYEE (wallet access)  
**And** Role-based guards/decorators are implemented in NestJS  
**And** Unauthorized access returns 403 Forbidden  
**And** Admin role can access all endpoints  
**And** Role hierarchy is documented in code comments  
**And** Protected endpoints include role requirements in API documentation

---

#### Story 2.5: 实现密码重置流程

As an **Employee**,  
I want **to reset my password via email verification**,  
So that **I can regain access if I forget my credentials**.

**Acceptance Criteria:**

**Given** User has forgotten password  
**When** User requests password reset with email address  
**Then** System generates secure reset token with 1-hour expiration  
**And** Reset token is stored in database with userId and expiresAt  
**And** Email is sent with password reset link containing token  
**And** Reset link directs to password reset form  
**And** User submits new password with valid token  
**And** New password is validated and hashed with bcrypt  
**And** User password is updated in database  
**And** Reset token is invalidated after successful use  
**And** Expired or invalid tokens return appropriate error messages  
**And** Audit log entry is created for password reset actions

---

#### Story 2.6: 创建用户资料管理页面

As an **Employee**,  
I want **to view and edit my profile information**,  
So that **I can keep my account details up to date**.

**Acceptance Criteria:**

**Given** User is authenticated  
**When** User navigates to profile page  
**Then** Profile page displays current user information (firstName, lastName, email, role)  
**And** User can edit firstName and lastName fields  
**And** Email field is read-only (requires separate verification flow)  
**And** Profile update API endpoint PUT `/users/profile` works  
**And** Updated profile data is saved to database  
**And** Success message is displayed after profile update  
**And** Profile page is mobile-responsive  
**And** Form validation prevents empty required fields  
**And** Audit log entry is created for profile updates

---

#### Story 2.7: 实现会话管理和登出

As an **Employee**,  
I want **to securely log out and invalidate my authentication tokens**,  
So that **my session is terminated when I leave the application**.

**Acceptance Criteria:**

**Given** User is logged in with valid tokens  
**When** User clicks logout button  
**Then** Logout API endpoint POST `/auth/logout` is called  
**And** Refresh token is invalidated/removed from system  
**And** Client-side tokens (access and refresh) are cleared from storage  
**And** User is redirected to login page  
**And** Subsequent API requests with old tokens return 401 Unauthorized  
**And** Token refresh endpoint POST `/auth/refresh` validates refresh token  
**And** New access token is issued when valid refresh token is provided  
**And** Expired refresh tokens cannot be used to get new access tokens  
**And** Audit log entry is created for logout actions

---

### Epic 3: Badge Template Management

**Epic Goal:** Enable HR admins and issuers to create reusable badge definitions

**Requirements Covered:**
- FR1: Create badge templates with metadata (title, description, criteria, skills taxonomy)
- FR2: Maintain badge catalog with search and categorization
- FR3: Design badge images and branding with visual designer
- FR4: Configure badge expiration and renewal policies
- FR5: Implement approval and governance workflows for badge templates

---

#### Story 3.0: 设计完整数据库架构文档

As a **Architect/Developer**,  
I want **to design complete database schema following Open Badges 2.0 specification**,  
So that **all entities, relationships, and constraints are planned before implementation**.

**Acceptance Criteria:**

**Given** Open Badges 2.0 specification is reviewed  
**When** Database schema design document is created  
**Then** Document includes all core entities: User, BadgeClass, BadgeAssertion, BadgeNomination, Issuer, Skills  
**And** Entity relationship diagram (ERD) shows all foreign key relationships  
**And** Document specifies JSONB fields with example data structures  
**And** Document defines all database constraints (unique, not null, check constraints)  
**And** Document specifies immutable fields and enforcement strategy (DB constraints vs app-level)  
**And** Document includes indexes for performance (email, badgeClassId, recipientId, status, dates)  
**And** Document maps Open Badges 2.0 fields to database columns  
**And** Document addresses audit trail table design  
**And** Document reviews with Architect before Prisma schema creation  
**And** Schema design stored in `_bmad-output/planning-artifacts/database-schema.md`  
**And** Team consensus achieved on schema approach before Story 3.1 begins

---

#### Story 3.1: 创建徽章模板数据模型

As a **Developer**,  
I want **to define BadgeClass entity following Open Badges 2.0 specification**,  
So that **badge templates store standardized metadata for credentials**.

**Acceptance Criteria:**

**Given** Prisma schema is configured  
**When** I define the BadgeClass model  
**Then** BadgeClass table includes fields: id, name, description, criteria, imageUrl, issuerProfileId, tags, skills (JSONB), expirationPolicy (JSONB), isActive, createdAt, updatedAt  
**And** Skills field stores array of skill objects with taxonomy structure  
**And** ExpirationPolicy field stores duration and renewal options as JSON  
**And** Issuer relationship references organization profile (future-proofing)  
**And** BadgeClass model includes approval status field (DRAFT, PENDING, APPROVED, REJECTED)  
**And** Database indexes are created on name, tags, and isActive fields  
**And** Prisma migration creates BadgeClass table  
**And** Open Badges 2.0 metadata fields align with specification

---

#### Story 3.2: 实现徽章模板CRUD API

As an **Issuer**,  
I want **to create, read, update, and delete badge templates via API**,  
So that **I can manage badge definitions programmatically**.

**Acceptance Criteria:**

**Given** BadgeClass table exists and user has ISSUER or ADMIN role  
**When** API endpoints are accessed  
**Then** POST `/badge-templates` creates new badge template (status: DRAFT)  
**And** GET `/badge-templates` returns paginated list with filters (status, tags, skills)  
**And** GET `/badge-templates/:id` returns single badge template details  
**And** PUT `/badge-templates/:id` updates existing template (only DRAFT or REJECTED)  
**And** DELETE `/badge-templates/:id` soft-deletes template (sets isActive=false)  
**And** API validates required fields (name, description, criteria)  
**And** API endpoints are protected by RBAC (ISSUER, ADMIN roles only)  
**And** Swagger documentation includes all endpoints with examples  
**And** Audit log entries created for all CRUD operations

---

#### Story 3.3: 构建徽章模板创建和编辑表单

As an **Issuer**,  
I want **to use an intuitive form to create and edit badge templates**,  
So that **I can define badge metadata without technical knowledge**.

**Acceptance Criteria:**

**Given** User has ISSUER role and is logged in  
**When** User navigates to badge template creation page  
**Then** Form displays fields: name, description, criteria (rich text editor), tags (multi-select)  
**And** Rich text editor supports formatting for criteria description  
**And** Tags input allows creating new tags or selecting existing ones  
**And** Form validation prevents submission with empty required fields  
**And** "Save as Draft" button creates template with DRAFT status  
**And** "Submit for Approval" button creates template with PENDING status  
**And** Success message displays after successful save  
**And** Edit mode pre-populates form with existing template data  
**And** Form is mobile-responsive  
**And** UX Design specification for badge template form is followed

---

#### Story 3.4: 实现技能分类管理系统

As an **Administrator**,  
I want **to manage a hierarchical skills taxonomy**,  
So that **badges can be tagged with standardized skill categories**.

**Acceptance Criteria:**

**Given** Admin user is logged in  
**When** Admin accesses Skills Management page  
**Then** Skills taxonomy displays as hierarchical tree structure  
**And** Admin can create new skill categories with parent-child relationships  
**And** Each skill has name, description, and optional parent category  
**And** Skills can be organized in levels (e.g., Domain > Category > Skill)  
**And** Skill CRUD API endpoints work: POST/GET/PUT/DELETE `/skills`  
**And** Badge template form includes skill selector with search and filtering  
**And** Multiple skills can be assigned to a badge template  
**And** Skills data is stored in dedicated Skills table  
**And** Badge-to-Skills relationship is many-to-many via junction table

---

#### Story 3.5: 实现徽章图像上传

As an **Issuer**,  
I want **to upload badge images for templates**,  
So that **badges have distinctive and branded appearance**.

**Acceptance Criteria:**

**Given** User is creating or editing badge template  
**When** User interacts with badge image upload section  
**Then** User can upload custom image (PNG, JPG, SVG) up to 5MB  
**And** Uploaded images are stored in Azure Blob Storage  
**And** Image URLs are saved in BadgeClass.imageUrl field  
**And** Image preview displays immediately after upload  
**And** Badge image dimensions follow Open Badges recommendation (400x400px minimum)  
**And** Image upload validates file type (PNG, JPG, SVG only) and size  
**And** Images are automatically resized to 400x400px if larger  
**And** Error messages display for invalid uploads with specific reason  
**And** Replace image button allows changing uploaded image  
**And** Badge image displays in template list and detail views  
**And** Alt text field for accessibility (WCAG 2.1 AA compliance)  
**And** Image compression applied to optimize file size

**Note:** Visual badge designer with drag-and-drop editor deferred to future phase to reduce initial complexity.

---

#### Story 3.6: 配置过期和续期策略

As an **Issuer**,  
I want **to configure expiration and renewal policies for badge templates**,  
So that **badges can require periodic recertification**.

**Acceptance Criteria:**

**Given** User is creating or editing badge template  
**When** User configures expiration policy section  
**Then** User can select "No Expiration" or "Expires After Duration"  
**And** Duration options include months or years (e.g., 12 months, 2 years)  
**And** Expiration policy is stored as JSON in BadgeClass.expirationPolicy  
**And** User can enable "Renewable" option with renewal criteria  
**And** Renewal criteria specifies required actions (e.g., retake course, manager approval)  
**And** Expiration policy displays on badge detail page  
**And** Form validation ensures duration is positive integer  
**And** Default policy is "No Expiration" if not specified  
**And** Expiration policy is enforced when badges are issued (future stories)

---

#### Story 3.7: 实现徽章模板审批工作流

As an **Administrator**,  
I want **to review and approve badge templates before they can be used**,  
So that **badge quality and governance standards are maintained**.

**Acceptance Criteria:**

**Given** Badge template has status PENDING  
**When** Admin accesses approval queue  
**Then** Pending templates display in approval queue with submission date  
**And** Admin can view full template details including all metadata  
**And** Admin can approve template (changes status to APPROVED)  
**And** Admin can reject template with reason (changes status to REJECTED)  
**And** Approval/rejection triggers notification to submitter (email or in-app)  
**And** Only APPROVED templates are available for badge issuance  
**And** Issuer who submitted receives notification with approval status  
**And** Rejected templates can be edited and resubmitted  
**And** Approval history is tracked with approver, timestamp, and decision reason  
**And** Audit log entries created for all approval actions

---

#### Story 3.8: 构建徽章目录页面

As an **Issuer**,  
I want **to browse and search the badge template catalog**,  
So that **I can find appropriate templates for issuing badges**.

**Acceptance Criteria:**

**Given** User has ISSUER role and is logged in  
**When** User navigates to badge catalog page  
**Then** Page displays all APPROVED badge templates in grid or list view  
**And** Each template card shows badge image, name, description preview, and skill tags  
**And** Search bar filters templates by name, description, or tags  
**And** Filter dropdowns allow filtering by skills, expiration policy, and approval status  
**And** Pagination displays 20 templates per page  
**And** Clicking template card navigates to template detail page  
**And** Detail page shows full metadata, criteria, skills, and expiration policy  
**And** "Issue Badge" button is available on template detail page (links to issuance flow)  
**And** Catalog page is mobile-responsive  
**And** Empty state displays when no templates exist: "No badge templates yet. Create your first template to get started." with "Create Template" button  
**And** Empty state displays when search/filters return zero results: "No templates match your criteria. Try adjusting filters."  
**And** UX Design specification for badge catalog is followed

---

### Epic 4: Manual Badge Issuance

**Epic Goal:** Enable issuers to award badges to individual employees

**Requirements Covered:**
- FR6: Issue badges manually to single recipients
- FR10: Enforce role-based issuing permissions (ISSUER role)
- FR11: Generate Open Badges 2.0 compliant badge assertions
- FR13: Store immutable badge metadata (issuer, recipient, issuance date, criteria)
- NFR3: Comprehensive audit logging for all issuance actions

---

#### Story 4.1: 创建徽章断言数据模型

As a **Developer**,  
I want **to define BadgeAssertion entity following Open Badges 2.0 specification**,  
So that **issued badges store immutable credential data**.

**Acceptance Criteria:**

**Given** Prisma schema is configured  
**When** I define the BadgeAssertion model  
**Then** BadgeAssertion table includes fields: id, badgeClassId, recipientId, issuerId, issuedDate, evidenceUrl, narrativeJustification, status (PENDING, CLAIMED, REJECTED), expiresAt, revokedAt, revokedReason, createdAt, updatedAt  
**And** Foreign key relationships link to BadgeClass, User (recipient), and User (issuer)  
**And** Status enum includes: PENDING, CLAIMED, REJECTED  
**And** Immutable fields (badgeClassId, recipientId, issuedDate) cannot be modified after creation  
**And** Open Badges 2.0 assertion structure stored as JSONB in metadata field  
**And** Database indexes created on recipientId, badgeClassId, status, and issuedDate  
**And** Prisma migration creates BadgeAssertion table  
**And** Unique verification URL is generated per assertion (verificationId field)

---

#### Story 4.2: 实现手动发放API端点

As an **Issuer**,  
I want **to issue badges to individual employees via API**,  
So that **I can award credentials with evidence and justification**.

**Acceptance Criteria:**

**Given** User has ISSUER or ADMIN role  
**When** POST `/badges/issue` endpoint is called  
**Then** Request validates badgeClassId exists and is APPROVED  
**And** Request validates recipientId exists in User table  
**And** BadgeAssertion record is created with status PENDING  
**And** Open Badges 2.0 compliant assertion JSON is generated  
**And** Assertion includes issuer, badgeClass, recipient, issuance date, and evidence  
**And** Unique verification ID is generated for public verification URL  
**And** Expiration date is calculated if badge template has expiration policy  
**And** API endpoint returns 201 Created with assertion details  
**And** RBAC enforces only ISSUER/ADMIN can issue badges  
**And** API validates recipient cannot be same as issuer  
**And** Evidence URL (optional) is validated for proper format

---

#### Story 4.3: 构建徽章发放表单UI

As an **Issuer**,  
I want **to use an intuitive form to manually issue badges**,  
So that **I can award credentials with context and supporting evidence**.

**Acceptance Criteria:**

**Given** User has ISSUER role and is logged in  
**When** User navigates to "Issue Badge" page  
**Then** Badge template selector displays all APPROVED templates with search  
**And** Template selector shows badge image, name, and description preview  
**And** Recipient search field allows finding employees by name or email  
**And** Recipient search returns real-time results with autocomplete  
**And** Evidence URL field accepts optional link to supporting documentation  
**And** Narrative justification field accepts rich text (why badge is awarded)  
**And** Form preview shows selected badge and recipient details  
**And** "Issue Badge" button submits form and creates assertion  
**And** Success message displays with link to issued badge details  
**And** Form validation prevents submission without required fields  
**And** Form is mobile-responsive  
**And** UX Design specification for badge issuance form is followed

---

#### Story 4.4: 实现邮件通知系统

As an **Employee (Recipient)**,  
I want **to receive email notification when a badge is issued to me**,  
So that **I am aware of the credential and can claim it**.

**Acceptance Criteria:**

**Given** Badge has been issued with status PENDING  
**When** BadgeAssertion is created  
**Then** Email notification is sent to recipient's registered email  
**And** Email includes badge image, name, and description  
**And** Email includes issuer name and issuance date  
**And** Email includes narrative justification from issuer  
**And** Email contains "Claim Badge" button linking to badge wallet  
**And** Email template follows organization branding  
**And** Email sending is asynchronous (non-blocking)  
**And** Failed email sends are logged and retried up to 3 times  
**And** Email notification preferences are respected (if user opted out)  
**And** Email includes expiration notice if badge has expiration policy

---

#### Story 4.5: 创建发放审计日志

As an **Administrator**,  
I want **to track all badge issuance actions with comprehensive audit logs**,  
So that **I can ensure accountability and compliance**.

**Acceptance Criteria:**

**Given** Badge issuance actions occur  
**When** Issuance API endpoint is called  
**Then** Audit log entry is created with: action type (BADGE_ISSUED), timestamp, issuerId, recipientId, badgeClassId, assertionId  
**And** Audit log includes IP address and user agent of issuer  
**And** Audit log records evidence URL and narrative justification  
**And** Audit log is stored in dedicated AuditLog table  
**And** Audit logs are immutable (append-only, no updates or deletes)  
**And** Admin can view audit logs filtered by date range, issuer, recipient, or badge template  
**And** Audit log API endpoint GET `/audit-logs` returns paginated results  
**And** Audit logs are retained per compliance requirements (minimum 7 years)  
**And** RBAC restricts audit log viewing to ADMIN role only

---

### Epic 5: Employee Badge Wallet & Claiming

**Epic Goal:** Give employees personal badge portfolio with privacy controls

**Requirements Covered:**
- FR17: Provide personal badge wallet/profile for employees
- FR18: Implement badge claiming workflow (manual or auto-accept)
- FR19: Enable privacy controls (public/private per badge)
- FR21: Allow badge download and export
- NFR19: WCAG 2.1 AA accessibility compliance
- NFR20: Responsive design for desktop, tablet, and mobile devices

---

#### Story 5.1: 构建个人徽章钱包页面

As an **Employee**,  
I want **to view all my badges in a personal wallet**,  
So that **I can see my earned credentials and manage pending badge offers**.

**Acceptance Criteria:**

**Given** Employee is logged in  
**When** Employee navigates to "My Badges" page  
**Then** Page displays three tabs: "Claimed" (status: CLAIMED), "Pending" (status: PENDING), "Rejected" (status: REJECTED)  
**And** Each badge displays as card with image, name, issuance date, and issuer  
**And** Claimed badges show privacy status indicator (public/private icon)  
**And** Pending badges show "Claim" and "Reject" action buttons  
**And** Badge cards are displayed in grid layout (responsive columns)  
**And** Empty state for Claimed tab: "No badges yet. Badges you earn will appear here." with illustration  
**And** Empty state for Pending tab: "No pending badges. You'll be notified when badges are issued to you."  
**And** Empty state for Rejected tab: "No rejected badges."  
**And** Badge count displays in each tab header  
**And** Page loads with smooth transitions and skeleton loading states  
**And** UX Design specification for badge wallet is followed  
**And** Page is accessible (WCAG 2.1 AA compliant)

---

#### Story 5.2: 实现徽章认领工作流

As an **Employee**,  
I want **to accept or reject pending badge offers**,  
So that **I have control over which credentials appear in my profile**.

**Acceptance Criteria:**

**Given** Employee has pending badge (status: PENDING)  
**When** Employee clicks "Claim" button  
**Then** Badge status updates to CLAIMED in database  
**And** Badge moves from "Pending" tab to "Claimed" tab  
**And** Success notification displays "Badge claimed successfully"  
**And** API endpoint PUT `/badges/:id/claim` updates status  
**When** Employee clicks "Reject" button  
**Then** Confirmation modal displays "Are you sure you want to reject this badge?"  
**And** Upon confirmation, badge status updates to REJECTED  
**And** Badge moves to "Rejected" tab  
**And** Rejection is logged in audit trail  
**And** Issuer receives optional notification of rejection  
**And** Rejected badges can be reclaimed later (status reverts to CLAIMED)

---

#### Story 5.3: 实现隐私控制

As an **Employee**,  
I want **to set each badge as public or private**,  
So that **I control which credentials are visible on my public profile**.

**Acceptance Criteria:**

**Given** Employee has claimed badges  
**When** Employee views badge in wallet  
**Then** Privacy toggle button is visible on each badge card  
**And** Toggle states: "Public" (visible to others) or "Private" (only visible to me)  
**And** Default privacy setting is "Private" for newly claimed badges  
**And** Clicking toggle updates privacy setting immediately  
**And** Privacy setting is stored in BadgeAssertion.isPublic field (boolean)  
**And** API endpoint PATCH `/badges/:id/privacy` updates setting  
**And** Public badges display on employee's public profile page  
**And** Private badges are hidden from public view but visible in personal wallet  
**And** Privacy status persists across sessions  
**And** Privacy change is logged in audit trail

---

#### Story 5.4: 创建徽章详情页面

As an **Employee**,  
I want **to view complete details of any badge**,  
So that **I can see criteria, skills, evidence, and metadata**.

**Acceptance Criteria:**

**Given** Employee clicks on badge card in wallet  
**When** Badge detail page loads  
**Then** Page displays full badge image prominently  
**And** Badge name, description, and criteria are displayed  
**And** Issuer name and issuance date are shown  
**And** Skills tags are displayed as interactive chips  
**And** Evidence URL (if provided) is shown as clickable link  
**And** Narrative justification from issuer is displayed  
**And** Expiration date is shown if badge has expiration policy  
**And** Privacy setting toggle is accessible  
**And** "Download" and "Share" action buttons are available  
**And** Public verification URL is displayed and copyable  
**And** Page is mobile-responsive with optimized layout  
**And** Back navigation returns to wallet view

---

#### Story 5.5: 实现徽章下载功能

As an **Employee**,  
I want **to download my badges in multiple formats**,  
So that **I can use them in other platforms and documents**.

**Acceptance Criteria:**

**Given** Employee is viewing badge detail page  
**When** Employee clicks "Download" button  
**Then** Download options menu displays: "Download PNG" and "Download JSON-LD"  
**And** "Download PNG" generates baked badge image (Open Badges 2.0 spec)  
**And** PNG image includes assertion metadata embedded in file  
**And** PNG file is named: `badge-{badgeName}-{date}.png`  
**And** "Download JSON-LD" generates Open Badges 2.0 compliant JSON assertion  
**And** JSON file includes all assertion fields per specification  
**And** JSON file is named: `badge-{badgeName}-{date}.json`  
**And** Downloads trigger browser save dialog  
**And** Download actions are logged (optional analytics)  
**And** Downloaded files can be uploaded to other badge platforms (Credly, Badgr)

---

#### Story 5.6: 优化移动端响应式设计

As an **Employee using mobile device**,  
I want **badge wallet to work seamlessly on my phone**,  
So that **I can manage and view badges on the go**.

**Acceptance Criteria:**

**Given** Employee accesses badge wallet on mobile device  
**When** Page loads on screen sizes below 768px  
**Then** Badge cards stack in single column layout  
**And** Navigation tabs remain accessible with swipe gestures  
**And** Touch targets are minimum 44x44px for accessibility  
**And** Badge images scale appropriately without distortion  
**And** Action buttons are thumb-friendly and well-spaced  
**And** Modals and dropdowns are optimized for mobile interaction  
**And** Page scrolling is smooth without janky animations  
**And** Badge detail page uses full screen on mobile  
**And** All interactive elements are easily tappable  
**And** Design is tested on iOS Safari and Android Chrome  
**And** Mobile layout follows UX Design specifications

---

### Epic 6: Badge Verification & Standards Compliance

**Epic Goal:** Ensure badge credibility through public verification and industry standards

**Requirements Covered:**
- FR11: Generate Open Badges 2.0 (IMS Global) compliant badge assertions
- FR12: Provide public verification pages with unique URLs per badge
- FR13: Store immutable badge metadata (issuer, recipient, issuance date, criteria)
- FR14: Export badges as JSON-LD assertions
- FR15: Support baked badge PNG format
- NFR5: Ensure Open Badges 2.0 standard compliance for credential portability

---

#### Story 6.1: 生成Open Badges 2.0 JSON-LD结构

As a **Developer**,  
I want **to generate Open Badges 2.0 compliant JSON-LD assertions**,  
So that **badges are interoperable with external platforms**.

**Acceptance Criteria:**

**Given** Badge assertion is created  
**When** System generates badge metadata  
**Then** JSON-LD structure follows Open Badges 2.0 specification exactly  
**And** Assertion includes required fields: @context, type, id, recipient, badge, issuedOn, verification  
**And** @context references "https://w3id.org/openbadges/v2"  
**And** Type field is set to "Assertion"  
**And** Recipient identity is hashed using SHA-256 with salt  
**And** Badge field references BadgeClass with full URL  
**And** IssuedOn uses ISO 8601 datetime format  
**And** Verification object includes type "hosted" and verification URL  
**And** Optional fields (evidence, expires, narrative) included when present  
**And** JSON-LD passes validation against Open Badges 2.0 schema  
**And** Generated JSON is stored in BadgeAssertion.metadata JSONB field

---

#### Story 6.2: 创建公开验证页面

As a **Public Verifier (external user)**,  
I want **to verify badge authenticity without logging in**,  
So that **I can trust the credential presented to me**.

**Acceptance Criteria:**

**Given** Badge has unique verification URL  
**When** Public user visits `/verify/{verificationId}`  
**Then** Public verification page loads without authentication requirement  
**And** Page displays badge image, name, and description  
**And** Recipient name is displayed (or "Identity Protected" if hashed)  
**And** Issuer organization name and logo are displayed  
**And** Issuance date and expiration date (if applicable) are shown  
**And** Criteria for earning badge are displayed  
**And** Badge status shows "Valid", "Expired", or "Revoked"  
**And** Revoked badges display revocation reason and date  
**And** Skills and competencies are listed  
**And** Evidence URL (if provided) is clickable  
**And** "Download JSON-LD" button provides assertion file  
**And** Page includes "Verified by G-Credit" trust badge  
**And** Page is SEO-optimized with Open Graph meta tags  
**And** Page is mobile-responsive

---

#### Story 6.3: 实现验证API端点

As a **Third-party Platform**,  
I want **to verify badge authenticity programmatically via API**,  
So that **I can integrate badge verification into my system**.

**Acceptance Criteria:**

**Given** Badge has verification ID  
**When** GET `/api/verify/{verificationId}` endpoint is called  
**Then** API returns Open Badges 2.0 compliant JSON-LD assertion  
**And** API does not require authentication (public endpoint)  
**And** Response includes all assertion fields per specification  
**And** Response includes verification status (valid, expired, revoked)  
**And** Response includes HTTP status 200 for valid badges  
**And** Invalid verification IDs return 404 Not Found  
**And** Revoked badges return assertion with revocation info  
**And** API supports CORS for cross-origin requests  
**And** API includes Cache-Control headers for performance  
**And** API rate limiting is configured to prevent abuse  
**And** API is documented in Swagger with examples

---

#### Story 6.4: 生成Baked Badge PNG

As an **Employee**,  
I want **to download badge images with embedded assertion data**,  
So that **the badge is self-verifying when shared**.

**Acceptance Criteria:**

**Given** Employee downloads badge as PNG  
**When** Baked badge generation is triggered  
**Then** System retrieves badge image from Azure Blob Storage  
**And** Open Badges 2.0 JSON-LD assertion is generated  
**And** Assertion JSON is embedded in PNG iTXt chunk with key "openbadges"  
**And** Embedded assertion follows Open Badges 2.0 baking specification  
**And** Assertion includes full verification URL  
**And** Baked PNG is generated using image processing library (sharp or similar)  
**And** Generated PNG maintains original image quality  
**And** PNG file size remains reasonable (<5MB)  
**And** Baked badge can be validated by external badge platforms  
**And** Badge inspector tools can extract and verify embedded assertion  
**And** Download endpoint GET `/badges/:id/download/png` returns baked image

---

#### Story 6.5: 确保元数据不可变性和完整性

As an **Administrator**,  
I want **to ensure badge assertion data cannot be altered after issuance**,  
So that **credentials maintain integrity and trustworthiness**.

**Acceptance Criteria:**

**Given** Badge assertion is created  
**When** System attempts to modify core assertion fields  
**Then** Database constraints prevent updates to immutable fields  
**And** Immutable fields include: badgeClassId, recipientId, issuerId, issuedDate, verificationId  
**And** Update attempts on immutable fields return 403 Forbidden error  
**And** Only status field (PENDING → CLAIMED/REJECTED) and privacy settings are mutable  
**And** Revocation is handled via separate revokedAt and revokedReason fields  
**And** Original assertion data preserved even when revoked  
**And** Database triggers or application-level validation enforces immutability  
**And** Audit log captures any attempted unauthorized modifications  
**And** Cryptographic hash (SHA-256) of assertion stored for integrity verification  
**And** Hash verification endpoint validates assertion hasn't been tampered with  
**And** Documentation clearly states immutability policy for compliance

---

### Epic 7: Badge Sharing & Social Integration

**Epic Goal:** Maximize badge value through social visibility and recognition

**Requirements Covered:**
- FR20: Support social sharing to LinkedIn, email, personal websites
- FR30: Send Microsoft Teams notifications and enable bot interactions
- FR31: Send Outlook email notifications
- FR32: Enable LinkedIn sharing integration

---

#### Story 7.1: 实现LinkedIn分享集成

As an **Employee**,  
I want **to share my badges directly to my LinkedIn profile**,  
So that **I can showcase my credentials to my professional network**.

**Acceptance Criteria:**

**Given** Employee has claimed badge with public privacy setting  
**When** Employee clicks "Share to LinkedIn" button on badge detail page  
**Then** LinkedIn OAuth 2.0 authentication flow initiates  
**And** Employee authorizes G-Credit to post on their behalf  
**And** System generates LinkedIn share content with badge image, title, and description  
**And** Post includes verification URL and organization name  
**And** LinkedIn API POST request publishes badge to employee's profile  
**And** Success message displays "Badge shared to LinkedIn successfully"  
**And** Share action is tracked in analytics (BadgeShare table)  
**And** LinkedIn API errors are handled gracefully with user-friendly messages  
**And** OAuth tokens are securely stored for future shares  
**And** Employee can revoke LinkedIn connection in profile settings  
**And** Share preview shows how post will appear on LinkedIn

---

#### Story 7.2: 实现邮件分享功能

As an **Employee**,  
I want **to share my badges via email with customizable message**,  
So that **I can notify specific people about my credentials**.

**Acceptance Criteria:**

**Given** Employee is viewing badge detail page  
**When** Employee clicks "Share via Email" button  
**Then** Email composition modal opens  
**And** Modal includes fields: recipient email(s), subject line, personal message  
**And** Subject line pre-populated with "Check out my {Badge Name} credential"  
**And** Email body includes badge image as embedded attachment  
**And** Email includes badge description and verification URL  
**And** Personal message from employee is included above badge details  
**And** Email template follows organization branding  
**And** "Send Email" button triggers email delivery  
**And** Multiple recipients can be added (comma-separated)  
**And** Email addresses are validated before sending  
**And** Success confirmation displays after email sent  
**And** Share action is tracked in analytics with recipient count

---

#### Story 7.3: 创建可嵌入的徽章Widget

As an **Employee**,  
I want **to embed my badges on my personal website or portfolio**,  
So that **I can display credentials outside the G-Credit platform**.

**Acceptance Criteria:**

**Given** Employee has public badges  
**When** Employee clicks "Embed Badge" button  
**Then** Embed code modal displays with iframe snippet  
**And** Embed code includes: `<iframe src="https://g-credit.com/embed/{verificationId}" ...>`  
**And** Widget dimensions are configurable (small, medium, large)  
**And** Widget displays badge image, name, issuer, and verification link  
**And** Widget styling matches G-Credit branding  
**And** Widget is responsive and mobile-friendly  
**And** Widget loads without requiring authentication  
**And** "Copy Code" button copies embed snippet to clipboard  
**And** Preview shows how widget will appear on external sites  
**And** Widget endpoint GET `/embed/{verificationId}` returns HTML  
**And** Widget includes "Verified by G-Credit" footer link  
**And** Widget respects badge privacy settings (only public badges embeddable)

---

#### Story 7.4: 集成Microsoft Teams通知

As an **Employee**,  
I want **to receive Teams notifications when badges are issued to me**,  
So that **I'm notified in my primary work communication tool**.

**Acceptance Criteria:**

**Given** Badge is issued to employee with status PENDING  
**When** Issuance notification is triggered  
**Then** Microsoft Teams notification is sent via Teams webhook or Bot  
**And** Teams message includes Adaptive Card with badge image  
**And** Card displays badge name, issuer, and issuance date  
**And** Card includes "View Badge" button linking to badge wallet  
**And** Card includes "Claim Badge" action button for direct claiming  
**And** Clicking "Claim Badge" updates badge status to CLAIMED  
**And** Teams notification respects user's notification preferences  
**And** Teams integration uses Microsoft Graph API  
**And** Failed Teams notifications are logged and fall back to email  
**And** Admin can configure Teams webhook URL in settings  
**And** Teams Bot can respond to "/badges" command showing user's badges

---

#### Story 7.5: 实现分享分析追踪

As an **Administrator**,  
I want **to track badge sharing metrics across all platforms**,  
So that **I can measure program engagement and social reach**.

**Acceptance Criteria:**

**Given** Employees share badges via various platforms  
**When** Share actions occur  
**Then** BadgeShare table records: badgeId, userId, platform (LinkedIn, Email, Embed, Teams), sharedAt timestamp  
**And** Share count is displayed on badge detail page  
**And** Admin dashboard shows sharing trends by platform  
**And** Analytics includes: total shares, shares per badge, shares per user  
**And** Platform breakdown chart shows distribution (LinkedIn: X%, Email: Y%, etc.)  
**And** Time-series chart shows sharing activity over time  
**And** Most shared badges are highlighted in analytics  
**And** Share data is aggregated for organizational reporting  
**And** API endpoint GET `/analytics/shares` returns aggregated metrics  
**And** Share analytics respect user privacy (anonymized reporting)  
**And** RBAC restricts analytics viewing to ADMIN role

---

#### Story 7.6: 添加Open Graph元标签

As a **Developer**,  
I want **to add Open Graph meta tags to badge verification pages**,  
So that **badges display with rich previews when shared on social media**.

**Acceptance Criteria:**

**Given** Badge verification page is shared on social media  
**When** Platform crawlers access verification URL  
**Then** HTML head includes Open Graph meta tags: og:title, og:description, og:image, og:url, og:type  
**And** og:title is set to badge name  
**And** og:description includes badge criteria summary  
**And** og:image points to badge image URL (absolute URL)  
**And** og:url is the verification URL  
**And** og:type is set to "website"  
**And** Twitter Card meta tags are also included (twitter:card, twitter:title, twitter:image)  
**And** Image dimensions meet platform requirements (1200x630px recommended)  
**And** Meta tags pass validation on Facebook Sharing Debugger  
**And** Meta tags pass validation on Twitter Card Validator  
**And** Rich preview displays correctly when shared on LinkedIn, Facebook, Twitter  
**And** Badge issuer and issuance date are included in description

---

### Epic 8: Bulk Badge Issuance

**Epic Goal:** Enable HR to efficiently award badges at scale (e.g., program completions)

**Requirements Covered:**
- FR7: Perform bulk badge issuance via CSV upload
- NFR9: Process bulk CSV operations efficiently (1000+ badges without timeout)
- NFR11: Implement asynchronous processing for long-running operations

---

#### Story 8.1: 创建CSV模板和验证

As an **Issuer**,  
I want **to download a standardized CSV template for bulk badge issuance**,  
So that **I can prepare bulk issuance data in the correct format**.

**Acceptance Criteria:**

**Given** Issuer is on bulk issuance page  
**When** Issuer clicks "Download CSV Template" button  
**Then** CSV file downloads with headers: badgeTemplateId, recipientEmail, evidenceUrl, narrativeJustification  
**And** Template includes example rows with sample data  
**And** Template includes comments explaining each field  
**And** BadgeTemplateId field accepts badge template ID or name  
**And** RecipientEmail field must match registered user emails  
**And** EvidenceUrl field is optional  
**And** NarrativeJustification field is optional  
**And** Template filename is `bulk-badge-issuance-template-{date}.csv`  
**And** CSV uses UTF-8 encoding to support international characters  
**And** Template download is tracked for analytics

---

#### Story 8.2: 实现CSV上传和解析

As an **Issuer**,  
I want **to upload a CSV file for bulk badge issuance**,  
So that **I can issue multiple badges at once**.

**Acceptance Criteria:**

**Given** Issuer has prepared CSV file  
**When** Issuer uploads CSV via bulk issuance form  
**Then** File upload validates file size (max 10MB)  
**And** File upload validates file type (CSV or TXT only)  
**And** CSV parser reads file and validates structure  
**And** Parser checks for required headers (badgeTemplateId, recipientEmail)  
**And** Parser validates each row for required fields  
**And** Parser checks badgeTemplateId exists and is APPROVED  
**And** Parser validates recipientEmail exists in User table  
**And** Parser validates evidenceUrl format if provided  
**And** Validation errors are collected with row numbers  
**And** Upload endpoint POST `/badges/bulk/upload` accepts CSV file  
**And** Successful parse stores data in temporary staging table  
**And** Upload returns validation summary (total rows, valid rows, error rows)

---

#### Story 8.3: 构建批量发放预览功能

As an **Issuer**,  
I want **to preview bulk issuance before confirming**,  
So that **I can verify all data is correct before issuing badges**.

**Acceptance Criteria:**

**Given** CSV has been successfully parsed  
**When** Preview page loads  
**Then** Preview displays total badge count to be issued  
**And** Preview shows breakdown by badge template with counts  
**And** Preview table shows: badge name, recipient name, recipient email, evidence URL  
**And** Table supports pagination (50 rows per page)  
**And** Table includes search and filter by badge template  
**And** Validation errors are displayed prominently at top  
**And** Error rows are highlighted in red with error message  
**And** "Fix Errors" button allows re-uploading corrected CSV  
**And** "Confirm and Issue" button is enabled only if no errors  
**And** Preview session expires after 30 minutes for security  
**And** Empty state displays when CSV has zero valid rows: "No valid badges found in CSV. Please check the template format and try again." with "Re-upload CSV" button  
**And** UX Design specification for bulk preview is followed

---

#### Story 8.4: 实现批量处理 (Phase 1: Synchronous, Phase 3: Async)

**Phase 1 Implementation (MVP):**

As an **Issuer**,  
I want **to issue up to 50 badges in a single batch**,  
So that **I can award badges to small groups efficiently**.

**Phase 1 Acceptance Criteria:**

**Given** Issuer confirms bulk issuance (max 50 badges)  
**When** "Confirm and Issue" button is clicked  
**Then** Frontend shows "Processing..." spinner  
**And** Backend processes all 50 badges synchronously (loop through CSV rows)  
**And** Each badge issuance creates BadgeAssertion record  
**And** Each badge sends notification email  
**And** Processing completes in 2-3 minutes (acceptable for 50 badges)  
**And** Frontend shows success message with count: "50 badges issued successfully"  
**And** Failed issuances are logged and reported separately  
**And** Audit log entry created for batch operation  

**Phase 3 Upgrade (Async Processing):**

As an **Issuer**,  
I want **bulk issuance to process in background without timeout**,  
So that **I can issue 1000+ badges without waiting or errors**.

**Phase 3 Acceptance Criteria:**

**Given** Issuer confirms bulk issuance (unlimited)  
**When** "Confirm and Issue" button is clicked  
**Then** Batch job is created with unique jobId and status QUEUED  
**And** Job record stores: jobId, issuerId, totalCount, processedCount, failedCount, status, createdAt  
**And** Messages are enqueued to Azure Service Bus for async processing  
**And** Each badge issuance is processed as separate message  
**And** Worker service consumes messages and creates BadgeAssertion records  
**And** Worker updates job processedCount after each badge issued  
**And** Worker handles failures and updates job failedCount  
**And** Job status transitions: QUEUED → PROCESSING → COMPLETED/FAILED  
**And** Processing supports 1000+ badges without timeout  
**And** Failed individual issuances are logged but don't stop batch  
**And** Issuer is redirected to progress tracking page immediately

---

#### Story 8.5: 创建进度追踪界面

As an **Issuer**,  
I want **to monitor bulk issuance progress in real-time**,  
So that **I know when the operation completes and can see results**.

**Acceptance Criteria:**

**Given** Bulk issuance job is processing  
**When** Issuer views job progress page  
**Then** Progress bar shows percentage completed (processedCount / totalCount)  
**And** Live counters display: Total, Processed, Failed, Remaining  
**And** Job status displays: Queued, Processing, Completed, Failed  
**And** Estimated time remaining is calculated and displayed  
**And** Page auto-refreshes every 5 seconds to update progress  
**And** WebSocket or polling updates progress without page reload  
**And** Completion notification displays when job finishes  
**And** "Download Results" button appears when job completes  
**And** Results CSV includes success/failure status per row  
**And** Failed rows include error reason in results  
**And** All bulk jobs are listed in job history table  
**And** Job history shows: date, badge template, total count, status

---

#### Story 8.6: 实现错误报告和重试机制

As an **Issuer**,  
I want **to see detailed error reports and retry failed issuances**,  
So that **I can resolve issues and complete bulk operations**.

**Acceptance Criteria:**

**Given** Bulk issuance job has failures  
**When** Job completes with status COMPLETED (with failures)  
**Then** Error report is generated listing all failed rows  
**And** Error report includes: row number, recipient email, badge template, error reason  
**And** Common error reasons: "Recipient not found", "Badge template inactive", "Duplicate issuance"  
**And** Error report is downloadable as CSV  
**And** "Retry Failed" button allows reprocessing only failed rows  
**And** Retry creates new job processing only failed entries  
**And** Retry validation checks if errors were resolved  
**And** System prevents duplicate badge issuance to same recipient for same template  
**And** Audit log records bulk job with jobId, total count, success count, failure count  
**And** Email notification sent to issuer when bulk job completes  
**And** Notification includes summary and link to results

---

### Epic 9: Badge Revocation

**Epic Goal:** Maintain badge integrity by enabling revocation when necessary

**Requirements Covered:**
- FR16: Implement badge revocation with reason tracking (policy violation, error, expiration)

---

#### Story 9.1: 创建徽章撤销表单

As an **Administrator or Issuer**,  
I want **to revoke issued badges with documented reason**,  
So that **I can remove credentials that are no longer valid**.

**Acceptance Criteria:**

**Given** User has ADMIN or ISSUER role  
**When** User navigates to badge revocation page  
**Then** Search field allows finding badge by recipient name, email, or badge name  
**And** Search results display badge details: recipient, badge name, issuance date, status  
**And** "Revoke" button is available for badges with status CLAIMED  
**And** Clicking "Revoke" opens revocation form modal  
**And** Modal includes reason dropdown with predefined options: Policy Violation, Issued in Error, Expired Credential, Employee Separation, Other  
**And** Modal includes required text field for detailed explanation  
**And** Modal includes confirmation checkbox "I confirm this badge should be revoked"  
**And** "Confirm Revocation" button is enabled only when all fields completed  
**And** Form validation prevents submission without reason and explanation  
**And** Modal shows warning about impact (badge becomes invalid, public verification shows revoked)

---

#### Story 9.2: 实现撤销API和数据库更新

As a **Developer**,  
I want **to implement badge revocation with soft-delete pattern**,  
So that **original badge data is preserved for audit purposes**.

**Acceptance Criteria:**

**Given** Revocation form is submitted  
**When** POST `/badges/:id/revoke` endpoint is called  
**Then** BadgeAssertion record is updated with revokedAt timestamp  
**And** RevokedReason field stores reason code and detailed explanation  
**And** RevokedBy field stores userId of person who revoked badge  
**And** Badge status remains CLAIMED (not deleted) but revocation fields populated  
**And** Original badge data (issuedDate, recipient, badgeClass) remains unchanged  
**And** Revocation is permanent and cannot be undone  
**And** API validates user has ADMIN or ISSUER role  
**And** API validates badge is in CLAIMED status (cannot revoke PENDING or REJECTED)  
**And** API returns 200 OK with revoked badge details  
**And** Audit log entry created with: BADGE_REVOKED action, badge ID, reason, revoker ID

---

#### Story 9.3: 更新验证页面显示撤销状态

As a **Public Verifier**,  
I want **to see revocation status on badge verification pages**,  
So that **I know if a credential is no longer valid**.

**Acceptance Criteria:**

**Given** Badge has been revoked (revokedAt is not null)  
**When** Public user visits verification URL  
**Then** Verification page displays prominent "REVOKED" badge status  
**And** Revoked status shows in red warning banner at top of page  
**And** Banner text: "This credential has been revoked and is no longer valid"  
**And** Revocation date is displayed  
**And** Revocation reason is displayed (if not sensitive)  
**And** Original badge details remain visible (issued date, recipient, criteria)  
**And** Badge image displays with semi-transparent overlay indicating revocation  
**And** "Download JSON-LD" still available but assertion includes revocationReason field  
**And** JSON-LD assertion follows Open Badges revocation specification  
**And** API `/api/verify/{verificationId}` returns revocation info in JSON response

---

#### Story 9.4: 在员工钱包中显示已撤销徽章

As an **Employee**,  
I want **to see revoked badges in my wallet with clear status**,  
So that **I understand which credentials are no longer valid**.

**Acceptance Criteria:**

**Given** Employee has badge that was revoked  
**When** Employee views badge wallet  
**Then** Revoked badges appear in "Claimed" tab with "Revoked" label  
**And** Badge card displays visual indicator (strikethrough or red overlay)  
**And** Badge card shows revocation date below issuance date  
**And** Clicking revoked badge shows full details including revocation reason  
**And** Detail page displays "REVOKED" status prominently  
**And** Revocation reason is shown to badge owner  
**And** Share and embed buttons are disabled for revoked badges  
**And** Download button still works but includes revocation data  
**And** Privacy toggle is disabled (revoked badges cannot be made public)  
**And** Employee cannot change status of revoked badge

---

#### Story 9.5: 实现撤销通知

As an **Employee**,  
I want **to be notified when my badge is revoked**,  
So that **I am aware of the status change**.

**Acceptance Criteria:**

**Given** Badge revocation is confirmed  
**When** Revocation is processed  
**Then** Email notification is sent to badge recipient  
**And** Email subject: "{Badge Name} credential has been revoked"  
**And** Email includes badge name and revocation date  
**And** Email includes revocation reason (if appropriate to share)  
**And** Email includes link to view badge details in wallet  
**And** Email provides contact information for questions or appeals  
**And** Email is professional and empathetic in tone  
**And** Optional Teams notification sent if Teams integration enabled  
**And** Notification respects user's communication preferences  
**And** In-app notification appears in employee's notification center  
**And** Notification includes timestamp and "Mark as Read" option

---

### Epic 10: Automated LMS Integration

**Epic Goal:** Reduce manual work by auto-issuing badges upon course completion

**Requirements Covered:**
- FR8: Automate badge issuance via LMS course completion triggers
- FR28: Sync employee directory from HRIS
- FR29: Consume LMS webhooks for automated issuance
- FR30/FR31: Send Teams and Outlook notifications
- NFR16: Provide retry mechanisms for webhook delivery

---

#### Story 10.0: 研究并验证LMS和HRIS集成准备

As a **Technical Lead/Architect**,  
I want **to research LMS/HRIS webhook schemas and verify integration access**,  
So that **automated badge issuance can be implemented correctly**.

**Acceptance Criteria:**

**Given** LMS and HRIS integrations are required  
**When** Integration readiness research is completed  
**Then** Target LMS platform(s) identified (e.g., Moodle, Canvas, Cornerstone, custom)  
**And** LMS webhook documentation reviewed and payload schema documented  
**And** LMS webhook authentication method identified (API key, HMAC signature, OAuth)  
**And** LMS webhook callback URL requirements documented  
**And** Test LMS webhook endpoint available for development and testing  
**And** HRIS system identified (e.g., Workday, BambooHR, ADP, custom)  
**And** HRIS API access verified with credentials or approved  
**And** HRIS API documentation reviewed for employee sync endpoints  
**And** Employee data fields mapped: firstName, lastName, email, employeeId, department, isActive  
**And** Integration readiness document created with: payload examples, authentication details, rate limits, contact persons  
**And** Risk assessment completed for LMS/HRIS unavailability or delayed access  
**And** Fallback plan documented (manual employee sync, manual badge issuance) if integrations delayed  
**And** Integration readiness approved by Architect before Story 10.1 begins

---

#### Story 10.1: 创建Webhook接收API端点

As a **Developer**,  
I want **to create secure webhook endpoint for receiving LMS events**,  
So that **external systems can trigger automated badge issuance**.

**Acceptance Criteria:**

**Given** LMS or external system sends course completion event  
**When** POST `/webhooks/lms` endpoint receives request  
**Then** Endpoint validates webhook signature or API key for authentication  
**And** Request payload is parsed and validated against expected schema  
**And** Required fields validated: eventType, courseId, userId/email, completionDate  
**And** Webhook event is logged with: eventId, source, payload, receivedAt  
**And** Invalid requests return 400 Bad Request with error details  
**And** Unauthorized requests return 401 Unauthorized  
**And** Successfully received events return 202 Accepted (async processing)  
**And** Endpoint supports multiple LMS providers (configurable payload formats)  
**And** Webhook secrets are stored in Azure Key Vault  
**And** API documentation includes webhook payload examples for each provider

---

#### Story 10.2: 实现课程到徽章的映射配置

As an **Administrator**,  
I want **to configure which LMS courses trigger which badge issuances**,  
So that **course completions automatically award appropriate badges**.

**Acceptance Criteria:**

**Given** Admin is logged in  
**When** Admin navigates to "LMS Integration" settings page  
**Then** Page displays list of existing course-to-badge mappings  
**And** "Add Mapping" button opens configuration form  
**And** Form includes: LMS Provider dropdown, Course ID field, Badge Template selector  
**And** Badge Template selector shows only APPROVED templates  
**And** Optional "Auto-Issue" checkbox enables/disables automatic issuance  
**And** Mapping is stored in CourseBadgeMapping table  
**And** Mappings can be edited or deleted  
**And** API endpoints: POST/GET/PUT/DELETE `/integrations/course-mappings`  
**And** Invalid course IDs display warning but allow saving  
**And** Mapping changes take effect immediately  
**And** Audit log records mapping configuration changes

---

#### Story 10.3: 实现自动徽章发放逻辑

As a **System**,  
I want **to automatically issue badges when course completion events are received**,  
So that **employees receive credentials without manual intervention**.

**Acceptance Criteria:**

**Given** Webhook event received and course-badge mapping exists  
**When** Event processing begins  
**Then** System looks up user by email or external userId  
**And** System retrieves badge template from course mapping  
**And** System validates user exists in G-Credit (creates if HRIS sync enabled)  
**And** System checks if badge already issued to prevent duplicates  
**And** BadgeAssertion is created with status PENDING or auto-CLAIMED (configurable)  
**And** Assertion includes courseId and completionDate as evidence  
**And** Email and Teams notifications sent to recipient  
**And** Processing is asynchronous via Azure Service Bus  
**And** Failed issuances are logged with retry attempts  
**And** Successful issuances update webhook event status to PROCESSED  
**And** Admin dashboard shows automated issuance statistics

---

#### Story 10.4: 建立HRIS员工同步

As an **Administrator**,  
I want **to synchronize employee directory from HRIS system**,  
So that **new employees can receive badges automatically**.

**Acceptance Criteria:**

**Given** HRIS integration is configured  
**When** Scheduled sync job runs (daily or on-demand)  
**Then** System connects to HRIS API (or webhook) to fetch employee data  
**And** Employee data includes: firstName, lastName, email, employeeId, department, isActive  
**And** New employees are created in User table with role EMPLOYEE  
**And** Existing employees are updated (name, department changes)  
**And** Inactive employees in HRIS are marked isActive=false in G-Credit  
**And** Sync process is idempotent (safe to run multiple times)  
**And** Sync job logs: total processed, created, updated, errors  
**And** Sync job dashboard shows last sync time and status  
**And** Manual "Sync Now" button triggers immediate sync  
**And** HRIS API credentials stored securely in Azure Key Vault  
**And** Failed syncs send alert to administrators

---

#### Story 10.5: 实现Webhook重试和错误处理

As a **System**,  
I want **to retry failed webhook processing with exponential backoff**,  
So that **temporary failures don't result in lost badge issuances**.

**Acceptance Criteria:**

**Given** Webhook event processing fails  
**When** Error occurs during badge issuance  
**Then** Event is marked as FAILED with error message logged  
**And** Retry mechanism queues event for reprocessing  
**And** Retry attempts: 1st (immediate), 2nd (1 min), 3rd (5 min), 4th (15 min), 5th (1 hour)  
**And** Maximum 5 retry attempts before marking as PERMANENTLY_FAILED  
**And** Event status transitions: RECEIVED → PROCESSING → PROCESSED/FAILED/PERMANENTLY_FAILED  
**And** Admin can manually retry PERMANENTLY_FAILED events  
**And** Failed events dashboard shows: event ID, error message, retry count, timestamp  
**And** Common errors handled: User not found, Badge template not found, Duplicate issuance  
**And** Dead letter queue captures events that exceed retry limit  
**And** Alert sent to admin when events enter dead letter queue

---

#### Story 10.6: 集成Azure Service Bus异步处理 (Phase 3 Optional)

**Note:** This story is optional for Phase 1-2 MVP. Synchronous webhook processing is sufficient for pilot scale. Service Bus is added in Phase 3 for production scale and resilience.

As a **Developer**,  
I want **to process webhook events asynchronously via Azure Service Bus**,  
So that **webhook responses are fast and processing is resilient**.

**Phase 3 Acceptance Criteria:**

**Given** Webhook event is received and validated  
**When** Event is accepted (202 response sent)  
**Then** Event payload is published to Azure Service Bus queue  
**And** Queue name: `lms-course-completion-events`  
**And** Worker service subscribes to queue and processes messages  
**And** Worker implements course-to-badge mapping lookup  
**And** Worker creates badge assertions and sends notifications  
**And** Worker handles message processing errors with retry policy  
**And** Dead letter queue captures permanently failed messages  
**And** Queue metrics monitored via Azure Application Insights  
**And** Queue processing scales horizontally with worker instances  
**And** Message lock timeout configured appropriately (5 minutes)  
**And** Worker gracefully handles duplicate messages (idempotent processing)

---

### Epic 11: Manager Nomination & Approval Workflow

**Epic Goal:** Enable distributed badge recognition through manager-driven nominations

**Requirements Covered:**
- FR9: Enable manager nomination and approval workflows for badges

**Workflow Clarification:**
- Approval Routing: All nominations go to ISSUER and ADMIN roles (no hierarchical routing)
- Single Approval: Any ISSUER or ADMIN can approve/reject (first reviewer decides)
- No Escalation: Simple one-step approval workflow (Manager → Issuer/Admin → Nominee)
- Future Enhancement: Multi-level approval or specific issuer assignment deferred to future phase

---

#### Story 11.1: 创建徽章提名数据模型

As a **Developer**,  
I want **to define BadgeNomination entity for tracking nomination workflow**,  
So that **manager nominations can be stored and processed**.

**Acceptance Criteria:**

**Given** Prisma schema is configured  
**When** I define the BadgeNomination model  
**Then** BadgeNomination table includes fields: id, badgeClassId, nomineeId, nominatorId (manager), justification, status, reviewerId, reviewedAt, rejectionReason, createdAt, updatedAt  
**And** Status enum includes: PENDING, APPROVED, REJECTED  
**And** Foreign keys link to BadgeClass, User (nominee), User (nominator), User (reviewer)  
**And** Justification field stores manager's explanation for nomination  
**And** RejectionReason field stores issuer's reason if rejected  
**And** Database indexes created on nomineeId, nominatorId, status, createdAt  
**And** Prisma migration creates BadgeNomination table  
**And** Nomination approval creates BadgeAssertion (linking to nominationId)

---

#### Story 11.2: 构建经理提名表单

As a **Manager**,  
I want **to nominate team members for badges they deserve**,  
So that **I can recognize employee achievements and skills**.

**Acceptance Criteria:**

**Given** User has MANAGER role and is logged in  
**When** Manager navigates to "Nominate Employee" page  
**Then** Form displays employee selector (search by name or email)  
**And** Employee selector filters to show only employees manager supervises (optional department filter)  
**And** Badge template selector shows all APPROVED templates  
**And** Badge selector displays badge image, name, and criteria  
**And** Justification text field (required) explains why employee deserves badge  
**And** Justification field has minimum 50 characters requirement  
**And** "Submit Nomination" button creates nomination with status PENDING  
**And** Success message confirms nomination submitted  
**And** Form validation prevents submitting without required fields  
**And** Empty state displays when no badge templates exist: "No badge templates available for nomination. Contact your administrator."  
**And** Form is mobile-responsive  
**And** UX Design specification for nomination form is followed

---

#### Story 11.3: 实现发放者审批队列

As an **Issuer or Administrator**,  
I want **to review and approve/reject badge nominations from managers**,  
So that **I can ensure badge quality and governance standards**.

**Acceptance Criteria:**

**Given** User has ISSUER or ADMIN role  
**When** User navigates to "Nominations Queue" page  
**Then** Page displays all nominations with status PENDING  
**And** Queue table shows: nominee name, badge name, nominating manager, nomination date  
**And** Clicking nomination opens detail view with full justification  
**And** Detail view shows badge criteria and nominee profile  
**And** "Approve" button is prominently displayed  
**And** "Reject" button opens rejection reason modal  
**And** Rejection modal requires reason text field  
**And** Approval creates BadgeAssertion with status PENDING  
**And** Approval updates nomination status to APPROVED  
**And** Rejection updates nomination status to REJECTED with reason  
**And** Queue supports filtering by badge template, nominator, date range  
**And** Queue supports sorting by nomination date  
**And** Pagination displays 20 nominations per page

---

#### Story 11.4: 构建多步骤审批工作流

As a **System**,  
I want **to orchestrate the multi-step nomination approval workflow**,  
So that **nominations flow from manager to issuer to nominee correctly**.

**Acceptance Criteria:**

**Given** Nomination workflow is triggered  
**When** Manager submits nomination  
**Then** Nomination status is set to PENDING  
**And** Notification sent to ISSUER/ADMIN role users (approval queue)  
**When** Issuer approves nomination  
**Then** BadgeAssertion is created with status PENDING  
**And** Notification sent to nominee (badge claim workflow)  
**And** Notification sent to nominating manager (approval confirmation)  
**And** Nomination status updates to APPROVED  
**When** Issuer rejects nomination  
**Then** Notification sent to nominating manager with rejection reason  
**And** Nominee is NOT notified (badge not issued)  
**And** Nomination status updates to REJECTED  
**And** All workflow transitions are logged in audit trail  
**And** Workflow state is recoverable in case of system failure

---

#### Story 11.5: 实现提名通知链

As a **User in nomination workflow**,  
I want **to receive notifications at each step of the nomination process**,  
So that **I stay informed of nomination status changes**.

**Acceptance Criteria:**

**Given** Nomination events occur  
**When** Manager submits nomination  
**Then** Email notification sent to approval queue (ISSUER/ADMIN users)  
**And** Email includes: nominee name, badge name, manager name, justification  
**And** Email includes "Review Nomination" button linking to approval queue  
**When** Issuer approves nomination  
**Then** Email notification sent to nominee with badge claim link  
**And** Email notification sent to nominating manager confirming approval  
**And** Teams notifications sent if integration enabled  
**When** Issuer rejects nomination  
**Then** Email notification sent to nominating manager with rejection reason  
**And** Email is professional and provides constructive feedback  
**And** All email templates follow organization branding  
**And** Email sending is asynchronous and includes retry logic  
**And** Notification preferences are respected for all recipients

---

#### Story 11.6: 创建提名历史和状态追踪

As a **Manager**,  
I want **to view all my submitted nominations and their status**,  
So that **I can track recognition progress for my team**.

**Acceptance Criteria:**

**Given** Manager is logged in  
**When** Manager navigates to "My Nominations" page  
**Then** Page displays all nominations submitted by manager  
**And** Table shows: nominee name, badge name, nomination date, status  
**And** Status displays as badge/chip: PENDING (yellow), APPROVED (green), REJECTED (red)  
**And** Clicking nomination shows detail view with justification  
**And** Detail view shows reviewer name and review date (if processed)  
**And** Rejected nominations display rejection reason  
**And** Page supports filtering by status and date range  
**And** Page supports searching by nominee name or badge name  
**And** Statistics summary shows: Total Nominations, Pending, Approved, Rejected  
**And** Manager can download nominations report as CSV  
**And** Nomination history is retained indefinitely for records

---

### Epic 12: Analytics & Reporting Dashboard

**Epic Goal:** Provide data-driven insights for HR to measure program success

**Requirements Covered:**
- FR22: Display admin dashboards with issuance trends, claim rates, share rates
- FR23: Show organizational skill inventory
- FR24: Provide department and role-based skill distribution views
- FR25: Calculate program effectiveness metrics
- FR26: Enable exportable reports for HR planning

---

#### Story 12.1: 创建管理仪表板概览页面

As an **Administrator**,  
I want **to view a comprehensive analytics dashboard with key metrics**,  
So that **I can quickly assess the badge program's health and impact**.

**Acceptance Criteria:**

**Given** Admin is logged in  
**When** Admin navigates to Analytics Dashboard  
**Then** Dashboard displays key performance indicators (KPIs) as cards: Total Badges Issued, Active Employees, Claim Rate %, Total Skills Represented  
**And** KPI cards show trend indicators (up/down arrows with percentage change vs previous period)  
**And** Dashboard includes date range selector (Last 7 days, 30 days, 90 days, Year, Custom)  
**And** Charts section displays: Issuance Trend, Top 10 Badges, Claim Rate Trend, Share Rate Trend  
**And** "Recent Activity" feed shows latest 10 badge issuances with timestamps  
**And** Dashboard auto-refreshes every 5 minutes  
**And** Dashboard is mobile-responsive with stacked layout  
**And** Loading states display skeleton screens while data fetches  
**And** Dashboard loads within 2 seconds with proper database indexing and caching  
**And** Empty state displays when no badges issued yet: "No badge data available. Start issuing badges to see analytics." with "Issue First Badge" button  
**And** RBAC restricts dashboard access to ADMIN role only  
**And** UX Design specification for analytics dashboard is followed

---

#### Story 12.2: 实现发放趋势时间序列分析

As an **Administrator**,  
I want **to visualize badge issuance trends over time**,  
So that **I can identify patterns and peak issuance periods**.

**Acceptance Criteria:**

**Given** Admin is viewing analytics dashboard  
**When** Issuance trend chart loads  
**Then** Line chart displays badge issuances grouped by day/week/month (based on selected date range)  
**And** Chart X-axis shows time periods, Y-axis shows issuance count  
**And** Chart supports drill-down by clicking data points to see details  
**And** Tooltip displays: date, issuance count, top 3 badges issued that period  
**And** Chart can be filtered by badge template, department, or issuer  
**And** Chart includes comparison line for previous period (dotted line)  
**And** Chart data is aggregated efficiently from BadgeAssertion table  
**And** API endpoint GET `/analytics/issuance-trend` returns time-series data  
**And** Chart library (Chart.js or Recharts) renders responsively  
**And** Export button downloads chart as PNG image

---

#### Story 12.3: 构建组织技能库存视图

As an **Administrator**,  
I want **to view all skills represented in the organization through badges**,  
So that **I can understand the collective capabilities of our workforce**.

**Acceptance Criteria:**

**Given** Admin navigates to Skills Inventory page  
**When** Page loads  
**Then** Skills taxonomy tree displays with expandable categories  
**And** Each skill shows: skill name, badge count containing this skill, employee count possessing this skill  
**And** Skills are color-coded by prevalence (high: green, medium: yellow, low: red)  
**And** Clicking skill opens detail view with: list of badges teaching this skill, list of employees with this skill  
**And** Skill gaps are highlighted (skills with low representation)  
**And** Search bar filters skills by name  
**And** "Skills Matrix" view shows skills vs departments as heatmap  
**And** API endpoint GET `/analytics/skills-inventory` aggregates skill data  
**And** Data is cached for performance (refreshed every hour)  
**And** Export button downloads skills inventory as CSV

---

#### Story 12.4: 实现部门和角色技能分布分析

As an **Administrator**,  
I want **to analyze skill distribution across departments and roles**,  
So that **I can identify training needs and talent gaps by team**.

**Acceptance Criteria:**

**Given** Admin is viewing skill distribution page  
**When** Page loads  
**Then** Department dropdown allows filtering by specific department or "All"  
**And** Bar chart displays top 10 skills per selected department  
**And** Chart shows employee count per skill as horizontal bars  
**And** Role breakdown table shows: role name, employee count, average badges per employee, top 3 skills  
**And** Heatmap visualizes skill density across departments (rows: departments, columns: skills)  
**And** Color intensity indicates skill concentration (darker = more employees)  
**And** Clicking heatmap cell drills down to employee list with that skill in that department  
**And** Comparison mode allows selecting two departments to compare side-by-side  
**And** API endpoint GET `/analytics/skills-distribution` returns aggregated data  
**And** Charts update dynamically when filters change  
**And** Export button downloads distribution report as PDF

---

#### Story 12.5: 计算项目有效性指标

As an **Administrator**,  
I want **to track program effectiveness metrics like claim rate and engagement**,  
So that **I can measure ROI and identify improvement opportunities**.

**Acceptance Criteria:**

**Given** Admin is viewing program effectiveness page  
**When** Metrics are calculated  
**Then** Claim Rate displays as percentage: (Claimed Badges / Total Issued) * 100  
**And** Claim Rate trend chart shows change over time  
**And** Average Time to Claim displays in hours/days  
**And** Share Rate displays as percentage: (Shared Badges / Claimed Badges) * 100  
**And** Engagement Score displays as composite metric (claim rate + share rate + active users)  
**And** Badge Template Performance table shows: template name, issuance count, claim rate, share rate  
**And** Low-performing badges (<50% claim rate) are flagged for review  
**And** Issuer Performance table shows: issuer name, badges issued, avg claim rate  
**And** Month-over-month growth metrics displayed with sparklines  
**And** API endpoint GET `/analytics/effectiveness` calculates all metrics  
**And** Metrics calculation is optimized with database aggregations

---

#### Story 12.6: 实现可导出报告功能

As an **Administrator**,  
I want **to export analytics reports in multiple formats**,  
So that **I can share insights with leadership and use data for HR planning**.

**Acceptance Criteria:**

**Given** Admin is viewing any analytics page  
**When** Admin clicks "Export Report" button  
**Then** Export format modal displays options: CSV, PDF, Excel  
**And** Admin can select report type: Summary Dashboard, Issuance Report, Skills Inventory, Department Analysis  
**And** Date range selector allows customizing report period  
**And** CSV export includes raw data with all relevant fields  
**And** PDF export includes formatted report with charts, tables, and branding  
**And** Excel export includes multiple sheets: Overview, Issuances, Skills, Departments  
**And** Report generation is asynchronous for large datasets  
**And** Progress indicator displays during report generation  
**And** Completed report downloads automatically  
**And** Email option sends report to specified recipients  
**And** API endpoint POST `/analytics/export` generates reports  
**And** Exported files are stored temporarily in Azure Blob Storage  
**And** Audit log records all report exports with timestamp and user

---

### Epic 13: Enterprise SSO Integration (Phase 3)

**Epic Goal:** Enable seamless enterprise authentication with Azure AD for enhanced security

**Requirements Covered:**
- FR27: Integrate Azure AD (Entra ID) for SSO authentication
- FR10: Enforce role-based issuing permissions (Azure AD group mapping)
- NFR1: Azure AD SSO with role-based access control

**Note:** Phase 3 authentication strategy - implemented after team gains production experience with Phase 1 JWT auth and validates MVP with pilot users

---

#### Story 13.0: 验证Azure AD集成准备就绪

As a **Technical Lead/Architect**,  
I want **to verify Azure AD tenant configuration and access before SSO implementation**,  
So that **SSO integration doesn't stall due to missing permissions or approvals**.

**Acceptance Criteria:**

**Given** Azure AD SSO integration is planned  
**When** Integration readiness check is performed  
**Then** Organization Azure AD tenant ID confirmed and documented  
**And** Permission granted to create Azure AD app registrations  
**And** Azure AD admin approval process documented (who approves, how long)  
**And** Graph API access requirements reviewed and feasible  
**And** Azure AD group structure documented for RBAC mapping  
**And** Test Azure AD tenant available for development and testing (or production approval for dev app)  
**And** OAuth 2.0 redirect URIs can be configured for G-Credit domain  
**And** Azure AD B2B/external users policy understood (if applicable)  
**And** MFA and Conditional Access policies documented (won't block G-Credit auth flow)  
**And** Azure AD admin contact identified for support during implementation  
**And** JWT Phase 1 users have valid email addresses matching Azure AD (for migration)  
**And** Integration readiness document approved by Security and Architect teams  
**And** Go/no-go decision made before starting Story 13.1

---

#### Story 13.1: 配置Azure AD应用注册

As a **DevOps Engineer**,  
I want **to register G-Credit application in Azure AD (Entra ID)**,  
So that **employees can authenticate using their corporate accounts**.

**Acceptance Criteria:**

**Given** Access to Azure AD admin portal  
**When** Application is registered in Azure AD  
**Then** App registration is created with name "G-Credit"  
**And** Redirect URIs configured for frontend: `https://g-credit.com/auth/callback`  
**And** Application ID (Client ID) is generated  
**And** Client secret is created and stored in Azure Key Vault  
**And** API permissions requested: User.Read, email, profile, openid  
**And** Admin consent granted for delegated permissions  
**And** Token configuration includes optional claims: email, name, groups  
**And** Application manifest configured with correct settings  
**And** Multi-tenant setting configured appropriately  
**And** Configuration documentation created with setup steps

---

#### Story 13.2: 实现Azure AD OAuth 2.0认证流

As a **Developer**,  
I want **to implement Azure AD OAuth 2.0 authentication flow**,  
So that **users can log in with Azure AD credentials**.

**Acceptance Criteria:**

**Given** Azure AD app registration is complete  
**When** User clicks "Sign in with Microsoft" button  
**Then** User is redirected to Azure AD login page  
**And** User authenticates with corporate credentials (email + password or MFA)  
**And** Azure AD redirects back to G-Credit with authorization code  
**And** Backend exchanges code for access token and refresh token  
**And** ID token is validated (signature, issuer, audience, expiration)  
**And** User profile is extracted from ID token (email, name, Azure AD ID)  
**And** User record is created or updated in User table  
**And** G-Credit session is established with JWT token  
**And** User is redirected to dashboard  
**And** Failed authentication displays user-friendly error messages  
**And** PKCE (Proof Key for Code Exchange) is implemented for security

---

#### Story 13.3: 实现用户资料同步

As a **System**,  
I want **to synchronize user profile data from Azure AD**,  
So that **employee information stays up-to-date automatically**.

**Acceptance Criteria:**

**Given** User logs in via Azure AD  
**When** Authentication completes  
**Then** System calls Microsoft Graph API to fetch full user profile  
**And** Profile data includes: firstName, lastName, email, jobTitle, department, officeLocation  
**And** User record in G-Credit is updated with latest profile data  
**And** Profile photo URL from Azure AD is stored (optional)  
**And** Department field is mapped to G-Credit department structure  
**And** Profile sync occurs on each login to keep data current  
**And** Graph API calls use delegated permissions with user's access token  
**And** API errors are handled gracefully (default to ID token claims)  
**And** Sync process logs: userId, fields updated, sync timestamp  
**And** Sync respects user privacy settings

---

#### Story 13.4: 实现Azure AD组到RBAC角色映射

As an **Administrator**,  
I want **to map Azure AD security groups to G-Credit RBAC roles**,  
So that **role assignment is managed centrally in Azure AD**.

**Acceptance Criteria:**

**Given** Azure AD groups are configured (e.g., "G-Credit-Admins", "G-Credit-Issuers")  
**When** User logs in via Azure AD  
**Then** ID token includes group claims (Azure AD group IDs or names)  
**And** System reads group membership from token claims  
**And** Group-to-role mapping is configured in application settings: {"groupId1": "ADMIN", "groupId2": "ISSUER"}  
**And** User role is automatically assigned based on group membership  
**And** Multiple groups result in highest privilege role  
**And** Default role is EMPLOYEE if no groups matched  
**And** Admin UI allows configuring group-to-role mappings  
**And** Mappings are stored in configuration table  
**And** Role changes are logged in audit trail  
**And** Role updates occur on each login to reflect AD changes  
**And** Documentation explains group setup in Azure AD

---

#### Story 13.5: 创建JWT到Azure AD的迁移路径

As a **Administrator**,  
I want **to migrate existing JWT-based users to Azure AD authentication**,  
So that **all users benefit from SSO without data loss**.

**Acceptance Criteria:**

**Given** Existing users authenticate with JWT (Phase 1)  
**When** Azure AD SSO is enabled (Phase 2)  
**Then** Login page displays both options: "Sign in with Microsoft" and "Sign in with Email"  
**And** Existing JWT users can continue using email/password login  
**And** Azure AD users are linked to existing accounts by email match  
**And** User record includes authMethod field: JWT, AZURE_AD, or BOTH  
**And** Migration wizard allows bulk converting JWT users to Azure AD  
**And** Migration preserves all user data: badges, nominations, settings  
**And** Email notifications inform users about Azure AD login availability  
**And** Admin dashboard shows migration progress: JWT users, AD users, migrated  
**And** Backward compatibility maintained during transition period  
**And** JWT authentication can be disabled after full migration  
**And** Documentation provides migration guide for admins

---

#### Story 13.6: 验证企业安全审计合规性

As a **Security Auditor**,  
I want **to verify Azure AD integration meets enterprise security requirements**,  
So that **the application passes security certification**.

**Acceptance Criteria:**

**Given** Azure AD SSO is implemented  
**When** Security audit is performed  
**Then** All authentication flows use OAuth 2.0 best practices  
**And** PKCE is implemented to prevent authorization code interception  
**And** Token validation includes: signature, issuer, audience, expiration checks  
**And** Tokens are stored securely (httpOnly cookies or secure storage)  
**And** Token refresh is implemented with proper rotation  
**And** Session timeout is configured (default: 8 hours)  
**And** Logout properly terminates both G-Credit and Azure AD sessions  
**And** Audit logs capture all authentication events: login, logout, failures  
**And** MFA requirements from Azure AD are respected  
**And** Conditional Access policies are supported  
**And** Application does not store Azure AD passwords  
**And** Security documentation includes threat model and mitigations

---

### Epic 14: External API & Extensibility

**Epic Goal:** Enable integration with external tools and future platform expansion

**Requirements Covered:**
- FR33: Provide RESTful APIs for external system access
- NFR4: Secure API authentication using OAuth 2.0 for external integrations

---

#### Story 14.1: 实现OAuth 2.0 API密钥认证

As a **External Developer**,  
I want **to authenticate API requests using OAuth 2.0 API keys**,  
So that **my application can securely access G-Credit data**.

**Acceptance Criteria:**

**Given** Admin creates API key for external integration  
**When** API key management page is accessed  
**Then** Admin can generate new API key with name and permissions scope  
**And** API key includes: key ID, secret, scopes (read:badges, write:badges, read:users)  
**And** Secret is displayed only once and must be copied immediately  
**And** API keys are stored hashed in database (bcrypt)  
**And** API keys can be revoked or regenerated  
**And** API requests include key in Authorization header: `Bearer {api_key}`  
**And** Backend validates API key on each request  
**And** Invalid or revoked keys return 401 Unauthorized  
**And** Scope enforcement limits API access based on key permissions  
**And** API key usage is tracked: request count, last used timestamp  
**And** Rate limits are enforced per API key

---

#### Story 14.2: 构建完整的RESTful API端点

As a **External Developer**,  
I want **comprehensive RESTful API endpoints for all resources**,  
So that **I can integrate G-Credit with external systems**.

**Acceptance Criteria:**

**Given** Valid API key is provided  
**When** API endpoints are called  
**Then** Badge Templates API: GET /api/v1/badge-templates (list), GET /api/v1/badge-templates/:id (detail)  
**And** Badges API: GET /api/v1/badges (list with filters), POST /api/v1/badges/issue (create)  
**And** Users API: GET /api/v1/users (list), GET /api/v1/users/:id (detail)  
**And** Verification API: GET /api/v1/verify/:verificationId (public, no auth)  
**And** All list endpoints support pagination with query params: page, limit, sort  
**And** All endpoints return consistent JSON format: {data, meta, errors}  
**And** Error responses include: status code, error message, error code  
**And** API versioning uses URL prefix: /api/v1/  
**And** Webhook registration API: POST /api/v1/webhooks (subscribe to events)  
**And** API follows REST best practices (proper HTTP methods and status codes)

---

#### Story 14.3: 自动生成Swagger/OpenAPI文档

As a **External Developer**,  
I want **interactive API documentation with examples**,  
So that **I can understand and test API endpoints easily**.

**Acceptance Criteria:**

**Given** API endpoints are defined with decorators/annotations  
**When** Swagger documentation is accessed at `/api/docs`  
**Then** Swagger UI displays all available API endpoints  
**And** Each endpoint includes: description, parameters, request body schema, response schema  
**And** Request/response examples provided for each endpoint  
**And** Authentication section explains API key usage  
**And** "Try it out" functionality allows testing endpoints directly  
**And** OpenAPI 3.0 specification is auto-generated from code  
**And** Swagger documentation updates automatically when API changes  
**And** JSON schema definitions for all models (BadgeClass, BadgeAssertion, User)  
**And** Error response schemas documented with status codes  
**And** Swagger JSON available at `/api/docs/json` for tooling integration

---

#### Story 14.4: 实现API速率限制和节流

As a **System Administrator**,  
I want **to enforce rate limits on API requests**,  
So that **the platform is protected from abuse and overuse**.

**Acceptance Criteria:**

**Given** API requests are being made  
**When** Rate limit is checked  
**Then** Rate limits enforced per API key: 1000 requests per hour (standard tier)  
**And** Rate limit headers included in responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset  
**And** Exceeded limits return 429 Too Many Requests with retry-after header  
**And** Rate limiting uses sliding window algorithm  
**And** Rate limit data stored in Redis for performance  
**And** Different rate limits for different endpoint tiers: public (100/hr), authenticated (1000/hr), premium (10000/hr)  
**And** Admin can adjust rate limits per API key  
**And** Rate limit exceeded events are logged  
**And** Throttling gradually slows down requests approaching limit  
**And** Burst allowance permits short-term spikes

---

#### Story 14.5: 创建SDK示例

As a **External Developer**,  
I want **SDK code samples in popular languages**,  
So that **I can quickly integrate G-Credit into my application**.

**Acceptance Criteria:**

**Given** API documentation is complete  
**When** SDK samples page is accessed  
**Then** JavaScript/TypeScript SDK sample provided with npm package structure  
**And** Python SDK sample provided with pip package structure  
**And** SDK samples include: authentication, badge issuance, badge verification  
**And** Code examples show error handling and retry logic  
**And** SDK includes README with installation and usage instructions  
**And** SDK samples published to GitHub repository  
**And** SDK includes type definitions (TypeScript) or type hints (Python)  
**And** SDK handles token refresh and pagination automatically  
**And** Example projects demonstrate common use cases  
**And** SDK is versioned and released with API version compatibility

---

#### Story 14.6: 构建开发者文档门户

As a **External Developer**,  
I want **comprehensive developer documentation portal**,  
So that **I can learn how to integrate with G-Credit effectively**.

**Acceptance Criteria:**

**Given** Developer portal is deployed  
**When** Developer navigates to `/developers`  
**Then** Portal includes: Getting Started guide, API reference, SDK documentation, Use cases  
**And** Getting Started guide walks through: API key creation, first API call, authentication  
**And** API reference links to Swagger documentation  
**And** Use cases section provides: "Issue badge programmatically", "Verify badge", "Sync users"  
**And** Code snippets provided in multiple languages (cURL, JavaScript, Python)  
**And** Portal includes rate limits documentation  
**And** Webhook events documented with payload schemas  
**And** Changelog tracks API versions and breaking changes  
**And** FAQ section answers common integration questions  
**And** Support contact information provided  
**And** Portal is SEO-optimized and mobile-responsive

---

## Document Complete

All 14 Epics with detailed user stories have been documented following the BMAD Method workflow.

