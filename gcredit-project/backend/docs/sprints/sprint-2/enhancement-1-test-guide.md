# Enhancement 1: Azure Blob Image Management - Test Guide

## 已实现功能

### ✅ Task E1.1: 图片删除功能
- `deleteImage(url)` - 删除指定URL的图片
- 在更新Badge Template时自动删除旧图片
- 在删除Badge Template时自动删除图片

### ✅ Task E1.2: 图片尺寸验证与优化建议
- **尺寸限制**:
  - 最小尺寸: 128x128 像素
  - 最大尺寸: 2048x2048 像素
  - 推荐尺寸: 256x256 或 512x512 像素

- **验证规则**:
  - 自动检测图片宽高
  - 验证长宽比（推荐1:1正方形）
  - 提供优化建议

- **优化建议类型**:
  - 图片尺寸不是推荐尺寸时提示
  - 非正方形图片提示（长宽比偏离1:1）
  - 图片过小提示（< 128px）
  - 图片过大提示（> 2048px）

### ✅ Task E1.3: 图片元数据与缩略图
- **元数据提取**:
  ```typescript
  {
    width: number;      // 图片宽度
    height: number;     // 图片高度
    format: string;     // 格式（png/jpeg）
    size: number;       // 文件大小（字节）
    aspectRatio: number; // 长宽比
    isOptimal: boolean; // 是否为最优尺寸
    suggestions?: string[]; // 优化建议
  }
  ```

- **缩略图生成**:
  - 尺寸: 128x128 像素
  - 裁剪方式: 中心裁剪（cover）
  - 可选功能（默认关闭）

## API 变更

### uploadImage 方法签名更新

**旧版本**:
```typescript
async uploadImage(
  file: Express.Multer.File,
  folder: string = 'templates',
): Promise<string>
```

**新版本**:
```typescript
async uploadImage(
  file: Express.Multer.File,
  folder: string = 'templates',
  generateThumbnail: boolean = false,
): Promise<UploadImageResult>

interface UploadImageResult {
  url: string;
  thumbnailUrl?: string;
  metadata: ImageMetadata;
}
```

## 测试场景

### 1. 尺寸验证测试

#### 测试1a: 图片太小（应拒绝）
- 创建 64x64 像素图片
- 预期: 400 错误，提示 "Image too small. Minimum dimensions: 128x128"

#### 测试1b: 图片太大（应拒绝）
- 创建 3000x3000 像素图片
- 预期: 400 错误，提示 "Image too large. Maximum dimensions: 2048x2048"

#### 测试1c: 最优尺寸（无建议）
- 创建 256x256 或 512x512 像素图片
- 预期: 成功上传，metadata.isOptimal = true，无 suggestions

#### 测试1d: 边界尺寸（有建议但接受）
- 创建 128x128 或 2048x2048 像素图片
- 预期: 成功上传，metadata.isOptimal = false，有 suggestions

### 2. 长宽比验证测试

#### 测试2a: 正方形图片（无建议）
- 创建 256x256 像素图片
- 预期: 无长宽比建议

#### 测试2b: 非正方形图片（有建议）
- 创建 256x128 像素图片
- 预期: 有建议 "Consider using square images (1:1 aspect ratio)"

### 3. 元数据验证测试

#### 测试3: 检查返回的元数据
- 上传任意有效图片
- 验证返回的 metadata 包含:
  - width, height, format, size
  - aspectRatio
  - isOptimal
  - suggestions (如果适用)

### 4. 缩略图生成测试

#### 测试4: 启用缩略图生成
- 修改 badge-templates.service.ts 将 `generateThumbnail` 参数改为 `true`
- 上传图片
- 验证返回包含 `thumbnailUrl`
- 访问缩略图URL验证尺寸为 128x128

## 创建测试图片

使用以下在线工具创建不同尺寸的测试图片:
- https://placekitten.com/64/64 (太小)
- https://placekitten.com/128/128 (最小边界)
- https://placekitten.com/256/256 (最优)
- https://placekitten.com/512/512 (最优)
- https://placekitten.com/1024/1024 (可接受)
- https://placekitten.com/2048/2048 (最大边界)
- https://placekitten.com/256/128 (非正方形)

