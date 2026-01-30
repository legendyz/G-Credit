# Sprint 6 - Manual Testing Guide
# Badge Sharing & Social Proof Features

**Version:** 1.0  
**Date:** January 31, 2026  
**Test Environment:** Local Development (Backend: localhost:3000, Frontend: localhost:5173)

---

## 📋 Prerequisites

### Environment Setup
- [ ] Backend server running: `npm run start:dev` (from `backend/` folder)
- [ ] Frontend server running: `npm run dev` (from `frontend/` folder)
- [ ] Database seeded with test data
- [ ] Valid JWT token in localStorage (login as test user)

### Required Test Data
- [ ] At least 3 test badges (claimed status)
- [ ] Test user email addresses for email sharing
- [ ] Microsoft Teams configuration (optional, can skip if not configured)

### Browser Requirements
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (Mac only)
- [ ] Edge

---

## 🧪 Test Scenarios

### Test Suite 1: Badge Share Modal (Story 7.2, 7.3, 7.4)

#### Test 1.1: Open Share Modal
**Steps:**
1. Navigate to badge wallet (`http://localhost:5173/`)
2. Click on any badge card to open Badge Detail Modal
3. Click "Share Badge" button in footer

**Expected Result:**
- ✅ Share modal opens with 3 tabs: Email, Teams, Widget
- ✅ Badge name displayed in modal header
- ✅ Email tab selected by default

---

#### Test 1.2: Email Sharing - Valid Input
**Steps:**
1. Open Share Modal (see Test 1.1)
2. In Email tab, enter: `test1@example.com, test2@example.com`
3. Enter optional message: "Check out my new badge!"
4. Click "Send via Email" button

**Expected Result:**
- ✅ Loading spinner appears on button
- ✅ Success message displays: "Badge shared successfully!"
- ✅ Form clears after 2 seconds
- ✅ Modal auto-closes
- ✅ Backend console shows email sent log
- ✅ Database `badge_shares` table has new record (platform='email')

**API Call:** `POST http://localhost:3000/api/badges/{badgeId}/share`

---

#### Test 1.3: Email Sharing - Validation
**Steps:**
1. Open Share Modal
2. Leave email field empty
3. Click "Send via Email"

**Expected Result:**
- ✅ Error message: "Please enter at least one email address"
- ✅ No API call made

**Steps:**
1. Enter invalid emails: `not-an-email, , ,`
2. Click "Send via Email"

**Expected Result:**
- ✅ Error message: "Please enter valid email addresses"

---

#### Test 1.4: Teams Sharing
**Steps:**
1. Open Share Modal
2. Switch to "Teams" tab
3. Leave Team ID and Channel ID empty (use defaults)
4. Enter optional message: "New badge achievement!"
5. Click "Share to Teams"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Success message displays
- ✅ Modal auto-closes after 2 seconds
- ✅ Backend console shows Teams notification sent
- ✅ Database `badge_shares` table has new record (platform='teams')

**API Call:** `POST http://localhost:3000/api/badges/{badgeId}/teams/share`

**Note:** If Teams is not configured, expect error message with graceful handling.

---

#### Test 1.5: Widget Tab - Copy Link
**Steps:**
1. Open Share Modal
2. Switch to "Widget" tab
3. Click "Copy Widget Link" button

**Expected Result:**
- ✅ Success message: "Link copied!"
- ✅ Clipboard contains: `http://localhost:5173/badges/{badgeId}/embed`
- ✅ Success message auto-dismisses after 2 seconds

---

#### Test 1.6: Widget Tab - Open Generator
**Steps:**
1. Open Share Modal
2. Switch to "Widget" tab
3. Click "Open Widget Generator" button

**Expected Result:**
- ✅ New browser tab opens
- ✅ URL: `http://localhost:5173/badges/{badgeId}/embed`
- ✅ Widget generator page loads successfully

---

### Test Suite 2: Badge Analytics (Story 7.5)

#### Test 2.1: View Share Statistics
**Steps:**
1. Open Badge Detail Modal for a badge you shared in Test 1.2 or 1.4
2. Scroll to "Share Analytics" section

