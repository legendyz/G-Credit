# Sprint 2 Backlog - Epic 3: Badge Template Management

**Sprint周期：** 2026-01-27 至 2026-02-07（10个工作日）  
**Sprint目标：** 建立完整的数字徽章模板管理系统，支持灵活的技能分类体系和Azure Blob图片存储  
**总工作量：** 32-33小时  
**状态：** ✅ Approved - Ready to Start

---

## Sprint 2 Scope Summary

### 核心Stories（Epic 3）
- **Story 3.1** - 徽章模板与技能分类数据模型（5-6h）
- **Story 3.2** - 创建徽章模板API + Azure Blob集成（6-7h）
- **Story 3.3** - 查询徽章模板API（3-4h）
- **Story 3.4** - 徽章目录与搜索优化（4-5h）
- **Story 3.5** - 颁发标准定义（3-4h）
- **Story 3.6** - 自定义技能分类管理（4-5h）

### Enhancements
- **Enhancement 1** - Azure Blob图片完整管理（2-3h）

### 排除项（延期到Sprint 3+）
- ❌ 徽章审批工作流
- ❌ 完整的分类管理UI
- ❌ 分类模板市场/导入导出

---

## 技能分类模板（5个）

| # | 分类名称 | 英文名称 | 典型子分类 |
|---|---------|---------|-----------|
| 1 | 技术技能 | Technical Skills | 编程语言、开发工具、云平台、数据库 |
| 2 | 软技能 | Soft Skills | 沟通能力、领导力、团队协作、问题解决 |
| 3 | 行业知识 | Domain Knowledge | 金融、医疗、教育、制造 |
| 4 | **公司特定能力** | Company-Specific Competencies | 企业文化、内部流程、专有工具、合规要求 |
| 5 | 通用职业技能 | Professional Skills | 项目管理、数据分析、商务演讲、时间管理 |

---

## Story 3.1: 徽章模板与技能分类数据模型

**优先级：** P0 (最高)  
**估算时间：** 5-6小时  
**依赖：** Sprint 1完成  
**风险等级：** Medium（技能分类设计复杂）

### 用户故事
> 作为**系统架构师**，我需要**设计徽章模板和技能分类的数据模型**，以便**支持灵活的徽章管理和自定义分类能力**。

### 验收标准
- [ ] Prisma schema定义完整（BadgeTemplate, Skill, SkillCategory）
- [ ] 支持5个预设分类模板 + 自定义能力
- [ ] 技能分类支持多层嵌套（至少3层）
- [ ] 数据库迁移成功执行
- [ ] 创建初始种子数据（5个分类模板）

### 技术任务

