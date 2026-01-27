# Backend 项目文件结构说明

## 📁 目录结构总览

```
backend/
├── 📁 .vscode/              # VS Code编辑器配置
├── 📁 dist/                 # TypeScript编译输出目录（构建产物）
├── 📁 docs/                 # 项目文档
├── 📁 node_modules/         # npm依赖包（485MB）
├── 📁 prisma/               # 数据库Schema和迁移文件
├── 📁 scripts/              # 实用工具脚本
├── 📁 src/                  # 源代码主目录 ⭐
├── 📁 test/                 # Jest E2E测试文件
├── 📁 test-scripts/         # 活跃的PowerShell测试脚本 ⭐ 新增
├── 📁 test-archive/         # 归档的测试文件 ⭐ 新增
├── 📁 test-images/          # 测试用图片素材
├── 📁 _bmad-output/         # BMAD工作流输出目录
└── 📄 配置文件              # 项目配置（12个）
```

---

## 🎯 核心目录详解

### 1️⃣ src/ - 源代码目录（45个文件）

#### 业务模块（Feature Modules）
```
src/
├── badge-issuance/          # 徽章签发模块 (Sprint 3) ⭐ NEW
│   ├── dto/                 # 数据传输对象
│   │   └── issue-badge.dto.ts
│   ├── services/
│   │   └── assertion-generator.service.ts    # Open Badges 2.0断言生成器
│   ├── badge-issuance.controller.ts          # REST API控制器
│   ├── badge-issuance.service.ts             # 业务逻辑
│   ├── badge-issuance.module.ts              # NestJS模块定义
│   └── badge-issuance.service.spec.ts        # 单元测试 (7个测试)
│
├── badge-templates/         # 徽章模板管理 (Sprint 2) ✅
│   ├── dto/
│   │   ├── badge-template.dto.ts
│   │   └── query-badge-template.dto.ts
│   ├── badge-templates.controller.ts         # CRUD + 查询API
│   ├── badge-templates.service.ts            # 模板业务逻辑
│   ├── badge-templates.module.ts
│   └── badge-templates.service.spec.ts
│
├── skills/                  # 技能管理 (Sprint 2) ✅
│   ├── dto/
│   │   └── skill.dto.ts
│   ├── skills.controller.ts
│   ├── skills.service.ts
│   └── skills.module.ts
│
├── skill-categories/        # 技能分类 (Sprint 2) ✅
│   ├── dto/
│   │   └── skill-category.dto.ts
│   ├── skill-categories.controller.ts
│   ├── skill-categories.service.ts
│   └── skill-categories.module.ts
│
└── modules/                 # 用户认证与授权 (Sprint 1) ✅
    ├── auth/
    │   ├── auth.controller.ts                # 登录/注册/密码重置
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── jwt.strategy.ts                   # JWT验证策略
    │   └── roles.guard.ts                    # RBAC权限守卫
    ├── users/
    │   ├── users.controller.ts               # 用户管理CRUD
    │   ├── users.service.ts
    │   └── users.module.ts
    └── profile/
        ├── profile.controller.ts             # 个人资料管理
        ├── profile.service.ts
        └── profile.module.ts
```

#### 公共模块（Common Modules）
```
src/common/                  # 共享基础设施 (13个文件)
├── azure-storage.service.ts # Azure Blob Storage集成
├── prisma.service.ts        # Prisma ORM客户端
├── email.service.ts         # 邮件服务（支持开发/生产环境）
├── filters/
│   └── http-exception.filter.ts  # 全局异常过滤器
├── interceptors/
│   └── logging.interceptor.ts    # 请求日志拦截器
├── pipes/
│   └── validation.pipe.ts        # 数据验证管道
└── utils/
    ├── logger.util.ts       # 日志工具
    ├── hash.util.ts         # 密码哈希
    └── validators.util.ts   # 自定义验证器
```

#### 配置与启动
```
src/
├── config/                  # 配置管理
│   └── configuration.ts     # 环境变量加载
├── app.module.ts            # 根模块（导入所有功能模块）
└── main.ts                  # 应用入口（端口3000, Swagger文档）
```

**文件统计：**
- badge-issuance: 7个文件
- badge-templates: 6个文件
- common: 13个文件
- modules: 10个文件（auth + users + profile）
- skills/skill-categories: 8个文件

---

### 2️⃣ prisma/ - 数据库管理

```
prisma/
├── schema.prisma            # 数据库Schema定义 ⭐
│   ├── User模型（用户表）
│   ├── BadgeTemplate模型（徽章模板）
│   ├── Badge模型（徽章实例）⭐ NEW
│   ├── Skill模型（技能）
│   └── SkillCategory模型（技能分类）
│
└── migrations/              # 数据库迁移历史
    ├── 20260120_initial/                        # Sprint 0: 初始化
    ├── 20260123_badge_templates/                # Sprint 2: 徽章模板
    ├── 20260127020604_add_badge_model/          # Sprint 3: 徽章签发 ⭐
    └── migration_lock.toml
```