**Expected Result:**
- ✅ Section displays with 4 stat cards
- ✅ Total Shares: Shows correct count
- ✅ Email: Shows count from Test 1.2
- ✅ Teams: Shows count from Test 1.4
- ✅ Widget: Shows 0 (or count if widget was embedded)
- ✅ Section only visible if current user is badge owner/issuer

**API Call:** `GET http://localhost:3000/api/badges/{badgeId}/analytics/shares`

---

#### Test 2.2: View Share History
**Steps:**
1. In Share Analytics section, click "View Share History" button

**Expected Result:**
- ✅ History section expands
- ✅ Lists recent shares with:
  - Platform icon (📧/👥/🔗)
  - Recipient email (for email shares)
  - Timestamp
- ✅ Button text changes to "Hide Share History"
- ✅ Click again to collapse

**API Call:** `GET http://localhost:3000/api/badges/{badgeId}/analytics/shares/history?limit=10`

---

#### Test 2.3: Empty Analytics State
**Steps:**
1. Open Badge Detail Modal for a badge that has never been shared
2. Check Share Analytics section

**Expected Result:**
- ✅ Shows empty state message: "This badge hasn't been shared yet"
- ✅ Helpful text: "Click the 'Share' button below to start sharing!"

---

### Test Suite 3: Badge Widget Generator (Story 7.3)

#### Test 3.1: Widget Configuration
**Steps:**
1. Navigate to: `http://localhost:5173/badges/{badgeId}/embed`
2. Try all size options: Small, Medium, Large
3. Try all theme options: Light, Dark, Auto
4. Toggle "Show badge name and issuer details"

**Expected Result:**
- ✅ Live preview updates immediately on each change
- ✅ Small: 100x100px widget
- ✅ Medium: 200x200px widget
- ✅ Large: 300x300px widget
- ✅ Light theme: White background
- ✅ Dark theme: Dark background
- ✅ Details toggle: Shows/hides badge name and issuer

**API Call:** `GET http://localhost:3000/api/badges/{badgeId}/widget?size={size}&theme={theme}&showDetails={bool}`

---

#### Test 3.2: Copy Iframe Code
**Steps:**
1. On widget generator page, configure widget (e.g., Medium, Light, Details ON)
2. Click "Copy Code" button under "Iframe Embed"

**Expected Result:**
- ✅ Button shows "✓ Copied!" feedback
- ✅ Clipboard contains iframe code like:
  ```html
  <iframe src="..." width="220" height="220" frameborder="0"></iframe>
  ```
- ✅ Feedback disappears after 2 seconds

---

#### Test 3.3: Copy Standalone HTML
**Steps:**
1. On widget generator page
2. Click "Copy Code" button under "Standalone HTML"

**Expected Result:**
- ✅ Button shows "✓ Copied!"
- ✅ Clipboard contains complete HTML/CSS/JS code
- ✅ Code includes:
  - `<div id="badge-widget-..."></div>`
  - `<style>...</style>`
  - `<script>...</script>`

---

#### Test 3.4: Widget Cross-Origin Test
**Steps:**
1. Create a simple HTML file locally:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Test Widget Embedding</h1>
     <!-- Paste iframe code from Test 3.2 here -->
   </body>
   </html>
   ```
2. Open the HTML file in browser (file://)

**Expected Result:**
- ✅ Widget loads correctly (CORS enabled)
- ✅ Badge image displays
- ✅ Hover effect works
- ✅ Click opens verification page in new tab

**Note:** CORS must be enabled in backend (`main.ts`)

---

### Test Suite 4: Badge Download PNG (Story 6.4)

#### Test 4.1: Download Badge
**Steps:**
1. Open Badge Detail Modal
2. Click "Download PNG" button in footer

**Expected Result:**
- ✅ Button shows loading state: "Downloading..."
- ✅ File download starts automatically
- ✅ Downloaded file name: `{BadgeName}-badge.png`
- ✅ PNG file opens correctly in image viewer
- ✅ PNG file contains badge image with embedded assertion (baked badge)

**API Call:** `GET http://localhost:3000/api/badges/{badgeId}/download/png`

---

#### Test 4.2: Download Error Handling
**Steps:**
1. Remove JWT token from localStorage: `localStorage.removeItem('access_token')`
2. Try to download badge

