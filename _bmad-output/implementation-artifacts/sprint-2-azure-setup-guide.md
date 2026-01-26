# Azure Blob Storage 验证指南 - Sprint 2

**目标：** 验证Sprint 0创建的Azure Blob Storage资源可用于Sprint 2  
**预计时间：** 15-20分钟  
**执行时间：** 2026-01-27 Day 1 上午

---

## ⚠️ 重要说明

**Sprint 0已创建Azure资源，无需重复创建！**

在Sprint 0（2026-01-24）中，我们已经创建了：
- ✅ **Storage Account:** `gcreditdevstoragelz`
- ✅ **Container:** `badges` (公开访问)
- ✅ **Container:** `evidence` (私有)
- ✅ **Connection String:** 已配置在 `.env` 文件中

**Sprint 2策略：** 复用现有资源，验证可用性即可。

**参考文档：** `docs/infrastructure-inventory.md` 查看完整资源清单

---

## 📋 前提条件

- [x] Azure订阅账号（已确认）
- [x] Sprint 0已创建Storage Account
- [x] 开发环境已就绪
- [x] `.env` 文件已配置

---

## 1️⃣ 验证环境变量配置（3分钟）

### 步骤 1.1: 检查 `.env` 文件

**文件位置：** `gcredit-project/backend/.env`

**确认以下配置存在：**
```env
# Azure Blob Storage (Sprint 0已配置)
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=gcreditdevstoragelz;AccountKey=***;EndpointSuffix=core.windows.net"
AZURE_STORAGE_ACCOUNT_NAME="gcreditdevstoragelz"
AZURE_STORAGE_CONTAINER_BADGES="badges"
AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
```

**⚠️ 如果缺失：**
- 从 `.env.example` 复制模板
- 联系团队获取Connection String
- 或登录Azure Portal重新获取

---

## 2️⃣ 验证Azure资源存在（可选，5分钟）

### 步骤 2.1: 登录Azure Portal（可选）

**仅在需要确认时执行：**
1. 访问：https://portal.azure.com
2. 搜索 "Storage accounts"
3. 找到 `gcreditdevstoragelz`
4. 确认状态为 "Available"

### 步骤 2.2: 确认Containers（可选）

**导航：**
```
Storage Account → Data storage → Containers
```

**应该看到：**
- ✅ `badges` (Public access: Blob)
- ✅ `evidence` (Public access: Private)

**如果Container不存在：**
- 参考原始指南创建（见文档末尾"附录A"）
- 但通常不需要，Sprint 0已创建

---

## 3️⃣ 运行测试脚本验证（10分钟）

### 步骤 3.1: 确认SDK已安装

**检查：**
```bash
cd gcredit-project/backend
npm list @azure/storage-blob
```

**预期输出：**
```
@azure/storage-blob@12.30.0
```

**如果未安装：**
```bash
npm install @azure/storage-blob
```

### 步骤 3.2: 运行测试脚本

**测试脚本位置：** `backend/scripts/test-azure-blob.ts`

**执行测试：**
```bash
cd gcredit-project/backend
npx ts-node scripts/test-azure-blob.ts
```

**预期输出（成功）：**
```
🔍 Testing Azure Blob Storage connection...

✅ Connection string found
✅ BlobServiceClient created
✅ Container client created for: badges
✅ Container exists: true

📤 Testing file upload...
✅ Test file uploaded: test-1769409043542.txt
📍 URL: https://gcreditdevstoragelz.blob.core.windows.net/badges/test-1769409043542.txt
✅ Downloaded content: "Hello from G-Credit Sprint 2!"
✅ Test file deleted

🎉 All tests passed! Azure Blob Storage is ready for Sprint 2.
```

**如果测试失败：**
- 检查`.env`文件配置
- 确认Connection String正确
- 查看错误消息并参考故障排查部分

---

## ✅ 验收检查清单

完成以下检查后，Sprint 2可以开始：

- [ ] `.env`文件包含所有Azure配置
- [ ] 环境变量已正确加载
- [ ] `@azure/storage-blob` SDK已安装
- [ ] 测试脚本运行成功
- [ ] 可以成功上传和下载文件
- [ ] 文件URL可公开访问（badges container）

---

## 🔧 故障排查

### 问题1: 连接失败
**错误：** `getaddrinfo ENOTFOUND gcreditdevstoragelz.blob.core.windows.net`

**解决：**
- 检查网络连接
- 确认Storage Account名称正确（`gcreditdevstoragelz`）
- 检查Connection String是否完整

