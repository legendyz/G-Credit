# Sprint 7 Technical Review Meeting

**Meeting Type:** Cross-Functional Technical & UX Review  
**Sprint:** Sprint 7 - Badge Revocation & Complete Lifecycle UAT  
**Date:** [Schedule before Day 1 - February 3, 2026]  
**Duration:** 90-120 minutes  
**Status:** Scheduled

---

## 📋 Meeting Objectives

1. **Architecture Review** - Validate new architectural patterns (Auth, Revocation, M365 sync)
2. **UX Review** - Ensure Login/Navigation aligns with existing design system
3. **Technical Feasibility** - Identify risks and validate implementation approach
4. **Cross-Story Integration** - Verify Story 0.2 (Login) + Epic 9 (Revocation) work together
5. **Reference Compliance** - Confirm alignment with existing ADRs, architecture docs, UX specs

---

## 👥 Required Participants

| Role | Attendee | Responsibilities |
|------|----------|-----------------|
| **UX Designer** | Amelia (UX mode) | Review Login/Navigation UI, Revoked badge display, ensure consistency with [ux-design-specification.md](../planning/ux-design-specification.md) |
| **Software Architect** | Amelia (Architect mode) | Validate architectural decisions, review M365 integration, assess technical risks |
| **Lead Developer** | Amelia (Dev mode) | Confirm implementation feasibility, estimate risks, validate Story breakdowns |
| **Scrum Master** | Bob | Facilitate meeting, capture decisions, update stories if needed |
| **Product Owner** | LegendZhu | Final decision authority, clarify requirements, approve UX changes |

---

## 📚 Pre-Meeting Required Reading

### **Primary Documents (MUST READ):**
1. **Sprint 7 Planning Documents**
   - [backlog.md](backlog.md) - All 10 stories overview
   - [0-2-login-navigation.md](0-2-login-navigation.md) - NEW CRITICAL story
   - [9-1 through 9-5](9-1-revoke-api.md) - Epic 9 Badge Revocation stories
   - [U-2-demo-seed.md](U-2-demo-seed.md) - M365 user sync feature

2. **Existing Architecture Standards**
   - [system-architecture.md](../../architecture/system-architecture.md) - Core architectural decisions (12 decisions)
   - [ADR-008-microsoft-graph-integration.md](../../decisions/ADR-008-microsoft-graph-integration.md) - M365 Graph API patterns

3. **Existing UX Standards**
   - [ux-design-specification.md](../../planning/ux-design-specification.md) - Design principles, navigation patterns, multi-role UI guidelines (3,321 lines)

### **Reference Documents (Nice to Have):**
4. [architecture-diagrams.md](../../architecture/architecture-diagrams.md) - System diagrams
5. [sprint-6-strategy-adjustment-meeting.md](../../decisions/sprint-6-strategy-adjustment-meeting-2026-01-29.md) - Recent decisions
6. [uat-test-plan.md](uat-test-plan.md) - Complete lifecycle testing scenarios

---

## 🎯 Review Agenda

### **Part 1: Story 0.2 - Login & Navigation System (30 min)**

#### **UX Review Questions:**