**当前Schema统计：**
- 5个数据模型（User, BadgeTemplate, Badge, Skill, SkillCategory）
- 18个索引（查询优化）
- 6个外键关系
- 3个枚举类型（UserRole, TemplateStatus, BadgeStatus）

---

### 3️⃣ test/ - Jest E2E测试文件

```
test/
├── app.e2e-spec.ts              # 应用基础E2E测试
├── badge-issuance.e2e-spec.ts   # Story 4.1 E2E测试 ⭐
├── badge-templates.e2e-spec.ts  # Sprint 2 E2E测试
└── jest-e2e.json                # E2E测试配置
```

**测试覆盖率：**
- Unit Tests: 7个测试套件（*.spec.ts）
- E2E Tests: 3个测试套件（test/*.e2e-spec.ts）
- PowerShell Tests: 18个脚本（test-scripts/）

---

### 4️⃣ test-scripts/ - PowerShell测试脚本 ⭐ 新增

按Spr6️⃣ docs/ - 项目文档

```
docs/
├── api/                         # API文档
│   └── endpoints.md
├── decisions/                   # 架构决策记录(ADR)
│   ├── ADR-001-authentication-strategy.md
│   ├── ADR-002-file-storage-strategy.md
│   ├── ADR-003-badge-assertion-format.md     ⭐
│   └── ADR-004-email-service-selection.md    ⭐
├── sprints/                     # Sprint计划与回顾
│   ├── sprint-1/
│   │   ├── kickoff.md
│   │   ├── backlog.md
│   │   ├── retrospective.md
│   │   └── test-strategy.md
│   ├── sprint-2/
│   │   ├── kickoff.md
│   │   ├── backlog.md
│   │   ├── retrospective.md
│   │   └── test-strategy.md
│   └── sprint-3/                ⭐
│       ├── kickoff.md           # 26条经验教训应用
│       ├── backlog.md           # 6个Story详细任务
│       └── test-strategy.md     # 40个测试规范
├── lessons-learned.md           # 项目经验总结
├── project-structure.md         # 项目文件结构说明 ⭐
├── testing-guide-zh.md          # 测试指南（中文）⭐
└── test-files-reorganization-plan.md  # 测试文件重组方案 ⭐
└── utilities/                   # 实用工具脚本（2个）
    ├── create-test-images.ps1            # 生成测试图片素材
    └── 完整测试演示.ps1                  # 演示用完整流程
```

**运行测试：**
```powershell
# Sprint 1完整测试
.\test-scripts\sprint-1\test-sprint-1-complete.ps1

# Sprint 2 E2E测试
.\test-scripts\sprint-2\test-sprint-2-e2e.ps1

# Sprint 3徽章签发测试
.\test-scripts\sprint-3\test-badge-issuance.ps1

# 快速数据库重置
.\test-scripts\infrastructure\quick-test-reset.ps1
```

---

### 5️⃣ test-archive/ - 归档测试文件 ⭐ 新增

历史参考和已废弃的测试文件（16个文件）

```
test-archive/
├── README.md                    # 归档说明文档 ⭐
├── deprecated/                  # 已废弃测试（6个）
│   ├── test-enhancement-1.ps1           # 被api版本替代
│   ├── test-sprint-2-simple.ps1         # 被quick版本替代
│   ├── test-story-3.4.ps1               # 被optimization版本替代
│   ├── test-story-3.4-optimization.ps1  # 命名不规范版本
│   ├── test-registration.ps1            # 被run版本替代
│   └── test-reset-simple.bat            # 被PowerShell版本替代
│
├── alternative-languages/       # 其他语言实现（3个）
│   ├── test-registration.js             # Node.js版本
│   ├── test_registration.py             # Python版本
│   └── test-with-curl.ps1               # curl版本
│
├── http-client-tests/           # REST Client测试（4个）
│   ├── test-login.http
│   ├── test-registration.http
│   ├── test-password-reset.http
│   └── test-rbac.http
│
├── old-reports/                 # 旧测试报告（3个）
│   └── sprint-1-test-report-*.txt
│
└── experimental/                # 实验性测试（6个）
    ├── test-e1-final.ps1
    ├── test-enhancement-1-quick.ps1
    ├── test-enhancement-1-api.ps1       # 最完善版本
    ├── test-correct-multipart.ps1
    ├── test-powershell-multipart.ps1
    └── test-reset-flow.ps1
```

**用途：**
- 📚 历史参考和学习资料
- 🔍 了解项目演进过程
- 💡 编写新测试的参考示例

⚠️ 这些测试可能已过时，运行前请检查兼容性

---

### 6️⃣ docs/ - 项目文档

```
docs/
├── api/                         # API文档
│   └── endpoints.md
├── decisions/                   # 架构决策记录(ADR)
│   ├── ADR-001-authentication-strategy.md
│   ├── ADR-002-file-storage-strategy.md
│   ├── ADR-003-badge-assertion-format.md     ⭐ NEW
│   └── ADR-004-email-service-selection.md    ⭐ NEW
├── sprints/                     # Sprint计划与回顾
│   ├── sprint-1/
│   │   ├── kickoff.md
│   │   ├── backlog.md
│   │   ├── retrospective.md
│   │   └── test-strategy.md
│   ├── sprint-2/
│   │   ├── kickoff.md
│   │   ├── backlog.md
│   │   ├── retrospective.md
│   │   └── test-strategy.md
│   └── sprint-3/                ⭐ NEW
│       ├── kickoff.md           # 26条经验教训应用
│       ├── backlog.md           # 6个Story详细任务
│       └── test-strategy.md     # 40个测试规范
└── lessons-learned.md           # 项目经验总结
```

---

## 📄 配置文件详解

### 环境配置
```
.env                        # 实际环境变量（不提交到Git）⚠️
.env.example                # 环境变量模板（提交到Git）
.env.email-test             # 邮件测试专用配置
```

**关键环境变量：**
- `DATABASE_URL` - Azure PostgreSQL连接字符串
- `JWT_SECRET` - JWT签名密钥
- `AZURE_STORAGE_*` - Azure Blob Storage配置
- `AZURE_COMMUNICATION_CONNECTION_STRING` - 邮件服务（Sprint 3待用）

### TypeScript配置
```
tsconfig.json               # TypeScript编译配置（严格模式）
tsconfig.build.json         # 构建专用配置（排除测试文件）
```

### 工具配置
```
package.json                # npm依赖和脚本命令 ⭐
nest-cli.json               # NestJS CLI配置
eslint.config.mjs           # ESLint代码规范
.prettierrc                 # Prettier代码格式化
.gitignore                  # Git忽略文件规则
```

### 重要npm脚本（package.json）
```json
{
  "start:dev": "nest start --watch",    # 开发模式（热重载）
  "build": "nest build",                # 编译TypeScript
  "test": "jest",                       # 运行单元测试
  "test:e2e": "jest --config ./test/jest-e2e.json",  # E2E测试
  "prisma:migrate": "prisma migrate dev",            # 数据库迁移
  "prisma:studio": "prisma studio"                   # 数据库可视化
}
```

---

## 📦 构建产物

### dist/ 目录（构建后生成）
```
dist/
├── src/                     # 编译后的JavaScript文件
├── main.js                  # 入口文件
└── *.js.map                 # Source Map（调试用）
```

**生成命令：** `npm run build`  
**清理命令：** 手动删除dist目录

---

## 📊 项目规模统计

| 类型 | 数量 | 备注 |
|------|------|------|
| 总文件数 | ~600个 | 含node_modules |
| 源代码文件 | 45个 | src/目录 |
| 活跃测试文件 | 22个 | test/ (4) + test-scripts/ (18) |
| 归档测试文件 | 16个 | test-archive/ |
| 单元测试文件 | 7个 | *.spec.ts |
| 文档文件 | 18个 | docs/目录 |
| 配置文件 | 13个 | .env, tsconfig等 |
| 数据库迁移 | 3个 | prisma/migrations |
| 代码行数 | ~8,500行 | 不含测试和node_modules |
| 代码行数 | ~8,500行 | 不含测试和node_modules |

---

## 🎯 关键文件快速索引

### 开发时最常修改
1. `src/app.module.ts` - 添加新模块时
2. `prisma/schema.prisma` - 数据模型变更时
3. `.env` - 环境变量配置
4. `src/{module}/*.service.ts` - 业务逻辑实现

### 查看项目状态
1. `README.md` - 项目总览
2. `CHANGELOG.md` - 版本变更历史
3. `docs/sprints/sprint-{n}/` - Sprint计划与进度
4. `package.json` - 依赖和脚本

### 调试问题时
1. `*.spec.ts` - 单元测试
2. `test/*.e2e-spec.ts` - E2E测试
3. `test-*.ps1` - PowerShell集成测试
4. `docs/decisions/` - 架构决策背景

---

## 🚀 下一步行动建议

### 1. 测试文件已重组 ✅
- ✅ 35个测试文件已按Sprint分类
- ✅ 18个活跃测试移至 `test-scripts/`
- ✅ 16个归档文件移至 `test-archive/`
- ✅ 根目录从62个条目减少到30个条目

### 2. 运行测试
```powershell
# Sprint 1完整测试套件
.\test-scripts\sprint-1\test-sprint-1-complete.ps1

# Sprint 2 E2E测试
.\test-scripts\sprint-2\test-sprint-2-e2e.ps1

# Sprint 3徽章签发测试
.\test-scripts\sprint-3\test-badge-issuance.ps1

# Jest测试
npm test                    # 单元测试
npm run test:e2e           # E2E测试
```

### 3. 继续开发
- Story 4.5: 邮件通知（使用.env.email-test测试）
- Story 4.2: 批量签发CSV
- Story 4.3: 徽章认领工作流

---

**文档版本：** v1.1  
**最后更新：** 2026-01-27（测试文件重组）  
**维护者：** G-Credit开发团队
