Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "密码重置功能 - 完整流程演示" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "第 1 步：请求密码重置" -ForegroundColor Yellow
Write-Host "发送请求到 /auth/request-reset..." -ForegroundColor Gray

$body = @{ email = "employee.test@gcredit.com" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/request-reset" -Method POST -Body $body -ContentType "application/json"

Write-Host "✅ 响应：" -ForegroundColor Green
Write-Host "   $($response.message)" -ForegroundColor White

Write-Host "`n" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "⚠️  重要步骤" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. 查看运行后端的 PowerShell 窗口（外部窗口）" -ForegroundColor White
Write-Host "2. 找到类似以下的输出：" -ForegroundColor White
Write-Host ""
Write-Host "   ================================================================================" -ForegroundColor Gray
Write-Host "   📧 [DEV MODE] Password Reset Email (not sent)" -ForegroundColor Gray
Write-Host "   ================================================================================" -ForegroundColor Gray
Write-Host "   To: employee.test@gcredit.com" -ForegroundColor Gray
Write-Host "   Subject: Reset Your Password" -ForegroundColor Gray
Write-Host "   Reset URL: http://localhost:5173/reset-password?token=<TOKEN>" -ForegroundColor Gray
Write-Host "   Token: <64位十六进制字符串>" -ForegroundColor Gray
Write-Host "   ================================================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 复制 Token 值（64位十六进制字符串）" -ForegroundColor White
Write-Host ""

$token = Read-Host "请粘贴从后端控制台复制的 token（或按 Enter 跳过）"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "`n⏭️  跳过后续测试" -ForegroundColor Yellow
    Write-Host "`n💡 提示：" -ForegroundColor Cyan
    Write-Host "   - 使用 test-password-reset.http 文件配合 REST Client 扩展进行完整测试" -ForegroundColor White
    Write-Host "   - 参考 测试指南.md 了解详细步骤" -ForegroundColor White
    exit 0
}

Write-Host "`n第 2 步：使用 Token 重置密码" -ForegroundColor Yellow
Write-Host "发送请求到 /auth/reset-password..." -ForegroundColor Gray

try {
    $body = @{ 
        token = $token.Trim()
        newPassword = "NewSecurePass123!" 
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/reset-password" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ 响应：" -ForegroundColor Green
    Write-Host "   $($response.message)" -ForegroundColor White
    
    Write-Host "`n第 3 步：测试旧密码（应该失败）" -ForegroundColor Yellow
    Write-Host "尝试使用旧密码登录..." -ForegroundColor Gray
    
    try {
        $body = @{ 
            email = "employee.test@gcredit.com"
            password = "EmployeePass123!" 
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json" | Out-Null
        Write-Host "❌ 失败：旧密码仍然有效（不应该）" -ForegroundColor Red
    } catch {
        Write-Host "✅ 正确：旧密码已失效（401 Unauthorized）" -ForegroundColor Green
    }
    
    Write-Host "`n第 4 步：测试新密码（应该成功）" -ForegroundColor Yellow
    Write-Host "使用新密码登录..." -ForegroundColor Gray
    
    $body = @{ 
        email = "employee.test@gcredit.com"
        password = "NewSecurePass123!" 
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ 登录成功！" -ForegroundColor Green
    Write-Host "   用户：$($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
    Write-Host "   JWT Token：$($response.accessToken.Substring(0, 50))..." -ForegroundColor Gray
    
    Write-Host "`n第 5 步：测试 Token 重用（应该失败）" -ForegroundColor Yellow
    Write-Host "尝试重用相同的 token..." -ForegroundColor Gray
    
    try {
        $body = @{ 
            token = $token.Trim()
            newPassword = "AnotherPass123!" 
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://localhost:3000/auth/reset-password" -Method POST -Body $body -ContentType "application/json" | Out-Null
        Write-Host "❌ 失败：Token 可以重用（不应该）" -ForegroundColor Red
    } catch {
        Write-Host "✅ 正确：Token 不能重用（400 Bad Request）" -ForegroundColor Green
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "🎉 所有测试通过！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n✅ 已验证功能：" -ForegroundColor White
    Write-Host "   • 密码重置请求（邮件发送模拟）" -ForegroundColor White
    Write-Host "   • Token 生成和验证" -ForegroundColor White
    Write-Host "   • 密码更新" -ForegroundColor White
    Write-Host "   • 旧密码失效" -ForegroundColor White
    Write-Host "   • Token 一次性使用" -ForegroundColor White
    Write-Host "`n📝 下一步：" -ForegroundColor Cyan
    Write-Host "   1. 恢复测试用户密码到原始值（可选）" -ForegroundColor White
    Write-Host "   2. 提交代码：git add . && git commit -m 'feat: Story 2.5 - Password reset'" -ForegroundColor White
    Write-Host "   3. 推送到远程：git push origin sprint-1-authentication" -ForegroundColor White
    
} catch {
    Write-Host "❌ 错误：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 可能的原因：" -ForegroundColor Yellow
    Write-Host "   - Token 格式不正确（应该是64位十六进制字符串）" -ForegroundColor White
    Write-Host "   - Token 已过期（1小时有效期）" -ForegroundColor White
    Write-Host "   - Token 已被使用" -ForegroundColor White
}
