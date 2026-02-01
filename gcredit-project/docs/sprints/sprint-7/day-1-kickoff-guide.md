# Sprint 7 Day 1 Kickoff - Developer Communication Guide

**Date:** February 3, 2026  
**Participants:** LegendZhu (Product Owner) + Amelia (Developer)  
**Duration:** 15-20 minutes  
**Purpose:** Ensure developer understands all Sprint 7 implementation details

---

## 📋 Kickoff Meeting Agenda

### **Opening (2 min)**

> "Morning Amelia! 今天是Sprint 7 Day 1，我们要开始Badge Revocation + Complete Lifecycle UAT。我想花15分钟确认一下所有开发细节，确保你有所有需要的信息。"

---

### **Part 1: Sprint Overview (3 min)**

**✅ 你需要说的：**

1. **Sprint目标：**
   > "这个sprint有2个主要目标：
   > - 实现Badge撤销功能（Epic 9，5个stories）
   > - 完成完整生命周期的UAT测试（3个stories）
   > - 加上Login系统（1个story）"

2. **Sprint时长变化：**
   > "Originally是5天，technical review后extended到**7天**（2月3-11日）。
   > 这是因为我们发现需要Login系统才能做UAT，所以加了Story 0.2a。"

3. **总工作量：**
   > "Total估算54.5小时，我们有56小时capacity（7天×8小时），有1.5小时buffer。"

---

### **Part 2: Critical Documentation (5 min)**

**✅ 指引开发者查看关键文档：**

#### **1️⃣ 最重要：Story Files**

> "所有story files都在 `docs/sprints/sprint-7/` 目录。
> 
> 每个story都已经完整更新了technical review的决策。你会看到：
> - **Technical Review Updates** section（在文件顶部）
> - Updated estimates（所有变化都有说明）
> - Revised ACs（具体的技术要求）"

**特别指出这些story：**
- **Story 9.1** (Day 1): "这个有完整的**TDD implementation guide**，500行详细指导。请follow TDD approach - write tests first!"
- **Story 0.2a** (Day 3): "这个有完整的**UX spec with wireframes and ARIA**，文件是 `login-ux-spec.md`"
- **Story U.2a** (Day 3): "这个有**M365 auto role detection**，会自动从org structure识别Manager和Employee"

#### **2️⃣ Timeline Reference**

> "Day-by-day的timeline在 `sprint-tracking.md`。
> 
> Key milestones:
> - **Day 1**: Story 9.1 (Backend foundation)
> - **Day 2**: Stories 9.2 + 9.3 (Frontend UX)
> - **Day 3**: Stories 0.2a + U.2a (Login + M365 sync) - **这天需要我参与**
> - **Day 4**: Stories 9.5 + 9.4 (Integration)
> - **Day 5-6**: Story U.1 (Complete UAT - 2 full days)
> - **Day 7**: Bug fixes + buffer"

#### **3️⃣ Technical Review Decisions**

> "所有technical decisions都documented在 `sprint-7-technical-review-meeting-minutes.md`。
> 
> Key decisions你需要知道：
> - Story 9.1要create **AuditLog table**（不只是Badge fields）
> - Badge.status用**REVOKED enum**（不是soft-delete）
> - API要**idempotent**（已经revoked的badge return 200 OK）
> - Story 0.2a是**MVP scope**（no token refresh, basic ARIA only）
> - Story U.2a用**auto role detection from M365**（你只需配置Admin和Issuer）"

---

### **Part 3: Day 1 Specific Instructions (5 min)**

**✅ 今天（Day 1）具体要做什么：**

#### **Story 9.1: Badge Revocation API (7 hours)**

> "今天的重点是Story 9.1。这个story有**TDD approach required**。
> 
> 请打开 `9-1-revoke-api.md`，里面有**Architect Notes section**，包括：
> - Phase 1: Database schema (30min) - 先写failing test，再implement
> - Phase 2: Service layer (1h) - 15-20个unit test examples
> - Phase 3: Controller (1h) - Complete implementation guide
> 
> Follow the TDD sequence: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR"

**重要技术点：**
1. **AuditLog Table:**
   > "Create new table - complete Prisma schema在story里"
   
2. **Authorization:**
   > "ADMIN can revoke any badge, ISSUER can only revoke their own"
   
3. **Idempotency:**
   > "Already-revoked badge应该return 200 OK with `alreadyRevoked: true` flag，不是400 error"
   
4. **Transaction:**
   > "Badge update和AuditLog creation要在same transaction（atomic）"

#### **Accessibility Setup (First 30 min)**

> "Today上午first 30 minutes，你需要verify accessibility tools。
> 
> Tools已经configured（我昨天做的）：
> - ESLint with jsx-a11y plugin ✅
> - axe-core in dev mode ✅
> - main.tsx已经import axe-setup ✅
> 
> 你只需要：
> 1. Run `npm run lint` - should work
> 2. Run `npm run dev` - console会显示axe violations（if any）
> 3. 如果有issues，check `accessibility-tools-setup.md`"

---

### **Part 4: Day 3 Coordination (3 min)**

**⚠️ 这部分很重要 - Day 3需要你参与：**

> "Day 3下午我们要implement Story U.2a - M365 User Sync。
> 
> **Before Story U.2a starts**，你会通知我准备：
> 1. Provide Admin和Issuer的email list（2-3个邮箱）
> 2. Verify M365 org structure有Manager-Employee relationships
> 3. Available for 15-min kickoff call
> 
> Story里面有**Developer Reminder section**提醒你这个。
> 
> Implementation会：
> - Auto-detect Manager（users with directReports）
> - Auto-detect Employee（users without directReports）
> - 你只需要在.env配置Admin和Issuer
> 
> 我们会一起test first sync，确认role distribution正确。"