1. **Navigation Pattern Compliance**
   - Q: Does proposed sidebar navigation match [ux-design-specification.md Section 8.2 "Role-Based Navigation"](../../planning/ux-design-specification.md#role-based-navigation)?
   - Q: How does Login page design align with existing visual system (colors, typography, spacing)?
   - Q: Dashboard design for 4 roles (ADMIN/ISSUER/MANAGER/EMPLOYEE) - are role-specific cards consistent with UX spec?

2. **Authentication UX**
   - Q: Login form validation feedback - matches error handling patterns?
   - Q: "Remember me" functionality needed for internal users?
   - Q: Logout placement - where in navigation?

3. **Missing UX Elements**
   - Q: Forgot password flow (deferred or MVP)?
   - Q: First-time login onboarding (show role-specific help)?
   - Q: Session timeout handling (modal or redirect)?

**Reference:** [ux-design-specification.md Lines 1-3321](../../planning/ux-design-specification.md)

#### **Architecture Review Questions:**

1. **State Management**
   - Q: Zustand for auth store - consistent with other state management? (Currently no global state)
   - Q: Token refresh strategy - align with JWT expiry in backend?
   - Q: Should we use React Context instead of Zustand for consistency?

2. **Routing Architecture**
   - Q: React Router Protected Routes - where does this fit in existing App.tsx structure?
   - Q: Role-based route guards - centralized or per-route?
   - Q: Public routes (verify, embed) - how to exclude from auth?

3. **Security Patterns**
   - Q: Token storage - localStorage or httpOnly cookie? (Security trade-offs)
   - Q: CSRF protection needed?
   - Q: XSS mitigation with stored tokens?

**Reference:** [system-architecture.md Decision 1.6: Authentication & RBAC](../../architecture/system-architecture.md#decision-16-authentication--rbac)

#### **Technical Feasibility:**

- **Estimate validation:** 4-6h for complete Login system realistic?
- **Dependencies:** Any backend API changes needed?
- **Testing complexity:** E2E tests for 4 roles + protected routes

**Deliverable:** ✅ Approve Story 0.2 design OR 🔄 Request design revisions

---

### **Part 2: Epic 9 - Badge Revocation (30 min)**

#### **UX Review Questions:**

1. **Revocation Modal Design**
   - Q: Modal interaction pattern - matches existing modal styles (if any)?
   - Q: Reason dropdown + notes textarea - field validation and max lengths?
   - Q: Confirmation dialog - clear enough to prevent accidental revocations?

2. **Revoked Badge Display**
   - Q: How to visually show revoked badges in employee wallet?
     - Option A: Greyed out with red "REVOKED" banner
     - Option B: Separate "Revoked Badges" section
     - Option C: Hidden by default, toggle to show
   - Q: Share button disabled - how to communicate why? (Tooltip? Disabled state styling?)
   - Q: Public verification page - how to display revocation (warning banner? Red status badge?)

3. **Admin UI for Revocation**
   - Q: Where does "Revoke" button appear in admin dashboard?
   - Q: Batch revocation needed? (Out of scope for Sprint 7, but design for future?)
   - Q: Audit log visibility - where do admins see revocation history?

**Reference:** [ux-design-specification.md Section 10: Edge Cases - Revoked Credentials](../../planning/ux-design-specification.md#edge-cases)

#### **Architecture Review Questions:**

1. **Database Schema Changes**
   - Q: 4 new Badge fields (revokedAt, revokedBy, revocationReason, revocationNotes) - migration strategy?
   - Q: Audit log entry creation - same transaction as revocation?
   - Q: Index needed on `revokedAt` for queries?

2. **API Design**
   - Q: `POST /api/badges/:id/revoke` - idempotent? (Can revoke already-revoked badge?)
   - Q: Authorization: Who can revoke? (ADMIN only? ISSUER who issued it?)
   - Q: Notification pipeline - async or sync email sending?

3. **Open Badges 2.0 Compliance**
   - Q: JSON-LD assertion update - `revoked: true` and `revokedAt` timestamp sufficient?
   - Q: Verification endpoint behavior - still return assertion or 404?
   - Q: Baked badge image update needed?

**Reference:** 
- [system-architecture.md Decision 1.2: Badge Data Model](../../architecture/system-architecture.md#decision-12-badge-data-model)
- [ADR-003: Badge Assertion Format](../../decisions/003-badge-assertion-format.md)

#### **Technical Feasibility:**

- **Stories 9.1-9.5 estimates:** 5h + 4h + 4h + 3h + 4h = 20h (Day 1-2) realistic?
- **Testing coverage:** Revocation + notification + UI + verification = complex E2E scenarios
- **Rollback strategy:** If revocation deployed with bugs, can we undo?

**Deliverable:** ✅ Approve Epic 9 design OR 🔄 Request architecture changes

---

### **Part 3: Story U.2 - M365 User Sync (20 min)**

#### **Architecture Review Questions:**

1. **Microsoft Graph Integration**
   - Q: GraphUsersService - consistent with existing GraphEmailService pattern?
   - Q: API permissions - User.Read.All already granted in Azure app registration?
   - Q: Rate limiting - how to handle 429 errors if org has 1000+ users?

2. **Hybrid Mode Design**
   - Q: `SEED_MODE=m365` environment variable - clear enough for developers?
   - Q: Fallback strategy if M365 API fails during seed?
   - Q: Should seed script support "partial sync" (e.g., only sync new users)?

3. **Role Mapping Configuration**
   - Q: YAML file `m365-role-mapping.yaml` - should this be checked into Git? (Security concern if emails exposed)
   - Q: Default role = EMPLOYEE - safe assumption?
   - Q: How to update role mapping without re-running seed?

**Reference:** [ADR-008: Microsoft Graph Integration](../../decisions/ADR-008-microsoft-graph-integration.md)

#### **Security & Privacy:**

- **Concern:** YAML contains real employee emails - Git commit history exposure
- **Concern:** Default password "TestPass123!" - must NEVER be used in production
- **Mitigation:** Add warning in seed script if NODE_ENV = production

**Deliverable:** ✅ Approve M365 sync design OR 🔄 Add security safeguards

---

### **Part 4: Integration & Risk Assessment (20 min)**

#### **Cross-Story Dependencies:**

1. **Story 0.2 ➔ Story U.1 (UAT)**
   - Dependency: UAT cannot run without Login system
   - Risk: If Story 0.2 delayed to Day 4, UAT blocked
   - Mitigation: Story 0.2 is CRITICAL priority, Day 3 morning only

2. **Story 9.5 (Admin UI) ➔ Story 0.2 (Login)**
   - Dependency: Admin revocation UI needs role-based navigation from Story 0.2
   - Risk: If navigation structure changes, Story 9.5 needs rework
   - Mitigation: Finalize navigation structure in this meeting

3. **Story U.2 (M365 Sync) ➔ Story U.1 (UAT)**
   - Dependency: UAT uses M365 org users for realistic testing
   - Risk: If M365 API fails, no test data
   - Mitigation: Local mode as fallback (`npm run seed:demo`)

#### **Technical Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Login system takes >6h (Story 0.2) | Medium | High | Pre-approve design now; dev starts with clear requirements |
| Revocation breaks existing verification | Low | Critical | Extensive E2E tests for verification endpoint |
| M365 API rate limiting during seed | Low | Medium | Add exponential backoff; fall back to local mode |
| Story 0.2 + Story 9.5 UI conflicts | Medium | Medium | Agree on navigation structure in this meeting |
| Zustand state management unfamiliar | Medium | Low | Dev can switch to React Context if needed |

#### **Timeline Validation:**

- **Day 1-2:** Epic 9 stories (20h estimated)
- **Day 3 morning:** Story 0.2 + Story U.2 (4-6h + 7.5h = 11.5h) - **CAN THIS FIT?**
- **Day 3 afternoon:** UAT prep
- **Day 4:** Complete UAT (6-8h)
- **Day 5:** Bug fixes

**Question:** Should Story 0.2 move to Day 2 afternoon to reduce Day 3 pressure?

**Deliverable:** ✅ Approve timeline OR 🔄 Adjust story schedule

---

### **Part 5: Design Decisions & Action Items (10 min)**

#### **Decisions to Make in This Meeting:**

1. **Login Page Design**
   - [ ] Approve Login page wireframe (to be presented by UX Designer)
   - [ ] Decide: Remember me checkbox - include or defer?
   - [ ] Decide: Forgot password link - show but not functional, or hide?

2. **Navigation Structure**
   - [ ] Approve sidebar menu items for each role (ADMIN/ISSUER/MANAGER/EMPLOYEE)
   - [ ] Decide: Where to place Logout button (sidebar bottom? top-right user menu?)
   - [ ] Decide: Dashboard as default landing page for all roles?

3. **Revoked Badge Display**
   - [ ] Decide: Visual treatment for revoked badges in wallet (greyed out? separate section? hidden?)
   - [ ] Decide: Share button - disabled with tooltip or remove entirely?
   - [ ] Decide: Revocation reason - show to employee or keep private?

4. **M365 Role Mapping**
   - [ ] Decide: YAML file location - config/ directory or prisma/seed/ directory?
   - [ ] Decide: Should role mapping support regex (e.g., `*@hr.company.com: ISSUER`)?
   - [ ] Decide: Update role mapping after initial seed - supported or manual DB update?

5. **Timeline Adjustment**
   - [ ] Decide: Story 0.2 stays on Day 3 OR moves to Day 2 afternoon?
   - [ ] Decide: If Day 3 too tight, which story defers to Sprint 8?

---

## 📝 Meeting Outcomes Template

### **Decisions Made:**

#### Decision 1: [Topic]
- **Option Chosen:** [A/B/C]
- **Rationale:** [Why this option?]
- **Owner:** [Who implements?]
- **Deadline:** [When?]

#### Decision 2: [Topic]
- **Option Chosen:** [A/B/C]
- **Rationale:** [Why this option?]
- **Owner:** [Who implements?]
- **Deadline:** [When?]

*(Repeat for all decisions)*

---

### **Action Items:**

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Update Story 0.2 with approved Login design | Dev (Amelia) | Day 1 start | ⏳ Pending |
| Create wireframes for revoked badge display | UX Designer | Before Day 2 | ⏳ Pending |
| Validate M365 User.Read.All permission granted | Product Owner | Before Day 3 | ⏳ Pending |
| Update sprint-tracking.md if timeline adjusted | Scrum Master | After meeting | ⏳ Pending |

---

### **Risks Identified:**

| Risk | Mitigation | Owner | Tracking |
|------|-----------|--------|----------|
| [Risk description] | [Mitigation plan] | [Owner] | [Status] |

---

### **Open Questions (Deferred):**

1. Question about [topic] - defer to Sprint 8 planning
2. Question about [topic] - research needed, revisit Day 3

---

## 🎨 UX Design Artifacts Needed

**Before Meeting:**
- [ ] Login page wireframe (low-fidelity mockup showing form layout)
- [ ] Navigation sidebar mockup for 4 roles (side-by-side comparison)
- [ ] Revoked badge display options (3 mockups: greyed out / separate section / hidden)

**After Meeting (if approved):**
- [ ] High-fidelity Login page design (Figma/Sketch)
- [ ] Dashboard layout for each role (placeholder cards)
- [ ] Revocation modal component spec (fields, validation, error states)

**Reference:** [ux-design-specification.md Section 8: Interaction Patterns](../../planning/ux-design-specification.md#interaction-patterns)

---

## 🏗️ Architecture Artifacts Needed

**Before Meeting:**
- [ ] Sequence diagram: Login flow (user submits credentials → JWT token → redirect to dashboard)
- [ ] Sequence diagram: Revocation flow (admin clicks revoke → API call → email notification → audit log)
- [ ] Component diagram: Auth store (Zustand) integration with React components

**After Meeting (if needed):**
- [ ] Updated system architecture diagram (add Login/Auth layer)
- [ ] New ADR if architectural pattern changed (e.g., ADR-009: Client-Side State Management)

**Reference:** [architecture-diagrams.md](../../architecture/architecture-diagrams.md)

---

## 📊 Success Criteria for This Meeting

**Meeting is successful if:**
- ✅ All participants agree on Login page design and navigation structure
- ✅ Revoked badge display pattern decided (no ambiguity for dev)
- ✅ M365 sync security concerns addressed
- ✅ Timeline validated or adjusted with team consensus
- ✅ All action items assigned with clear deadlines
- ✅ Zero blocker risks remaining (all mitigated or accepted)

**Meeting failed if:**
- ❌ UX design rejected and requires major rework
- ❌ Architecture conflicts with existing ADRs discovered
- ❌ Estimates deemed unrealistic, stories need re-scoping
- ❌ Multiple unresolved open questions blocking Day 1 start

---

## 📎 Related Documents

### **Sprint 7 Planning:**
- [backlog.md](backlog.md) - Sprint 7 backlog
- [kickoff-readiness.md](kickoff-readiness.md) - Kickoff checklist
- [sprint-tracking.md](sprint-tracking.md) - Daily progress tracking

### **Architecture Standards:**
- [system-architecture.md](../../architecture/system-architecture.md) - Core decisions
- [architecture-diagrams.md](../../architecture/architecture-diagrams.md) - System diagrams
- [ADR-008-microsoft-graph-integration.md](../../decisions/ADR-008-microsoft-graph-integration.md) - M365 patterns

### **UX Standards:**
- [ux-design-specification.md](../../planning/ux-design-specification.md) - Design system (3,321 lines)

### **Previous Sprint Decisions:**
- [sprint-6-strategy-adjustment-meeting.md](../../decisions/sprint-6-strategy-adjustment-meeting-2026-01-29.md) - Recent strategic decisions

---

## 🗓️ Scheduling Information

**Recommended Timing:**
- **Best:** February 2, 2026 (Day before Sprint 7 starts) - 2-4 PM
- **Acceptable:** February 3, 2026 (Day 1 morning) - 9-11 AM (delays dev start)
- **Not Recommended:** During Sprint 7 execution (design changes disrupt flow)

**Meeting Format:**
- **In-Person:** Whiteboard for wireframes and architecture diagrams
- **Remote:** Zoom + Miro/Figma for collaborative design review

**Prep Time Needed:**
- UX Designer: 2-3 hours (create wireframes)
- Architect: 1-2 hours (review stories, validate against ADRs)
- Dev: 1 hour (review estimates, identify technical risks)

---

## 📝 Meeting Notes

*[To be filled during meeting]*

---

**Meeting Organizer:** Bob (Scrum Master)  
**Document Created:** January 31, 2026  
**Last Updated:** January 31, 2026  
**Status:** 📅 Scheduled, pending participant confirmation

---

## Appendix: Key Questions Summary

### **Critical Questions (Must Answer in Meeting):**
1. Login page design - approved as-is?
2. Navigation structure for 4 roles - finalized?
3. Revoked badge display - which visual option?
4. Story 0.2 timeline - Day 3 morning feasible or move earlier?
5. M365 role mapping YAML - security concerns addressed?

### **Important Questions (Inform Implementation):**
6. Auth state management - Zustand or React Context?
7. Token storage - localStorage or httpOnly cookie?
8. Revocation authorization - ADMIN only or ISSUER can revoke own badges?
9. Revocation reason visibility - show to employee or admin-only?
10. M365 sync fallback - auto-fallback to local mode if API fails?

### **Nice-to-Have Questions (Can Defer):**
11. Forgot password flow - include non-functional link?
12. Remember me - include in MVP?
13. Batch revocation - design for future extensibility?
14. Role mapping regex support - needed now or Sprint 8?
15. Session timeout modal - custom or browser default?

---

**Ready to Schedule? Contact:**
- LegendZhu (Product Owner) - final approval
- Amelia (multi-role: UX/Architect/Dev) - all review aspects
- Bob (Scrum Master) - facilitation and note-taking
