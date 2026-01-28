# Sprint 5特定内容审核报告

**日期：** 2026-01-28  
**审核人：** Bob (Scrum Master)  
**对比基准：** Sprint 4 Backlog  
**目的：** 识别Sprint 5特定的技术需求和补充必要文档

---

## 📊 审核方法论

### 参考对象：Sprint 4 Backlog的特定内容
Sprint 4 backlog包含了以下**超出模板**的特定描述：

1. **详细的UX设计文档引用**
   - `ux-badge-wallet-timeline-view.md` (830行)
   - `ux-badge-detail-modal.md`
   - `ux-badge-wallet-empty-state.md`
   - 每个Story都引用具体的UX设计文档

2. **Azure资源使用的特定说明**
   - SAS Token生成策略（5分钟过期）
   - 文件命名规范（`{badgeId}/{fileId}-{filename}.ext`）
   - 容器访问策略（private vs public）
   - 环境变量验证清单

3. **算法实现细节**
   - Similar Badge推荐算法的评分公式
   - Milestone检测逻辑
   - 具体的TypeScript代码示例

4. **技术决策的权衡说明**
   - 为什么Timeline View优于Grid View
   - 为什么使用Zustand而不是Redux
   - Phase 1 vs Phase 3的实现差异

5. **组件架构文档**
   - 详细的组件树结构
   - 子组件列表
   - Props接口定义

---

## 🔍 Sprint 5当前状态分析

### ✅ 已包含的内容（符合模板）
- [x] Pre-Sprint资源检查
- [x] Lessons Learned应用
- [x] 详细的验收标准
- [x] 技术实现示例
- [x] 测试策略
- [x] Definition of Done

### ❌ 缺失的Sprint 5特定内容

#### 1. **Open Badges 2.0规范细节** 🚨 **关键缺失**

**问题：** Sprint 5涉及外部标准合规（Open Badges 2.0），但缺少：
- Open Badges 2.0的核心概念解释（Assertion vs BadgeClass vs Issuer）
- JSON-LD的@context详细说明
- Hosted verification的工作原理
- Baking specification的技术细节
- 与Credly/Badgr的兼容性测试步骤

**建议补充：** 创建 `open-badges-2.0-reference.md`

---

#### 2. **Public Route安全配置** 🚨 **安全关键**

**问题：** Sprint 5引入公开API（无需认证），但缺少：
- NestJS @Public() decorator的配置说明
- JWT Auth Guard的绕过策略
- Rate Limiting的具体配置（1000 req/hr如何实现？）
- CORS配置的详细设置
- 防止滥用的安全措施

**建议补充：** 在backlog.md中添加"Public API安全配置"章节

---

#### 3. **Sharp包的Windows兼容性** ⚠️ **潜在风险**

**问题：** Sprint 4提到了sharp包，但Sprint 5缺少：
- Sharp在Windows上的原生依赖编译说明
- 可能的安装失败场景和解决方案
- 备用方案（如果sharp安装失败）
- PNG iTXt chunk的技术细节和验证方法

**建议补充：** 创建 `sharp-installation-guide.md`（类似Sprint 4的Azure setup guide）

---

#### 4. **外部验证器集成测试流程** ⚠️ **质量保证**

**问题：** 提到了Open Badges Validator，但缺少：
- 如何使用 https://openbadgesvalidator.imsglobal.org/
- 测试步骤的详细清单
- 验证失败的常见错误和修复方法
- Credly/Badgr导入测试的具体操作步骤

**建议补充：** 创建 `external-validator-testing-guide.md`

---

#### 5. **SEO和Open Graph配置** ⚠️ **前端特定**

**问题：** 提到了Open Graph meta tags，但缺少：
- Facebook Sharing Debugger的使用说明
- Twitter Card Validator的测试流程
- 图片尺寸和格式的最佳实践
- og:image的绝对URL生成策略

**建议补充：** 创建 `seo-open-graph-setup.md`

---

#### 6. **Database Migration策略** ⚠️ **数据库安全**

**问题：** Sprint 5修改现有badges表（添加列），但缺少：
- Migration的回滚策略
- 现有数据的迁移处理（verificationId如何为现有badges生成？）
- metadataHash的回填策略
- 索引添加的性能影响评估

**建议补充：** 在backlog.md中添加"Database Migration计划"章节

---

#### 7. **UX设计规范**（相比Sprint 4的差距）

