# 测试文件快速访问指南

## 🚀 常用测试命令

### Jest测试（推荐）
```bash
# 运行所有单元测试
npm test

# 运行E2E测试
npm run test:e2e

# 运行特定测试文件
npm test badge-issuance.service.spec

# 查看测试覆盖率
npm run test:cov
```

### PowerShell测试脚本

#### Sprint 1 - 认证与授权
```powershell
# 完整测试套件（推荐）⭐
.\test-scripts\sprint-1\test-sprint-1-complete.ps1

# 单独测试
.\test-scripts\sprint-1\run-login-tests.ps1
.\test-scripts\sprint-1\run-registration-tests.ps1
.\test-scripts\sprint-1\run-password-reset-tests.ps1
.\test-scripts\sprint-1\run-rbac-tests.ps1
```

#### Sprint 2 - 徽章模板
```powershell
# E2E完整测试（推荐）⭐
.\test-scripts\sprint-2\test-sprint-2-e2e.ps1

# 快速冒烟测试
.\test-scripts\sprint-2\test-sprint-2-quick.ps1

# 特定Story测试
.\test-scripts\sprint-2\test-story-3-4-optimization.ps1
.\test-scripts\sprint-2\test-story-3-5-validation.ps1
```

#### Sprint 3 - 徽章签发
```powershell
# Story 4.1完整工作流测试 ⭐
.\test-scripts\sprint-3\test-badge-issuance.ps1
```

#### 基础设施测试
```powershell
# 快速数据库重置
.\test-scripts\infrastructure\quick-test-reset.ps1

# 邮件服务测试
.\test-scripts\infrastructure\test-email-real.ps1

# Azure Blob上传测试
.\test-scripts\infrastructure\test-simple-upload.ps1
```

#### 实用工具
```powershell
# 生成测试图片
.\test-scripts\utilities\create-test-images.ps1

# 演示完整流程
.\test-scripts\utilities\完整测试演示.ps1
```

---

## 📁 测试文件位置

### 单元测试（*.spec.ts）
- `src/badge-issuance/badge-issuance.service.spec.ts`
- `src/badge-templates/badge-templates.service.spec.ts`
- 其他模块的*.spec.ts文件

### E2E测试（test/）
- `test/app.e2e-spec.ts` - 应用基础测试
- `test/badge-issuance.e2e-spec.ts` - 徽章签发测试
- `test/badge-templates.e2e-spec.ts` - 徽章模板测试

### PowerShell测试（test-scripts/）
按功能和Sprint组织，详见目录结构

### 归档测试（test-archive/）
历史参考文件，一般不需要运行

---

## 🔍 查找测试

### 按功能查找
| 功能 | 位置 |
|------|------|
| 用户认证 | test-scripts/sprint-1/run-login-tests.ps1 |
| 用户注册 | test-scripts/sprint-1/run-registration-tests.ps1 |
| 密码重置 | test-scripts/sprint-1/run-password-reset-tests.ps1 |
| RBAC权限 | test-scripts/sprint-1/run-rbac-tests.ps1 |
| 徽章模板 | test-scripts/sprint-2/test-sprint-2-e2e.ps1 |
| 徽章签发 | test-scripts/sprint-3/test-badge-issuance.ps1 |
| 邮件服务 | test-scripts/infrastructure/test-email-real.ps1 |
| 文件上传 | test-scripts/infrastructure/test-simple-upload.ps1 |

### 按测试类型查找
| 类型 | 位置 |
|------|------|
| 单元测试 | src/**/*.spec.ts |
| E2E测试 | test/*.e2e-spec.ts |
| 集成测试 | test-scripts/sprint-*/\*.ps1 |
| 基础设施测试 | test-scripts/infrastructure/\*.ps1 |

---

## ⚡ 快速测试流程

### 开发新功能时
1. 编写单元测试：`src/{module}/*.spec.ts`
2. 运行单元测试：`npm test {module}.spec`
3. 编写E2E测试：`test/*.e2e-spec.ts`
4. 运行E2E测试：`npm run test:e2e`
5. （可选）编写PowerShell集成测试

### 提交代码前
```bash
# 1. 运行所有单元测试
npm test

# 2. 运行E2E测试
npm run test:e2e

# 3. 运行相关Sprint的完整测试
.\test-scripts\sprint-3\test-badge-issuance.ps1
```

### 部署前验证
```bash
# 1. 完整测试覆盖率检查
npm run test:cov

# 2. 运行所有Sprint测试
.\test-scripts\sprint-1\test-sprint-1-complete.ps1
.\test-scripts\sprint-2\test-sprint-2-e2e.ps1
.\test-scripts\sprint-3\test-badge-issuance.ps1

# 3. 基础设施测试
.\test-scripts\infrastructure\test-email-real.ps1
```

---

## 📚 相关文档

- [项目结构说明](project-structure.md) - 完整的项目文件结构
- [测试指南（中文）](testing-guide-zh.md) - 详细的测试编写指南
- [测试文件重组方案](test-files-reorganization-plan.md) - 重组的详细说明
- [test-archive/README.md](../test-archive/README.md) - 归档文件说明

---

## 🆘 常见问题

### Q: 如何运行特定的测试？
```bash
# Jest单元测试
npm test -- badge-issuance.service.spec.ts

# Jest E2E测试
npm run test:e2e -- badge-issuance.e2e-spec.ts

# PowerShell测试（直接运行脚本）
.\test-scripts\sprint-3\test-badge-issuance.ps1
```

### Q: 测试失败怎么办？
1. 检查数据库是否已迁移：`npx prisma migrate dev`
2. 检查环境变量：`.env`文件是否正确配置
3. 重置数据库：`.\test-scripts\infrastructure\quick-test-reset.ps1`
4. 查看错误日志，定位问题

### Q: 如何添加新的测试？
- **单元测试**：在模块目录创建`*.spec.ts`文件
- **E2E测试**：在`test/`目录创建`*.e2e-spec.ts`文件
- **PowerShell测试**：在`test-scripts/sprint-{n}/`创建`.ps1`文件

### Q: test-archive/ 里的测试还能用吗？
可以参考，但不推荐直接运行，因为：
- 可能与当前API不兼容
- 已被新版本测试替代
- 主要用于学习和历史参考

---

**最后更新：** 2026-01-27  
**维护者：** G-Credit开发团队