**Expected Result:**
- ✅ Error alert: "Failed to download badge. Please try again."
- ✅ Button returns to normal state

---

### Test Suite 5: Admin Analytics Dashboard (Story 7.5)

#### Test 5.1: Access Dashboard
**Steps:**
1. Navigate to: `http://localhost:5173/admin/analytics`

**Expected Result:**
- ✅ Page loads with title "📊 Badge Sharing Analytics"
- ✅ Shows mock data (real API not yet implemented)
- ✅ Yellow notice banner: "Demo Mode: This page is currently displaying mock data"

---

#### Test 5.2: Time Range Selection
**Steps:**
1. On admin analytics page
2. Click "Last 7 Days" button
3. Click "Last 30 Days" button
4. Click "Last 90 Days" button

**Expected Result:**
- ✅ Selected button highlights (blue border + blue background)
- ✅ Data refreshes (currently mock data, no change)

---

#### Test 5.3: View Platform Distribution
**Steps:**
1. Check "Platform Distribution" section

**Expected Result:**
- ✅ Progress bars for Email, Teams, Widget
- ✅ Percentages add up to 100%
- ✅ Smooth animation on load

---

#### Test 5.4: View Top Shared Badges
**Steps:**
1. Scroll to "🏆 Top Shared Badges" table

**Expected Result:**
- ✅ Table shows top 5 badges
- ✅ Rank 1-3 show medal emojis (🥇🥈🥉)
- ✅ Rank 4+ show #4, #5 text
- ✅ Shows breakdown by platform (Email/Teams/Widget)

---

### Test Suite 6: Responsive Design

#### Test 6.1: Mobile View
**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 12 Pro
4. Navigate through all pages

**Expected Result:**
- ✅ Badge Detail Modal: Full screen on mobile
- ✅ Share Modal: Full screen on mobile
- ✅ Widget Generator: Responsive grid layout
- ✅ Admin Analytics: Stacked cards, scrollable table
- ✅ All buttons accessible and properly sized

---

#### Test 6.2: Tablet View
**Steps:**
1. In DevTools, select iPad Air
2. Test all features

**Expected Result:**
- ✅ Badge Detail Modal: 90% width, centered
- ✅ Share Modal: Centered dialog
- ✅ Analytics Dashboard: 2-column grid layout

---

### Test Suite 7: Cross-Browser Testing

#### Test 7.1: Firefox
**Steps:**
1. Open Firefox
2. Run Test 1.1 - 1.6 (Share Modal)
3. Run Test 3.1 - 3.4 (Widget Generator)

**Expected Result:**
- ✅ All features work identically to Chrome
- ✅ No console errors
- ✅ Animations smooth

---

#### Test 7.2: Safari (Mac Only)
**Steps:**
1. Open Safari
2. Run Test 1.1 - 1.6 (Share Modal)
3. Run Test 3.1 - 3.4 (Widget Generator)

**Expected Result:**
- ✅ All features work identically to Chrome
- ✅ Gradients render correctly
- ✅ No console errors

---

#### Test 7.3: Edge
**Steps:**
1. Open Microsoft Edge
2. Run Test 1.1 - 1.6 (Share Modal)
3. Run Test 3.1 - 3.4 (Widget Generator)

**Expected Result:**
- ✅ All features work identically to Chrome
- ✅ No console errors

---

## 🔍 Backend Verification

### Database Inspection
After running tests, check PostgreSQL database:

```sql
-- View all badge shares
SELECT * FROM badge_shares ORDER BY shared_at DESC LIMIT 10;

-- Count shares by platform
SELECT platform, COUNT(*) as count
FROM badge_shares
GROUP BY platform;

-- View shares for specific badge
SELECT * FROM badge_shares WHERE badge_id = 'YOUR_BADGE_ID';
```

**Expected Result:**
- ✅ Each share action creates a record
- ✅ Platform field: 'email', 'teams', or 'widget'
- ✅ Metadata JSON contains relevant info (recipient email, team ID, referrer URL)

---

### API Response Testing (Postman/cURL)