**问题：** Sprint 4有3个详细的UX文档（830+行），Sprint 5缺少：
- 验证页面的视觉设计规范（颜色、字体、布局）
- Revoked badge的视觉处理（红色banner的具体设计）
- Mobile responsive的具体断点和布局
- Loading states的设计（skeleton screens）
- Error states的设计（404, 验证失败）

**建议补充：** 创建 `ux-verification-page-design.md`

---

## 📋 推荐的补充文档清单

### 🔴 高优先级（必须补充）

1. **`open-badges-2.0-reference.md`** (Sprint 5特定的技术标准)
   - Open Badges 2.0核心概念
   - JSON-LD schema详解
   - Assertion结构说明
   - BadgeClass vs Issuer vs Assertion关系图
   - 参考代码示例

2. **`public-api-security-config.md`** (安全关键)
   - NestJS @Public() decorator配置
   - Rate limiting实现（express-rate-limit或@nestjs/throttler）
   - CORS配置详解
   - 防止滥用的监控策略

3. **Database Migration计划**（在backlog.md中添加专门章节）
   - Migration文件命名：`20260129_sprint5_verification_columns`
   - 回滚策略
   - 现有数据处理（生成verificationId）
   - 性能影响评估

### 🟡 中优先级（建议补充）

4. **`sharp-installation-guide.md`**
   - Windows安装指南
   - 常见错误和解决方案
   - 测试iTXt chunk嵌入的方法

5. **`external-validator-testing-guide.md`**
   - Open Badges Validator使用流程
   - Credly/Badgr导入测试步骤
   - 常见验证错误和修复

6. **`ux-verification-page-design.md`**
   - 验证页面视觉设计规范
   - Revoked badge视觉处理
   - Mobile responsive设计
   - Loading/Error states设计

### 🟢 低优先级（可选补充）

7. **`seo-open-graph-setup.md`**
   - Facebook Sharing Debugger指南
   - Twitter Card测试步骤
   - 图片尺寸最佳实践

---

## 🎯 Sprint 4 vs Sprint 5对比总结

| 维度 | Sprint 4 | Sprint 5 | 差距评估 |
|------|----------|----------|---------|
| **UX设计文档** | 3个详细文档（830+行） | 0个 | ❌ 需要补充 |
| **技术标准文档** | 无（内部功能） | 0个（需要Open Badges 2.0） | ❌ 需要补充 |
| **安全配置文档** | Azure SAS Token详解 | 无（需要Public API） | ❌ 需要补充 |
| **安装指南** | 无（使用现有包） | 无（需要sharp） | ⚠️ 建议补充 |
| **算法细节** | Similar Badge评分公式 | 无（JSON-LD生成逻辑） | ✅ 已有代码示例 |
| **外部集成测试** | 无 | 无（需要外部验证器） | ❌ 需要补充 |

---

## 💡 具体补充建议

### 立即补充到backlog.md的内容：

#### 在Story 6.1中添加：

```markdown
### Open Badges 2.0核心概念（必读）

**三层架构：**
1. **Issuer（发行者）:** G-Credit系统本身
2. **BadgeClass（徽章类）:** badge_templates表（定义了徽章的标准）
3. **Assertion（断言）:** badges表（证明某人获得了某个徽章）

**JSON-LD的@context作用：**
- 定义字段的语义（不只是数据，还有意义）
- 允许不同系统理解相同的数据结构
- 必须使用 "https://w3id.org/openbadges/v2"

**Hosted Verification工作原理：**
1. 徽章包含verificationUrl字段
2. 外部验证器访问这个URL
3. 返回的JSON-LD必须与徽章中的数据一致
4. 验证器比对数据以确认真实性

**关键规范要求：**
- recipientId必须hash（隐私保护）
- issuedOn必须ISO 8601格式
- badge字段必须是URL（不是ID）
```

#### 在Story 6.2中添加：

```markdown
### Public API安全配置详解

**NestJS @Public() Decorator配置：**

1. 创建自定义装饰器：
```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

2. 修改JWT Guard：
```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // 跳过JWT验证
    }
    return super.canActivate(context);
  }
}
```

3. 在Controller中使用：
```typescript
@Controller('api/verify')
export class VerificationController {
  @Get(':verificationId')
  @Public() // 公开访问
  async verifyBadge(@Param('verificationId') id: string) {
    // ...
  }
}
```