### 问题2: Container不存在
**错误：** `Container 'badges' does not exist`

**解决：**
- 登录Azure Portal确认Container已创建
- 如果不存在，参考附录A创建
- 检查环境变量`AZURE_STORAGE_CONTAINER_BADGES`是否为"badges"

### 问题3: 权限错误
**错误：** `AuthorizationPermissionMismatch`

**解决：**
- 重新生成Access Key
- 确认使用的是正确的Connection String
- 检查Container的访问级别

### 问题4: 图片无法访问
**错误：** 404 或 403

**解决：**
- 确认Container的Public access level设置为`Blob`
- 检查URL格式：`https://{account}.blob.core.windows.net/{container}/{blob}`
- 验证Blob是否存在

---

## 📊 Sprint 2使用说明

### Container使用策略

**badges container（Sprint 2-7使用）：**
```
badges/
├── template-{uuid}.png        - 徽章模板图片（Sprint 2）
├── issued-{badgeId}.png       - 已颁发徽章（Sprint 3+）
└── custom-{userId}-{name}.png - 自定义图片（未来）
```

**文件命名规范：**
- 模板图片：`template-` 前缀
- 已颁发：`issued-` 前缀
- 使用UUID确保唯一性

**代码中使用：**
```typescript
// 总是使用环境变量
const containerName = process.env.AZURE_STORAGE_CONTAINER_BADGES; // 'badges'

// 文件命名示例
const fileName = `template-${uuid()}-${originalName}`;
```

---

## 🔗 相关文档

- **资源清单：** `docs/infrastructure-inventory.md`
- **Sprint 0 Backlog：** `_bmad-output/implementation-artifacts/sprint-0-backlog.md` (Story 1.4)
- **Sprint 2 Backlog：** `_bmad-output/implementation-artifacts/sprint-2-backlog.md`

---

## 附录A: Container创建指南（紧急情况）

**仅在Container真的不存在时使用：**

### 创建badges Container

1. 登录Azure Portal
2. 找到 `gcreditdevstoragelz`
3. 左侧菜单 → Data storage → Containers
4. 点击 + Container
5. 配置：
   - Name: `badges`
   - Public access level: **Blob (anonymous read access for blobs only)**
6. 点击 Create

### 创建evidence Container

1. 同上步骤1-4
2. 配置：
   - Name: `evidence`
   - Public access level: **Private (no anonymous access)**
3. 点击 Create

---

**验证完成后，返回Sprint 2 Kick-off文档继续Story 3.1！** 🚀
# 添加到 ~/.bashrc 或 ~/.zshrc
export AZURE_STORAGE_CONNECTION_STRING="你的连接字符串"

# 重新加载
source ~/.bashrc

# 验证
echo $AZURE_STORAGE_CONNECTION_STRING
```

### 步骤 3.3: 更新.env文件

**文件位置：** `gcredit-project/backend/.env`

**添加配置：**
```env
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=gcreditdev;AccountKey=xxxxx==;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=gcreditdev
AZURE_BLOB_CONTAINER_BADGES=badge-images

