# Sprint 11 — Wave 3 Dev Prompt

**Wave:** 3 of 5 — Core Features  
**Sprint Branch:** `sprint-11/security-quality-hardening`  
**Baseline Commit:** `bf1868c`  
**Estimated Time:** ~10-13h  
**Test Baseline:** Backend 580 + Frontend 526 = **1106 tests**

---

## 🎯 Wave 3 目标

完成 4 个核心功能 Story，补全 PRD 合规性和用户体验关键缺失项。

**验收标准：**
- [ ] Badge 可见性切换（PUBLIC/PRIVATE）完整实现（DB + API + 双入口 UI）
- [ ] LinkedIn 分享 Tab 集成到 BadgeShareModal
- [ ] 验证页 Skill UUID→Name 显示修复
- [ ] 403 Access Denied 专用页面
- [ ] 全部测试通过（0 regressions from 1106 baseline）
- [ ] ESLint 0 errors + 0 warnings（BE + FE）

---

## Story 11.4: FR19 — Badge Visibility Toggle (PUBLIC/PRIVATE)

**预估:** 4-6h | **优先级:** 🔴 CRITICAL

### 当前状态

**Badge Model** (`backend/prisma/schema.prisma` L183-223)：
- 无 `visibility` 或 `isPublic` 字段
- 已有 `BadgeStatus` enum 先例

**Badge Controller** (`backend/src/badge-issuance/badge-issuance.controller.ts` — 457 行)：
- 无 PATCH endpoint
- 有 GET `my-badges`, GET `wallet`, GET `:id`, POST `:id/revoke` 等

**Badge Service** (`backend/src/badge-issuance/badge-issuance.service.ts` — 1530 行)：
- 无 visibility 相关方法

**前端组件：**
- `BadgeTimelineCard.tsx` (L142) — Wallet 卡片，有 View/Download 操作图标，无 visibility toggle
- `BadgeDetailModal.tsx` (L565) — Badge 详情弹窗，footer 有 Claim/Share/Download 按钮，无 visibility toggle
- `ClaimSuccessModal.tsx` (L239) — 领取成功弹窗，有 "View in Wallet"/"Continue Browsing"，无 visibility 提示
- `VerifyBadgePage.tsx` (L347) — 验证页，已有 404 处理 (L83-86: `setError('Badge not found...')`)
- `badge.ts` — `BadgeDetail` interface 无 `visibility` 或 `isPublic` 字段

### 实现方案

#### 1. Prisma Schema — 新增 BadgeVisibility enum 和字段

**文件:** `backend/prisma/schema.prisma`

在 `BadgeStatus` enum 附近（enum 定义区域）新增：

```prisma
enum BadgeVisibility {
  PUBLIC
  PRIVATE
}
```

在 `model Badge` 中，`status` 字段后新增：

```prisma
  visibility  BadgeVisibility @default(PUBLIC)
```

添加复合索引（在 Badge model 的 `@@index` 区域）：

```prisma
  @@index([visibility, status])       // 验证页查询优化
  @@index([recipientId, visibility])  // profile 过滤
```

运行 migration：
```bash
cd gcredit-project/backend
npx prisma migrate dev --name add-badge-visibility
```

> **注意：** `@default(PUBLIC)` 使所有现有 badge 自动为 PUBLIC，完全向后兼容。

#### 2. 新建 DTO — UpdateBadgeVisibilityDto

**新文件:** `backend/src/badge-issuance/dto/update-badge-visibility.dto.ts`

```typescript
import { IsEnum } from 'class-validator';
import { BadgeVisibility } from '@prisma/client';

export class UpdateBadgeVisibilityDto {
  @IsEnum(BadgeVisibility)
  visibility: BadgeVisibility;
}
```

#### 3. Badge Controller — 新增 PATCH 端点

**文件:** `backend/src/badge-issuance/badge-issuance.controller.ts`

新增端点（放在 `revokeBadge` 之前）：

```typescript
@Patch(':id/visibility')
@UseGuards(JwtAuthGuard)
async updateVisibility(
  @Param('id') id: string,
  @Body() dto: UpdateBadgeVisibilityDto,
  @Req() req: any,
) {
  return this.badgeIssuanceService.updateVisibility(id, dto.visibility, req.user.id);
}
```

**权限控制：** 只有 badge 的 `recipientId` 本人可切换 visibility。Service 层验证。

