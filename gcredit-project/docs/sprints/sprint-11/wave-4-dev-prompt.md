# Sprint 11 — Wave 4 Dev Prompt

**Wave:** 4 of 5 — Code Quality  
**Sprint Branch:** `sprint-11/security-quality-hardening`  
**Baseline Commit:** `91c746f`  
**Estimated Time:** ~16-23h  
**Test Baseline:** Backend 586 + Frontend 541 = **1127 tests**

---

## 🎯 Wave 4 目标

完成 5 个代码质量 Story，提升日志标准化、测试覆盖率和分页一致性。

**验收标准：**
- [ ] 22 个 controller/service 全部使用 NestJS Logger（0 遗留 console.log）
- [ ] badge-templates.service 单元测试 >80% 覆盖率
- [ ] issuance-criteria-validator.service 单元测试 >80% 覆盖率
- [ ] blob-storage.service 单元测试 >80% 覆盖率
- [ ] 所有分页端点统一 `PaginatedResponse<T>` 格式，前后端原子化修改
- [ ] 全部测试通过（0 regressions from 1127 baseline）
- [ ] ESLint 0 errors + 0 warnings（BE + FE）

---

## Story 11.13: CQ-004 — NestJS Logger Integration (22 Services/Controllers)

**预估:** 2-3h | **优先级:** 🟡 MEDIUM  
**依赖:** Story 11.8 (PII sanitization — ✅ Done in Wave 2)

### 当前状态

**已有 Logger 的文件（无需修改）：**
- `analytics.service.ts` (L14)
- `csv-validation.service.ts` (L19)
- `storage.service.ts` (L13)
- `prisma.service.ts` (L14)
- `blob-storage.service.ts` (L31)
- `badge-issuance.service.ts` (L33)
- `bulk-issuance.service.ts` (L105)
- `email.service.ts` (L24)
- `badge-notification.service.ts` (L18)
- `bulk-issuance.controller.ts` (L54)
- `badge-verification.service.ts` (L8)
- `dashboard.controller.ts` (L40)
- `dashboard.service.ts` (L24)
- `m365-sync.controller.ts` (L57)
- `m365-sync.service.ts` (L28)
- `auth.service.ts` (L24)
- `graph-email.service.ts` (L17)
- `graph-teams.service.ts` (L17)
- `graph-token-provider.service.ts` (L17)
- `teams-badge-notification.service.ts` (L25)
- `admin-users.controller.ts` (L59)
- `admin-users.service.ts` (L79)
- `badge-templates.service.ts` (L19)
- `badge-sharing.controller.ts` (L29)
- `badge-sharing.service.ts` (L19)
- `email-template.service.ts` (L26)
- `widget-embed.controller.ts` (L39)
- `main.ts` (多处)
- `azure-blob.config.ts` (L4)

**console.log/error/warn 检查：** 生产代码中**零个** `console.log/error/warn` 调用（仅存在于 spec 文件和字符串字面量中）。无需替换，仅需添加 Logger。

### 需要添加 Logger 的 22 个文件

#### Controllers (13 files)

| # | 文件路径 | 类名 |
|---|---------|------|
| 1 | `src/app.controller.ts` | `AppController` |
| 2 | `src/analytics/analytics.controller.ts` | `AnalyticsController` |
| 3 | `src/badge-issuance/badge-issuance.controller.ts` | `BadgeIssuanceController` |
| 4 | `src/badge-sharing/controllers/badge-analytics.controller.ts` | `BadgeAnalyticsController` |
| 5 | `src/badge-sharing/controllers/teams-sharing.controller.ts` | `TeamsSharingController` |
| 6 | `src/badge-templates/badge-templates.controller.ts` | `BadgeTemplatesController` |
| 7 | `src/badge-verification/badge-verification.controller.ts` | `BadgeVerificationController` |
| 8 | `src/evidence/evidence.controller.ts` | `EvidenceController` |
| 9 | `src/microsoft-graph/teams/teams-action.controller.ts` | `TeamsActionController` |
| 10 | `src/milestones/milestones.controller.ts` | `MilestonesController` |
| 11 | `src/modules/auth/auth.controller.ts` | `AuthController` |
| 12 | `src/skill-categories/skill-categories.controller.ts` | `SkillCategoriesController` |
| 13 | `src/skills/skills.controller.ts` | `SkillsController` |

#### Services (9 files)

