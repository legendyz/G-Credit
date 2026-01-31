# Azure AD App Setup for Microsoft Graph (Sprint 6)

**Purpose:** Configure Azure AD (Entra ID) app registration for Microsoft Graph email and Teams notifications.

---

## 1) Create App Registration
1. Go to **Azure Portal → Azure Active Directory → App registrations → New registration**
2. Name: **G-Credit Badge Platform**
3. Supported account types: **Single tenant**
4. Register

Record:
- **Application (client) ID** → `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → `AZURE_TENANT_ID`
- **Tenant domain** (e.g., `your-tenant.onmicrosoft.com`) → `AZURE_TENANT_DOMAIN`

---

## 2) Configure API Permissions
Add **Application** permissions:
- **Mail.Send**
- **TeamsActivity.Send**
- **Channel.ReadBasic.All**
- **User.Read.All**

Then click **Grant admin consent**.

---

## 3) Create Client Secret
1. Certificates & secrets → New client secret
2. Name: `G-Credit Backend - Sprint 6`
3. Copy secret value immediately → `AZURE_CLIENT_SECRET`

---

## 4) Update Backend Environment Variables
Add to `backend/.env`:
```bash
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_DOMAIN=your-tenant.onmicrosoft.com
GRAPH_API_SCOPE=https://graph.microsoft.com/.default
GRAPH_API_BASE_URL=https://graph.microsoft.com/v1.0
ENABLE_GRAPH_EMAIL=true
ENABLE_TEAMS_NOTIFICATIONS=true
GRAPH_EMAIL_FROM=badges@your-tenant-domain.onmicrosoft.com
DEFAULT_TEAMS_TEAM_ID=...
DEFAULT_TEAMS_CHANNEL_ID=...
```

---

## 5) Validate Setup
- Start backend: `npm run start:dev`
- Check logs for:
  - `✅ Graph Token Provider initialized`
  - `✅ Graph Email Service initialized`
  - `✅ Graph Teams Service initialized`

---

## Troubleshooting
- **Missing Azure AD config**: Ensure `AZURE_*` variables are set.
- **Invalid user**: Verify `GRAPH_EMAIL_FROM` exists in M365 tenant.
- **Teams errors**: Confirm Team/Channel IDs are correct and app has permissions.

---

**Owner:** Sprint 6 / Story 7.1