#### 4. Badge Service — 新增 updateVisibility 方法

**文件:** `backend/src/badge-issuance/badge-issuance.service.ts`

```typescript
async updateVisibility(badgeId: string, visibility: BadgeVisibility, userId: string): Promise<Badge> {
  const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
  
  if (!badge) {
    throw new NotFoundException('Badge not found');
  }
  
  if (badge.recipientId !== userId) {
    throw new ForbiddenException('Only the badge recipient can change visibility');
  }
  
  return this.prisma.badge.update({
    where: { id: badgeId },
    data: { visibility },
  });
}
```

#### 5. Verification Service — PRIVATE badge 返回 404

**文件:** `backend/src/badge-verification/badge-verification.service.ts`

在 `verifyBadge()` 方法中，查询到 badge 后（badge 查询结果之后），添加 visibility 检查：

```typescript
// After fetching badge, before building response:
if (badge.visibility === 'PRIVATE') {
  throw new NotFoundException('Badge not found');
}
```

> **⚠️ 架构条件 C-3（方案B）：** OB Assertion 端点 `GET /api/badges/:id/assertion` **不检查** visibility。Visibility 控制的是展示层（验证页、public profile），不是数据层（assertion）。UUID v4 不可枚举，Assertion 可访问符合 OB 2.0 hosted verification 要求。

#### 6. Badge 查询方法 — 包含 visibility 字段

**文件:** `backend/src/badge-issuance/badge-issuance.service.ts`

在 `getMyBadges()`, `getWalletBadges()`, `findOne()` 等方法的 Prisma select/include 中，确保返回 `visibility` 字段。

#### 7. 前端类型 — 添加 visibility

**文件:** `frontend/src/types/badge.ts`

在 `BadgeDetail` interface 中添加：

```typescript
visibility: 'PUBLIC' | 'PRIVATE';
```

#### 8. BadgeTimelineCard — 添加 Visibility Toggle（主入口）

**文件:** `frontend/src/components/TimelineView/BadgeTimelineCard.tsx`

在现有操作图标区域（View 👁️、Download ⬇️）下方，添加 visibility toggle：

```tsx
import { Globe, Lock, Loader2 } from 'lucide-react';

// In the action area:
<button
  onClick={() => handleToggleVisibility(badge.id, badge.visibility)}
  disabled={isToggling}
  className="p-2 rounded-full hover:bg-neutral-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
  title={badge.visibility === 'PUBLIC' ? 'Set to Private' : 'Set to Public'}
  aria-label={`Badge visibility: ${badge.visibility.toLowerCase()}`}
>
  {isToggling ? (
    <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
  ) : badge.visibility === 'PUBLIC' ? (
    <Globe className="h-4 w-4 text-brand-600" />
  ) : (
    <Lock className="h-4 w-4 text-neutral-400" />
  )}
</button>
```

**交互规则：**
- 点击后直接 PATCH 切换（PUBLIC↔PRIVATE），无二次确认弹窗（操作可逆）
- 切换中显示 `Loader2` spinner 防止重复点击
- 成功：`toast.success("Badge set to Private")` / `toast.success("Badge set to Public")`
- 失败：`toast.error("Failed to update visibility. Please try again.")`
- 状态即时更新，无需页面刷新

**API 调用：**
```typescript
import { apiFetch } from '@/lib/apiFetch';

const handleToggleVisibility = async (badgeId: string, currentVisibility: string) => {
  setIsToggling(true);
  try {
    const newVisibility = currentVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    const res = await apiFetch(`/badges/${badgeId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility: newVisibility }),
    });
    if (!res.ok) throw new Error();
    // Update local state
    toast.success(`Badge set to ${newVisibility === 'PUBLIC' ? 'Public' : 'Private'}`);
  } catch {
    toast.error('Failed to update visibility. Please try again.');
  } finally {
    setIsToggling(false);
  }
};
```

> **注意：** 使用 Wave 2 引入的 `apiFetch` 包装器（自动携带 httpOnly cookie）。

#### 9. BadgeDetailModal — 添加 Visibility Toggle（确认入口）

**文件:** `frontend/src/components/BadgeDetailModal/BadgeDetailModal.tsx`

在 Modal footer 区域（Claim/Share/Download 按钮附近），新增 visibility 切换区：

```tsx
<div className="flex items-center gap-2 text-sm text-neutral-600">
  <span>Visibility:</span>
  <button
    onClick={() => handleToggleVisibility(badge.id, badge.visibility)}
    disabled={isToggling}
    className="flex items-center gap-1 px-3 py-1 rounded-full border hover:bg-neutral-50 transition-colors"
  >
    {isToggling ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : badge.visibility === 'PUBLIC' ? (
      <>
        <Globe className="h-4 w-4 text-brand-600" /> Public
      </>
    ) : (
      <>
        <Lock className="h-4 w-4 text-neutral-400" /> Private
      </>
    )}
  </button>
