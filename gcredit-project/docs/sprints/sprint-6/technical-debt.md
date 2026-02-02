# Sprint 6 Technical Debt

This document tracks known technical debt and future enhancements for Sprint 6.

## 🔧 Technical Debt Items

### 1. Teams Channel Sharing - Not Implemented

**Status**: Deferred to Future Sprint  
**Priority**: Medium  
**Estimated Effort**: 2-3 days  
**ID**: TD-006

#### Background
Teams channel sharing for badges was attempted but requires additional Microsoft Graph API permissions that need proper configuration and tenant admin approval.

#### 🧪 Skipped Tests (Must Re-enable When Resolved)

The following 4 test files are currently skipped due to missing permissions:

1. **`badge-issuance-teams-integration.spec.ts`**
   - Tests: Teams badge issuance notifications
   - Reason: Requires `ChannelMessage.Send` permission

2. **`graph-teams.service.spec.ts`**
   - Tests: Microsoft Graph Teams service methods
   - Reason: Requires `ChannelMessage.Send` permission

3. **`teams-sharing.controller.spec.ts`**
   - Tests: Teams sharing controller endpoints
   - Reason: Requires `ChannelMessage.Send` permission

4. **`teams-badge-notification.service.spec.ts`**
   - Tests: Teams notification service implementation
   - Reason: Requires `ChannelMessage.Send` permission

**⚠️ Important:** When TD-006 is resolved, remember to:
- [ ] Remove `.skip()` from all 4 test files
- [ ] Verify tests pass with real Teams environment
- [ ] Update this document status to ✅ Resolved
- [ ] Update `technical-debt-from-reviews.md` in Sprint 7

#### Current Implementation
- ✅ **Badge Issuance Notifications**: Email-based (private, working)
- ✅ **Badge Sharing**: Email-based (working)
- ❌ **Teams Channel Sharing**: Not implemented

#### What's Needed

**1. Microsoft Graph API Permissions**
Add to Azure AD App Registration (ceafe2e0-73a9-46b6-a203-1005bfdda11f):
- `ChannelMessage.Send` - Send messages to Teams channels
- Requires tenant admin consent

**2. Implementation Approach**
Two options explored:

**Option A: Activity Feed Notifications** (Attempted, requires Teams App)
- Endpoint: `/users/{userId}/teamwork/sendActivityNotification`
- Requires: Teams App manifest, installation, `TeamsActivity.Send` permission
- Complexity: High (Teams App deployment required)

**Option B: Channel Messages** (Preferred)
- Endpoint: `/teams/{teamId}/channels/{channelId}/messages`
- Requires: `ChannelMessage.Send` permission only
- Complexity: Medium (just needs permission, no Teams App)

**Recommendation**: Implement Option B (Channel Messages) when ready to add permissions.

#### Code References
- Controller: `backend/src/badge-sharing/controllers/teams-sharing.controller.ts` (currently disabled)
- Service: `backend/src/microsoft-graph/teams/teams-badge-notification.service.ts` (has `shareBadgeToTeamsChannel` method ready)
- Graph Service: `backend/src/microsoft-graph/services/graph-teams.service.ts` (has `sendChannelMessage` method ready)

#### Testing Notes
- Team ID used in testing: `5d22bf72-2a7b-4197-aef6-6ea68776dfda` (MSFT team)
- Channel ID: `19:07cNZC5HB8qTO8s29EnlqJqMiYjJXm3XF6fkMMsJNiA1@thread.tacv2`
- Error encountered: "Missing role permissions... API requires 'Teamwork.Migrate.All' or 'ChannelMessage.Send'"

#### Decision Rationale
- Badge notifications should be **private** (email is appropriate)
- Badge sharing to Teams channels is a **nice-to-have** feature for public celebration
- Email sharing provides sufficient functionality for MVP
- Teams integration can be added later when permissions are approved

---

### 2. Badge PNG Generation

**Status**: Deferred  
**Priority**: Low  
**Estimated Effort**: 1-2 days

#### Issue
The `GET /api/badges/:id/download/png` endpoint currently returns a placeholder response with instructions to implement image generation using Canvas or Sharp library.

#### What's Needed
- Image generation library (Sharp recommended)
- Badge template rendering
- PNG export functionality

#### Workaround
Users can:
- View badges in web UI
- Take screenshots
- Share via email with embedded images

See: `docs/development/badge-image-setup-guide.md`

---

## ✅ Completed Items

### Email Notifications
- ✅ Badge issuance email notifications
- ✅ Badge sharing via email
- ✅ Adaptive Card HTML templates
- ✅ Microsoft Graph Email Service integration

### Badge Sharing
- ✅ Email sharing with Adaptive Cards
- ✅ Share analytics tracking
- ✅ Authorization checks (only recipient/issuer can share)

---

## 📋 Future Enhancements

### Microsoft Teams Integration (Full)
When ready to implement:
1. Request `ChannelMessage.Send` permission from tenant admin
2. Enable Teams sharing endpoint
3. Add UI for selecting Teams channel
4. Test with real Teams environment

### Additional Features
- SMS notifications (requires Twilio integration)
- Slack integration
- LinkedIn badge sharing
- Badge collections/showcases

---

## 📝 Notes

**Decision Date**: January 31, 2026  
**Decision Maker**: Development Team  
**Review Date**: Next Sprint Planning

This technical debt is **acceptable** because:
- Core badge functionality works (issue, claim, revoke, verify)
- Email notifications are reliable and private
- Teams integration is a nice-to-have, not critical
- Implementation path is clear for future sprint

**No blockers for Sprint 6 completion**.