| # | 文件路径 | 类名 |
|---|---------|------|
| 14 | `src/app.service.ts` | `AppService` |
| 15 | `src/badge-issuance/services/assertion-generator.service.ts` | `AssertionGeneratorService` |
| 16 | `src/badge-issuance/services/csv-parser.service.ts` | `CsvParserService` |
| 17 | `src/badge-sharing/services/badge-analytics.service.ts` | `BadgeAnalyticsService` |
| 18 | `src/badge-templates/recommendations.service.ts` | `RecommendationsService` |
| 19 | `src/common/services/issuance-criteria-validator.service.ts` | `IssuanceCriteriaValidatorService` |
| 20 | `src/evidence/evidence.service.ts` | `EvidenceService` |
| 21 | `src/skill-categories/skill-categories.service.ts` | `SkillCategoriesService` |
| 22 | `src/skills/skills.service.ts` | `SkillsService` |

### 实现方案

对每个文件执行以下机械步骤：

**Step 1 — 在 import 区域添加 Logger（如果尚未导入）：**

```typescript
import { ..., Logger } from '@nestjs/common';
```

> **注意：** 大多数 controller 已从 `@nestjs/common` 导入装饰器，只需在 destructure 中追加 `Logger`。Service 如果没有 `@nestjs/common` import，需新增。

**Step 2 — 在 class body 第一行添加 logger 属性：**

```typescript
export class XxxController {
  private readonly logger = new Logger(XxxController.name);
  // ... existing code
}
```

**Step 3 — 在关键操作点添加日志调用（非必须，但推荐）：**

对于较复杂的 controller/service（如 `BadgeIssuanceController`, `EvidenceController`, `SkillsService`），可在以下位置添加日志：
- 方法入口：`this.logger.log('Creating badge template...')`
- 错误处理 catch 块：`this.logger.error('Failed to create badge', error.stack)`
- 重要业务决策点：`this.logger.warn('Skill not found, skipping...')`

> **简单文件（如 `AppController`, `AppService`）只需添加 Logger 属性即可，无需额外日志调用。**

### 测试要求

无需新增测试文件。现有测试不应受影响（Logger 添加不改变任何业务逻辑）。验证所有现有测试仍通过即可。

### 验收标准

- [ ] 22 个文件全部包含 `private readonly logger = new Logger(ClassName.name)`
- [ ] 运行 `grep -r "new Logger(" backend/src/ --include="*.ts" | grep -v ".spec." | wc -l` 应 ≥ 50（原有 ~30 + 新增 22）
- [ ] 0 个 `console.log/error/warn` 在非 spec/test 文件中
- [ ] 所有现有测试通过

---

## Story 11.10: CQ-001 — badge-templates.service.ts Unit Tests

**预估:** 4-6h | **优先级:** 🟡 HIGH

### 当前状态

**Service 文件:** `backend/src/badge-templates/badge-templates.service.ts` (436 行)

**公开方法 (8 个):**
1. `create(dto: CreateBadgeTemplateDto, imageFile?: Express.Multer.File)` — 创建模板，含可选图片上传
2. `findAll(query: QueryBadgeTemplateDto)` — 分页查询，支持 search/category/status 过滤
3. `findOne(id: string)` — 按 ID 查询，含 skill 填充
4. `findOneRaw(id: string)` — 原始 Prisma 返回（供内部用）
5. `update(id: string, dto: UpdateBadgeTemplateDto, imageFile?: Express.Multer.File)` — 更新模板，含图片替换
6. `remove(id: string)` — 删除模板，含图片清理
7. `getCriteriaTemplates()` — 获取所有发放标准模板
8. `getCriteriaTemplate(key: string)` — 获取单个模板

**私有方法 (1 个):**
- `validateSkillIds(skillIds: string[])` — 验证技能 ID 存在性

**构造函数依赖：**
```typescript
constructor(
  private prisma: PrismaService,
  private blobStorageService: BlobStorageService,
  private criteriaValidator: IssuanceCriteriaValidatorService,
)
```

**当前测试:** 无（`badge-templates.service.spec.ts` 不存在）

### findAll 分页实现（L143-176）

```typescript
async findAll(query: QueryBadgeTemplateDto) {
  const { page = 1, limit = 10, search, category, status } = query;
  const skip = (page - 1) * limit;
  const where: Prisma.BadgeTemplateWhereInput = {};
  // ... filter building ...
  const [data, total] = await Promise.all([
    this.prisma.badgeTemplate.findMany({ where, skip, take: limit, include: {...}, orderBy: {...} }),
    this.prisma.badgeTemplate.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}
```

### 实现方案