</div>
```

**同样的 PATCH 逻辑，同样的 toast 反馈。**

#### 10. ClaimSuccessModal — 添加 Visibility 提示

**文件:** `frontend/src/components/ClaimSuccessModal.tsx`

在 congratulations 文字和 action buttons 之间，添加一行提示：

```tsx
<p className="text-sm text-neutral-500 mb-4">
  Your badge is publicly visible. You can change this anytime from your wallet.
</p>
```

> **注意：** 不需要在此处放 toggle 控件，仅做文字提示。Toggle 入口在 Wallet 和 Detail Modal。

#### 11. 测试要求

**后端：**
- `updateVisibility` service 方法：正常切换、非 owner 被拒、badge 不存在
- PATCH 端点 controller 测试
- 验证 PRIVATE badge 在 verify 端点返回 404
- 验证 PRIVATE badge 在 assertion 端点**仍可访问**（C-3 方案B）

**前端：**
- BadgeTimelineCard toggle 渲染 + 点击行为
- BadgeDetailModal toggle 渲染
- ClaimSuccessModal visibility 提示文字存在

---

## Story 11.5: LinkedIn Share Tab

**预估:** 3-4h | **优先级:** 🔴 CRITICAL

### 当前状态

**BadgeShareModal** (`frontend/src/components/BadgeShareModal/BadgeShareModal.tsx` — 786 行)：
- 当前 tabs: `type ShareTab = 'email' | 'teams' | 'widget'`
- `const TABS: ShareTab[] = ['email', 'teams', 'widget']`
- Tab 实现：`role="tablist"` + `aria-selected` + `data-tab` + keyboard navigation (ArrowLeft/ArrowRight)
- Tab panel: `role="tabpanel"` + `aria-labelledby`

**badgeShareApi.ts** (`frontend/src/lib/badgeShareApi.ts` — 171 行)：
- 有 `shareBadgeViaEmail`, `shareBadgeToTeams`, `getBadgeShareStats`, `getBadgeShareHistory`
- 无 LinkedIn 相关函数

**Badge Share Analytics Backend：**
- `BadgeShare` model (`schema.prisma` L289-303)：`platform String @db.VarChar(50)` — 支持 `'linkedin'` 值，无需 schema 变更
- `badge-analytics.controller.ts`：已有 share analytics 端点
- `widget-embed.controller.ts` L329-336：recordShare via `BadgeAnalyticsService.recordShare()`

**OG Meta Tags：**
- `frontend/index.html` — 无 OG meta tags
- 验证页是 SPA，LinkedIn 爬虫抓不到动态内容

### 实现方案

#### 1. 添加 LinkedIn Tab 到 BadgeShareModal

**文件:** `frontend/src/components/BadgeShareModal/BadgeShareModal.tsx`

**Step 1 — 更新 Tab 类型和常量 (L21-23)：**

```typescript
type ShareTab = 'email' | 'linkedin' | 'teams' | 'widget';
const TABS: ShareTab[] = ['email', 'linkedin', 'teams', 'widget'];
```

> **Tab 排序（UX Review）：** Email → LinkedIn → Teams → Widget（LinkedIn 是第二高频社交分享渠道）

**Step 2 — 添加 LinkedIn Tab Button (在 tablist 区域 L211-270)：**

在 Email tab button 后、Teams tab button 前，新增：

```tsx
<button
  role="tab"
  aria-selected={activeTab === 'linkedin'}
  aria-controls="panel-linkedin"
  data-tab="linkedin"
  onClick={() => setActiveTab('linkedin')}
  onKeyDown={handleTabKeyDown}
  tabIndex={activeTab === 'linkedin' ? 0 : -1}
  className={`flex-1 min-h-[44px] flex items-center justify-center gap-1 px-2 py-2 text-sm font-medium border-b-2 transition-colors ${
    activeTab === 'linkedin'
      ? 'border-brand-600 text-brand-700'
      : 'border-transparent text-neutral-500 hover:text-neutral-700'
  }`}