---

### **Part 5: Questions & Clarifications (2-5 min)**

**✅ 问开发者：**

1. **"你对Sprint 7的overall goal clear吗？"**
   - Expected: Badge Revocation + Complete UAT

2. **"Story 9.1的TDD approach你comfortable吗？"**
   - Expected: Yes, 会follow architect notes

3. **"Day 3的M365 sync coordination你understand吗？"**
   - Expected: Yes, 会提前通知你

4. **"有任何questions about stories或者technical decisions吗？"**
   - Answer any questions

5. **"Accessibility tools setup你confident吗？"**
   - Expected: Yes, 会先verify

---

## 📝 Quick Reference Checklist

**给开发者的核心文档清单：**

```
✅ MUST READ:
├─ sprint-tracking.md          (Day-by-day timeline)
├─ 9-1-revoke-api.md           (Today's story with TDD guide)
├─ backlog.md                  (All stories overview)
└─ sprint-7-technical-review-meeting-minutes.md  (All decisions)

✅ READ BEFORE IMPLEMENTATION:
├─ 0-2-login-navigation.md     (Story 0.2a - Day 3)
├─ login-ux-spec.md            (Login wireframe - Day 3)
├─ U-2-demo-seed.md            (Story U.2a - Day 3)
└─ Each story file before starting

✅ REFERENCE:
├─ accessibility-tools-setup.md (If tools have issues)
├─ uat-test-plan.md            (UAT scenarios - Day 5-6)
└─ pre-development-checklist.md (All prep work done)
```

---

## 🚨 Red Flags to Watch

**告诉开发者注意这些：**

1. **"如果Story 9.1超过7小时："**
   > "立即告诉我。我们可以defer Story 9.4（notifications）到Sprint 8。"

2. **"如果Login implementation看起来超过6小时："**
   > "Stop and discuss。可能需要further scope reduction。"

3. **"如果M365 sync有issues："**
   > "我们有local mode fallback。可以用local fixtures instead。"

4. **"如果axe-core报很多violations："**
   > "Not all are blockers。Focus on form labels和ARIA only for MVP。"

---

## 💬 Suggested Opening Script

**完整的opening你可以这样说：**

---

> **"Morning Amelia! Ready for Sprint 7 Day 1?**
> 
> 今天我们start Badge Revocation功能。我想花15分钟quick sync确保你有all the context。
> 
> **Sprint Overview:**
> Sprint 7是7 working days，从今天到2月11日。Main goals是implement Badge Revocation + complete lifecycle UAT。总共11个stories，54.5 hours estimated。
> 
> **Today - Story 9.1 (7h):**
> Badge Revocation API是critical path上的first story。这个story has a complete TDD implementation guide in the story file。请follow TDD approach - write tests first，然后implement。
> 
> Key technical points:
> - Create new AuditLog table
> - Use REVOKED enum in Badge.status
> - API must be idempotent
> - Authorization: ADMIN可以revoke any，ISSUER只能revoke自己的
> 
> **First 30 minutes today:**
> 请verify accessibility tools（eslint + axe-core）。我昨天已经configured，你只需要run `npm run lint`和`npm run dev`确认working。
> 
> **Day 3 Heads Up:**
> Day 3下午我们implement M365 User Sync。你会need to notify我before starting，我需要provide Admin/Issuer emails和verify M365 org structure。We'll do first sync together。
> 
> **All Documentation:**
> 所有story files都updated with technical review decisions。每个story file有complete specs，包括revised ACs和implementation notes。
> 
> Key files:
> - `9-1-revoke-api.md` - Today's story (500 lines TDD guide)
> - `sprint-tracking.md` - Day-by-day timeline
> - `login-ux-spec.md` - Login wireframe for Day 3
> 
> **Any questions before you start?**"

---

## ✅ Success Criteria

**Meeting成功如果开发者能回答：**

1. ✅ "Sprint 7 main goal是什么？" 
   → Badge Revocation + UAT

2. ✅ "今天要做什么story？需要多久？"
   → Story 9.1, 7 hours

3. ✅ "Story 9.1的key technical requirements是什么？"
   → AuditLog table, REVOKED enum, idempotent API, authorization

4. ✅ "Day 3我什么时候需要参与？"
   → Story U.2a开始前，需要你provide emails和verify M365

5. ✅ "如果遇到blocker应该怎么办？"
   → 立即告诉你，讨论scope adjustment

---

## 📞 Follow-Up

**Meeting结束后：**

1. **Send summary message:**
   ```
   "Thanks for the sync! 
   Key reminders:
   - Today: Story 9.1 with TDD approach (7h)
   - Follow architect notes in story file
   - Day 3: We sync before M365 implementation
   - Any blocker: Tell me immediately
   
   Good luck! 🚀"
   ```

2. **Check-in timing:**
   - End of Day 1: "Story 9.1 complete?"
   - Day 2 afternoon: "Stories 9.2+9.3 on track?"
   - Before Day 3 afternoon: "Ready for M365 sync?"

---

**Created By:** Bob (Scrum Master)  
**Date:** February 2, 2026  
**Purpose:** Ensure smooth Sprint 7 Day 1 kickoff with complete developer context
