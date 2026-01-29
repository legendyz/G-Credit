# Story 7.3: Embeddable Badge Widget

Status: **backlog** 🔴  
*Note: This is a retroactive documentation file. Implementation has NOT been started yet.*

## Story

As a badge recipient,
I want to embed my badge on external websites,
so that I can display my credentials on my personal website, portfolio, or LinkedIn profile.

## Acceptance Criteria

1. [ ] User can generate embed code from badge detail page
2. [ ] Widget displays badge image and details correctly
3. [ ] Widget works in iframe and standalone HTML
4. [ ] Widget supports 3 sizes (small, medium, large) and 3 themes (light, dark, auto)
5. [ ] Widget click opens verification page in new tab
6. [ ] Widget records share in BadgeShare table
7. [ ] Widget works cross-origin (CORS configured)
8. [ ] Widget is responsive on mobile

## Tasks / Subtasks

### ⚠️ CRITICAL: Prisma 使用规范（开始前必读）

**🚨 Sprint 6 重大教训 - Lesson 22**

Story 7.3 需要访问 Prisma 数据库（Badge、BadgeShare表）。**在编写任何 Prisma 查询前，必须了解以下关键规范：**

**📖 完整文档**: [Lesson 22 - Prisma Schema Naming Conventions](../../lessons-learned/lessons-learned.md#lesson-22)

**关键要点:**
1. **关系名验证**: 使用 VSCode 自动完成验证正确的关系名
   - ✅ 正确: `badge.template` (不是 `badgeTemplate`)
   - ✅ 正确: `badge.issuer` (不是 `badge.badgeTemplate.issuer`)
   - ✅ 正确: `badge.recipient` (不是 `recipientUser`)

2. **User 模型字段**: 没有 `name` 字段
   - ❌ 错误: `user.name`
   - ✅ 正确: `user.firstName` + `user.lastName` 或 `user.email`

3. **测试 Mock 必须匹配真实 schema**:
   - ✅ 正确: `{ template: {...}, issuer: {...} }`
   - ❌ 错误: `{ badgeTemplate: {...} }`

4. **每次修改 Prisma 查询后运行**: `npm run build` (验证 TypeScript 类型)

**如果不遵守**: 可能导致编译错误（Lesson 22: 一个错误导致 137 个 TS 错误）

---

### Backend Implementation

- [ ] **Task 1: Widget Embedding API** (AC: #2, #3)
  - [ ] **PRE-CHECK**: 阅读上方 Prisma 使用规范
  - [ ] Create `GET /api/badges/:badgeId/widget` endpoint (returns HTML snippet)
  - [ ] Create `GET /api/badges/:badgeId/embed` endpoint (returns JSON for client-side rendering)
  - [ ] **Prisma 查询**: 使用正确关系名 (`badge.template`, `badge.issuer`)
  - [ ] Make API public (no authentication required)
  - [ ] Configure CORS for cross-origin embedding
  - [ ] **POST-CHECK**: Run `npm run build` to verify TypeScript types

- [ ] **Task 2: Widget Configuration Options** (AC: #4)
  - [ ] Implement size parameter: `small` (100x100), `medium` (200x200), `large` (300x300)
  - [ ] Implement theme parameter: `light`, `dark`, `auto`
  - [ ] Implement show details parameter: `true` (badge name + issuer), `false` (image only)
  - [ ] Return appropriate HTML/JSON based on parameters

- [ ] **Task 3: Widget Share Tracking** (AC: #6)
  - [ ] **依赖**: Story 7.5 必须先完成（创建 BadgeShare 表）
  - [ ] Record widget embeds in BadgeShare table
  - [ ] Use `platform='widget'` and `sharedAt` timestamp
  - [ ] Store referrer URL in metadata (if available)
  - [ ] **验证**: Mock 数据结构匹配真实 BadgeShare schema

### Frontend Implementation

- [ ] **Task 4: Widget Generator Page** (AC: #1)
  - [ ] Create new page: `/badges/:badgeId/embed`
  - [ ] Preview widget with different size/theme options
  - [ ] Copy HTML snippet button (for iframe embedding)
  - [ ] Copy standalone code button (for direct HTML embedding)
  - [ ] Display embedding instructions

- [ ] **Task 5: Embeddable Widget Component** (AC: #2, #5, #8)
  - [ ] Create standalone React component (can run outside main app)
  - [ ] Fetch badge data from public API
  - [ ] Render badge image + details based on options
  - [ ] Click opens badge verification page in new tab
  - [ ] Ensure responsive design (mobile, tablet, desktop)

### Testing

- [ ] **Task 6: Unit Tests** (AC: #2, #4, #6)
  - [ ] Test widget API endpoints (HTML/JSON responses)
  - [ ] Test widget configuration options (size, theme, details)
  - [ ] Test widget share tracking
  - [ ] **IMPORTANT**: Mock 数据必须使用正确的 Prisma 关系名
    - ✅ `mockBadge = { template: {...}, issuer: {...} }`
    - ❌ `mockBadge = { badgeTemplate: {...} }` (这会导致测试通过但编译失败)
  - [ ] Achieve >80% test coverage
  - [ ] **验证**: Run `npm run build` after all tests pass

- [ ] **Task 7: Integration Tests** (AC: #3, #7, #8)
  - [ ] Test embedding widget on test HTML page
  - [ ] Test iframe embedding
  - [ ] Test standalone HTML embedding
  - [ ] Test CORS configuration (cross-origin requests)
  - [ ] Test responsive behavior on mobile/tablet/desktop

- [ ] **Task 8: Cross-Browser Testing** (AC: #3)
  - [ ] Test on Chrome
  - [ ] Test on Firefox
  - [ ] Test on Safari
  - [ ] Test on Edge

## Dev Notes

### Architecture Patterns to Use

- **Public API Pattern**: Widget endpoints should be public (no authentication)
- **CORS Configuration**: Enable cross-origin requests for external embedding
- **Standalone Component**: Widget should work independently from main app
- **URL Parameters**: Support query parameters for widget configuration (size, theme, details)

### Suggested Source Tree Structure

```
backend/src/badge-sharing/
├── badge-sharing.controller.ts      # Add widget endpoints here
│   ├── GET /badges/:id/widget      # Returns HTML snippet
│   └── GET /badges/:id/embed       # Returns JSON
└── badge-sharing.service.ts         # Add widget tracking methods

frontend/src/
├── pages/
│   └── BadgeEmbed.tsx              # Widget generator page (/badges/:id/embed)
├── components/
│   └── badge/
│       └── BadgeWidget.tsx         # Standalone embeddable widget component
└── api/
    └── badgeApi.ts                 # Add widget API methods
```

### Testing Standards

- **Unit Tests**: Mock badge API, test widget rendering with different options
- **Integration Tests**: Create test HTML page, embed widget, verify functionality
- **Cross-Browser**: Test on Chrome, Firefox, Safari, Edge
- **Responsive**: Test on mobile (375px), tablet (768px), desktop (1024px+)
- **Coverage**: >80% for all widget-related code

### Project Structure Notes

**Alignment:**
- ✅ Widget endpoints in existing `badge-sharing` module (not a new module)
- ✅ Widget component can be standalone or part of main app
- ✅ CORS configuration in NestJS `main.ts`
- ✅ Public API follows REST conventions

**Key Design Decisions:**
- Widget should work without authentication (public badges only)
- Widget embeds should be tracked in BadgeShare table (for analytics)
- Widget should open verification page in new tab (not inline)
- Widget should support both iframe and standalone HTML embedding

### References

- **Epic Details**: [backlog.md](backlog.md) Lines 451-500+ (Story 7.3 specification)
- **Architecture**: [API Guidelines](../../architecture/api-guidelines.md)
- **CORS Configuration**: [NestJS CORS Docs](https://docs.nestjs.com/security/cors)
- **Open Badges Specification**: [Baking Specification](https://www.imsglobal.org/spec/ob/v2p0/#badge-baking)

## Dev Agent Record

### Agent Model Used

**Agent**: Not yet assigned  
**Model**: TBD

### Implementation Status

**Status**: 🔴 **NOT STARTED**

**Code Search Results**:
- ❌ No "widget" references found in backend codebase
- ❌ No widget API endpoints exist
- ❌ No widget component exists in frontend
- ✅ BadgeShare table exists (from Story 7.5) for tracking

**Dependencies**:
- Story 7.5 (BadgeShare table) - ✅ Assumed implemented
- Public badge API - ✅ Should already exist from earlier stories
- CORS configuration - ⚠️ May need to be added

### File List

**Not Yet Created** - No files exist for this story.

---

## Retrospective Notes

**Why No Story File Was Created Initially:**
Stories 7.2 and 7.3 were intended to be implemented directly from `backlog.md`, which contained complete specifications. However:
- Story 7.2 (Email Sharing) was successfully implemented
- **Story 7.3 (Widget Embedding) was NEVER implemented**

**Current Status:**
This story file is being created retroactively to:
1. Document that Story 7.3 was NOT implemented during Sprint 6
2. Provide a complete specification for future implementation
3. Maintain documentation consistency with other stories (7.2, 7.4)

**Priority Assessment:**
- Story 7.3 priority: **MEDIUM** (per backlog)
- Stories 7.1, 7.2, 7.4 were completed (HIGH priority)
- Story 7.5 (Analytics) status unknown
- Widget embedding can be implemented in a future sprint

**Recommendation:**
- Mark Story 7.3 as **backlog** in sprint tracking
- Consider implementing in future sprint if widget embedding is needed
- If not needed soon, consider descoping or deferring to later version

**Best Practice Going Forward:**
Always create dedicated story files using the `create-story` workflow before sprint planning to:
1. Clarify which stories are in scope vs out of scope
2. Provide detailed task breakdowns for estimation
3. Enable better sprint planning and capacity management
4. Track implementation status accurately

**Story File Creation:**
This file was created retroactively on **January 25, 2025** by Bob (Scrum Master) during Sprint 6 retrospective documentation review.