>
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
  LinkedIn
</button>
```

> **图标（UX Review）：** 使用 LinkedIn 官方品牌色 `#0A66C2` SVG，不使用 emoji。其他 tab 保持现有 emoji（统一迁移 Lucide 留给 Story 11.15）。

**Step 3 — 添加 LinkedIn Tab Panel (在现有 tab panel 区域)：**

```tsx
{activeTab === 'linkedin' && (
  <div
    role="tabpanel"
    id="panel-linkedin"
    aria-labelledby="tab-linkedin"
    className="space-y-4"
  >
    {/* Share Preview */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Share Preview
      </label>
      <div className="border rounded-lg p-4 bg-neutral-50 text-sm text-neutral-700 space-y-2">
        <p className="font-semibold">
          🏆 I earned the "{badgeName}" digital badge!
        </p>
        <p className="text-neutral-500">
          Issued by {issuerName} via G-Credit. Verify:{' '}
          <span className="text-brand-600 underline">{verificationUrl}</span>
        </p>
        <p className="text-neutral-400 text-xs">
          #DigitalCredentials #ProfessionalDevelopment #GCredit
        </p>
      </div>
    </div>

    {/* Editable Message */}
    <div>
      <label htmlFor="linkedin-message" className="block text-sm font-medium text-neutral-700 mb-1">
        Customize Message (optional)
      </label>
      <textarea
        id="linkedin-message"
        rows={3}
        value={linkedInMessage}
        onChange={(e) => setLinkedInMessage(e.target.value)}
        className="w-full rounded-md border border-neutral-300 p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        placeholder="Add a personal message to your LinkedIn post..."
      />
    </div>

    {/* Share Button */}
    <button
      onClick={handleLinkedInShare}
      disabled={linkedInShared}
      className={`w-full flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
        linkedInShared
          ? 'bg-green-100 text-green-700 cursor-not-allowed'
          : 'bg-[#0A66C2] text-white hover:bg-[#094fa3]'
      }`}
    >
      {linkedInShared ? (
        <>✓ LinkedIn opened — share from there</>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Share on LinkedIn
        </>
      )}
    </button>

    <p className="text-xs text-neutral-400 text-center">
      Opens LinkedIn in a new window
    </p>
  </div>
)}
```

**Step 4 — LinkedIn 分享逻辑：**

```typescript
const [linkedInMessage, setLinkedInMessage] = useState('');
const [linkedInShared, setLinkedInShared] = useState(false);

// Default message template (set on modal open or tab switch)
useEffect(() => {
  if (activeTab === 'linkedin' && !linkedInMessage) {
    setLinkedInMessage(
      `I'm proud to have earned the ${badgeName} badge, issued by ${issuerName} via G-Credit. ` +
      `This credential validates my professional skills. ` +
      `Verify my badge: ${verificationUrl} ` +
      `#DigitalCredentials #ProfessionalDevelopment #GCredit`
    );
  }
}, [activeTab]);

