# Azure Blob Storage 配置指南 - Sprint 2

**目标：** 为G-Credit徽章图片存储配置Azure Blob Storage  
**预计时间：** 30-45分钟  
**执行时间：** 2026-01-27 Day 1 上午

---

## 📋 前提条件

- [x] Azure订阅账号（已确认）
- [ ] Azure Portal访问权限
- [ ] 具备创建资源的权限
- [ ] 开发环境已就绪

---

## 1️⃣ 创建Storage Account（15分钟）

### 步骤 1.1: 登录Azure Portal
```
访问：https://portal.azure.com
登录你的Azure账号
```

### 步骤 1.2: 创建Storage Account

**导航：**
```
Home → Create a resource → Storage account
```

**配置参数：**

| 参数 | 推荐值 | 说明 |
|-----|--------|------|
| **Subscription** | 你的订阅名 | 使用现有订阅 |
| **Resource Group** | `rg-gcredit-dev` | 新建或使用现有 |
| **Storage Account Name** | `gcreditdev` | 全局唯一，3-24字符，仅小写字母和数字 |
| **Region** | `East Asia` 或 `Southeast Asia` | 选择离你最近的区域 |
| **Performance** | `Standard` | 足够用，成本低 |
| **Redundancy** | `LRS (Locally Redundant)` | 开发环境用LRS即可 |

**高级设置：**
- [ ] Minimum TLS version: `TLS 1.2`
- [ ] Allow Blob public access: `Enabled` ✅ **重要**
- [ ] Enable storage account key access: `Enabled`

**点击：** Review + Create → Create

**等待部署：** 约2-3分钟

---

## 2️⃣ 创建Blob Container（5分钟）

### 步骤 2.1: 进入Storage Account
```
部署完成后 → Go to resource
```

### 步骤 2.2: 创建Container

**导航：**
```
左侧菜单 → Data storage → Containers → + Container
```

**配置：**
- **Name:** `badge-images`
- **Public access level:** `Blob (anonymous read access for blobs only)`
  - ⚠️ 这样图片URL可以直接访问，无需SAS令牌

**点击：** Create

### 步骤 2.3: （可选）创建其他Container
如果需要：
- `evidence-files` - 未来存储证据文件
- `user-avatars` - 未来存储用户头像

---

## 3️⃣ 获取Connection String（5分钟）

### 步骤 3.1: 获取连接字符串

**导航：**
```
Storage Account → Security + networking → Access keys
```

**显示密钥：**
- 点击 `Show keys`
- 复制 **key1** 的 **Connection string**

**格式示例：**
```
DefaultEndpointsProtocol=https;AccountName=gcreditdev;AccountKey=xxxxx==;EndpointSuffix=core.windows.net
```

### 步骤 3.2: 保存到环境变量

**Windows（PowerShell）：**
```powershell
# 临时设置（当前会话）
$env:AZURE_STORAGE_CONNECTION_STRING = "你的连接字符串"

# 永久设置（用户环境变量）
[System.Environment]::SetEnvironmentVariable(
    "AZURE_STORAGE_CONNECTION_STRING",
    "你的连接字符串",
    "User"
)

# 验证
$env:AZURE_STORAGE_CONNECTION_STRING
```

**Linux/Mac：**
```bash
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