或者使用 PowerShell + ImageMagick:
```powershell
# 安装 ImageMagick
# choco install imagemagick

# 创建测试图片
magick -size 64x64 xc:blue test-64x64.png
magick -size 256x256 xc:green test-256x256.png
magick -size 512x512 xc:red test-512x512.png
magick -size 256x128 xc:yellow test-256x128.png
magick -size 3000x3000 xc:purple test-3000x3000.png
```

## 使用 curl 测试

```bash
# 1. 登录获取token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}'

# 2. 上传最优尺寸图片（256x256）
curl -X POST http://localhost:3000/badge-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Optimal Size Badge" \
  -F "category=skill" \
  -F "description=Testing optimal size 256x256" \
  -F "skillIds=[]" \
  -F "image=@test-256x256.png"

# 预期: 无优化建议，isOptimal=true

# 3. 上传非正方形图片（256x128）
curl -X POST http://localhost:3000/badge-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Non-Square Badge" \
  -F "category=achievement" \
  -F "description=Testing non-square image" \
  -F "skillIds=[]" \
  -F "image=@test-256x128.png"

# 预期: 有长宽比建议

# 4. 上传过小图片（64x64）
curl -X POST http://localhost:3000/badge-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Too Small Badge" \
  -F "category=skill" \
  -F "description=Testing too small image" \
  -F "skillIds=[]" \
  -F "image=@test-64x64.png"

# 预期: 400 错误，拒绝上传

# 5. 上传过大图片（3000x3000）
curl -X POST http://localhost:3000/badge-templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Too Large Badge" \
  -F "category=skill" \
  -F "description=Testing too large image" \
  -F "skillIds=[]" \
  -F "image=@test-3000x3000.png"

# 预期: 400 错误，拒绝上传
```

## 使用 Postman 测试

1. **创建新请求**
   - Method: POST
   - URL: http://localhost:3000/badge-templates
   - Headers: Authorization: Bearer {token}

2. **Body设置**
   - Type: form-data
   - 添加字段:
     - name: "Test Badge"
     - category: "skill"
     - description: "Testing image validation"
     - skillIds: [] (array)
     - image: [选择文件]

3. **查看响应**
   - 检查返回的 imageUrl
   - 在浏览器中打开 imageUrl 验证图片

4. **查看服务器日志**
   - 观察控制台输出的优化建议
   - 例如: "Image optimization suggestions: Recommended dimensions: 256x256 or 512x512 pixels"

## 验证清单

- [ ] 图片尺寸验证工作正常（拒绝 < 128px 和 > 2048px）
- [ ] 最优尺寸（256x256, 512x512）无建议
- [ ] 非最优尺寸有合理建议
- [ ] 非正方形图片有长宽比建议
- [ ] 元数据正确返回（width, height, format等）
- [ ] 删除旧图片功能正常（更新时）
- [ ] 服务器日志正确输出优化建议
- [ ] 所有验证错误信息清晰易懂

## 预期日志输出示例

```
[BlobStorageService] Image optimization suggestions: Recommended dimensions: 256x256 or 512x512 pixels (square images work best for badges)
[BlobStorageService] Image optimization suggestions: Consider using square images (1:1 aspect ratio) for better display across different platforms
```

## 常见错误

### 错误1: Image too small
```json
{
  "statusCode": 400,
  "message": "Image too small. Minimum dimensions: 128x128 pixels. Current: 64x64",
  "error": "Bad Request"
}
```

### 错误2: Image too large
```json
{
  "statusCode": 400,
  "message": "Image too large. Maximum dimensions: 2048x2048 pixels. Current: 3000x3000",
  "error": "Bad Request"
}
```

### 错误3: Invalid format
```json
{
  "statusCode": 400,
  "message": "Invalid image format. Only PNG and JPG images are allowed.",
  "error": "Bad Request"
}
```

## 性能考虑

- sharp 库处理图片速度快（~10-50ms）
- 缩略图生成增加 ~20-30ms 处理时间
- 元数据提取开销极小（~5ms）
- 建议默认不生成缩略图，按需启用

## 下一步

1. 运行测试验证所有功能
2. 检查服务器日志确认优化建议正常输出
3. 可选：启用缩略图生成（修改 service 中的 generateThumbnail 参数）
4. 提交 Enhancement 1 完成的代码