const handleLinkedInShare = async () => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
  window.open(shareUrl, '_blank', 'width=600,height=600');
  
  // Record analytics
  try {
    await recordLinkedInShare(badge.id);
  } catch {
    // Non-blocking — don't fail the share if analytics fails
  }
  
  // Button state: show "opened" for 5 seconds
  setLinkedInShared(true);
  setTimeout(() => setLinkedInShared(false), 5000);
};
```

#### 2. Analytics — recordLinkedInShare 函数

**文件:** `frontend/src/lib/badgeShareApi.ts`

新增函数：

```typescript
export async function recordLinkedInShare(badgeId: string): Promise<void> {
  await apiFetch(`/badges/${badgeId}/share/linkedin`, {
    method: 'POST',
  });
}
```

#### 3. Backend — LinkedIn Share Recording Endpoint

**文件:** `backend/src/badge-sharing/controllers/` — 新增或在现有 controller 中添加

可在 `badge-sharing.controller.ts` 或新建 `linkedin-sharing.controller.ts` 中添加：

```typescript
@Post(':badgeId/share/linkedin')
@UseGuards(JwtAuthGuard)
async recordLinkedInShare(
  @Param('badgeId') badgeId: string,
  @Req() req: any,
) {
  await this.badgeAnalyticsService.recordShare(badgeId, req.user.id, 'linkedin');
  return { success: true };
}
```

> **注意：** 检查 `BadgeAnalyticsService.recordShare()` 方法签名，确保 `'linkedin'` 作为 platform 参数被接受。`BadgeShare.platform` 是 `String @db.VarChar(50)`，无 enum 约束，直接接受 `'linkedin'`。

#### 4. OG Meta Tags — 验证页支持 LinkedIn 预览

**⚠️ 架构条件 C-6：** LinkedIn 分享链接指向验证页 URL，LinkedIn 爬虫会从该 URL 抓取 OG meta tags 生成预览卡片。SPA 页面默认无法提供动态 OG tags。

**推荐实现方案 — 静态 fallback + 后端 SSR 路由：**

**方案 A（最小实现，推荐 Sprint 11）：** 在 `frontend/index.html` 添加静态 fallback OG tags：

```html
<head>
  <!-- Open Graph Meta Tags (static fallback for social sharing) -->
  <meta property="og:title" content="G-Credit — Verified Digital Badge" />
  <meta property="og:description" content="This digital badge was issued and verified through G-Credit, a professional credential management platform." />
  <meta property="og:image" content="/gcredit-og-image.png" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="G-Credit" />
</head>
```

并创建 `frontend/public/gcredit-og-image.png` — G-Credit logo/branding image（1200×630px 推荐尺寸）。

> **注意：** 静态 fallback 无法为每个 badge 提供个性化预览（badge 名称、图片）。动态 SSR OG 方案（方案 B）可作为 Sprint 12 优化，当前 MVP 先用通用 metadata 确保 LinkedIn 预览不为空白。

**方案 B（未来优化，Sprint 12）：** 后端添加 middleware，对 `/verify/:id` 的 bot/crawler 请求（User-Agent 包含 `LinkedInBot`）返回包含动态 OG tags 的 HTML。非 bot 请求正常返回 SPA。

#### 5. 测试要求

**前端：**
- BadgeShareModal LinkedIn tab 渲染
- Tab 类型包含 'linkedin'，tab 顺序正确 (email → linkedin → teams → widget)
- LinkedIn share button 点击后状态变化（disabled + 文字变化）
- `window.open` 被调用且 URL 正确
- `recordLinkedInShare` API 被调用

**后端：**
- LinkedIn share recording endpoint 正常工作
- BadgeShare record created with `platform: 'linkedin'`
- Analytics 统计包含 linkedin 分享数据

---

## Story 11.18: Verification Page — Skill UUID → Display Name

**预估:** 1h | **优先级:** 🟡 MEDIUM

### 当前状态

**后端 — 验证 Service：**
`backend/src/badge-verification/badge-verification.service.ts` L140-145：

```typescript
badge: {
  name: badge.template.name,
  // ...
  skills: badge.template.skillIds || [],  // ← 返回原始 UUID 数组！
},
```

Badge template 查询 (L43)：`skillIds: true`，但**无 Skill model join**。`BadgeTemplate.skillIds` 是 `String[]`（L120），不是 Prisma relation。

**Skill Model** (`schema.prisma` L168-179)：

```prisma
model Skill {
  id          String        @id @default(uuid())
  name        String        @db.VarChar(100)
  description String?       @db.Text
  categoryId  String
  category    SkillCategory @relation(...)
  level       SkillLevel?
}
```

**前端 — 验证页 Skill 渲染：**
`frontend/src/pages/VerifyBadgePage.tsx` L296-308：

```tsx
{badge.badge.skills.map((skillId: string) => (
  <span key={skillId}
    className="px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm">
    {skillId}  {/* ← 直接显示 UUID！ */}
  </span>
))}
```

**前端类型：** `badge.ts` L54-65 — `skills: string[]`

### 实现方案

#### 1. 后端 — Skill 名称解析

**文件:** `backend/src/badge-verification/badge-verification.service.ts`

在 `verifyBadge()` 方法中，查询 badge 之后、构建响应之前，添加 Skill 查询：

```typescript
// After fetching badge (around L100-130), before building response:
const skills = badge.template.skillIds?.length
  ? await this.prisma.skill.findMany({
      where: { id: { in: badge.template.skillIds } },
      select: { id: true, name: true },
    })
  : [];
