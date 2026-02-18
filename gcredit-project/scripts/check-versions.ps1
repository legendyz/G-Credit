# 📋 版本检查脚本 - G-Credit Project
# 用途：自动提取项目所有依赖版本号，用于创建 Sprint Version Manifest
# 使用：在项目根目录运行 .\scripts\check-versions.ps1

Write-Host "`n🔍 正在检查 G-Credit 项目版本..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 检查是否在正确的目录
if (-not (Test-Path "gcredit-project")) {
    Write-Host "❌ 错误：请在项目根目录 (CODE/) 运行此脚本" -ForegroundColor Red
    exit 1
}

# ============================================
# Frontend Dependencies
# ============================================
Write-Host "`n📦 Frontend Dependencies:" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

if (Test-Path "gcredit-project/frontend/package.json") {
    $frontendPkg = Get-Content "gcredit-project/frontend/package.json" | ConvertFrom-Json
    
    # 核心框架
    Write-Host "  核心框架:" -ForegroundColor White
    if ($frontendPkg.dependencies.react) {
        $reactVer = $frontendPkg.dependencies.react -replace '[^\d\.]',''
        Write-Host "    - React: $reactVer" -ForegroundColor Green
    }
    if ($frontendPkg.dependencies.'react-dom') {
        $reactDomVer = $frontendPkg.dependencies.'react-dom' -replace '[^\d\.]',''
        Write-Host "    - React DOM: $reactDomVer" -ForegroundColor Green
    }
    
    # 构建工具
    Write-Host "`n  构建工具:" -ForegroundColor White
    if ($frontendPkg.devDependencies.vite) {
        $viteVer = $frontendPkg.devDependencies.vite -replace '[^\d\.]',''
        Write-Host "    - Vite: $viteVer" -ForegroundColor Green
    }
    if ($frontendPkg.devDependencies.typescript) {
        $tsFrontendVer = $frontendPkg.devDependencies.typescript -replace '[^\d\.]',''
        Write-Host "    - TypeScript: $tsFrontendVer" -ForegroundColor Green
    }
    
    # UI库
    Write-Host "`n  UI库 & 组件:" -ForegroundColor White
    if ($frontendPkg.dependencies.'@radix-ui/react-slot') {
        Write-Host "    - Radix UI: (多个组件)" -ForegroundColor Green
    }
    if ($frontendPkg.dependencies.'lucide-react') {
        $lucideVer = $frontendPkg.dependencies.'lucide-react' -replace '[^\d\.]',''
        Write-Host "    - Lucide React (Icons): $lucideVer" -ForegroundColor Green
    }
    
    # 路由 & 状态管理
    Write-Host "`n  路由 & 状态管理:" -ForegroundColor White
    if ($frontendPkg.dependencies.'react-router-dom') {
        $routerVer = $frontendPkg.dependencies.'react-router-dom' -replace '[^\d\.]',''
        Write-Host "    - React Router: $routerVer" -ForegroundColor Green
    }
    if ($frontendPkg.dependencies.'@tanstack/react-query') {
        $queryVer = $frontendPkg.dependencies.'@tanstack/react-query' -replace '[^\d\.]',''
        Write-Host "    - TanStack Query: $queryVer" -ForegroundColor Green
    }
    
    # 样式
    Write-Host "`n  样式:" -ForegroundColor White
    if ($frontendPkg.dependencies.'tailwindcss') {
        $tailwindVer = $frontendPkg.dependencies.'tailwindcss' -replace '[^\d\.]',''
        Write-Host "    - Tailwind CSS: $tailwindVer" -ForegroundColor Green
    } elseif ($frontendPkg.devDependencies.'tailwindcss') {
        $tailwindVer = $frontendPkg.devDependencies.'tailwindcss' -replace '[^\d\.]',''
        Write-Host "    - Tailwind CSS: $tailwindVer" -ForegroundColor Green
    }
    
    # 表单 & 验证
    Write-Host "`n  表单 & 验证:" -ForegroundColor White
    if ($frontendPkg.dependencies.'react-hook-form') {
        $rhfVer = $frontendPkg.dependencies.'react-hook-form' -replace '[^\d\.]',''
        Write-Host "    - React Hook Form: $rhfVer" -ForegroundColor Green
    }
    if ($frontendPkg.dependencies.'zod') {
        $zodVer = $frontendPkg.dependencies.'zod' -replace '[^\d\.]',''
        Write-Host "    - Zod: $zodVer" -ForegroundColor Green
    }
    
} else {
    Write-Host "  ⚠️ 未找到 frontend/package.json" -ForegroundColor Yellow
}

