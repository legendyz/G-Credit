# System Architecture Diagrams

Visual documentation of the GCredit Digital Badge Platform architecture.

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Database Schema](#database-schema)
- [Badge Issuance Flow](#badge-issuance-flow)
- [Authentication Flow](#authentication-flow)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

High-level system architecture showing main components and interactions.

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser<br/>React SPA]
        MOBILE[Mobile App<br/>Future]
    end

    subgraph "API Gateway"
        NGINX[Nginx<br/>Reverse Proxy]
    end

    subgraph "Application Layer"
        API[NestJS API Server<br/>Port 3000]
        AUTH[Authentication<br/>JWT Module]
        BADGES[Badge Issuance<br/>Module]
        TEMPLATES[Badge Templates<br/>Module]
        SKILLS[Skills<br/>Module]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Azure Flexible Server)]
        PRISMA[Prisma ORM]
    end

    subgraph "External Services"
        AZURE_BLOB[Azure Blob Storage<br/>Badge Images]
        AZURE_EMAIL[Azure Communication<br/>Email Service]
    end

    WEB --> NGINX
    MOBILE -.Future.-> NGINX
    NGINX --> API
    
    API --> AUTH
    API --> BADGES
    API --> TEMPLATES
    API --> SKILLS
    
    AUTH --> PRISMA
    BADGES --> PRISMA
    TEMPLATES --> PRISMA
    SKILLS --> PRISMA
    
    PRISMA --> POSTGRES
    
    TEMPLATES --> AZURE_BLOB
    BADGES --> AZURE_EMAIL
    
    style WEB fill:#e1f5ff
    style API fill:#fff4e6
    style POSTGRES fill:#f0f0f0
    style AZURE_BLOB fill:#d4f1f4
    style AZURE_EMAIL fill:#d4f1f4
```

### Components Description

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Client** | React 19 + TypeScript | User interface for badge management |
| **API Server** | NestJS 11 + TypeScript | Backend REST API |
| **Database** | PostgreSQL 16 | Persistent data storage |
| **Blob Storage** | Azure Blob Storage | Badge template images |
| **Email Service** | Azure Communication Services | Badge claim notifications |
| **ORM** | Prisma 6.19 | Database abstraction layer |

---

## Component Architecture

Detailed view of NestJS application architecture.

```mermaid
graph LR
    subgraph "Controllers"
        AC[Auth Controller]
        BC[Badge Controller]
        TC[Template Controller]
        SC[Skill Controller]
    end

    subgraph "Services"
        AS[Auth Service]
        BS[Badge Service]
        TS[Template Service]
        SS[Skill Service]
        PS[Prisma Service]
        AZS[Azure Storage Service]
        ES[Email Service]
    end

    subgraph "Guards & Middleware"
        JG[JWT Auth Guard]
        RG[Roles Guard]
        VP[Validation Pipe]
    end

    subgraph "Common"
        DEC[Decorators]
        DTO[DTOs]
        INT[Interceptors]
    end

    AC --> JG
    BC --> JG
    TC --> JG
    
    JG --> RG
    
    AC --> AS
    BC --> BS
    TC --> TS
    SC --> SS
    
    AS --> PS
    BS --> PS
    TS --> PS
    SS --> PS
    
    BS --> ES
    TS --> AZS
    
    AC -.uses.-> DTO
    BC -.uses.-> DTO
    TC -.uses.-> DTO
    
    style AC fill:#e1f5ff
    style BC fill:#e1f5ff
    style TC fill:#e1f5ff
    style AS fill:#fff4e6
    style BS fill:#fff4e6
    style TS fill:#fff4e6
```

### Module Dependencies

```mermaid
graph TD
    APP[App Module]
    
    APP --> AUTH[Auth Module]
    APP --> BADGE[Badge Issuance Module]
    APP --> TEMPLATE[Badge Template Module]
    APP --> SKILL[Skill Module]
    APP --> CATEGORY[Skill Category Module]
    APP --> COMMON[Common Module]
    
    AUTH --> COMMON
    BADGE --> COMMON
    TEMPLATE --> COMMON
    SKILL --> COMMON
    CATEGORY --> COMMON
    
    BADGE -.uses.-> TEMPLATE
    TEMPLATE -.uses.-> SKILL
    
    COMMON --> PRISMA[Prisma Module]
    COMMON --> AZURE[Azure Module]
    
    style APP fill:#d4f1f4
    style COMMON fill:#fff4e6