# 可选：未来使用
AZURE_BLOB_CONTAINER_EVIDENCE=evidence-files
AZURE_BLOB_CONTAINER_AVATARS=user-avatars
```

**⚠️ 安全提醒：**
- 确保 `.env` 在 `.gitignore` 中
- 不要提交connection string到Git

---

## 4️⃣ 安装Azure SDK（5分钟）

### 步骤 4.1: 安装npm包

```bash
cd gcredit-project/backend
npm install @azure/storage-blob
```

**预期版本：**
```json
{
  "@azure/storage-blob": "^12.17.0"
}
```

### 步骤 4.2: 安装图片处理库（可选）

```bash
npm install sharp
npm install --save-dev @types/sharp
```

用于图片验证和尺寸调整。

---

## 5️⃣ 验证连接（10分钟）

### 步骤 5.1: 创建测试脚本

**文件：** `gcredit-project/backend/scripts/test-azure-blob.ts`

```typescript
import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAzureConnection() {
  try {
    console.log('🔍 Testing Azure Blob Storage connection...\n');

    // 1. 验证环境变量
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING not found in environment');
    }
    console.log('✅ Connection string found');

    // 2. 创建BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    console.log('✅ BlobServiceClient created');

    // 3. 获取容器引用
    const containerName = 'badge-images';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`✅ Container client created for: ${containerName}`);

    // 4. 检查容器是否存在
    const exists = await containerClient.exists();
    console.log(`✅ Container exists: ${exists}`);

    if (!exists) {
      throw new Error(`Container '${containerName}' does not exist. Please create it first.`);
    }

    // 5. 测试上传
    console.log('\n📤 Testing file upload...');
    const testContent = 'Hello from G-Credit!';
    const blobName = `test-${Date.now()}.txt`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(testContent, testContent.length);
    console.log(`✅ Test file uploaded: ${blobName}`);
    console.log(`📍 URL: ${blockBlobClient.url}`);

    // 6. 验证文件可访问
    const downloadResponse = await blockBlobClient.download();
    const downloaded = await streamToString(downloadResponse.readableStreamBody!);
    console.log(`✅ Downloaded content: "${downloaded}"`);

    // 7. 清理测试文件
    await blockBlobClient.delete();
    console.log(`✅ Test file deleted`);

    console.log('\n🎉 All tests passed! Azure Blob Storage is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

testAzureConnection();
```

### 步骤 5.2: 运行测试

```bash
cd gcredit-project/backend
npx ts-node scripts/test-azure-blob.ts
```

**预期输出：**
```
🔍 Testing Azure Blob Storage connection...

✅ Connection string found
✅ BlobServiceClient created
✅ Container client created for: badge-images
✅ Container exists: true

📤 Testing file upload...
✅ Test file uploaded: test-1706169600000.txt
📍 URL: https://gcreditdev.blob.core.windows.net/badge-images/test-1706169600000.txt
✅ Downloaded content: "Hello from G-Credit!"
✅ Test file deleted

🎉 All tests passed! Azure Blob Storage is ready.
```

### 步骤 5.3: 测试图片上传（可选）

创建测试图片并上传：
```typescript
// 使用真实图片测试
const fs = require('fs');
const imagePath = './test-badge.png';
const imageBuffer = fs.readFileSync(imagePath);

await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
  blobHTTPHeaders: {
    blobContentType: 'image/png',
    blobCacheControl: 'public, max-age=31536000'
  }
});
```

---

## 6️⃣ 配置CORS（可选，5分钟）

如果前端需要直接上传到Azure Blob：

**导航：**
```
Storage Account → Settings → Resource sharing (CORS) → Blob service
```

**添加规则：**
- **Allowed origins:** `http://localhost:5173` (Vite dev server)
- **Allowed methods:** `GET, POST, PUT, DELETE, HEAD, OPTIONS`
- **Allowed headers:** `*`
- **Exposed headers:** `*`
- **Max age:** `3600`

**点击：** Save

---

## ✅ 验收检查清单

完成以下检查后，Sprint 2可以开始：

- [ ] Storage Account创建成功
- [ ] Container `badge-images` 创建成功，public access已启用
- [ ] Connection String已获取并保存到.env
- [ ] 环境变量已设置
- [ ] `@azure/storage-blob` 包已安装
- [ ] 测试脚本运行成功
- [ ] 可以成功上传和下载文件
- [ ] 文件URL可公开访问

---

## 🔧 常见问题排查

### 问题1: 连接失败
**错误：** `getaddrinfo ENOTFOUND gcreditdev.blob.core.windows.net`

**解决：**
- 检查网络连接
- 确认Storage Account名称正确
- 检查Connection String是否完整

### 问题2: 权限错误
**错误：** `AuthorizationPermissionMismatch`

**解决：**
- 重新生成Access Key
- 确认使用的是正确的Connection String
- 检查Container的访问级别

### 问题3: 图片无法访问
**错误：** 404 或 403

**解决：**
- 确认Container的Public access level设置为`Blob`
- 检查URL格式：`https://{account}.blob.core.windows.net/{container}/{blob}`
- 验证Blob是否存在

### 问题4: CORS错误
**错误：** 前端访问被CORS阻止

**解决：**
- 配置CORS规则（见步骤6）
- 或使用后端代理上传

---

## 📊 成本估算（参考）

**开发阶段预估（假设）：**
- 存储空间：1GB徽章图片
- 请求次数：1000次/月上传 + 5000次/月访问
- 预估成本：< $5 USD/月

**LRS定价（East Asia区域）：**
- 存储：~$0.02/GB/月
- 操作：PUT $0.065/10000次，GET $0.0043/10000次

**生产环境建议：**
- 升级到GRS或RAGRS
- 启用CDN加速
- 设置生命周期管理

---

## 🔗 参考资源

- [Azure Blob Storage官方文档](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [定价计算器](https://azure.microsoft.com/en-us/pricing/calculator/)

---

**配置完成后，运行测试脚本验证，然后开始Story 3.1！** 🚀