# ============================================
# Backend Dependencies
# ============================================
Write-Host "`n📦 Backend Dependencies:" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

if (Test-Path "gcredit-project/backend/package.json") {
    $backendPkg = Get-Content "gcredit-project/backend/package.json" | ConvertFrom-Json
    
    # 核心框架
    Write-Host "  核心框架:" -ForegroundColor White
    if ($backendPkg.dependencies.'@nestjs/core') {
        $nestVer = $backendPkg.dependencies.'@nestjs/core' -replace '[^\d\.]',''
        Write-Host "    - NestJS Core: $nestVer" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'@nestjs/common') {
        $nestCommonVer = $backendPkg.dependencies.'@nestjs/common' -replace '[^\d\.]',''
        Write-Host "    - NestJS Common: $nestCommonVer" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'@nestjs/platform-express') {
        $nestExpressVer = $backendPkg.dependencies.'@nestjs/platform-express' -replace '[^\d\.]',''
        Write-Host "    - NestJS Platform Express: $nestExpressVer" -ForegroundColor Green
    }
    
    # 数据库 & ORM
    Write-Host "`n  数据库 & ORM:" -ForegroundColor White
    if ($backendPkg.dependencies.'prisma') {
        $prismaVer = $backendPkg.dependencies.'prisma' -replace '[^\d\.]',''
        Write-Host "    - Prisma: $prismaVer ⚠️ (锁定版本，勿升级到7.x)" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'@prisma/client') {
        $prismaClientVer = $backendPkg.dependencies.'@prisma/client' -replace '[^\d\.]',''
        Write-Host "    - Prisma Client: $prismaClientVer" -ForegroundColor Green
    }
    
    # 认证 & 安全
    Write-Host "`n  认证 & 安全:" -ForegroundColor White
    if ($backendPkg.dependencies.'@nestjs/passport') {
        $passportVer = $backendPkg.dependencies.'@nestjs/passport' -replace '[^\d\.]',''
        Write-Host "    - NestJS Passport: $passportVer" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'@nestjs/jwt') {
        $jwtVer = $backendPkg.dependencies.'@nestjs/jwt' -replace '[^\d\.]',''
        Write-Host "    - NestJS JWT: $jwtVer" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'bcrypt') {
        $bcryptVer = $backendPkg.dependencies.'bcrypt' -replace '[^\d\.]',''
        Write-Host "    - bcrypt: $bcryptVer" -ForegroundColor Green
    }
    
    # 日志
    Write-Host "`n  日志:" -ForegroundColor White
    if ($backendPkg.dependencies.'winston') {
        $winstonVer = $backendPkg.dependencies.'winston' -replace '[^\d\.]',''
        Write-Host "    - Winston: $winstonVer" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'nest-winston') {
        $nestWinstonVer = $backendPkg.dependencies.'nest-winston' -replace '[^\d\.]',''
        Write-Host "    - Nest Winston: $nestWinstonVer" -ForegroundColor Green
    }
    
    # 云存储
    Write-Host "`n  云存储:" -ForegroundColor White
    if ($backendPkg.dependencies.'@azure/storage-blob') {
        $azureBlobVer = $backendPkg.dependencies.'@azure/storage-blob' -replace '[^\d\.]',''
        Write-Host "    - Azure Storage Blob: $azureBlobVer" -ForegroundColor Green
    }
    
    # 验证 & 工具
    Write-Host "`n  验证 & 工具:" -ForegroundColor White
    if ($backendPkg.dependencies.'class-validator') {
        $cvVer = $backendPkg.dependencies.'class-validator' -replace '[^\d\.]',''
        Write-Host "    - class-validator: $cvVer" -ForegroundColor Green
    }
    if ($backendPkg.dependencies.'class-transformer') {
        $ctVer = $backendPkg.dependencies.'class-transformer' -replace '[^\d\.]',''
        Write-Host "    - class-transformer: $ctVer" -ForegroundColor Green
    }
    
    # TypeScript
    Write-Host "`n  TypeScript:" -ForegroundColor White
    if ($backendPkg.devDependencies.'typescript') {
        $tsBackendVer = $backendPkg.devDependencies.'typescript' -replace '[^\d\.]',''
        Write-Host "    - TypeScript: $tsBackendVer" -ForegroundColor Green
    }
    
    # 测试
    Write-Host "`n  测试框架:" -ForegroundColor White
    if ($backendPkg.devDependencies.'jest') {
        $jestVer = $backendPkg.devDependencies.'jest' -replace '[^\d\.]',''
        Write-Host "    - Jest: $jestVer" -ForegroundColor Green
    }
    if ($backendPkg.devDependencies.'@nestjs/testing') {
        $nestTestVer = $backendPkg.devDependencies.'@nestjs/testing' -replace '[^\d\.]',''
        Write-Host "    - NestJS Testing: $nestTestVer" -ForegroundColor Green
    }
    
} else {
    Write-Host "  ⚠️ 未找到 backend/package.json" -ForegroundColor Yellow
}

