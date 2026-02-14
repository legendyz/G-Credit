# 🔍 版本验证脚本 - G-Credit Project
# 用途：验证 Sprint Version Manifest 中的版本号与实际 package.json 是否一致
# 使用：.\scripts\verify-versions.ps1 -ManifestFile "docs/sprints/sprint-N/version-manifest.md"

param(
    [Parameter(Mandatory=$true)]
    [string]$ManifestFile
)

Write-Host "`n🔍 验证版本清单准确性..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Manifest: $ManifestFile`n" -ForegroundColor White

# 检查是否在正确的目录
if (-not (Test-Path "gcredit-project")) {
    Write-Host "❌ 错误：请在项目根目录 (CODE/) 运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查 manifest 文件是否存在
if (-not (Test-Path "gcredit-project/$ManifestFile")) {
    Write-Host "❌ 错误：找不到 manifest 文件: $ManifestFile" -ForegroundColor Red
    Write-Host "   请确认文件路径正确" -ForegroundColor Yellow
    exit 1
}

# 读取 manifest 内容
$manifest = Get-Content "gcredit-project/$ManifestFile" -Raw

# 读取实际版本
$frontendPkg = $null
$backendPkg = $null

if (Test-Path "gcredit-project/frontend/package.json") {
    $frontendPkg = Get-Content "gcredit-project/frontend/package.json" | ConvertFrom-Json
}

if (Test-Path "gcredit-project/backend/package.json") {
    $backendPkg = Get-Content "gcredit-project/backend/package.json" | ConvertFrom-Json
}

# 初始化错误和警告列表
$errors = @()
$warnings = @()
$checks = 0
$passed = 0

# ============================================
# 验证函数
# ============================================
function Test-Version {
    param(
        [string]$Name,
        [string]$ActualVersion,
        [string]$Manifest,
        [bool]$Critical = $true
    )
    
    $script:checks++
    
    if (-not $ActualVersion) {
        $script:warnings += "⚠️  $Name : 未找到实际版本（可能未安装）"
        return
    }
    
    # 清理版本号（移除 ^ ~ 等符号）
    $cleanActual = $ActualVersion -replace '[^\d\.]',''
    
    # 检查 manifest 中是否包含此版本
    $pattern = "$Name.*$cleanActual"
    
    if ($Manifest -match $pattern) {
        Write-Host "✅ $Name : $cleanActual" -ForegroundColor Green
        $script:passed++
    } else {
        # 尝试查找 manifest 中记录的版本
        if ($Manifest -match "$Name.*?(\d+\.\d+\.\d+)") {
            $manifestVer = $matches[1]
            if ($Critical) {
                $script:errors += "❌ $Name : 不匹配！`n   实际: $cleanActual | Manifest: $manifestVer"
            } else {
                $script:warnings += "⚠️  $Name : 不匹配（非关键）`n   实际: $cleanActual | Manifest: $manifestVer"
            }
        } else {
            $script:warnings += "⚠️  $Name : Manifest中未找到记录"
        }
    }
}

# ============================================
# Frontend 关键依赖验证
# ============================================
Write-Host "📦 验证 Frontend 关键依赖..." -ForegroundColor Yellow

if ($frontendPkg) {
    Test-Version "React" $frontendPkg.dependencies.react $manifest $true
    Test-Version "Vite" $frontendPkg.devDependencies.vite $manifest $true
    Test-Version "TypeScript" $frontendPkg.devDependencies.typescript $manifest $true
    Test-Version "React Router" $frontendPkg.dependencies.'react-router-dom' $manifest $false
    Test-Version "TanStack Query" $frontendPkg.dependencies.'@tanstack/react-query' $manifest $false
    Test-Version "Tailwind CSS" ($frontendPkg.dependencies.'tailwindcss' ?? $frontendPkg.devDependencies.'tailwindcss') $manifest $false
} else {
    Write-Host "⚠️  跳过 Frontend 验证（package.json 未找到）" -ForegroundColor Yellow
}

# ============================================
# Backend 关键依赖验证
# ============================================
Write-Host "`n📦 验证 Backend 关键依赖..." -ForegroundColor Yellow

if ($backendPkg) {
    Test-Version "NestJS" $backendPkg.dependencies.'@nestjs/core' $manifest $true
    Test-Version "Prisma" $backendPkg.dependencies.'prisma' $manifest $true
    Test-Version "TypeScript" $backendPkg.devDependencies.'typescript' $manifest $true
    Test-Version "Winston" $backendPkg.dependencies.'winston' $manifest $false
    Test-Version "Azure Storage Blob" $backendPkg.dependencies.'@azure/storage-blob' $manifest $false
    Test-Version "JWT" $backendPkg.dependencies.'@nestjs/jwt' $manifest $false
    Test-Version "bcrypt" $backendPkg.dependencies.'bcrypt' $manifest $false
} else {
    Write-Host "⚠️  跳过 Backend 验证（package.json 未找到）" -ForegroundColor Yellow
}

# ============================================
# Infrastructure 验证
# ============================================
Write-Host "`n🛠️  验证 Infrastructure..." -ForegroundColor Yellow

try {
    $nodeVer = node --version
    Test-Version "Node.js" $nodeVer $manifest $true
} catch {
    $warnings += "⚠️  Node.js: 无法检测版本"
}

try {
    $npmVer = npm --version
    Test-Version "npm" $npmVer $manifest $false
} catch {
    $warnings += "⚠️  npm: 无法检测版本"
}

# PostgreSQL（通常在 manifest 中手动记录）
if ($manifest -match "PostgreSQL.*16") {
    Write-Host "✅ PostgreSQL: 16.x (已记录)" -ForegroundColor Green
    $passed++
    $checks++
} else {
    $warnings += "⚠️  PostgreSQL: Manifest中未找到版本16.x记录"
}

# ============================================
# 结果汇总
# ============================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "📊 验证结果汇总" -ForegroundColor Cyan
Write-Host "-" * 60 -ForegroundColor Gray
Write-Host "  总检查项: $checks" -ForegroundColor White
Write-Host "  通过: $passed" -ForegroundColor Green
Write-Host "  错误: $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { "Red" } else { "Green" })
Write-Host "  警告: $($warnings.Count)" -ForegroundColor $(if ($warnings.Count -gt 0) { "Yellow" } else { "Green" })

# 显示错误
if ($errors.Count -gt 0) {
    Write-Host "`n❌ 发现关键版本不匹配：" -ForegroundColor Red
    Write-Host "-" * 60 -ForegroundColor Gray
    $errors | ForEach-Object { 
        Write-Host $_ -ForegroundColor Red 
        Write-Host ""
    }
}

# 显示警告
if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️  警告信息：" -ForegroundColor Yellow
    Write-Host "-" * 60 -ForegroundColor Gray
    $warnings | ForEach-Object { 
        Write-Host $_ -ForegroundColor Yellow 
        Write-Host ""
    }
}

# 最终结论
Write-Host ("=" * 60) -ForegroundColor Gray
if ($errors.Count -eq 0) {
    if ($warnings.Count -eq 0) {
        Write-Host "✅ 版本清单完全准确！所有关键版本号匹配。" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "✅ 关键版本验证通过，但有 $($warnings.Count) 个警告项。" -ForegroundColor Yellow
        Write-Host "   建议检查并更新 manifest 中的非关键依赖版本。" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "❌ 版本验证失败！发现 $($errors.Count) 个关键版本不匹配。" -ForegroundColor Red
    Write-Host "   请更新 manifest 文件或检查 package.json。" -ForegroundColor Red
    Write-Host "`n💡 修复步骤：" -ForegroundColor Cyan
    Write-Host "   1. 检查上方列出的版本不匹配项" -ForegroundColor White
    Write-Host "   2. 运行 .\scripts\check-versions.ps1 查看实际版本" -ForegroundColor White
    Write-Host "   3. 更新 manifest 文件中的版本号" -ForegroundColor White
    Write-Host "   4. 重新运行此验证脚本" -ForegroundColor White
    exit 1
}
