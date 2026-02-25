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

---

## SSO Configuration (Sprint 13 — Story 13.1)

### Redirect URI for SSO

1. Go to **Azure Portal → App registrations → G-Credit**
2. Under **Authentication → Platform configurations → Web**
3. Add redirect URI: `http://localhost:3000/api/auth/sso/callback` (development)
4. For production: add `https://<production-domain>/api/auth/sso/callback`

### Delegated API Permissions for SSO

Add **Delegated** permissions (in addition to existing Application permissions):
- `openid`
- `profile`
- `email`
- `User.Read`

Then click **Grant admin consent**.

> **Note:** These delegated permissions are for the SSO Authorization Code Flow. The existing Application permissions (Mail.Send, TeamsActivity.Send, etc.) for the Client Credentials flow are NOT affected.

### SSO Environment Variables

Add to `backend/.env`:
```bash
AZURE_SSO_CLIENT_ID="ceafe2e0-73a9-46b6-a203-1005bfdda11f"
AZURE_SSO_CLIENT_SECRET="<your-secret>"
AZURE_SSO_REDIRECT_URI="http://localhost:3000/api/auth/sso/callback"
AZURE_SSO_SCOPES="openid profile email User.Read"
```

### Dual OAuth Architecture

| Flow | Purpose | Library | Permissions |
|------|---------|---------|-------------|
| **Client Credentials** (Sprint 6) | App-only Graph API | `@azure/identity` | Application: Mail.Send, User.Read.All, etc. |
| **Authorization Code + PKCE** (Sprint 13) | User SSO login | `@azure/msal-node` | Delegated: openid, profile, email, User.Read |

Both flows share the same App Registration but operate independently.

**Owner:** Sprint 13 / Story 13.1