# ============================================
# Infrastructure & Tools
# ============================================
Write-Host "`n🛠️  Infrastructure & Tools:" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

# Node.js
try {
    $nodeVer = node --version
    Write-Host "  - Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Node.js 未安装或未在 PATH 中" -ForegroundColor Yellow
}

# npm
try {
    $npmVer = npm --version
    Write-Host "  - npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ npm 未安装或未在 PATH 中" -ForegroundColor Yellow
}

# PostgreSQL (显示配置的版本)
Write-Host "  - PostgreSQL: 16.x (Azure Flexible Server)" -ForegroundColor Green

# Azure CLI (可选)
try {
    $azVer = az --version 2>$null | Select-Object -First 1
    if ($azVer) {
        Write-Host "  - Azure CLI: 已安装" -ForegroundColor Green
    }
} catch {
    Write-Host "  - Azure CLI: 未安装 (可选)" -ForegroundColor Gray
}

# ============================================
# Development Tools
# ============================================
Write-Host "`n🔧 Development Tools:" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

if (Test-Path "gcredit-project/backend/package.json") {
    $backendPkg = Get-Content "gcredit-project/backend/package.json" | ConvertFrom-Json
    
    if ($backendPkg.devDependencies.'eslint') {
        $eslintVer = $backendPkg.devDependencies.'eslint' -replace '[^\d\.]',''
        Write-Host "  - ESLint: $eslintVer" -ForegroundColor Green
    }
    if ($backendPkg.devDependencies.'prettier') {
        $prettierVer = $backendPkg.devDependencies.'prettier' -replace '[^\d\.]',''
        Write-Host "  - Prettier: $prettierVer" -ForegroundColor Green
    }
}

# ============================================
# Summary
# ============================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ 版本检查完成！" -ForegroundColor Green
Write-Host "`n💡 使用提示：" -ForegroundColor Cyan
Write-Host "  1. 复制上方输出到 Sprint Version Manifest 文档" -ForegroundColor White
Write-Host "  2. 添加必要的注释和说明" -ForegroundColor White
Write-Host "  3. 运行验证脚本确认准确性：" -ForegroundColor White
Write-Host "     .\scripts\verify-versions.ps1 -ManifestFile 'docs/sprints/sprint-N/version-manifest.md'" -ForegroundColor Gray
Write-Host ""
