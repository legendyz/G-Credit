# Enhancement 1 Testing Guide

## 测试准备

### 步骤 1: 生成测试图片

在一个 PowerShell 终端中运行：

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
.\create-test-images.ps1
```

这将创建 8 个不同尺寸的测试图片：
- ✗ 64x64 (太小，应被拒绝)
- ⚠ 128x128 (最小边界，有建议)
- ✓ 256x256 (最优尺寸，无建议)
- ✓ 512x512 (最优尺寸，无建议)
- ⚠ 256x128 (非正方形，有长宽比建议)
- ⚠ 1024x1024 (可接受，有建议)
- ⚠ 2048x2048 (最大边界，有建议)
- ✗ 3000x3000 (太大，应被拒绝)

### 步骤 2: 启动后端服务器

**在另一个独立的 PowerShell 终端中**运行：

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
```

**重要**: 保持这个终端运行，不要关闭！服务器需要一直运行。

等待服务器启动完成，看到类似输出：
```
Nest application successfully started
Application is running on: http://localhost:3000
```

### 步骤 3: 运行测试脚本

**在第三个 PowerShell 终端中**运行：

```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
.\test-enhancement-1-api.ps1
```

## 测试覆盖

测试脚本会自动测试以下场景：

### ✓ 成功场景
1. **最优尺寸 (256x256)** - 应该上传成功，无优化建议
2. **最优尺寸 (512x512)** - 应该上传成功，无优化建议
3. **最小边界 (128x128)** - 应该上传成功，有尺寸建议
4. **非正方形 (256x128)** - 应该上传成功，有长宽比建议
5. **大尺寸 (1024x1024)** - 应该上传成功，有优化建议

### ✗ 失败场景 (应被拒绝)
1. **太小 (64x64)** - 应返回 400 错误，提示最小尺寸 128x128
2. **太大 (3000x3000)** - 应返回 400 错误，提示最大尺寸 2048x2048

## 如何查看优化建议

### 方法 1: 查看服务器控制台日志

在运行 `npm run start:dev` 的终端窗口中，观察输出：

```
[BlobStorageService] Image optimization suggestions: Recommended dimensions: 256x256 or 512x512 pixels (square images work best for badges)
```

或

```
[BlobStorageService] Image optimization suggestions: Consider using square images (1:1 aspect ratio) for better display across different platforms
```

### 方法 2: 查看测试脚本输出

测试脚本会显示：
- ✓ 成功上传的图片
- ⚠ 有建议的图片（提示查看服务器日志）
- ✗ 被拒绝的图片及错误消息

## 预期结果

### 对于最优尺寸 (256x256, 512x512)
```
✓ Upload successful (Status: 200)
  Badge ID: xxx
  Image URL: https://...
  No optimization suggestions expected
```

服务器日志：**无优化建议输出**

### 对于非最优尺寸 (128x128)
```
✓ Upload successful (Status: 200)
  Badge ID: xxx
  Image URL: https://...
⚠ Expected optimization suggestions (check server logs)
```

服务器日志：
```
Image optimization suggestions: Recommended dimensions: 256x256 or 512x512 pixels
```

### 对于非正方形 (256x128)
```
✓ Upload successful (Status: 200)
  Badge ID: xxx
  Image URL: https://...
⚠ Expected optimization suggestions (check server logs)
```

服务器日志：
```
Image optimization suggestions: Recommended dimensions: 256x256 or 512x512 pixels; Consider using square images (1:1 aspect ratio)
```

### 对于太小的图片 (64x64)
```
✓ Correctly rejected (Status: 400)
  Error: Image too small. Minimum dimensions: 128x128 pixels. Current: 64x64
✓ Error message contains expected text: 'too small'
```

## 故障排查

### 问题 1: "Backend server is NOT running!"

**解决方案**: 
1. 打开新的 PowerShell 终端
2. 运行 `cd C:\G_Credit\CODE\gcredit-project\backend`
3. 运行 `npm run start:dev`
4. 等待服务器完全启动
5. 在另一个终端运行测试

### 问题 2: "Test images directory not found!"

**解决方案**: 
先运行 `.\create-test-images.ps1` 创建测试图片

### 问题 3: "Login failed"

**解决方案**: 
1. 确认服务器正在运行
2. 确认数据库已初始化并有 admin 用户
3. 如果需要，运行 `npx prisma db seed` 创建默认用户

### 问题 4: 看不到优化建议

**解决方案**: 
优化建议只在服务器控制台输出，不在测试脚本输出中。切换到运行 `npm run start:dev` 的终端窗口查看。

## 完整测试流程（三个终端）

### 终端 1 - 生成测试图片
```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
.\create-test-images.ps1
# 运行完成后可以关闭
```

### 终端 2 - 后端服务器（保持运行）
```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
npm run start:dev
# 不要关闭！保持运行！
```

### 终端 3 - 运行测试
```powershell
cd C:\G_Credit\CODE\gcredit-project\backend
.\test-enhancement-1-api.ps1
# 观察测试结果
# 同时观察终端2的服务器日志
```

## 验证清单

测试完成后，确认以下内容：

- [ ] 64x64 图片被拒绝，错误消息清晰
- [ ] 128x128 图片上传成功但有优化建议
- [ ] 256x256 图片上传成功且无建议 ⭐
- [ ] 512x512 图片上传成功且无建议 ⭐
- [ ] 256x128 非正方形图片有长宽比建议
- [ ] 1024x1024 图片上传成功但有建议
- [ ] 服务器日志正确输出优化建议
- [ ] 所有错误消息都清晰易懂

## 手动验证（可选）

使用浏览器或 Postman 访问上传的图片 URL，验证：
1. 图片可以正常访问
2. 图片尺寸正确
3. 图片显示清晰

## Enhancement 1 功能验证

✅ **Task E1.1**: 图片删除 - 已在 Story 3.2 测试中验证  
✅ **Task E1.2**: 尺寸验证与建议 - 本次测试重点  
✅ **Task E1.3**: 元数据提取 - 检查响应中的 metadata  

完成以上测试后，Enhancement 1 即完全验证通过！
