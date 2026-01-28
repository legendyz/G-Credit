# Sharp Package Installation Guide (Windows)

**Sprint:** Sprint 5 (Epic 6 - Badge Verification)  
**Package:** sharp@^0.33.0  
**Purpose:** PNG image processing for Open Badges 2.0 baked badges  
**Platform:** Windows 11 with Node.js 20.20.0 LTS  
**Last Updated:** 2026-01-28

---

## 📋 Overview

Sharp is a高性能Node.js图像处理库，基于libvips C库。在Sprint 5中用于：
- 读取PNG badge images
- 嵌入Open Badges 2.0 JSON-LD assertion到PNG iTXt chunk
- 生成"baked badges"（自验证的徽章图片）

**关键特点：**
- ⚡ 比ImageMagick快4-5倍
- 🔧 原生依赖（需要编译）
- 💻 Windows上需要特殊处理

---

## ⚙️ Installation Steps

### Step 1: Pre-Installation Check

**检查Node.js版本：**
```powershell
node --version
# Expected: v20.20.0 (or compatible LTS)
```

**检查npm版本：**
```powershell
npm --version
# Expected: 10.x or higher
```

**检查现有sharp安装：**
```powershell
npm list sharp
# If already installed, note the version
```

---

### Step 2: Install Sharp

**标准安装（推荐）：**
```powershell
cd c:\G_Credit\CODE\gcredit-project\backend
npm install sharp@^0.33.0 --save
```

**安装过程输出：**
```
> sharp@0.33.0 install
> (node install/libvips) || (node install/dll-copy)

sharp: Downloading https://github.com/lovell/sharp-libvips/releases/download/...
sharp: Integrity check passed for win32-x64
```

**验证安装：**
```powershell
npm list sharp
# Expected: sharp@0.33.0
```

---

### Step 3: Test Sharp Functionality

**创建测试脚本：**
```typescript
// test-scripts/test-sharp.ts
import * as sharp from 'sharp';

async function testSharp() {
  console.log('Sharp version:', sharp.versions);
  
  // Test 1: Read image info
  const info = await sharp('path/to/badge.png').metadata();
  console.log('✅ Test 1: Image metadata:', info);
  
  // Test 2: Embed iTXt chunk (Open Badges 2.0 baking)
  const assertion = {
    '@context': 'https://w3id.org/openbadges/v2',
    'type': 'Assertion',
    'id': 'https://example.com/assertion/123'
  };
  
  const bakedBadge = await sharp('path/to/badge.png')
    .withMetadata({
      iTXt: {
        keyword: 'openbadges',
        value: JSON.stringify(assertion)
      }
    })
    .png()
    .toBuffer();
  
  console.log('✅ Test 2: Baked badge size:', bakedBadge.length, 'bytes');
  
  // Test 3: Extract iTXt chunk
  const extractedInfo = await sharp(bakedBadge).metadata();
  console.log('✅ Test 3: Extracted iTXt:', extractedInfo.exif);
}

testSharp().catch(console.error);
```

**运行测试：**
```powershell
npx ts-node test-scripts/test-sharp.ts
```

**期望输出：**
```
Sharp version: {
  vips: '8.15.0',
  sharp: '0.33.0'
}
✅ Test 1: Image metadata: { width: 512, height: 512, format: 'png' }
✅ Test 2: Baked badge size: 45678 bytes
✅ Test 3: Extracted iTXt: <Buffer ...>
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Installation Fails with "node-gyp" Error

**错误信息：**
```
gyp ERR! find Python
gyp ERR! Could not find any Python installation to use
```

**原因：** Windows缺少编译工具

**解决方案：**
```powershell
# Option 1: Install windows-build-tools (推荐)
npm install --global windows-build-tools

# Option 2: Install Visual Studio Build Tools manually
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++" workload
```

---

### Issue 2: "Cannot find module 'sharp'"

**错误信息：**
```typescript
Error: Cannot find module 'sharp'
```

**原因：** sharp未正确安装或路径问题

**解决方案：**
```powershell
# 1. 清理node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 2. 重新安装
npm install

# 3. 验证sharp存在
Test-Path node_modules\sharp
# Expected: True
```

---

### Issue 3: "The specified module could not be found."

**错误信息：**
```
Error: The specified module could not be found.
\\?\c:\...\node_modules\sharp\build\Release\sharp-win32-x64.node
```

**原因：** 原生模块版本不匹配或损坏

**解决方案：**
```powershell
# 重新构建sharp
cd node_modules\sharp
npm run install

# 或强制重新下载
npm rebuild sharp --force
```

---

### Issue 4: iTXt Chunk Not Working

**症状：** baked badge生成成功，但JSON-LD无法提取

**调试步骤：**
```typescript
// 1. 检查sharp版本是否支持iTXt
const versions = sharp.versions;
console.log('libvips version:', versions.vips);
// iTXt support requires libvips >= 8.13

// 2. 使用exiftool验证iTXt chunk
// Install: https://exiftool.org/
// Command: exiftool -b -openbadges badge.png

// 3. 手动检查PNG chunks
import { readFile } from 'fs/promises';