```

然后替换响应中的 skills 字段 (L140-145)：

```typescript
// 修改前:
skills: badge.template.skillIds || [],

// 修改后:
skills: skills.map(s => ({ id: s.id, name: s.name })),
```

> **注意：** 需在 service 构造函数中注入 `PrismaService` — 检查是否已注入。

#### 2. 前端类型更新

**文件:** `frontend/src/types/badge.ts`

更新 `VerificationResponse` 中的 skills 类型：

```typescript
// 修改前:
skills: string[];

// 修改后:
skills: Array<{ id: string; name: string }>;
```

#### 3. 前端 — 验证页渲染更新

**文件:** `frontend/src/pages/VerifyBadgePage.tsx` L296-308

```tsx
// 修改前:
{badge.badge.skills.map((skillId: string) => (
  <span key={skillId} className="px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm">
    {skillId}
  </span>
))}

// 修改后:
{badge.badge.skills.map((skill: { id: string; name: string }) => (
  <span key={skill.id} className="px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm">
    {skill.name}
  </span>
))}
```

#### 4. 测试要求

**后端：**
- 验证 Skill `findMany` 被正确调用
- 返回的 skills 包含 `{ id, name }` 而非纯 UUID 字符串
- skillIds 为空时 skills 返回空数组

**前端：**
- 验证页渲染 skill name（非 UUID）
- 处理空 skills 数组

---

## Story 11.19: 403 Access Denied Page

**预估:** 2h | **优先级:** 🟡 MEDIUM

### 当前状态

**NotFoundPage.tsx** (`frontend/src/pages/NotFoundPage.tsx` — 23 行)：

```tsx
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Layout pageTitle="Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-6xl font-bold text-neutral-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Page Not Found</h2>
        <p className="text-neutral-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-brand-600 text-white rounded-lg ...">
          Back to Dashboard
        </button>
      </div>
    </Layout>
  );
}
```

**ProtectedRoute.tsx** (`frontend/src/components/ProtectedRoute.tsx` L47-50)：

```tsx
if (requiredRoles && requiredRoles.length > 0 && user) {
  if (!requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;  // ← 静默重定向到首页！
  }
}
```

**App.tsx Router** (`frontend/src/App.tsx` — 201 行)：
- 公开路由: `/login`, `/verify/:verificationId`, `/badges/:badgeId/embed`, `/claim`
- 受保护路由: `/`, `/wallet`, `/admin/*`, `/profile`
- Catch-all: `<Route path="*" element={<NotFoundPage />} />`
- 无 `/access-denied` 或 `/403` 路由

**401 处理 (ProtectedRoute L42-45):** 未登录 → `<Navigate to="/login" state={{ from: fullPath }} replace />`

### 实现方案

#### 1. 创建 AccessDeniedPage 组件

**新文件:** `frontend/src/pages/AccessDeniedPage.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/stores/authStore';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const roleName = user?.role ?? 'Unknown';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Layout pageTitle="Access Denied">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="h-16 w-16 text-neutral-300 mb-4" />
        <h1 className="text-5xl md:text-6xl font-bold text-neutral-300 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Access Denied</h2>
        <p className="text-neutral-500 mb-8 max-w-md">
          You don't have permission to access this page.
          Your current role ({roleName}) does not have access to this resource.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors min-h-[44px]"
          >
            ← Go Back
          </button>
          <a
            href={`mailto:admin@company.com?subject=Access Request: ${window.location.pathname}`}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors min-h-[44px] inline-flex items-center justify-center"
          >
            Contact Admin
          </a>
        </div>
      </div>
    </Layout>
  );
}
```

**设计要点（UX Review）：**
- 复用 `NotFoundPage` 布局模式（`min-h-[60vh]`, `text-center`, `text-neutral-*`, `bg-brand-600`）
- 显示当前角色（帮助理解"为什么不能访问"），**不显示所需角色**（OWASP 安全建议）
- 图标：Lucide `ShieldAlert`
- 双按钮："← Go Back" (outline, `navigate(-1)`) + "Contact Admin" (primary, mailto)
- 移动端按钮纵向堆叠：`flex-col sm:flex-row gap-3`
- Go Back fallback：如果无浏览历史，fallback 到 `/`

#### 2. 添加路由

**文件:** `frontend/src/App.tsx`

在公开路由区域（`/login`, `/verify/:verificationId` 等之后），添加：

```tsx
<Route path="/access-denied" element={<AccessDeniedPage />} />
```

Import:
```tsx
import AccessDeniedPage from '@/pages/AccessDeniedPage';
```

#### 3. 修改 ProtectedRoute — 角色不足时跳转 403

**文件:** `frontend/src/components/ProtectedRoute.tsx` L49

```tsx
// 修改前:
return <Navigate to="/" replace />;

// 修改后:
return <Navigate to="/access-denied" replace />;
```

> **注意：** 401（未登录）仍走现有 `<Navigate to="/login">` 逻辑，不受影响。仅 403（已登录但角色不足）走新页面。

#### 4. 测试要求

**前端：**
- `AccessDeniedPage` 渲染正确：403 数字、"Access Denied" 标题、ShieldAlert 图标
- 显示用户当前角色
- "Go Back" 按钮调用 `navigate(-1)`（或无历史时 `navigate('/')`）
- "Contact Admin" 按钮的 mailto 链接正确
- 移动端双按钮 stacking
- ProtectedRoute 角色不足时导航到 `/access-denied`

---

## 📋 执行顺序建议

1. **11.4** Badge Visibility Toggle（最大项，涉及 DB migration + 前后端）
2. **11.18** Skill UUID→Name（小项，与验证页相关，可紧接 11.4 验证页修改）
3. **11.5** LinkedIn Share Tab（前端为主，独立于其他 story）
4. **11.19** 403 Access Denied（完全独立，可最后做）

---

## ⚠️ 审核条件检查清单

在提交前请确认以下条件已满足：

| # | 条件 | 来源 | 相关 Story | 状态 |
|---|------|------|-----------|------|
| C-3 | PRIVATE badge OB assertion 仍可访问（方案B） | Architect | 11.4 | |
| C-5 | 双入口 toggle（Wallet 卡片 + Detail Modal），默认 PUBLIC | UX | 11.4 | |
| C-6 | 验证页需 OG meta tags（至少 static fallback） | UX | 11.5 | |
| UX | ClaimSuccessModal 添加 visibility 提示文字 | UX | 11.4 | |
| UX | LinkedIn tab 使用品牌色 SVG（#0A66C2） | UX | 11.5 | |
| UX | Tab 排序: Email → LinkedIn → Teams → Widget | UX | 11.5 | |
| UX | LinkedIn button "✓ opened" 状态 5s | UX | 11.5 | |
| UX | 403 页面显示当前角色，不显示所需角色 | UX | 11.19 | |
| UX | 403 双按钮: Go Back (outline) + Contact Admin (primary) | UX | 11.19 | |
| UX | 403 移动端按钮 flex-col sm:flex-row | UX | 11.19 | |
| UX | 401 仍走 /login，403 走 /access-denied | UX | 11.19 | |

---

## 🔧 Pre-Push Checklist（提交前必须全部通过）

> **Lesson 40:** 本地 pre-push 检查必须完整镜像 CI pipeline，避免推送后 CI 红。

在每次 `git push` 之前，请在本地依次执行以下命令，**全部通过后**再推送：

### Backend
```bash
cd gcredit-project/backend

# 1. ESLint（必须 0 errors + 0 warnings）
npx eslint . --max-warnings=0

# 2. TypeScript 编译检查（必须 0 errors）
npx tsc --noEmit

# 3. 单元测试（必须全部通过）
npm test

# 4. E2E 测试（必须全部通过）
npm run test:e2e
```

### Frontend
```bash
cd gcredit-project/frontend

# 1. ESLint（必须 0 errors + 0 warnings）
npx eslint . --max-warnings=0

# 2. TypeScript 编译检查（必须 0 errors）
npx tsc --noEmit

# 3. 单元测试（必须全部通过）
npm test -- --run
```

### 常见 CI 失败原因（Wave 2 教训）
| 原因 | 解决 |
|------|------|
| `--max-warnings=0` 不在本地检查中 | 使用上述完整命令 |
| TS1272: `import` 应为 `import type` | 检查 `tsconfig.json` 的 `verbatimModuleSyntax` |
| E2E response format change | 同步更新 E2E 测试断言 |
| 新 endpoint 缺少 E2E 覆盖 | 为新 API 添加基本 E2E 测试 |

> **规则：** 如果本地检查有任何失败，先修复再推送。不要假设 CI 会通过。