#### Test Email Sharing API
```bash
curl -X POST http://localhost:3000/api/badges/BADGE_ID/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmails": ["test@example.com"],
    "customMessage": "Test message"
  }'
```

**Expected Response:**
```json
{
  "message": "Badge shared successfully",
  "shareCount": 1
}
```

---

#### Test Analytics API
```bash
curl http://localhost:3000/api/badges/BADGE_ID/analytics/shares \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "total": 5,
  "byPlatform": {
    "email": 2,
    "teams": 1,
    "widget": 2
  }
}
```

---

#### Test Widget API (Public, No Auth)
```bash
curl http://localhost:3000/api/badges/BADGE_ID/widget?size=medium&theme=light&showDetails=true
```

**Expected Response:**
```json
{
  "html": "<div class=\"g-credit-badge-widget\">...</div>",
  "css": ".g-credit-badge-widget { ... }",
  "script": "(function() { ... })()"
}
```

---

## ✅ Test Results Template

Use this template to record test results:

| Test ID | Test Name | Chrome | Firefox | Safari | Edge | Pass/Fail | Notes |
|---------|-----------|--------|---------|--------|------|-----------|-------|
| 1.1 | Open Share Modal | ✅ | ⬜ | ⬜ | ⬜ | | |
| 1.2 | Email Sharing Valid | ✅ | ⬜ | ⬜ | ⬜ | | |
| 1.3 | Email Validation | ✅ | ⬜ | ⬜ | ⬜ | | |
| 1.4 | Teams Sharing | ✅ | ⬜ | ⬜ | ⬜ | | |
| 1.5 | Widget Copy Link | ✅ | ⬜ | ⬜ | ⬜ | | |
| 1.6 | Widget Generator | ✅ | ⬜ | ⬜ | ⬜ | | |
| 2.1 | View Statistics | ✅ | ⬜ | ⬜ | ⬜ | | |
| 2.2 | View History | ✅ | ⬜ | ⬜ | ⬜ | | |
| 2.3 | Empty State | ✅ | ⬜ | ⬜ | ⬜ | | |
| 3.1 | Widget Config | ✅ | ⬜ | ⬜ | ⬜ | | |
| 3.2 | Copy Iframe | ✅ | ⬜ | ⬜ | ⬜ | | |
| 3.3 | Copy HTML | ✅ | ⬜ | ⬜ | ⬜ | | |
| 3.4 | Cross-Origin | ✅ | ⬜ | ⬜ | ⬜ | | |
| 4.1 | Download Badge | ✅ | ⬜ | ⬜ | ⬜ | | |
| 4.2 | Download Error | ✅ | ⬜ | ⬜ | ⬜ | | |
| 5.1 | Admin Dashboard | ✅ | ⬜ | ⬜ | ⬜ | | |
| 5.2 | Time Range | ✅ | ⬜ | ⬜ | ⬜ | | |
| 5.3 | Platform Dist | ✅ | ⬜ | ⬜ | ⬜ | | |
| 5.4 | Top Badges | ✅ | ⬜ | ⬜ | ⬜ | | |
| 6.1 | Mobile View | ✅ | ⬜ | ⬜ | ⬜ | | |
| 6.2 | Tablet View | ✅ | ⬜ | ⬜ | ⬜ | | |

---

## 🐛 Known Issues & Limitations

1. **Admin Analytics Dashboard**: Currently displays mock data. Backend API endpoint not yet implemented.
   - **Workaround**: UI is fully functional and ready for backend integration.

2. **Teams Notifications**: Requires Microsoft Graph API configuration. If not configured:
   - **Expected Behavior**: Graceful error message, no crash.

3. **Widget Cross-Origin**: CORS must be enabled in backend (`main.ts`).
   - **Verification**: Check `app.enableCors()` is present.

4. **Badge Download**: Requires JWT authentication.
   - **Workaround**: Ensure user is logged in before testing.

---

## 📝 Test Sign-Off

**Tested By:** _______________________  
**Date:** _______________________  
**Environment:** Local / Staging / Production  
**Overall Status:** Pass / Fail / Partial  

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Blockers:**
_________________________________________________________________
_________________________________________________________________

**Sign-Off:** _______________________  
**Date:** _______________________