**Task 3.1.1: 设计BadgeTemplate模型**（1.5小时）
```prisma
model BadgeTemplate {
  id              String   @id @default(uuid())
  name            String   @db.VarChar(100)
  description     String?  @db.Text
  imageUrl        String?  // Azure Blob URL
  category        String   @db.VarChar(50)
  skillIds        String[] // 关联的技能ID数组
  issuanceCriteria Json    // 颁发标准（灵活的JSON结构）
  validityPeriod  Int?     // 有效期（天数，null表示永久）
  status          BadgeStatus @default(DRAFT)
  createdBy       String
  creator         User     @relation(fields: [createdBy], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([category])
  @@index([status])
  @@index([createdAt])
}

enum BadgeStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

**Task 3.1.2: 设计SkillCategory模型**（2小时）
```prisma
model SkillCategory {
  id              String   @id @default(uuid())
  name            String   @db.VarChar(100)
  nameEn          String?  @db.VarChar(100) // 英文名称
  description     String?  @db.Text
  parentId        String?
  parent          SkillCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children        SkillCategory[] @relation("CategoryHierarchy")
  level           Int      @default(1) // 1=顶层, 2=二级, 3=三级
  isSystemDefined Boolean  @default(false) // true=预设, false=自定义
  isEditable      Boolean  @default(true)
  displayOrder    Int      @default(0)
  skills          Skill[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([parentId])
  @@index([isSystemDefined])
  @@index([level])
}
```

**Task 3.1.3: 设计Skill模型**（1小时）
```prisma
model Skill {
  id          String        @id @default(uuid())
  name        String        @db.VarChar(100)
  description String?       @db.Text
  categoryId  String
  category    SkillCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  level       SkillLevel?   // 技能等级（可选）
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  @@index([categoryId])
  @@unique([name, categoryId]) // 同一分类下技能名称唯一
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}
```

**Task 3.1.4: 创建数据库迁移**（0.5小时）
```bash
npx prisma migrate dev --name add_badge_and_skill_models
```

**Task 3.1.5: 创建种子数据**（1小时）
```typescript
// prisma/seed-skills.ts
const skillCategories = [
  {
    name: '技术技能',
    nameEn: 'Technical Skills',
    level: 1,
    isSystemDefined: true,
    children: [
      { name: '编程语言', level: 2 },
      { name: '开发工具', level: 2 },
      { name: '云平台', level: 2 },
      { name: '数据库', level: 2 }
    ]
  },
  {
    name: '软技能',
    nameEn: 'Soft Skills',
    level: 1,
    isSystemDefined: true,
    children: [
      { name: '沟通能力', level: 2 },
      { name: '领导力', level: 2 },
      { name: '团队协作', level: 2 },
      { name: '问题解决', level: 2 }
    ]
  },
  {
    name: '行业知识',
    nameEn: 'Domain Knowledge',
    level: 1,
    isSystemDefined: true,
    children: [
      { name: '金融', level: 2 },
      { name: '医疗', level: 2 },
      { name: '教育', level: 2 },
      { name: '制造', level: 2 }
    ]
  },
  {
    name: '公司特定能力',
    nameEn: 'Company-Specific Competencies',
    level: 1,
    isSystemDefined: true,
    children: [
      { name: '企业文化', level: 2 },
      { name: '内部流程', level: 2 },
      { name: '专有工具', level: 2 },
      { name: '合规要求', level: 2 }
    ]
  },
  {
    name: '通用职业技能',
    nameEn: 'Professional Skills',
    level: 1,
    isSystemDefined: true,
    children: [
      { name: '项目管理', level: 2 },
      { name: '数据分析', level: 2 },
      { name: '商务演讲', level: 2 },
      { name: '时间管理', level: 2 }
    ]
  }
];
```

**测试要求：**
- [ ] 数据模型关系完整性测试
- [ ] 种子数据成功加载
- [ ] 级联删除测试（删除分类时子分类和技能的处理）

---

## Story 3.2: 创建徽章模板API + Azure Blob集成

**优先级：** P0  
**估算时间：** 6-7小时  
**依赖：** Story 3.1  
**风险等级：** Medium（Azure集成需测试）

### 用户故事
> 作为**管理员**，我需要**创建徽章模板并上传图片**，以便**定义可颁发的数字徽章类型**。

### 验收标准
- [ ] POST /api/admin/badge-templates 接口完成
- [ ] 支持上传图片到Azure Blob Storage
- [ ] 图片验证（格式: PNG/JPG, 大小: ≤2MB, 尺寸: 建议512x512）
- [ ] 字段验证完整（DTO + Validation Pipe）
- [ ] 返回完整的徽章模板信息（含图片URL）

### 技术任务

**Task 3.2.1: 配置Azure Blob Storage**（1.5小时）
```typescript
// backend/src/config/azure-blob.config.ts
import { BlobServiceClient } from '@azure/storage-blob';

export const azureBlobConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: 'badge-images',
};

export const getBlobServiceClient = () => {
  return BlobServiceClient.fromConnectionString(
    azureBlobConfig.connectionString
  );
};
```

**环境变量：**
```env
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_ACCOUNT_NAME=gcreditdev
```

**Task 3.2.2: 创建图片上传Service**（2小时）
```typescript
// backend/src/common/services/blob-storage.service.ts
@Injectable()
export class BlobStorageService {
  private containerClient: ContainerClient;

