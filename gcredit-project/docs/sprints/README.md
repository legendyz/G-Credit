# Sprint Documentation Index

**Last Updated:** 2026-01-28  
**Current Sprint:** Sprint 3 Complete (v0.3.0) → Planning Sprint 4  
**Total Sprints:** 4 (Sprint 0-3)

---

## 📊 Sprint Overview

| Sprint | Name | Status | Duration | Stories | Tests | Version |
|--------|------|--------|----------|---------|-------|---------|
| [Sprint 0](./sprint-0/) | Infrastructure & Setup | ✅ Complete | Setup Phase | N/A | N/A | - |
| [Sprint 1](./sprint-1/) | Authentication & Authorization | ✅ Complete | 2 weeks | 4 stories | Unit tests | v0.1.0 |
| [Sprint 2](./sprint-2/) | Badge Template Management | ✅ Complete | 2 weeks | 5 stories | Integration tests | v0.2.0 |
| [Sprint 3](./sprint-3/) | Badge Issuance System | ✅ Complete | 2 weeks | 6 stories | 46 tests | v0.3.0 |

---

## 📁 Sprint Structure

Each sprint directory follows this consistent structure:

```
sprint-N/
├── README.md                    # Sprint overview and summary
├── backlog.md                   # User stories and tasks
├── retrospective.md             # Sprint retrospective (if completed)
└── [additional docs]            # Sprint-specific documentation
```

---

## 🏃 Sprint Summaries

### Sprint 0 - Infrastructure & Setup
**Focus:** Project foundation and development environment

**Key Deliverables:**
- Git repository and project structure
- Development environment setup
- Database configuration (PostgreSQL + Prisma)
- Code standards and conventions

[View Sprint 0 Details →](./sprint-0/)

---

### Sprint 1 - Authentication & Authorization
**Focus:** User management and security

**Key Deliverables:**
- JWT-based authentication
- User registration and login
- Role-based access control (ADMIN, ISSUER, EMPLOYEE)
- Password reset functionality

**Technologies:**
- NestJS Passport
- JWT strategy
- bcrypt password hashing
- Email service integration

[View Sprint 1 Details →](./sprint-1/)

---

### Sprint 2 - Badge Template Management
**Focus:** Badge template system

**Key Deliverables:**
- Badge template CRUD operations
- Image upload (Azure Blob Storage)
- Skill taxonomy integration
- Template search and filtering

**Technologies:**
- Azure Blob Storage
- Prisma JSON fields
- Advanced filtering with Prisma

[View Sprint 2 Details →](./sprint-2/)

---

### Sprint 3 - Badge Issuance System ⭐ ✅ COMPLETE
**Focus:** Complete badge issuance workflow

**Status:** ✅ Complete (v0.3.0, 2026-01-28)

**Key Deliverables:**
- Single badge issuance with claim tokens
- Batch CSV upload (up to 1000 badges)
- Badge claiming workflow (7-day expiry)
- Email notifications (Azure Communication Services)
- Badge history with pagination and filtering
- Badge revocation with audit trail
- Open Badges 2.0 JSON-LD assertions
- Public verification endpoints

**Technologies:**
- Azure Communication Services (email)
- csv-parse library
- Multer file upload
- Open Badges 2.0 specification
- UUID v4 claim tokens

**Metrics:**
- 6/6 stories (100%)
- 46 total tests (26 E2E + 20 unit, 100% pass)
- 7 UAT scenarios (100% acceptance)
- 13h actual vs 12.5h estimated (104%)
- 82% test coverage (exceeds 80% target)
- 0 critical bugs
- Sprint grade: A+ (9.5/10)

**Key Achievements:**
- Complete badge lifecycle (issue → claim → verify → revoke)
- Fixed UUID validation bug through comprehensive testing
- Phase 1-3 documentation reorganization (45%→100% compliance)

[View Sprint 3 Details →](./sprint-3/)

---

## 📈 Progress Metrics

### Story Completion
```
Sprint 0:  Setup Phase (N/A)
Sprint 1:  4/4 stories ✅ (100%)
Sprint 2:  5/5 stories ✅ (100%)
Sprint 3:  6/6 stories ✅ (100%)
────────────────────────────
Total:     15/15 stories ✅
```

### Test Coverage
```
Sprint 0:  N/A (Infrastructure)
Sprint 1:  Unit tests + Integration tests
Sprint 2:  Integration tests + E2E tests
Sprint 3:  26 E2E tests + 20 unit tests + 7 UAT ✅
────────────────────────────
Current:   46+ automated tests
```

### Time Efficiency
```
Sprint 1:  ~100% efficient
Sprint 2:  ~95% efficient
Sprint 3:  96% efficient (13h / 12.5h)
────────────────────────────
Average:   ~97% efficiency ✅
```

---

## 🔍 Finding Sprint Information

### By Topic

**Authentication & Security**
→ Sprint 1: User auth, JWT, RBAC, password reset

**Badge Templates**
→ Sprint 2: Template management, image upload, search

**Badge Issuance**
→ Sprint 3: Issuing badges, claiming, notifications, revocation

**Infrastructure**
→ Sprint 0: Project setup, environment, standards

---

### By Technology

**Azure Services**
- Sprint 2: Azure Blob Storage (images)
- Sprint 3: Azure Communication Services (email)

**Database (Prisma)**
- Sprint 0: Initial setup
- Sprint 1: User model
- Sprint 2: BadgeTemplate model
- Sprint 3: Badge model

**Authentication**
- Sprint 1: Complete auth system

**File Upload**
- Sprint 2: Images (Azure Blob)
- Sprint 3: CSV files (Multer)

---

## 📚 Cross-Sprint Documentation

### Lessons Learned
Accumulated lessons from all sprints:
→ [Lessons Learned](../lessons-learned/lessons-learned.md)

### Architecture Evolution
How the system architecture evolved:
→ [System Architecture](../architecture/system-architecture.md)

### Security
Security considerations across all sprints:
→ [Security Notes](../security/security-notes.md)

### Testing Strategy
Testing approach evolution:
→ [Testing Documentation](../testing/)

---

## 🗂️ Document Templates

Looking to create sprint documentation?
→ [Sprint Templates](../templates/)

---

## 🚀 Next Sprint

Planning Sprint 4? Common next steps:
- Badge display and sharing
- Analytics and reporting
- Advanced badge features
- Performance optimization
- Production deployment preparation

---

## 📞 Sprint Documentation Guidelines

### Creating Sprint Documentation
1. Copy sprint README template from `templates/`
2. Fill in sprint overview and goals
3. Document stories as they're completed
4. Add retrospective after sprint ends
5. Link to related documentation

### Sprint Naming Convention
- Use format: `sprint-N` (lowercase, hyphenated)
- N starts from 0 (infrastructure sprint)
- Consistent across all documentation

### Sprint Document Structure
```markdown
# Sprint N - [Sprint Name]
**Sprint Duration:** [duration]
**Status:** [In Progress / Complete]
**Epic:** [epic name]

## Sprint Overview
## Documentation
## Stories Delivered
## Technical Implementation
## Testing
## Key Learnings
## Related Documentation
```

---

**Maintained By:** Technical Documentation Team  
**Questions?** See main [Documentation Index](../README.md)