```

---

## Database Schema

Entity Relationship Diagram showing database structure.

```mermaid
erDiagram
    User ||--o{ Badge : issues
    User ||--o{ Badge : receives
    User ||--o{ BadgeTemplate : creates
    
    BadgeTemplate ||--o{ Badge : "used for"
    BadgeTemplate }o--o{ Skill : "requires"
    
    Skill }o--|| SkillCategory : "belongs to"
    SkillCategory }o--o| SkillCategory : "parent of"
    
    User {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime lastLoginAt
    }
    
    BadgeTemplate {
        string id PK
        string name
        string description
        enum category
        string imageUrl
        json issuanceCriteria
        int validityPeriod
        enum status
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    Badge {
        string id PK
        string templateId FK
        string recipientId FK
        string issuerId FK
        enum status
        string claimToken
        string claimUrl
        string evidenceUrl
        json assertionJson
        datetime issuedAt
        datetime claimedAt
        datetime expiresAt
        datetime revokedAt
        string revocationReason
        string revokedBy
        datetime createdAt
        datetime updatedAt
    }
    
    Skill {
        string id PK
        string name UK
        string description
        string categoryId FK
        datetime createdAt
        datetime updatedAt
    }
    
    SkillCategory {
        string id PK
        string name UK
        string description
        string parentId FK
        datetime createdAt
        datetime updatedAt
    }
```

### Key Relationships

1. **User → Badge (as Issuer):** One user can issue many badges
2. **User → Badge (as Recipient):** One user can receive many badges
3. **BadgeTemplate → Badge:** One template can be used for many badges
4. **BadgeTemplate ↔ Skill:** Many-to-many relationship
5. **Skill → SkillCategory:** Many skills belong to one category
6. **SkillCategory → SkillCategory:** Self-referencing for hierarchy

---

## Badge Issuance Flow

Complete workflow from badge issuance to claim.

```mermaid
sequenceDiagram
    participant Admin as HR Admin
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Email as Azure Email
    participant User as Employee
    
    Admin->>API: POST /api/badges<br/>{templateId, recipientId}
    
    API->>DB: Validate template exists & active
    DB-->>API: Template found
    
    API->>DB: Validate recipient exists
    DB-->>API: Recipient found
    
    API->>API: Generate claim token
    API->>API: Hash claim token
    API->>API: Create Open Badges assertion
    
    API->>DB: Create badge record<br/>status: ISSUED
    DB-->>API: Badge created
    
    API->>Email: Send claim email<br/>with claimUrl & token
    Email-->>User: 📧 Badge claim notification
    
    API-->>Admin: ✅ Badge issued<br/>{badgeId, claimUrl, claimToken}
    
    User->>API: POST /api/badges/:id/claim<br/>{claimToken}
    
    API->>API: Hash provided token
    API->>DB: Find badge by hashed token
    DB-->>API: Badge found
    
    alt Badge already claimed
        API-->>User: ❌ 400 Already claimed
    else Badge expired
        API-->>User: ❌ 410 Badge expired
    else Badge revoked
        API-->>User: ❌ 410 Badge revoked
    else Valid claim
        API->>DB: Update badge<br/>status: CLAIMED<br/>claimedAt: now
        DB-->>API: Badge updated
        API-->>User: ✅ Badge claimed successfully
    end
```

### Badge Status State Machine

```mermaid
stateDiagram-v2
    [*] --> ISSUED: Issue badge
    
    ISSUED --> CLAIMED: Claim badge
    ISSUED --> REVOKED: Admin revokes
    
    CLAIMED --> REVOKED: Admin revokes
    
    REVOKED --> [*]
    
    note right of ISSUED
        Waiting for recipient
        to claim badge
    end note
    
    note right of CLAIMED
        Badge successfully
        claimed by recipient
    end note
    
    note right of REVOKED
        Badge invalidated
        by admin
    end note
```

---

## Authentication Flow

JWT-based authentication and authorization flow.

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Guard as JWT Guard
    participant DB as PostgreSQL
    
    Client->>API: POST /auth/login<br/>{email, password}
    
    API->>DB: Find user by email
    DB-->>API: User found
    
    API->>API: Verify password<br/>(bcrypt compare)
    
    alt Invalid credentials
        API-->>Client: ❌ 401 Unauthorized
    else Valid credentials
        API->>API: Generate access token<br/>(15 min expiry)
        API->>API: Generate refresh token<br/>(7 day expiry)
        API->>DB: Store refresh token hash
        API-->>Client: ✅ {accessToken, refreshToken}
    end
    
    Client->>API: GET /api/badges/my-badges<br/>Authorization: Bearer token
    
    API->>Guard: Validate JWT token
    
    alt Invalid/expired token
        Guard-->>Client: ❌ 401 Unauthorized
    else Valid token
        Guard->>API: Extract user from token
        API->>DB: Query badges for user
        DB-->>API: Badges list
        API-->>Client: ✅ {badges}
    end
    
    Note over Client,API: Token expires after 15 minutes
    
    Client->>API: POST /auth/refresh<br/>{refreshToken}
    
    API->>DB: Validate refresh token
    DB-->>API: Token valid
    
    API->>API: Generate new access token
    API->>API: Generate new refresh token
    API->>DB: Update refresh token
    
    API-->>Client: ✅ {accessToken, refreshToken}
```

### Role-Based Access Control

```mermaid
graph TD
    REQUEST[Incoming Request]
    
    REQUEST --> JWT[JWT Auth Guard]
    
    JWT --> VALID{Valid Token?}
    
    VALID -->|No| REJECT1[❌ 401 Unauthorized]
    VALID -->|Yes| EXTRACT[Extract User Role]
    
    EXTRACT --> ROLES[Roles Guard]
    
    ROLES --> CHECK{Has Required Role?}
    
    CHECK -->|No| REJECT2[❌ 403 Forbidden]
    CHECK -->|Yes| ALLOW[✅ Allow Request]
    
    ALLOW --> CONTROLLER[Controller Handler]
    
    style REQUEST fill:#e1f5ff
    style ALLOW fill:#d4f1f4
    style REJECT1 fill:#ffebee
    style REJECT2 fill:#ffebee
```

### User Roles Hierarchy

```mermaid
graph TD
    ADMIN[ADMIN<br/>Full System Access]
    MANAGER[MANAGER<br/>Team Management]
    ISSUER[ISSUER<br/>Badge Issuance]
    EMPLOYEE[EMPLOYEE<br/>Basic Access]
    
    ADMIN --> MANAGER
    ADMIN --> ISSUER
    MANAGER --> EMPLOYEE
    ISSUER --> EMPLOYEE
    
    style ADMIN fill:#f44336,color:#fff
    style MANAGER fill:#ff9800,color:#fff
    style ISSUER fill:#4caf50,color:#fff
    style EMPLOYEE fill:#2196f3,color:#fff
```

**Permissions:**
- **ADMIN:** All operations + user management + badge revocation
- **MANAGER:** Team oversight + reporting (future)
- **ISSUER:** Issue badges + view issued badges
- **EMPLOYEE:** Claim badges + view own badges

---

## Deployment Architecture

Production deployment on Azure.

```mermaid
graph TB
    subgraph "Internet"
        USER[Users]
    end
    
    subgraph "Azure Cloud"
        subgraph "App Service"
            FE[Frontend<br/>React SPA<br/>Static Files]
            BE[Backend<br/>NestJS API<br/>Node.js 20]
        end
        
        subgraph "Database"
            DB[(PostgreSQL<br/>Flexible Server<br/>B1ms)]
        end
        
        subgraph "Storage"
            BLOB[Blob Storage<br/>Badge Images]
        end
        
        subgraph "Communication"
            EMAIL[Communication Services<br/>Email Notifications]
        end
        
        subgraph "Monitoring"
            INSIGHTS[Application Insights<br/>Logging & Metrics]
        end
    end
    
    USER --> FE
    FE --> BE
    BE --> DB
    BE --> BLOB
    BE --> EMAIL
    BE --> INSIGHTS
    FE --> INSIGHTS
    
    style USER fill:#e1f5ff
    style FE fill:#4caf50,color:#fff
    style BE fill:#ff9800,color:#fff
    style DB fill:#2196f3,color:#fff
    style BLOB fill:#9c27b0,color:#fff
    style EMAIL fill:#f44336,color:#fff
```

### Environment Configuration

```mermaid
graph LR
    subgraph "Development"
        DEV_FE[Frontend<br/>localhost:5173]
        DEV_BE[Backend<br/>localhost:3000]
        DEV_DB[(Local PostgreSQL)]
    end
    
    subgraph "Staging"
        STG_FE[Frontend<br/>staging.gcredit.com]
        STG_BE[Backend<br/>api-staging.gcredit.com]
        STG_DB[(Azure PostgreSQL)]
    end
    
    subgraph "Production"
        PROD_FE[Frontend<br/>gcredit.com]
        PROD_BE[Backend<br/>api.gcredit.com]
        PROD_DB[(Azure PostgreSQL)]
    end
    
    DEV_FE -.Deploy.-> STG_FE
    DEV_BE -.Deploy.-> STG_BE
    
    STG_FE -.Deploy.-> PROD_FE
    STG_BE -.Deploy.-> PROD_BE
    
    style DEV_FE fill:#e1f5ff
    style STG_FE fill:#fff4e6
    style PROD_FE fill:#d4f1f4
```

---

## API Request Flow

Detailed request/response flow through the system.

```mermaid
flowchart TD
    START([HTTP Request]) --> CORS{CORS Check}
    
    CORS -->|Failed| ERROR1[403 Forbidden]
    CORS -->|Passed| ROUTE[Route Matching]
    
    ROUTE -->|Not Found| ERROR2[404 Not Found]
    ROUTE -->|Found| PUBLIC{Public Route?}
    
    PUBLIC -->|Yes| VALIDATE
    PUBLIC -->|No| JWT[JWT Guard]
    
    JWT --> TOKEN{Valid Token?}
    TOKEN -->|No| ERROR3[401 Unauthorized]
    TOKEN -->|Yes| ROLES[Roles Guard]
    
    ROLES --> PERMISSION{Has Permission?}
    PERMISSION -->|No| ERROR4[403 Forbidden]
    PERMISSION -->|Yes| VALIDATE
    
    VALIDATE[Validation Pipe] --> VALID{Valid DTO?}
    VALID -->|No| ERROR5[400 Bad Request]
    VALID -->|Yes| CONTROLLER[Controller Handler]
    
    CONTROLLER --> SERVICE[Service Layer]
    SERVICE --> BUSINESS{Business Logic}
    
    BUSINESS -->|Error| ERROR6[500 Server Error]
    BUSINESS -->|Success| DB[(Database)]
    
    DB --> TRANSFORM[Response Transform]
    TRANSFORM --> SUCCESS[200/201 Success]
    
    ERROR1 --> END([HTTP Response])
    ERROR2 --> END
    ERROR3 --> END
    ERROR4 --> END
    ERROR5 --> END
    ERROR6 --> END
    SUCCESS --> END
    
    style START fill:#e1f5ff
    style SUCCESS fill:#d4f1f4
    style ERROR1 fill:#ffebee
    style ERROR2 fill:#ffebee
    style ERROR3 fill:#ffebee
    style ERROR4 fill:#ffebee
    style ERROR5 fill:#ffebee
    style ERROR6 fill:#ffebee
```

---

## Data Flow: Badge Template Creation

Example of data flow for creating a badge template with image upload.

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Interceptor
    participant Service
    participant Azure
    participant Prisma
    participant DB
    
    Client->>Controller: POST /badge-templates<br/>multipart/form-data
    
    Controller->>Interceptor: File Upload Interceptor
    Interceptor->>Interceptor: Validate file type<br/>(PNG, JPG, GIF, WebP)
    Interceptor->>Interceptor: Validate file size<br/>(< 5MB)
    
    alt Invalid file
        Interceptor-->>Client: ❌ 400 Invalid file
    else Valid file
        Interceptor->>Controller: File validated
        
        Controller->>Service: create(dto, file)
        
        Service->>Azure: Upload image to Blob Storage
        Azure-->>Service: Image URL
        
        Service->>Prisma: Create template record<br/>with imageUrl
        Prisma->>DB: INSERT INTO badge_templates
        DB-->>Prisma: Template created
        Prisma-->>Service: Template object
        
        Service-->>Controller: Template created
        Controller-->>Client: ✅ 201 Created<br/>{template}
    end
```

---

## Scalability Considerations

Future scalability patterns.

```mermaid
graph TB
    subgraph "Current (MVP)"
        SINGLE[Single App Server<br/>Vertical Scaling]
        SINGLE_DB[(Single Database<br/>B1ms)]
    end
    
    subgraph "Future: Horizontal Scaling"
        LB[Load Balancer]
        APP1[App Server 1]
        APP2[App Server 2]
        APP3[App Server N]
        
        LB --> APP1
        LB --> APP2
        LB --> APP3
        
        APP1 --> DB_POOL
        APP2 --> DB_POOL
        APP3 --> DB_POOL
        
        DB_POOL[(Database<br/>Connection Pooling)]
        
        CACHE[(Redis Cache<br/>Session Store)]
        
        APP1 -.-> CACHE
        APP2 -.-> CACHE
        APP3 -.-> CACHE
    end
    
    subgraph "Future: Microservices"
        API_GW[API Gateway]
        
        AUTH_SVC[Auth Service]
        BADGE_SVC[Badge Service]
        NOTIFY_SVC[Notification Service]
        
        API_GW --> AUTH_SVC
        API_GW --> BADGE_SVC
        API_GW --> NOTIFY_SVC
        
        MSG_QUEUE[Message Queue<br/>Azure Service Bus]
        
        BADGE_SVC --> MSG_QUEUE
        MSG_QUEUE --> NOTIFY_SVC
    end
    
    style SINGLE fill:#e1f5ff
    style LB fill:#fff4e6
    style API_GW fill:#d4f1f4
```

---

## Related Documentation

- [System Design Document](./system-design.md)
- [Database Schema Details](./database-schema.md)
- [API Documentation](../../backend/docs/api/README.md)
- [Deployment Guide](../setup/deployment-guide.md)

---

**Diagram Tools:**
- All diagrams created with **Mermaid**
- Renderable in GitHub, VS Code, GitBook
- Editable directly in Markdown

**Last Updated:** January 27, 2026