  async uploadImage(
    file: Express.Multer.File,
    folder: string
  ): Promise<string> {
    // 验证图片
    this.validateImage(file);
    
    // 生成唯一文件名
    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
    
    // 上传到Azure Blob
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });
    
    return blockBlobClient.url;
  }

  async deleteImage(url: string): Promise<void> {
    const blobName = this.extractBlobName(url);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }

  private validateImage(file: Express.Multer.File): void {
    const allowedTypes = ['image/png', 'image/jpeg'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PNG and JPG images are allowed');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('Image size must not exceed 2MB');
    }
  }
}
```

**Task 3.2.3: 创建DTO和验证**（1小时）
```typescript
// backend/src/badge-templates/dto/create-badge-template.dto.ts
export class CreateBadgeTemplateDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsIn(['achievement', 'skill', 'certification', 'participation'])
  category: string;

  @IsArray()
  @IsUUID('4', { each: true })
  skillIds: string[];

  @IsObject()
  issuanceCriteria: Record<string, any>;

  @IsInt()
  @Min(1)
  @IsOptional()
  validityPeriod?: number;
}
```

**Task 3.2.4: 实现Controller和Service**（1.5小时）
```typescript
// backend/src/badge-templates/badge-templates.controller.ts
@Controller('admin/badge-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BadgeTemplatesController {
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() dto: CreateBadgeTemplateDto,
    @UploadedFile() image: Express.Multer.File,
    @CurrentUser() user: User
  ) {
    return this.badgeTemplatesService.create(dto, image, user.id);
  }
}

// backend/src/badge-templates/badge-templates.service.ts
@Injectable()
export class BadgeTemplatesService {
  async create(
    dto: CreateBadgeTemplateDto,
    image: Express.Multer.File,
    userId: string
  ): Promise<BadgeTemplate> {
    // 上传图片
    let imageUrl: string | null = null;
    if (image) {
      imageUrl = await this.blobStorageService.uploadImage(image, 'badges');
    }

    // 验证技能ID存在
    await this.validateSkillIds(dto.skillIds);

    // 创建模板
    return this.prisma.badgeTemplate.create({
      data: {
        ...dto,
        imageUrl,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        }
      }
    });
  }

  private async validateSkillIds(skillIds: string[]): Promise<void> {
    const skills = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } }
    });

    if (skills.length !== skillIds.length) {
      throw new BadRequestException('One or more skill IDs are invalid');
    }
  }
}
```

**测试要求：**
- [ ] 图片上传成功测试
- [ ] 图片格式验证测试
- [ ] 图片大小验证测试
- [ ] 无图片创建模板测试
- [ ] 技能ID验证测试
- [ ] 权限控制测试（仅管理员可创建）

---

## Story 3.3: 查询徽章模板API

**优先级：** P0  
**估算时间：** 3-4小时  
**依赖：** Story 3.2  
**风险等级：** Low

### 用户故事
> 作为**普通用户/管理员**，我需要**查看徽章模板列表和详情**，以便**了解可以获得哪些徽章**。

### 验收标准
- [ ] GET /api/badge-templates（公开，仅返回ACTIVE状态）
- [ ] GET /api/admin/badge-templates/:id（管理员，所有状态）
- [ ] 支持分页、排序、筛选
- [ ] 返回关联的技能信息
- [ ] 响应时间 < 200ms

### 技术任务

**Task 3.3.1: 创建查询DTO**（0.5小时）
```typescript
export class QueryBadgeTemplatesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID('4')
  skillId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
```

**Task 3.3.2: 实现公开查询接口**（1.5小时）
```typescript
@Controller('badge-templates')
export class PublicBadgeTemplatesController {
  @Get()
  async findAll(@Query() query: QueryBadgeTemplatesDto) {
    return this.badgeTemplatesService.findAll(query, true); // onlyActive=true
  }
}