**Rate Limiting配置（使用@nestjs/throttler）：**

安装：`npm install @nestjs/throttler@^5.0.0`

配置：
```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 3600000, // 1 hour in milliseconds
      limit: 1000,  // 1000 requests per hour
    }]),
  ],
})
```

应用到Controller：
```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 1000, ttl: 3600000 } })
@Controller('api/verify')
export class VerificationController {
  // ...
}
```

**CORS配置：**
```typescript
// main.ts
app.enableCors({
  origin: '*', // 公开API允许所有来源
  methods: 'GET,HEAD,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: false,
});
```
```

#### 在Story 6.5中添加：

```markdown
### Database Migration详细计划

**Migration文件：** `20260129_sprint5_verification_columns.sql`

**Up Migration（添加列）：**
```sql
-- Add verificationId column
ALTER TABLE "badges" 
ADD COLUMN "verificationId" TEXT;

-- Generate UUID for existing badges
UPDATE "badges" 
SET "verificationId" = gen_random_uuid()::TEXT 
WHERE "verificationId" IS NULL;

-- Add unique constraint
ALTER TABLE "badges" 
ADD CONSTRAINT "badges_verificationId_key" 
UNIQUE ("verificationId");

-- Add metadataHash column
ALTER TABLE "badges" 
ADD COLUMN "metadataHash" TEXT;

-- Add index for verification queries
CREATE INDEX "idx_badges_verification" 
ON "badges"("verificationId") 
WHERE "verificationId" IS NOT NULL;
```

**Down Migration（回滚）：**
```sql
-- Remove index
DROP INDEX IF EXISTS "idx_badges_verification";

-- Remove columns
ALTER TABLE "badges" 
DROP COLUMN IF EXISTS "metadataHash";

ALTER TABLE "badges" 
DROP CONSTRAINT IF EXISTS "badges_verificationId_key";

ALTER TABLE "badges" 
DROP COLUMN IF EXISTS "verificationId";
```

**现有数据处理策略：**
1. 所有现有badges自动生成verificationId（UUID）
2. metadataHash初始为NULL，首次访问时生成
3. 异步任务：为所有现有badges生成metadata和hash（Story 6.1完成后运行）

**性能影响评估：**
- 添加列：即时（ALTER TABLE）
- UUID生成：约0.1ms/badge（估计1000个badges约100ms）
- 索引创建：约50ms（小数据集）
- **总停机时间：**预计 <1秒（可接受）

**验证步骤：**
1. 在dev环境运行migration
2. 检查现有badges的verificationId非空
3. 测试查询性能（`WHERE verificationId = ?`）
4. 验证唯一约束生效（尝试插入重复verificationId）
```

---

## ✅ 审核结论

### Sprint 5特定需求总结：

1. **外部标准合规**（Open Badges 2.0）- Sprint 4没有的新挑战
2. **Public API安全**（无认证访问）- Sprint 4没有的新架构
3. **原生库安装**（sharp on Windows）- Sprint 4没有的新依赖
4. **外部系统集成测试**（Validator）- Sprint 4没有的新测试类型
5. **SEO优化**（Open Graph）- Sprint 4没有的新前端需求
6. **数据库现有数据迁移**（verificationId回填）- Sprint 4创建新表vs Sprint 5修改现有表

### 推荐行动：

**🔴 必须立即补充（阻碍开发）：**
1. ✅ 在backlog.md中添加"Open Badges 2.0核心概念"章节到Story 6.1
2. ✅ 在backlog.md中添加"Public API安全配置"章节到Story 6.2
3. ✅ 在backlog.md中添加"Database Migration计划"章节到Story 6.5

**🟡 建议补充（提升质量）：**
4. 创建 `sharp-installation-guide.md`（参考Sprint 4的azure-setup-guide.md）
5. 创建 `external-validator-testing-guide.md`

**🟢 可选补充（锦上添花）：**
6. 创建 `ux-verification-page-design.md`（参考Sprint 4的UX文档）
7. 创建 `seo-open-graph-setup.md`

---

## 📝 下一步

**选项A：** 我立即补充必须的内容到backlog.md（🔴高优先级章节）  
**选项B：** 你先审查这份报告，确认补充范围  
**选项C：** 我创建所有推荐的补充文档（🔴+🟡+🟢）

**你希望我执行哪个选项？**