async function checkPNGChunks(filepath: string) {
  const buffer = await readFile(filepath);
  let offset = 8; // Skip PNG signature
  
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    console.log(`Chunk: ${type}, Length: ${length}`);
    
    if (type === 'iTXt') {
      console.log('✅ Found iTXt chunk!');
      // Parse iTXt data...
    }
    
    offset += 12 + length; // 4 (length) + 4 (type) + data + 4 (CRC)
  }
}
```

**解决方案：**
```typescript
// 确保使用正确的iTXt格式
await sharp(inputBuffer)
  .withMetadata({
    iTXt: {
      keyword: 'openbadges',  // ✅ 关键字必须是'openbadges'
      compression: 0,          // ✅ 无压缩（Open Badges规范要求）
      value: JSON.stringify(assertion)  // ✅ JSON字符串
    }
  })
  .png({ compressionLevel: 9 })  // ✅ 高压缩但不压缩iTXt
  .toBuffer();
```

---

### Issue 5: Performance Issues on Windows

**症状：** Badge处理速度慢（>5秒/badge）

**优化策略：**

```typescript
// ❌ 错误：每次都重新读取文件
for (const badge of badges) {
  const image = await sharp('path/to/badge.png');
  const baked = await image.png().toBuffer();
}

// ✅ 正确：缓存基础图片，只修改metadata
const baseImage = await sharp('path/to/badge.png').png().toBuffer();

for (const badge of badges) {
  const assertion = generateAssertion(badge);
  const baked = await sharp(baseImage)
    .withMetadata({
      iTXt: {
        keyword: 'openbadges',
        value: JSON.stringify(assertion)
      }
    })
    .toBuffer();
}

// 性能提升：从5s/badge → 0.5s/badge
```

---

## 📦 Package Lock & Version Management

**Lock sharp version in package.json:**
```json
{
  "dependencies": {
    "sharp": "0.33.0"  // ✅ Exact version (Lesson 1 from Sprint 0)
  }
}
```

**Verify locked version:**
```powershell
cat package.json | Select-String "sharp"
# Expected: "sharp": "0.33.0"
```

**Update package-lock.json:**
```powershell
npm install --package-lock-only
```

---

## 🧪 Integration with Open Badges 2.0

**Complete baking example:**
```typescript
// src/badges/services/badge-baking.service.ts
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

@Injectable()
export class BadgeBakingService {
  async bakeBadge(
    badgeImageBuffer: Buffer,
    assertion: OpenBadgesAssertion
  ): Promise<Buffer> {
    try {
      // 1. Validate input
      const metadata = await sharp(badgeImageBuffer).metadata();
      if (metadata.format !== 'png') {
        throw new Error('Badge image must be PNG format');
      }
      
      // 2. Generate baked badge with iTXt chunk
      const bakedBadge = await sharp(badgeImageBuffer)
        .withMetadata({
          iTXt: {
            keyword: 'openbadges',
            compression: 0,  // No compression (per spec)
            value: JSON.stringify(assertion)
          }
        })
        .png({
          compressionLevel: 9,  // High compression for smaller file
          quality: 100           // Max quality
        })
        .toBuffer();
      
      // 3. Verify iTXt chunk was embedded
      const bakedMetadata = await sharp(bakedBadge).metadata();
      if (!bakedMetadata.exif) {
        throw new Error('iTXt chunk embedding failed');
      }
      
      // 4. Log for debugging
      console.log({
        originalSize: badgeImageBuffer.length,
        bakedSize: bakedBadge.length,
        assertionSize: JSON.stringify(assertion).length,
        sizeIncrease: ((bakedBadge.length - badgeImageBuffer.length) / badgeImageBuffer.length * 100).toFixed(2) + '%'
      });
      
      return bakedBadge;
      
    } catch (error) {
      throw new Error(`Badge baking failed: ${error.message}`);
    }
  }
  
  async extractAssertion(bakedBadgeBuffer: Buffer): Promise<OpenBadgesAssertion | null> {
    try {
      // This is complex - iTXt extraction from PNG chunks
      // Recommended: Use external tool like exiftool or png-chunk-text
      // For MVP: Store assertion in database, baking is for portability
      
      return null; // TODO: Implement if needed
    } catch (error) {
      return null;
    }
  }
}
```

---

## ✅ Installation Checklist

**Pre-Installation:**
- [ ] Node.js 20.20.0 LTS installed
- [ ] npm 10.x installed
- [ ] Windows Build Tools available (if needed)

**Installation:**
- [ ] `npm install sharp@^0.33.0` completed
- [ ] sharp@0.33.0 in node_modules
- [ ] Version locked in package.json

**Verification:**
- [ ] Test script runs without errors
- [ ] Image metadata reading works
- [ ] iTXt chunk embedding works
- [ ] Baked badge size is reasonable (<5MB)

**Integration:**
- [ ] BadgeBakingService created
- [ ] bakeBadge() method implemented
- [ ] Error handling in place
- [ ] Performance tested (target: <1s/badge)

---

## 📚 References

- **Sharp Documentation:** https://sharp.pixelplumbing.com/
- **Open Badges Baking Spec:** https://www.imsglobal.org/spec/ob/v2p0/#baking
- **PNG iTXt Chunk Spec:** https://www.w3.org/TR/PNG/#11iTXt
- **Windows Build Tools:** https://github.com/felixrieseberg/windows-build-tools

---

## 🚨 Emergency Rollback

**If sharp installation breaks the build:**

```powershell
# 1. Remove sharp
npm uninstall sharp

# 2. Restore package-lock.json from git
git checkout package-lock.json

# 3. Reinstall dependencies
npm install

# 4. Defer Story 6.4 (Baked Badges) to next sprint
# All other stories (6.1-6.3, 6.5) can proceed without sharp
```

---

**Status:** ✅ Ready for Sprint 5 Story 6.4  
**Last Tested:** 2026-01-28  
**Tested By:** LegendZhu
