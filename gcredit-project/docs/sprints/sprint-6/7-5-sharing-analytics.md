# Story 7.5: Sharing Analytics

Status: **ready-for-dev** 🔵  
Priority: **MEDIUM** (Required by Stories 7.2, 7.3, 7.4)

## Story

As a badge issuer,
I want to track how badges are shared,
so that I can measure engagement and the reach of our credentials.

## Acceptance Criteria

1. [ ] BadgeShare table created and migrated to database
2. [ ] Email shares recorded (platform='email', recipientEmail, sharedAt)
3. [ ] Teams shares recorded (platform='teams', metadata with team/channel IDs)
4. [ ] Widget embeds recorded (platform='widget', metadata with referrer URL)
5. [ ] Badge detail page shows share counts by platform
6. [ ] Badge detail page shows share history (last 10 shares)
7. [ ] Only badge owner/issuer can view analytics
8. [ ] API endpoints tested and documented

## Tasks / Subtasks

### ⚠️ CRITICAL: Prisma Schema 命名规范（开始前必读）

**🚨 重大风险警告 - Lesson 22（Sprint 6）**

在修改 `schema.prisma` 前，**必须阅读并遵守以下规范**，否则可能导致整个代码库编译失败（137+ TypeScript错误）：

**📖 完整教训**: [Lesson 22 - Prisma Schema Naming Conventions](../../lessons-learned/lessons-learned.md#lesson-22-prisma-schema-naming-conventions-and-mock-testing-pitfalls)

**强制性规范（违反将导致项目损坏）:**

1. **✅ 正确的 Model 命名模式:**
```prisma
model BadgeShare {           // ✅ PascalCase 模型名
  id          String   @id @default(uuid())
  badgeId     String
  badge       Badge    @relation(fields: [badgeId], references: [id])
  // ... 其他字段
  
  @@map("badge_shares")      // ✅ snake_case 表名映射
}
```

2. **❌ 禁止的命名模式:**
```prisma
model badge_shares {         // ❌ 绝对禁止 snake_case 模型名
  id          String   @id
  // 这将破坏整个代码库的类型系统！
}
```

3. **🚫 禁止的操作:**
```bash
npx prisma format          # ❌ 禁止！会破坏 @@map() 设计
prettier schema.prisma     # ❌ 禁止！会重新格式化模型名
```

4. **✅ 允许的操作:**
```bash
npx prisma generate        # ✅ 重新生成 Prisma Client
npx prisma migrate dev     # ✅ 创建迁移
npx prisma db push         # ✅ 同步数据库
```

5. **三步强制验证（修改schema后必做）:**
```bash
npx prisma generate        # 步骤 1: 重新生成 Client
npm run build              # 步骤 2: TypeScript 编译检查
npm test                   # 步骤 3: 运行所有测试

# 如果步骤 2 出现大量错误（>10个），立即回退！
git checkout HEAD -- prisma/schema.prisma
```

6. **为什么这个规范如此重要:**
- Sprint 6 Story 7.4 教训: 一次 `prisma format` 导致 137 个 TypeScript 编译错误
- 影响范围: 所有使用 Prisma 的文件（几乎整个后端代码库）
- 修复成本: 如果继续修改需要更新 137+ 文件
- 实际解决: 回退 schema 到正确版本（零代码更改）

---

### Database Schema

- [ ] **Task 1: Create BadgeShare Table** (AC: #1)
  - [ ] **PRE-CHECK**: 确认现有 schema.prisma 中所有 model 都是 PascalCase
  - [ ] Create Prisma migration: `add_badge_share_table`
  - [ ] Define BadgeShare model in schema.prisma:
    - **⚠️ 使用**: `model BadgeShare { ... @@map("badge_shares") }`
    - **❌ 禁止**: `model badge_shares { ... }`
    ```prisma
    model BadgeShare {
      id             String   @id @default(uuid())
      badgeId        String
      badge          Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
      
      platform       String   // 'email', 'teams', 'widget'
      sharedAt       DateTime @default(now())
      sharedBy       String   // User ID who shared (optional for widget)
      
      // Platform-specific metadata
      recipientEmail String?  // For email shares
      metadata       Json?    // For Teams (team/channel), Widget (referrer URL)
      
      @@index([badgeId, platform])
      @@index([sharedAt])
      @@map("badge_shares")
    }
    ```
  - [ ] Add `shares BadgeShare[]` relation to Badge model
  - [ ] Run `npx prisma migrate dev --name add_badge_share_table`
  - [ ] **POST-CHECK**: 运行三步验证
    ```bash
    npx prisma generate  # 步骤 1
    npm run build        # 步骤 2 - 不应有错误
    npm test             # 步骤 3 - 全部通过
    ```
  - [ ] Verify migration in database

### Backend Implementation

- [ ] **Task 2: Badge Analytics Service** (AC: #2-4, #6)
  - [ ] **IMPORTANT**: 使用正确的 Prisma 关系名
    - ✅ `badge.template` (不是 `badgeTemplate`)
    - ✅ `badge.issuer` (不是 `badge.badgeTemplate.issuer`)
    - ✅ 使用 VSCode 自动完成验证关系名
  - [ ] Create `BadgeAnalyticsService` in badge-sharing module
  - [ ] Implement `recordShare(badgeId, platform, userId, metadata)` method
  - [ ] Implement `getShareStats(badgeId)` method (returns counts by platform)
  - [ ] Implement `getShareHistory(badgeId, limit)` method (returns recent shares)
  - [ ] Add authorization checks (only badge owner/issuer can view)
  - [ ] Unit tests with mocked Prisma client
    - **⚠️ Mock 数据必须匹配真实 schema**
    - ✅ 正确: `{ template: {...}, issuer: {...} }`
    - ❌ 错误: `{ badgeTemplate: {...} }`

- [ ] **Task 3: Integrate with Story 7.2 (Email)** (AC: #2)
  - [ ] Update `BadgeSharingService.shareViaEmail()` to call `recordShare()`
  - [ ] Pass `platform='email'`, `recipientEmail` in metadata
  - [ ] Replace TODO comment with actual implementation
  - [ ] Unit tests verify recordShare is called

- [ ] **Task 4: Integrate with Story 7.4 (Teams)** (AC: #3)
  - [ ] Update `TeamsSharingController.shareToTeams()` to call `recordShare()`
  - [ ] Pass `platform='teams'`, team/channel IDs in metadata
  - [ ] Unit tests verify recordShare is called

- [ ] **Task 5: Integrate with Story 7.3 (Widget)** (AC: #4)
  - [ ] Update widget embed endpoint to call `recordShare()`
  - [ ] Pass `platform='widget'`, referrer URL in metadata (if available)
  - [ ] Anonymous shares allowed (sharedBy can be null)
  - [ ] Unit tests verify recordShare is called

- [ ] **Task 6: Analytics API Endpoints** (AC: #5, #6, #7, #8)
  - [ ] Create `GET /api/badges/:badgeId/analytics/shares` endpoint
    - Returns: `{ total, byPlatform: { email: 5, teams: 3, widget: 12 } }`
    - Authorization: JWT required, badge owner or issuer only
  - [ ] Create `GET /api/badges/:badgeId/analytics/shares/history` endpoint
    - Query params: `?limit=10`
    - Returns: Array of share records with timestamps
    - Authorization: JWT required, badge owner or issuer only
  - [ ] Add Swagger documentation for both endpoints
  - [ ] Controller tests with mocked service

### Frontend Implementation

- [ ] **Task 7: Analytics Display on Badge Detail** (AC: #5, #6)
  - [ ] Add "Share Analytics" section to Badge Detail Modal
  - [ ] Display share counts by platform (Email: 5, Teams: 3, Widget: 12)
  - [ ] Display share history timeline (last 10 shares)
  - [ ] Format timestamps in user-friendly format
  - [ ] Only show if user is badge owner or issuer
  - [ ] Loading state while fetching analytics

- [ ] **Task 8: Admin Analytics Page (Optional)** 
  - [ ] Create `/admin/analytics` page
  - [ ] Show aggregate analytics across all badges
  - [ ] Most shared badges (top 10)
  - [ ] Platform distribution pie chart
  - [ ] Only accessible by ADMIN role

### Testing

- [ ] **Task 9: Unit Tests** (AC: #8)
  - [ ] BadgeAnalyticsService tests (recordShare, getShareStats, getShareHistory)
  - [ ] Authorization tests (owner/issuer can view, others cannot)
  - [ ] Badge sharing integration tests (7.2, 7.3, 7.4 call recordShare)
  - [ ] Achieve >80% test coverage

- [ ] **Task 10: Integration Tests** (AC: #1-4)
  - [ ] Test database migration successful
  - [ ] Test recordShare creates records in database
  - [ ] Test getShareStats returns correct counts
  - [ ] Test getShareHistory returns correct records
  - [ ] Test authorization (403 for unauthorized users)

- [ ] **Task 11: E2E Tests** (AC: #5, #6)
  - [ ] Share badge via email → Verify analytics updated
  - [ ] Share badge via Teams → Verify analytics updated
  - [ ] Embed widget → Verify analytics updated
  - [ ] View badge detail → Verify analytics displayed correctly

## Dev Notes

### Architecture Patterns to Use

- **Service Layer**: `BadgeAnalyticsService` handles all analytics logic
- **Database Relations**: BadgeShare → Badge (many-to-one)
- **Authorization**: Row-level security (only owner/issuer can view)
- **Metadata Storage**: JSON column for platform-specific data
- **Indexing**: Index on `badgeId + platform` for fast queries

### Suggested Source Tree Structure

```
backend/src/badge-sharing/
├── badge-sharing.service.ts         # Add recordShare() calls
├── services/
│   └── badge-analytics.service.ts   # NEW: Analytics logic
│   └── badge-analytics.service.spec.ts
└── controllers/
    └── badge-analytics.controller.ts # NEW: Analytics endpoints
    └── badge-analytics.controller.spec.ts

backend/prisma/
├── schema.prisma                     # Add BadgeShare model
└── migrations/
    └── XXXXXX_add_badge_share_table/ # NEW: Migration

frontend/src/
├── components/
│   └── badge/
│       └── BadgeAnalytics.tsx        # NEW: Analytics display
└── pages/
    └── admin/
        └── AnalyticsPage.tsx         # OPTIONAL: Admin analytics
```

### Database Schema Details

**BadgeShare Table**:
- `id`: UUID primary key
- `badgeId`: Foreign key to Badge (with CASCADE delete)
- `platform`: Enum-like string ('email', 'teams', 'widget')
- `sharedAt`: Timestamp (auto-generated)
- `sharedBy`: User ID (nullable for anonymous widget embeds)
- `recipientEmail`: Email address (only for email platform)
- `metadata`: JSON (flexible storage for platform-specific data)

**Indexes**:
- `(badgeId, platform)`: Fast queries for share counts by platform
- `(sharedAt)`: Fast queries for recent shares

**Example Data**:
```json
// Email share
{
  "id": "abc-123",
  "badgeId": "badge-456",
  "platform": "email",
  "sharedAt": "2026-01-30T10:30:00Z",
  "sharedBy": "user-789",
  "recipientEmail": "john@example.com",
  "metadata": null
}

// Teams share
{
  "id": "def-456",
  "badgeId": "badge-456",
  "platform": "teams",
  "sharedAt": "2026-01-30T11:00:00Z",
  "sharedBy": "user-789",
  "recipientEmail": null,
  "metadata": {
    "teamId": "team-123",
    "channelId": "channel-456",
    "channelName": "General"
  }
}

// Widget embed
{
  "id": "ghi-789",
  "badgeId": "badge-456",
  "platform": "widget",
  "sharedAt": "2026-01-30T12:00:00Z",
  "sharedBy": null, // Anonymous
  "recipientEmail": null,
  "metadata": {
    "referrerUrl": "https://johndoe.com/portfolio"
  }
}
```

### Testing Standards

- **Unit Tests**: Mock Prisma client, test analytics logic in isolation
- **Integration Tests**: Use test database, verify records created/queried
- **Coverage**: >80% for analytics service and controllers
- **Authorization**: Test 403 responses for unauthorized users

### Project Structure Notes

**Alignment:**
- ✅ Analytics service in `badge-sharing/services/` (not a separate module)
- ✅ Analytics controller in `badge-sharing/controllers/`
- ✅ Reuses existing authorization guards (JwtAuthGuard)
- ✅ Follows REST conventions (`/badges/:id/analytics/shares`)

**Key Design Decisions**:
- Analytics in `badge-sharing` module (not separate `analytics` module)
- JSON metadata column for flexibility (avoid adding columns per platform)
- BadgeShare records are NOT deleted when badge is deleted (CASCADE for audit trail)
- Anonymous widget embeds allowed (sharedBy can be null)

### API Response Examples

**GET /api/badges/:id/analytics/shares**:
```json
{
  "badgeId": "badge-456",
  "total": 20,
  "byPlatform": {
    "email": 8,
    "teams": 7,
    "widget": 5
  }
}
```

**GET /api/badges/:id/analytics/shares/history?limit=5**:
```json
{
  "badgeId": "badge-456",
  "shares": [
    {
      "id": "share-1",
      "platform": "teams",
      "sharedAt": "2026-01-30T14:30:00Z",
      "sharedBy": "user-123",
      "metadata": { "channelName": "Engineering" }
    },
    {
      "id": "share-2",
      "platform": "email",
      "sharedAt": "2026-01-30T13:00:00Z",
      "sharedBy": "user-123",
      "recipientEmail": "jane@example.com"
    }
  ]
}
```

### References

- **Epic Details**: [backlog.md](backlog.md) Lines 600-750 (Story 7.5 specification)
- **Prisma Migrations**: [Prisma Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- **JSON Columns**: [Prisma JSON Type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)
- **Architecture**: [API Guidelines](../../architecture/api-guidelines.md)

## Dev Agent Record

### Agent Model Used

**Agent**: TBD (Amelia or assigned dev)  
**Model**: TBD

### Implementation Status

**Status**: 🔵 **READY FOR DEV**

**Dependencies**:
- ✅ Story 7.2 (Email Sharing) - Complete, needs integration
- 🔴 Story 7.3 (Widget Embedding) - Not implemented yet
- ✅ Story 7.4 (Teams Notifications) - Complete, needs integration

**Estimated Effort**: 4-6 hours
- Task 1-2: Database + Service (2 hours)
- Task 3-5: Integration with Stories 7.2, 7.4 (1 hour)
- Task 6: API Endpoints (1 hour)
- Task 7-8: Frontend (1 hour)
- Task 9-11: Testing (1-2 hours)

**Blocking Issues**: None

**Technical Considerations**:
- Story 7.3 integration (Task 5) can be skipped if Story 7.3 is not implemented
- Admin analytics page (Task 8) is optional and can be deferred
- Consider using transaction when recording shares to ensure consistency

### File List

**Not Yet Created** - No files exist for this story.

**Files to Create**:
- `backend/prisma/migrations/XXXXXX_add_badge_share_table/migration.sql`
- `backend/src/badge-sharing/services/badge-analytics.service.ts`
- `backend/src/badge-sharing/services/badge-analytics.service.spec.ts`
- `backend/src/badge-sharing/controllers/badge-analytics.controller.ts`
- `backend/src/badge-sharing/controllers/badge-analytics.controller.spec.ts`
- `frontend/src/components/badge/BadgeAnalytics.tsx` (optional)

**Files to Update**:
- `backend/prisma/schema.prisma` (add BadgeShare model)
- `backend/src/badge-sharing/badge-sharing.service.ts` (add recordShare calls)
- `backend/src/badge-sharing/badge-sharing.module.ts` (register analytics service)
- `backend/src/badge-sharing/controllers/teams-sharing.controller.ts` (add recordShare calls)

---

## Implementation Notes

### 🚨 紧急回退程序（如果 TypeScript 编译出现大量错误）

**症状**: 修改 schema.prisma 后 `npm run build` 出现 >50 个 TypeScript 错误，且与 Prisma 相关

**立即执行以下步骤:**

```bash
# 1. 立即停止当前工作
# 2. 检查 schema.prisma 最近的更改
git log -3 --oneline -- prisma/schema.prisma

# 3. 对比差异
git diff HEAD~1 -- prisma/schema.prisma

# 4. 如果发现模型名被改为 snake_case，立即回退
git checkout HEAD~1 -- prisma/schema.prisma
npx prisma generate
npm run build

# 5. 验证错误消失后，提交回退
git add prisma/schema.prisma
git commit -m "fix(prisma): Revert schema format changes (Lesson 22)"
git push
```

**Root Cause**: 
- `npx prisma format` 或代码格式化工具将 `model User { @@map("users") }` 改为 `model users { }`
- 导致 Prisma Client 生成 `prisma.users` 而不是 `prisma.user`
- 破坏整个代码库的类型系统（137+ 文件受影响）

**Prevention**:
- 永远不要运行 `npx prisma format`
- 修改 schema 后立即运行三步验证
- 在 `.prettierignore` 中添加 `prisma/schema.prisma`

---

### Prisma 关系名速查表（Story 7.5 专用）

**当前项目 Schema 的关系名映射** (基于 Sprint 6 Lesson 22):

```prisma
// schema.prisma 定义
model badges {
  badge_templates                 badge_templates  @relation(...)
  users_badges_issuerIdTousers    users  @relation("badges_issuerIdTousers", ...)
  users_badges_recipientIdTousers users  @relation("badges_recipientIdTousers", ...)
}

// 实际 Prisma API 名称（代码中使用）
badge.template      // ✅ 不是 badgeTemplate
badge.issuer        // ✅ 不是 badgeTemplate.issuer
badge.recipient     // ✅ 不是 user 或 recipientUser

// 错误示例（常见错误）
badge.badgeTemplate        // ❌ Property 'badgeTemplate' does not exist
badge.badgeTemplate.issuer // ❌ Nested wrong
badge.credential           // ❌ Model 'credential' doesn't exist
```

**如何验证关系名:**
1. 打开 VSCode
2. 输入 `prisma.badge.findUnique({ include: { `
3. 等待自动完成提示
4. 看到的选项就是正确的关系名

**或者查看生成的类型:**
```bash
code node_modules/.prisma/client/index.d.ts
# 搜索 "export type badge" 查看可用关系
```

---

### Story 7.5 Development Pre-Flight Checklist

**在开始 Task 1 (创建 BadgeShare 表) 前:**
- [ ] 阅读完整 Lesson 22 文档
- [ ] 确认理解 PascalCase model + @@map() 模式
- [ ] 在 `.prettierignore` 中添加 `prisma/schema.prisma`
- [ ] 准备好三步验证命令（generate → build → test）
- [ ] 准备好紧急回退命令（在出错时使用）

**在 Task 2-5 (Service 开发) 前:**
- [ ] 使用 VSCode 自动完成验证关系名
- [ ] 参考 Story 7.4 中的正确 Prisma 查询（已修复）
- [ ] Mock 数据结构必须匹配真实 schema
- [ ] 每完成一个 service 方法就运行 `npm run build`

**在提交代码前:**
- [ ] `npm run build` 无错误
- [ ] `npm test` 全部通过
- [ ] 检查 schema.prisma 中所有 model 仍为 PascalCase
- [ ] Git diff 中 schema.prisma 的更改符合预期

---

## Development Notes (continued)

**Story 7.5 is a PREREQUISITE for complete Sprint 6 functionality:**
- Stories 7.2 and 7.4 have TODO comments: "Record share event in analytics (Story 7.5)"
- Without this story, share tracking is incomplete
- Analytics provide business value for measuring badge engagement

**Implementation Order**:
1. **First**: Create database migration and BadgeShare table
2. **Second**: Implement BadgeAnalyticsService
3. **Third**: Integrate with Stories 7.2 and 7.4 (remove TODO comments)
4. **Fourth**: Add API endpoints
5. **Fifth**: Add frontend display (optional but recommended)
6. **Last**: Integration and E2E tests

**Story File Creation:**
This file was created on **January 30, 2026** by Bob (Scrum Master) to prepare for remaining Sprint 6 work.