**新文件:** `backend/src/badge-templates/badge-templates.service.spec.ts`

#### Mock 设置

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadgeTemplatesService } from './badge-templates.service';
import { PrismaService } from '../common/prisma.service';
import { BlobStorageService } from '../common/services/blob-storage.service';
import { IssuanceCriteriaValidatorService } from '../common/services/issuance-criteria-validator.service';
import { NotFoundException } from '@nestjs/common';

describe('BadgeTemplatesService', () => {
  let service: BadgeTemplatesService;
  let prisma: jest.Mocked<PrismaService>;
  let blobStorage: jest.Mocked<BlobStorageService>;
  let criteriaValidator: jest.Mocked<IssuanceCriteriaValidatorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeTemplatesService,
        {
          provide: PrismaService,
          useValue: {
            badgeTemplate: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            skill: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: BlobStorageService,
          useValue: {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
            isAvailable: jest.fn(),
          },
        },
        {
          provide: IssuanceCriteriaValidatorService,
          useValue: {
            validate: jest.fn(),
            getTemplates: jest.fn(),
            getTemplate: jest.fn(),
            getTemplateKeys: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BadgeTemplatesService>(BadgeTemplatesService);
    prisma = module.get(PrismaService);
    blobStorage = module.get(BlobStorageService);
    criteriaValidator = module.get(IssuanceCriteriaValidatorService);
  });

  // ... tests ...
});
```

#### 必须覆盖的测试场景

**`create` 方法：**
- 创建无图片的模板 — 验证 prisma.create 被正确调用
- 创建带图片的模板 — 验证 blobStorage.uploadImage 被调用，imageUrl 被设置
- 创建带 skillIds 的模板 — 验证 validateSkillIds 被调用
- 创建带 issuanceCriteria 的模板 — 验证 criteriaValidator.validate 被调用
- skillIds 包含无效 ID — 抛出 BadRequestException
- criteriaValidator.validate 抛出错误 — 错误冒泡

**`findAll` 方法：**
- 默认分页参数（page=1, limit=10）
- 带 search 过滤的查询 — where 条件包含 OR + contains
- 带 category 过滤的查询
- 带 status 过滤的查询
- 分页 meta 正确计算（total, totalPages, hasNext, hasPrev）
- 空结果返回空数组 + total=0

**`findOne` 方法：**
- 正常返回，包含 skill 填充
- ID 不存在 — 抛出 NotFoundException

**`findOneRaw` 方法：**
- 正常返回原始 Prisma 对象
- ID 不存在 — 抛出 NotFoundException

**`update` 方法：**
- 更新基本字段（name, description 等）
- 更新带新图片 — 旧图片被删除 + 新图片上传
- 更新 skillIds — validateSkillIds 被调用
- 更新 issuanceCriteria — criteriaValidator.validate 被调用
- 模板不存在 — 抛出 NotFoundException

**`remove` 方法：**
- 删除无图片的模板
- 删除有图片的模板 — blobStorage.deleteImage 被调用
- 模板不存在 — 抛出 NotFoundException

**`getCriteriaTemplates` / `getCriteriaTemplate`：**
- 委托给 IssuanceCriteriaValidatorService
- getTemplate 返回 null 时行为正确

**`validateSkillIds` (通过 create/update 间接测试)：**
- 全部 skillIds 存在 — 通过
- 部分 skillIds 不存在 — 抛出 BadRequestException（带具体缺失 ID）

### 验收标准

- [ ] 新建 `badge-templates.service.spec.ts`
- [ ] 覆盖所有 8 个公开方法 + validateSkillIds
- [ ] 至少 25 个 test case
- [ ] 目标 >80% line coverage（`npx jest --coverage --collectCoverageFrom="src/badge-templates/badge-templates.service.ts"`)
- [ ] 所有测试通过

---

## Story 11.11: CQ-002 — issuance-criteria-validator.service.ts Unit Tests

**预估:** 3-4h | **优先级:** 🟡 HIGH

### 当前状态

**Service 文件:** `backend/src/common/services/issuance-criteria-validator.service.ts` (239 行)

**公开方法 (4 个):**
1. `validate(criteria: IssuanceCriteriaDto): void` — 主验证方法，抛出 BadRequestException
2. `getTemplates(): typeof ISSUANCE_CRITERIA_TEMPLATES` — 获取所有预定义模板
3. `getTemplate(key: string): IssuanceCriteriaDto | null` — 按 key 获取单个模板
4. `getTemplateKeys(): string[]` — 获取所有模板 key 列表

**私有方法 (4 个):**
- `validateCondition(condition: IssuanceConditionDto, index: number): void`
- `validateValueType(condition: IssuanceConditionDto, index: number): void`
- `validateTypeSpecificRules(criteria: IssuanceCriteriaDto): void`
- `validateFieldExists(conditions: IssuanceConditionDto[], field: string, type: string): void`

**依赖：** **零** — 纯逻辑服务，无 DI 依赖。测试最简单。

**DTO 类型参考：**

```typescript
// IssuanceCriteriaType enum (6 values)
MANUAL = 'manual'
AUTO_TASK = 'auto_task'
AUTO_LEARNING_TIME = 'auto_learning_time'
AUTO_EXAM_SCORE = 'auto_exam_score'
AUTO_SKILL_LEVEL = 'auto_skill_level'
COMBINED = 'combined'

// ConditionOperator enum (9 values)
EQUALS = '=='
NOT_EQUALS = '!='
GREATER_THAN = '>'
GREATER_THAN_OR_EQUAL = '>='
LESS_THAN = '<'
LESS_THAN_OR_EQUAL = '<='
IN = 'in'
NOT_IN = 'not_in'
CONTAINS = 'contains'
```

**当前测试:** 无

### 实现方案

**新文件:** `backend/src/common/services/issuance-criteria-validator.service.spec.ts`

#### Mock 设置 — 极简

```typescript
import { IssuanceCriteriaValidatorService } from './issuance-criteria-validator.service';
import { IssuanceCriteriaType, ConditionOperator, IssuanceCriteriaDto } from '../../badge-templates/dto/issuance-criteria.dto';

describe('IssuanceCriteriaValidatorService', () => {
  let service: IssuanceCriteriaValidatorService;

  beforeEach(() => {
    service = new IssuanceCriteriaValidatorService(); // 无依赖，直接实例化
  });

  // ... tests ...
});
```

#### 必须覆盖的验证规则 (14+)

**基本验证：**
1. null/undefined criteria — 应抛出 BadRequestException
2. 缺少 type 字段 — 应抛出
3. 无效 type 值 — 应抛出
4. MANUAL 类型无 conditions — 应通过（MANUAL 不需要条件）
5. MANUAL 类型带 conditions — 行为确认（通过或忽略）

**Condition 验证：**
6. condition 缺少 field — 应抛出
7. condition 缺少 operator — 应抛出
8. condition 缺少 value — 应抛出
9. 无效 operator — 应抛出

**值类型验证 (validateValueType)：**
10. `IN` / `NOT_IN` operator 要求 value 为数组 — 非数组应抛出
11. 数值比较 operator (`>`, `>=`, `<`, `<=`) — value 应为 number
12. `EQUALS` / `NOT_EQUALS` — 接受 string/number/boolean
13. `CONTAINS` — value 应为 string

**Type-specific 规则 (validateTypeSpecificRules)：**
14. `AUTO_TASK` 必须有 `taskId` 字段 — 缺少应抛出
15. `AUTO_EXAM_SCORE` 必须有 `examId` 字段 — 缺少应抛出
16. `AUTO_SKILL_LEVEL` 必须有 `skillId` 字段 — 缺少应抛出
17. `AUTO_LEARNING_TIME` — 确认所需字段
18. `COMBINED` 类型必须有 ≥2 conditions — 仅1个应抛出

**逻辑运算符验证：**
19. 多条件时必须有 logicOperator（`AND`/`OR`）— 缺少应抛出
20. 单条件时不需要 logicOperator

**模板相关方法：**
21. `getTemplates()` — 返回非空对象
22. `getTemplate('manual')` — 返回 MANUAL 模板
23. `getTemplate('nonexistent')` — 返回 null
24. `getTemplateKeys()` — 返回字符串数组，包含 'manual' 等

**Happy path — 完整有效 criteria：**
25. 有效的 AUTO_TASK criteria（含 taskId condition）— 不抛出
26. 有效的 AUTO_EXAM_SCORE criteria（含 examId + score condition）— 不抛出
27. 有效的 COMBINED criteria（含 ≥2 conditions + logicOperator）— 不抛出

### 验收标准

- [ ] 新建 `issuance-criteria-validator.service.spec.ts`
- [ ] 覆盖所有 4 个公开方法
- [ ] 通过公开方法间接测试所有 4 个私有方法
- [ ] 至少 20 个 test case
- [ ] 目标 >80% line coverage
- [ ] 所有测试通过

---

## Story 11.12: CQ-003 — blob-storage.service.ts Unit Tests

**预估:** 3-4h | **优先级:** 🟡 HIGH

### 当前状态

**Service 文件:** `backend/src/common/services/blob-storage.service.ts` (412 行)

**公开方法 (4 个 + OnModuleInit):**
1. `onModuleInit()` — 初始化 Azure Blob 连接，无连接串时 warn 并跳过
2. `isAvailable(): boolean` — 检查 containerClient 是否可用
3. `uploadImage(file: Express.Multer.File, prefix?: string): Promise<UploadImageResult>` — 上传图片（含验证、元数据提取、缩略图生成）
4. `deleteImage(url: string): Promise<void>` — 删除 blob
5. `imageExists(url: string): Promise<boolean>` — 检查 blob 是否存在

**私有方法 (6 个):**
- `ensureClient(): ContainerClient` — 确保客户端可用，否则抛出
- `validateImage(file: Express.Multer.File): void` — 验证类型/大小/magic bytes
- `getImageMetadata(buffer: Buffer): Promise<ImageMetadata>` — 使用 sharp 提取元数据
- `validateDimensions(metadata: ImageMetadata): void` — 验证尺寸范围
- `generateThumbnail(buffer: Buffer, blobName: string): Promise<string | undefined>` — 生成缩略图
- `extractBlobName(url: string): string` — 从 URL 提取 blob 名
- `getFileExtension(filename: string): string` — 提取文件扩展名

**构造函数依赖：**
```typescript
constructor(private configService: ConfigService) {}
```

**Azure SDK 使用：**
- `BlobServiceClient.fromConnectionString()` — 在 onModuleInit 中
- `ContainerClient` — 存储为 `this.containerClient`
- `BlockBlobClient` — 通过 `containerClient.getBlockBlobClient()` 获取

**常量：**
```typescript
RECOMMENDED_SIZES = [256, 512, 1024]
OPTIMAL_SIZES = [256, 512]
MIN_DIMENSION = 128
MAX_DIMENSION = 2048
```

**接受的文件类型:** `image/png`, `image/jpeg`  
**最大文件大小:** 2MB  
**Magic bytes 验证:** 通过 `validateMagicBytes()` utility（来自 `../utils/magic-byte-validator`）

**当前测试:** 无

### 实现方案

**新文件:** `backend/src/common/services/blob-storage.service.spec.ts`

#### Mock 设置

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlobStorageService } from './blob-storage.service';
import { BadRequestException } from '@nestjs/common';

// Mock Azure SDK
const mockBlockBlobClient = {
  upload: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  exists: jest.fn().mockResolvedValue(true),
  url: 'https://mockaccount.blob.core.windows.net/badges/test.png',
};

const mockContainerClient = {
  getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
  createIfNotExists: jest.fn().mockResolvedValue({}),
};

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn().mockReturnValue({
      getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
    }),
  },
  ContainerClient: jest.fn(),
}));

// Mock sharp
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockReturnValue({
    metadata: jest.fn().mockResolvedValue({ width: 512, height: 512, format: 'png' }),
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
  });
  return mockSharp;
});

// Mock magic-byte-validator
jest.mock('../utils/magic-byte-validator', () => ({
  validateMagicBytes: jest.fn(), // no-op by default (pass)
}));
```

#### 必须覆盖的测试场景

**`onModuleInit`：**
- 有连接串 → 初始化成功，isAvailable() 返回 true
- 无连接串 → warn日志，isAvailable() 返回 false
- 连接串无效 → 捕获异常，isAvailable() 返回 false

**`isAvailable`：**
- containerClient 存在 → true
- containerClient 为 null → false

**`uploadImage`：**
- 正常上传 PNG — 返回 { url, thumbnailUrl, metadata }
- 正常上传 JPEG — 同上
- 无效文件类型（非 png/jpeg）→ BadRequestException
- 文件过大（>2MB）→ BadRequestException
- Magic bytes 验证失败 → BadRequestException
- 尺寸过小（<128px）→ BadRequestException
- 尺寸过大（>2048px）→ BadRequestException
- Blob storage 不可用 → 返回 mock data（fallback 行为）
- 带自定义 prefix 参数
- 图片元数据正确计算（width, height, format, size, aspectRatio, isOptimal）
- isOptimal 为 true 当尺寸在 OPTIMAL_SIZES 中
- suggestions 包含优化建议当尺寸不在 RECOMMENDED_SIZES 中

**`deleteImage`：**
- 正常删除
- Blob storage 不可用 → 静默返回（不抛出）
- 删除失败 → 错误处理

**`imageExists`：**
- Blob 存在 → true
- Blob 不存在 → false
- Blob storage 不可用 → false

**私有方法通过公开方法间接测试：**
- `ensureClient` — 通过 uploadImage 在不可用时测试
- `validateImage` — 通过 uploadImage 传入各种无效文件
- `getImageMetadata` — 通过 uploadImage 验证返回的 metadata
- `validateDimensions` — 通过 uploadImage 传入超尺寸图片
- `generateThumbnail` — 通过 uploadImage 验证 thumbnailUrl 存在
- `extractBlobName` — 通过 deleteImage 传入各种 URL
- `getFileExtension` — 通过 uploadImage 传入不同文件名

### 验收标准

- [ ] 新建 `blob-storage.service.spec.ts`
- [ ] 覆盖所有 5 个公开方法
- [ ] Mock Azure SDK 和 sharp，不依赖外部服务
- [ ] 至少 20 个 test case
- [ ] 目标 >80% line coverage
- [ ] 所有测试通过

---

## Story 11.16: CQ-007 — Paginated Response Format Standardization

**预估:** 4-6h | **优先级:** 🟡 HIGH  
**⚠️ 架构条件 C-4:** 前后端必须同一 PR 原子化修改，不可拆分部署

### 当前状态 — 5 种不同的分页格式

| 端点 | 数据 key | Meta 结构 | 参数 |
|------|---------|---------|----|
| badge-templates `findAll` | `data` | `meta: { page, limit, total, totalPages, hasNext, hasPrev }` | page, limit |
| badge-issuance `getMyBadges` | `data` | `pagination: { page, limit, totalCount, totalPages, hasMore }` | page, limit |
| badge-issuance admin `findAllAdmin` | flat: `badges` | `total, page, limit, totalPages` (扁平) | page, limit |
| admin-users `findAll` | `users` | `pagination: { total, page, limit, totalPages, nextCursor, hasMore }` | page, limit |
| wallet `getWalletBadges` | `badges` | `pagination: { page, limit, total, totalPages }` + `dateGroups` | page, limit |
| bulk-issuance preview | `rows` | `page, pageSize, totalPages` (扁平) | page, pageSize |

### 目标统一格式（Arch Review §4.2）

```typescript
// backend/src/common/interfaces/paginated-response.interface.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;       // 当前页（1-based）
    limit: number;      // 每页条数
    total: number;      // 总记录数
    totalPages: number; // 总页数
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

```typescript
// backend/src/common/utils/pagination.util.ts
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
```

### 实现方案

#### Phase 1: 创建共享基础设施

**新文件 1:** `backend/src/common/interfaces/paginated-response.interface.ts`
 — PaginatedResponse<T> 接口定义

**新文件 2:** `backend/src/common/utils/pagination.util.ts`
 — createPaginatedResponse<T>() 工具函数

**新文件 3:** `backend/src/common/utils/pagination.util.spec.ts`
 — 工具函数测试：
 - 正常分页计算
 - page=1 时 hasPreviousPage=false
 - 最后一页时 hasNextPage=false
 - total=0 时返回空数组
 - totalPages 向上取整

#### Phase 2: 逐个迁移后端 Controller

**迁移顺序（从最接近目标格式到差异最大）：**

##### 2a. badge-templates.service.ts — 最接近目标

**文件:** `backend/src/badge-templates/badge-templates.service.ts` L164-176

当前:
```typescript
return {
  data,
  meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
};
```

改为:
```typescript
import { createPaginatedResponse } from '../common/utils/pagination.util';
// ...
return createPaginatedResponse(data, total, page, limit);
```

**变更:** `hasNext` → `hasNextPage`, `hasPrev` → `hasPreviousPage`

##### 2b. badge-issuance.service.ts — getMyBadges (L617-643)

当前:
```typescript
return {
  data: badges.map(...),
  pagination: { page, limit, totalCount, totalPages, hasMore },
};
```

改为:
```typescript
return createPaginatedResponse(badges.map(...), totalCount, query.page, query.limit);
```

**变更:** `pagination` → `meta`, `totalCount` → `total`, `hasMore` → `hasNextPage` + `hasPreviousPage`

##### 2c. badge-issuance.service.ts — findAllAdmin (L794-836)

当前:
```typescript
return {
  badges: badges.map(...),
  total: totalCount,
  page: query.page,
  limit: query.limit,
  totalPages,
};
```

改为:
```typescript
return createPaginatedResponse(badges.map(...), totalCount, query.page, query.limit);
```

**变更:** `badges` → `data`, flat meta → `meta` object

##### 2d. admin-users.service.ts (L200-210)

当前:
```typescript
return {
  users,
  pagination: { total, page, limit, totalPages, nextCursor, hasMore },
};
```

改为:
```typescript
return {
  ...createPaginatedResponse(users, total, page!, limit!),
  // Preserve nextCursor for progressive enhancement (optional)
};
```

**变更:** `users` → `data`, `pagination` → `meta`, drop `nextCursor`/`hasMore`, add `hasNextPage`/`hasPreviousPage`

> **注意：** `nextCursor` 在当前前端代码中**未被使用**（只用 page-based），可以安全移除。

##### 2e. wallet — getWalletBadges (L1178-1186)

当前:
```typescript
return {
  badges: timelineItems,
  pagination: { page, limit, total: totalItems, totalPages },
  dateGroups,
};
```

改为:
```typescript
return {
  ...createPaginatedResponse(timelineItems, totalItems, page, limit),
  dateGroups, // 保留 wallet 特有的 dateGroups
};
```

**变更:** `badges` → `data`, `pagination` → `meta`, 新增 `hasNextPage`/`hasPreviousPage`。`dateGroups` 作为额外字段保留。

##### 2f. bulk-issuance — EnrichedPreviewData（可选）

`bulk-issuance.service.ts` L82-91 的 `EnrichedPreviewData` 使用 `page/pageSize/totalPages` 扁平格式。此端点仅在批量发放预览中使用，与典型列表 API 不同。

**建议:** Sprint 11 中**不迁移** bulk-issuance 预览数据格式（它是 session-based 的一次性数据，与标准分页列表语义不同）。可在 Sprint 12 中统一。

#### Phase 3: 更新前端消费者

**⚠️ 每迁移一个后端 controller 后，立即更新对应的前端消费者。**

##### 3a. 前端共享类型

**新文件:** `frontend/src/types/pagination.ts`

```typescript
export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
```

##### 3b. Badge Template 前端（变更最小）

**文件:** `frontend/src/pages/admin/BadgeManagementPage.tsx` (L201)

当前读 `data?.total` (直接从扁平的 admin response)，需要改为读新格式。

检查 BadgeManagementPage 调用的是 admin `findAllAdmin` 还是 `findAll`：
- 如果调用 `findAll` → `response.meta.total` (从 `hasNext`→`hasNextPage`)
- 如果调用 admin endpoint → `response.meta.total` (从 `badges` key → `data` key)

**文件:** `frontend/src/pages/admin/BadgeManagementPage.test.tsx`  
— 更新所有 mock response 的分页格式

##### 3c. Admin User Management 前端

**文件:** `frontend/src/pages/AdminUserManagementPage.tsx`

当前:
```tsx
data.pagination.total          // L182
data.pagination.totalPages     // L282
data.pagination.hasMore        // L302
```

改为:
```tsx
data.meta.total
data.meta.totalPages
data.meta.hasNextPage     // 替代 hasMore
```

还需要: `data.users` → `data.data`（或解构 `const { data: users, meta } = response`）

**文件:** `frontend/src/lib/adminUsersApi.ts` — 如果有类型定义需要更新

**文件:** `frontend/src/hooks/useAdminUsers.test.tsx` — 更新 mock response

##### 3d. Wallet/Timeline 前端

**文件:** `frontend/src/components/TimelineView/` 相关文件

当前可能读:
```tsx
response.badges        → response.data
response.pagination.*  → response.meta.*
response.dateGroups    → response.dateGroups (保留)
```

##### 3e. Badge Issuance（员工 My Badges）前端

检查前端消费 `getMyBadges` 的代码，更新:
```tsx
response.data             → response.data        (不变)
response.pagination.*     → response.meta.*
```

#### Phase 4: 更新现有 E2E/后端测试

**后端测试 (*.spec.ts):**
- `admin-users.service.spec.ts` — 更新 `result.pagination.*` → `result.meta.*`（L98, L180-181）
- `badge-issuance-wallet.service.spec.ts` — 更新 `result.pagination.*` → `result.meta.*`
- `badge-issuance.controller.spec.ts` — 更新 mock response 格式
- `badge-issuance.service.spec.ts` — 更新 L1276-1329 wallet test assertions
- 任何 E2E 测试涉及分页响应

**前端测试：**
- `BadgeManagementPage.test.tsx` — 更新 mock response（L128, L273, L290, L310, L376, L395, L438）
- `useAdminUsers.test.tsx` — 更新 mock response（L58-59）
- `useBadgeSearch.test.ts` — 更新 totalCount 引用（L260）
- 其他涉及分页响应的前端测试

### 测试要求

**新增测试：**
- `pagination.util.spec.ts` — createPaginatedResponse 工具函数测试

**更新现有测试：**
- 所有使用旧分页格式的测试断言需更新为新格式
- 确保所有 E2E 测试适配新响应 shape

### 验收标准

- [ ] `PaginatedResponse<T>` 接口和 `createPaginatedResponse()` 创建
- [ ] 5 个端点迁移完成（badge-templates, getMyBadges, findAllAdmin, admin-users, wallet）
- [ ] bulk-issuance 标记为 Sprint 12 待迁移（已知例外）
- [ ] 前后端同一 commit 原子化修改（C-4）
- [ ] 所有前端消费者更新
- [ ] 所有现有测试更新并通过
- [ ] 新增 pagination.util 测试

---

## 📋 执行顺序

1. **11.13** NestJS Logger integration（2-3h，机械操作，作为热身）
2. **11.10** badge-templates.service 单元测试（4-6h）
3. **11.11** issuance-criteria-validator 单元测试（3-4h，纯逻辑，无 mock）
4. **11.12** blob-storage.service 单元测试（3-4h）
5. **11.16** Pagination standardization（4-6h，最大项，涉及前后端 + 测试更新）

> **建议：** 11.10/11.11/11.12 的测试文件按需参考现有 spec 文件模式（如 `admin-users.service.spec.ts`、`badge-issuance.service.spec.ts`）以保持测试风格一致。

---

## ⚠️ 审核条件检查清单

在提交前请确认以下条件已满足：

| # | 条件 | 来源 | 相关 Story | 状态 |
|---|------|------|-----------|------|
| C-4 | 前后端同一 PR 原子化修改分页格式 | Architect | 11.16 | |
| CQ | 22 个文件全部有 Logger | Quality | 11.13 | |
| CQ | badge-templates.service 测试 >80% coverage | Quality | 11.10 | |
| CQ | issuance-criteria-validator 测试 >80% coverage | Quality | 11.11 | |
| CQ | blob-storage.service 测试 >80% coverage | Quality | 11.12 | |
| CQ | 所有分页端点返回统一 PaginatedResponse<T> | Quality | 11.16 | |
| CQ | 前端消费者全部适配新分页格式 | Quality | 11.16 | |

---

## 🔧 Pre-Push Checklist（提交前必须全部通过）

> **Lesson 40:** 本地 pre-push 检查必须完整镜像 CI pipeline，避免推送后 CI 红。

在每次 `git push` 之前，请在本地依次执行以下命令，**全部通过后**再推送：

### Backend
```bash
cd gcredit-project/backend

# 1. ESLint（必须 0 errors + 0 warnings）
npx eslint . --max-warnings=0

# 2. TypeScript 编译检查（必须 0 errors）
npx tsc --noEmit

# 3. 单元测试（必须全部通过）
npm test

# 4. E2E 测试（必须全部通过）
npm run test:e2e
```

### Frontend
```bash
cd gcredit-project/frontend

# 1. ESLint（必须 0 errors + 0 warnings）
npx eslint . --max-warnings=0

# 2. TypeScript 编译检查（必须 0 errors）
npx tsc --noEmit

# 3. 单元测试（必须全部通过）
npm test -- --run
```

### 常见 CI 失败原因（Wave 2 教训）
| 原因 | 解决 |
|------|------|
| `--max-warnings=0` 不在本地检查中 | 使用上述完整命令 |
| TS1272: `import` 应为 `import type` | 检查 `tsconfig.json` 的 `verbatimModuleSyntax` |
| E2E response format change | 同步更新 E2E 测试断言（**Story 11.16 高风险**） |
| 新 endpoint 缺少 E2E 覆盖 | 为新 API 添加基本 E2E 测试 |
| Logger import 未加 `type` 前缀 | Logger 是运行时值，不需要 `import type` |

> **规则：** 如果本地检查有任何失败，先修复再推送。不要假设 CI 会通过。

### ⚠️ Story 11.16 特别提示

Pagination standardization 涉及大量测试断言更新。推荐工作流：
1. 先迁移一个 controller + 对应前端 + 对应测试
2. 运行全量测试确认无回归
3. 再迁移下一个
4. 最后运行 Pre-Push Checklist 全量检查