// Service实现
async findAll(query: QueryBadgeTemplatesDto, onlyActive = false) {
  const { page, limit, category, skillId, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BadgeTemplateWhereInput = {
    ...(onlyActive && { status: BadgeStatus.ACTIVE }),
    ...(category && { category }),
    ...(skillId && { skillIds: { has: skillId } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [data, total] = await Promise.all([
    this.prisma.badgeTemplate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, username: true }
        }
      }
    }),
    this.prisma.badgeTemplate.count({ where })
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

**Task 3.3.3: 实现管理员详情查询**（1小时）
```typescript
@Controller('admin/badge-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BadgeTemplatesController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.badgeTemplatesService.findOne(id);
    
    if (!template) {
      throw new NotFoundException('Badge template not found');
    }
    
    return template;
  }
}

// Service实现（含技能信息）
async findOne(id: string) {
  const template = await this.prisma.badgeTemplate.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, username: true, email: true }
      }
    }
  });

  if (!template) return null;

  // 获取关联的技能信息
  const skills = await this.prisma.skill.findMany({
    where: { id: { in: template.skillIds } },
    include: {
      category: {
        select: { id: true, name: true, nameEn: true }
      }
    }
  });

  return {
    ...template,
    skills
  };
}
```

**测试要求：**
- [ ] 公开接口仅返回ACTIVE状态
- [ ] 分页功能正确
- [ ] 分类筛选正确
- [ ] 技能ID筛选正确
- [ ] 搜索功能正确（名称+描述）
- [ ] 管理员可查看所有状态
- [ ] 不存在的ID返回404

---

## Story 3.4: 徽章目录与搜索优化

**优先级：** P1  
**估算时间：** 4-5小时  
**依赖：** Story 3.3  
**风险等级：** Low

### 用户故事
> 作为**普通用户**，我需要**便捷地浏览和搜索徽章模板**，以便**快速找到感兴趣的徽章**。

### 验收标准
- [ ] 支持多条件组合筛选
- [ ] 支持按技能分类树状浏览
- [ ] 搜索性能优化（数据库索引）
- [ ] 返回筛选统计信息（如：每个分类下的徽章数量）
- [ ] 响应时间 < 150ms

### 技术任务

**Task 3.4.1: 优化数据库索引**（1小时）
```prisma
model BadgeTemplate {
  // ... existing fields
  
  @@index([category, status])
  @@index([createdAt])
}
```

**Task 3.4.2: 实现分类树状浏览**（2小时）

**Task 3.4.3: 实现高级搜索**（1-1.5小时）

**Task 3.4.4: 性能测试与优化**（0.5小时）

**测试要求：**
- [ ] 分类树正确返回3层结构
- [ ] 徽章数量统计准确
- [ ] 多条件筛选正确
- [ ] 排序功能正确
- [ ] 性能测试通过（<150ms）

---

## Story 3.5: 颁发标准定义

**优先级：** P1  
**估算时间：** 3-4小时  
**依赖：** Story 3.2  
**风险等级：** Medium（JSON Schema验证复杂）

### 用户故事
> 作为**管理员**，我需要**定义徽章的颁发标准**，以便**系统自动判断用户是否符合获得徽章的条件**。

### 验收标准
- [ ] 支持多种颁发标准类型（完成任务、学习时长、考试分数等）
- [ ] JSON Schema验证标准格式
- [ ] 提供标准模板（常见场景）
- [ ] 更新/删除颁发标准

### 技术任务

**Task 3.5.1: 定义颁发标准Schema**（1.5小时）

**Task 3.5.2: 创建验证Service**（1小时）

**Task 3.5.3: 更新BadgeTemplate Service**（0.5小时）

**Task 3.5.4: 创建标准模板API**（1小时）

**测试要求：**
- [ ] Schema验证测试（各种颁发标准类型）
- [ ] 无效格式返回清晰错误信息
- [ ] 模板API正确返回
- [ ] 验证接口正确工作

---

## Story 3.6: 自定义技能分类管理

**优先级：** P1  
**估算时间：** 4-5小时  
**依赖：** Story 3.1  
**风险等级：** Medium

### 用户故事
> 作为**管理员**，我需要**在预设分类下添加自定义子分类**，以便**适应公司特定的技能体系**。

### 验收标准
- [ ] 可在任何预设分类下添加自定义子分类
- [ ] 支持最多3层嵌套
- [ ] 不可编辑系统预设的顶层5个分类
- [ ] 可编辑/删除自定义分类
- [ ] 删除分类时级联处理关联技能

### 技术任务

**Task 3.6.1: 创建分类管理DTO**（0.5小时）

**Task 3.6.2: 实现创建/更新/删除API**（2.5小时）

**Task 3.6.3: 创建技能管理API**（1.5小时）

**测试要求：**
- [ ] 创建自定义子分类成功
- [ ] 不可创建顶层自定义分类
- [ ] 不可超过3层嵌套
- [ ] 不可编辑系统预设顶层分类
- [ ] 删除有子分类的分类失败
- [ ] 删除有技能的分类失败
- [ ] 技能名称在同一分类下唯一

---

## Enhancement: Azure Blob图片完整管理

**估算时间：** 2-3小时

### 任务

**Task E1.1: 实现图片删除功能**（1小时）

**Task E1.2: 图片尺寸验证与优化建议**（1小时）

**Task E1.3: 图片预览与CDN配置**（0.5-1小时）

---

## 测试策略

### 单元测试（每个Story完成后）
- Service层测试覆盖率 ≥ 80%
- 使用Jest + Prisma Mock
- 重点测试业务逻辑和验证规则

### 集成测试
- API端到端测试（使用Supertest）
- 数据库集成测试（测试数据库）
- Azure Blob集成测试（开发环境）

### 测试数据
```typescript
// tests/fixtures/badge-templates.fixture.ts
export const testBadgeTemplates = [
  {
    name: 'TypeScript高级认证',
    category: 'skill',
    skillIds: ['<技术技能-编程语言-TypeScript>'],
    issuanceCriteria: {
      type: 'exam_score',
      conditions: [
        { field: 'examId', operator: '==', value: 'ts-advanced' },
        { field: 'score', operator: '>=', value: 90 }
      ]
    }
  },
  {
    name: '团队协作大师',
    category: 'achievement',
    skillIds: ['<软技能-团队协作>'],
    issuanceCriteria: {
      type: 'composite',
      conditions: [
        { field: 'projectsCompleted', operator: '>=', value: 5 },
        { field: 'peerEndorsements', operator: '>=', value: 10 }
      ],
      logic: 'AND'
    }
  }
];
```

---

## 风险管理

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| Azure Blob集成失败 | Medium | 提前测试连接，准备降级方案（本地存储） |
| 技能分类设计过于复杂 | Medium | 先实现基础3层，复杂逻辑延后 |
| 图片上传性能问题 | Low | 添加文件大小限制，使用流式上传 |
| 颁发标准验证复杂 | Medium | 使用成熟的JSON Schema库（Ajv） |
| 工作量超出预期 | Medium | 优先完成P0任务，P1任务可调整 |

---

## Definition of Done

每个Story需满足：
- [ ] 代码完成且通过Code Review
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] API文档更新（Swagger）
- [ ] 数据库迁移脚本测试通过
- [ ] 无阻塞性bug
- [ ] 产品验收通过

---

## Sprint 2时间表

### Week 1（2026-01-27 至 01-31，5个工作日）

**Day 1-2（1月27-28日）：** Story 3.1 + Story 3.6
- 数据模型设计与迁移
- 种子数据创建
- 自定义分类管理API

**Day 3-4（1月29-30日）：** Story 3.2
- Azure Blob配置
- 图片上传Service
- 创建徽章模板API

**Day 5（1月31日）：** Story 3.3
- 查询徽章模板API
- 开始集成测试

### Week 2（2026-02-03 至 02-07，5个工作日）

**Day 6-7（2月3-4日）：** Story 3.4 + Story 3.5
- 搜索优化
- 颁发标准定义

**Day 8（2月5日）：** Enhancement E1
- 图片完整管理功能

**Day 9（2月6日）：** 测试与bug修复
- 完成所有测试
- 修复发现的问题
- 性能优化

**Day 10（2月7日）：** Sprint 2收尾
- 文档更新
- Demo准备
- Sprint 2 Retrospective

---

## 交付物清单

### 代码
- [ ] 3个新的Prisma模型（BadgeTemplate, Skill, SkillCategory）
- [ ] 15+个新API端点
- [ ] Azure Blob Storage集成
- [ ] 60+个测试用例

### 文档
- [ ] API文档（Swagger）
- [ ] 数据模型文档
- [ ] 颁发标准Schema文档
- [ ] Azure Blob配置指南
- [ ] Sprint 2 Retrospective

### 数据
- [ ] 5个预设技能分类模板
- [ ] 20+个示例子分类
- [ ] 50+个示例技能
- [ ] 10个测试徽章模板

---

**Backlog状态：** ✅ Approved by Product Owner  
**准备开始：** 2026-01-27  
**估算完成：** 2026-02-07
