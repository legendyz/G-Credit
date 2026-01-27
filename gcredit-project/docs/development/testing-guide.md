# Testing Guide

Comprehensive guide to writing and running tests for the GCredit Digital Badge Platform.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Stack](#testing-stack)
- [Test Types](#test-types)
- [Unit Testing](#unit-testing)
- [E2E Testing](#e2e-testing)
- [UAT Testing](#uat-testing)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [Best Practices](#best-practices)

---

## Testing Philosophy

### Test Pyramid

```
       /\
      /  \     E2E Tests (Few)
     /----\    - Happy path scenarios
    /      \   - Critical user flows
   /--------\  
  / Integration\ Integration Tests (Some)
 /    Tests    \ - Module interactions
/--------------\ - Database operations
/  Unit Tests   \ Unit Tests (Many)
/    (Most)     \ - Business logic
/----------------\ - Utilities
```

### Testing Principles

1. **Tests should be fast** - Unit tests < 100ms, E2E tests < 10s
2. **Tests should be isolated** - No dependencies between tests
3. **Tests should be deterministic** - Same input = same output
4. **Tests should be maintainable** - Clear, simple, well-organized
5. **Tests should provide value** - Test behavior, not implementation

### Coverage Goals

| Type | Target | Current (Sprint 3) |
|------|--------|--------------------|
| **Unit Tests** | > 80% | 85% |
| **E2E Tests** | Critical paths | 100% of user stories |
| **Overall** | > 75% | 82% |

---

## Testing Stack

### Dependencies

```json
{
  "devDependencies": {
    "@nestjs/testing": "^11.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.5",
    "@types/supertest": "^2.0.16"
  }
}
```

### Tools

- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for E2E tests
- **@nestjs/testing** - NestJS testing utilities
- **Prisma** - Test database management

### Configuration

**jest.config.js:**
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

**test/jest-e2e.json:**
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

---

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions/methods in isolation  
**Location:** `src/**/*.spec.ts`  
**Speed:** Very fast (< 100ms)

**Example:**
```typescript
describe('BadgeService', () => {
  it('should generate a unique claim token', () => {
    const token1 = service.generateClaimToken();
    const token2 = service.generateClaimToken();
    
    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
  });
});
```

### 2. Integration Tests

**Purpose:** Test module interactions and database operations  
**Location:** `src/**/*.spec.ts`  
**Speed:** Fast (< 1s)

**Example:**
```typescript
describe('BadgeService (Integration)', () => {
  it('should create a badge with database persistence', async () => {
    const badge = await service.issueBadge(createDto, 'issuer-id');
    
    expect(badge.id).toBeDefined();
    
    const found = await prisma.badge.findUnique({ 
      where: { id: badge.id } 
    });
    expect(found).toBeDefined();
  });
});
```

### 3. E2E Tests

**Purpose:** Test complete user flows through HTTP API  
**Location:** `test/**/*.e2e-spec.ts`  
**Speed:** Moderate (< 10s)

**Example:**
```typescript
describe('/api/badges (E2E)', () => {
  it('should issue a badge successfully', () => {
    return request(app.getHttpServer())
      .post('/api/badges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createBadgeDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('ISSUED');
      });
  });
});
```

### 4. UAT Tests

**Purpose:** Manual user acceptance testing  
**Location:** `docs/sprints/sprint-N/uat-testing-guide.md`  
**Speed:** Manual

---

## Unit Testing

### Service Testing

**Setup with mocks:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceService } from './badge-issuance.service';
import { PrismaService } from '../common/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('BadgeIssuanceService', () => {
  let service: BadgeIssuanceService;
  let prisma: PrismaService;

  // Mock data
  const mockBadge = {
    id: 'badge-123',
    templateId: 'template-123',
    recipientId: 'user-123',
    issuerId: 'issuer-123',
    status: 'ISSUED',
    claimToken: 'token-hash',
    issuedAt: new Date(),
  };

  const mockTemplate = {
    id: 'template-123',
    name: 'Test Badge',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeIssuanceService,
        {
          provide: PrismaService,
          useValue: {
            badge: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            badgeTemplate: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issueBadge', () => {
    it('should issue a badge successfully', async () => {
      // Arrange
      const createDto = {
        templateId: 'template-123',
        recipientId: 'user-123',
      };
      
      jest.spyOn(prisma.badgeTemplate, 'findUnique')
        .mockResolvedValue(mockTemplate);
      jest.spyOn(prisma.badge, 'create')
        .mockResolvedValue(mockBadge);

      // Act
      const result = await service.issueBadge(createDto, 'issuer-123');

      // Assert
      expect(result).toEqual(mockBadge);
      expect(prisma.badgeTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-123' },
      });
      expect(prisma.badge.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if template not found', async () => {
      // Arrange
      const createDto = {
        templateId: 'invalid-id',
        recipientId: 'user-123',
      };
      
      jest.spyOn(prisma.badgeTemplate, 'findUnique')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.issueBadge(createDto, 'issuer-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('claimBadge', () => {
    it('should claim a badge successfully', async () => {
      // Test implementation
    });

    it('should reject already claimed badge', async () => {
      // Test implementation
    });
  });
});
```

### Controller Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';

describe('BadgeIssuanceController', () => {
  let controller: BadgeIssuanceController;
  let service: BadgeIssuanceService;

  const mockBadgeService = {
    issueBadge: jest.fn(),
    claimBadge: jest.fn(),
    getMyBadges: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeIssuanceController],
      providers: [
        {
          provide: BadgeIssuanceService,
          useValue: mockBadgeService,
        },
      ],
    }).compile();

    controller = module.get<BadgeIssuanceController>(BadgeIssuanceController);
    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('issueBadge', () => {
    it('should call service.issueBadge', async () => {
      const dto = { templateId: '123', recipientId: '456' };
      const req = { user: { userId: 'issuer-id' } };
      
      await controller.issueBadge(dto, req);

      expect(service.issueBadge).toHaveBeenCalledWith(dto, 'issuer-id');
    });
  });
});
```

---

## E2E Testing

### Setup

**test/setup.ts:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.init();
  return app;
}

export async function cleanDatabase(app: INestApplication) {
  const prisma = app.get(PrismaService);
  
  // Clean in order (respect foreign keys)
  await prisma.badge.deleteMany();
  await prisma.badgeTemplate.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.user.deleteMany();
}
```

### Complete E2E Test Example

**test/badge-issuance.e2e-spec.ts:**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { cleanDatabase } from './setup';

describe('Badge Issuance (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let issuerToken: string;
  let userToken: string;
  let templateId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    
    // Create test users
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
      });
    
    adminToken = adminLogin.body.accessToken;

    // Create badge template
    const templateResponse = await request(app.getHttpServer())
      .post('/badge-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Test Badge')
      .field('category', 'certification')
      .field('skillIds', JSON.stringify([]))
      .field('issuanceCriteria', JSON.stringify({ type: 'manual' }))
      .expect(201);
    
    templateId = templateResponse.body.id;

    // Create recipient user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@test.com',
        password: 'User123!',
        firstName: 'Test',
        lastName: 'User',
      });
    
    userId = userResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/badges', () => {
    it('should issue a badge successfully (Admin)', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId,
          recipientId: userId,
          expiresIn: 365,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.status).toBe('ISSUED');
          expect(res.body.claimToken).toBeDefined();
          expect(res.body.claimUrl).toBeDefined();
        });
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .send({
          templateId,
          recipientId: userId,
        })
        .expect(401);
    });

    it('should reject invalid template ID', () => {
      return request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: 'invalid-uuid',
          recipientId: userId,
        })
        .expect(400);
    });
  });

  describe('POST /api/badges/:id/claim', () => {
    let badgeId: string;
    let claimToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId,
          recipientId: userId,
        });
      
      badgeId = response.body.id;
      claimToken = response.body.claimToken;
    });

    it('should claim badge successfully', () => {
      return request(app.getHttpServer())
        .post(`/api/badges/${badgeId}/claim`)
        .send({ claimToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CLAIMED');
          expect(res.body.claimedAt).toBeDefined();
        });
    });

    it('should reject already claimed badge', async () => {
      // First claim
      await request(app.getHttpServer())
        .post(`/api/badges/${badgeId}/claim`)
        .send({ claimToken })
        .expect(200);

      // Second claim attempt
      return request(app.getHttpServer())
        .post(`/api/badges/${badgeId}/claim`)
        .send({ claimToken })
        .expect(400);
    });

    it('should reject invalid claim token', () => {
      return request(app.getHttpServer())
        .post(`/api/badges/${badgeId}/claim`)
        .send({ claimToken: 'invalid-token' })
        .expect(404);
    });
  });

  describe('GET /api/badges/my-badges', () => {
    it('should return user badges with pagination', async () => {
      // Issue badge
      const response = await request(app.getHttpServer())
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ templateId, recipientId: userId });

      // Claim badge
      await request(app.getHttpServer())
        .post(`/api/badges/${response.body.id}/claim`)
        .send({ claimToken: response.body.claimToken });

      // Login as user
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'User123!' });

      // Get my badges
      return request(app.getHttpServer())
        .get('/api/badges/my-badges?page=1&limit=10')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta.total).toBeGreaterThan(0);
        });
    });
  });
});
```

---

## UAT Testing

### UAT Scenarios

User Acceptance Testing validates that features meet business requirements.

**Location:** `docs/sprints/sprint-3/uat-testing-guide.md`

### Example UAT Scenario

**Scenario 1: Issue Single Badge**

1. **Preconditions:**
   - Admin user logged in
   - Badge template exists
   - Recipient user exists

2. **Steps:**
   - Navigate to badge issuance page
   - Select badge template
   - Select recipient
   - Add evidence URL
   - Set expiration (365 days)
   - Click "Issue Badge"

3. **Expected Results:**
   - ✅ Badge created successfully
   - ✅ Claim token generated
   - ✅ Claim URL provided
   - ✅ Email sent to recipient

4. **Acceptance Criteria:**
   - Process takes < 3 minutes
   - Error messages are clear
   - Email arrives within 5 minutes
   - Email content is professional

---

## Running Tests

### Run All Unit Tests

```bash
cd backend
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm test -- badge-issuance.service.spec
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Run E2E Test with Pattern

```bash
npm run test:e2e -- --testNamePattern="should issue badge"
```

### Run Tests with Coverage

```bash
npm run test:cov
```

Coverage report: `backend/coverage/lcov-report/index.html`

---

## Coverage Reports

### View Coverage

```bash
npm run test:cov
open coverage/lcov-report/index.html  # Mac/Linux
start coverage/lcov-report/index.html # Windows
```

### Coverage Thresholds

**jest.config.js:**
```javascript
module.exports = {
  // ... other config
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Current Coverage (Sprint 3)

```
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   82.45 |    75.32 |   84.21 |   82.89 |
 badge-issuance/          |   88.92 |    82.14 |   92.45 |   89.34 |
 badge-templates/         |   85.67 |    78.43 |   88.76 |   86.21 |
 modules/auth/            |   79.34 |    71.28 |   81.45 |   79.87 |
 skills/                  |   76.23 |    68.92 |   78.34 |   76.89 |
```

---

## Best Practices

### 1. Test Structure (Arrange-Act-Assert)

```typescript
it('should do something', async () => {
  // Arrange: Set up test data
  const dto = { templateId: '123', recipientId: '456' };
  jest.spyOn(service, 'findTemplate').mockResolvedValue(mockTemplate);

  // Act: Execute the code under test
  const result = await service.issueBadge(dto, 'issuer-id');

  // Assert: Verify the result
  expect(result.status).toBe('ISSUED');
  expect(service.findTemplate).toHaveBeenCalledWith('123');
});
```

### 2. Descriptive Test Names

**✅ Good:**
```typescript
it('should throw NotFoundException when template does not exist', () => {});
it('should send email notification after badge issuance', () => {});
it('should prevent claiming already claimed badge', () => {});
```

**❌ Bad:**
```typescript
it('test 1', () => {});
it('should work', () => {});
it('badge test', () => {});
```

### 3. Test One Thing

**✅ Good:**
```typescript
it('should create badge with correct status', () => {
  expect(badge.status).toBe('ISSUED');
});

it('should generate unique claim token', () => {
  expect(badge.claimToken).toBeDefined();
  expect(badge.claimToken.length).toBeGreaterThan(20);
});
```

**❌ Bad:**
```typescript
it('should create badge and send email and log event', () => {
  // Testing too many things at once
});
```

### 4. Use Test Data Builders

```typescript
// test/builders/badge.builder.ts
export class BadgeBuilder {
  private badge: Partial<Badge> = {
    id: 'test-id',
    status: 'ISSUED',
    issuedAt: new Date(),
  };

  withTemplate(templateId: string): this {
    this.badge.templateId = templateId;
    return this;
  }

  withRecipient(recipientId: string): this {
    this.badge.recipientId = recipientId;
    return this;
  }

  build(): Badge {
    return this.badge as Badge;
  }
}

// Usage in tests:
const badge = new BadgeBuilder()
  .withTemplate('template-123')
  .withRecipient('user-456')
  .build();
```

### 5. Clean Up After Tests

```typescript
afterEach(async () => {
  // Clear mocks
  jest.clearAllMocks();
  
  // Clean database (E2E tests)
  if (app) {
    await cleanDatabase(app);
  }
});

afterAll(async () => {
  // Close connections
  await app?.close();
});
```

### 6. Test Error Cases

```typescript
describe('error handling', () => {
  it('should handle database connection error', async () => {
    jest.spyOn(prisma.badge, 'create')
      .mockRejectedValue(new Error('Connection lost'));

    await expect(service.issueBadge(dto, 'issuer-id'))
      .rejects
      .toThrow('Failed to issue badge');
  });

  it('should handle invalid UUID format', () => {
    return request(app)
      .post('/api/badges')
      .send({ templateId: 'not-a-uuid' })
      .expect(400);
  });
});
```

---

## Summary Checklist

Before merging code:

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Coverage > 80% for new code
- [ ] Critical paths have E2E tests
- [ ] Tests follow naming conventions
- [ ] Tests are isolated (no dependencies)
- [ ] Mock external services
- [ ] Error cases tested
- [ ] Documentation updated

---

**Last Updated:** January 27, 2026  
**Next Review:** After Sprint 4  
**Questions?** See [Troubleshooting Guide](./troubleshooting.md) or ask in team chat!
