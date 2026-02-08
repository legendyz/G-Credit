# Email Setup Guide — Microsoft Graph API

> **Updated:** TD-014 (Sprint 9) — All email delivery now uses Microsoft Graph API.
> Legacy SMTP/nodemailer/ACS paths have been removed.

## Prerequisites

1. Azure AD App Registration with `Mail.Send` permission
2. Microsoft 365 user mailbox (the "from" address)

## Environment Variables

```env
# Required — Azure AD credentials (for Graph API)
AZURE_AD_TENANT_ID="your-tenant-id"
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"

# Required — Enable Graph Email
ENABLE_GRAPH_EMAIL="true"

# Required — Sender email (must be a valid M365 user mailbox)
GRAPH_EMAIL_FROM="badges@your-tenant-domain.onmicrosoft.com"
```

## Architecture

```
EmailService (thin wrapper)
  └─ GraphEmailService (Microsoft Graph API)
       └─ GraphTokenProviderService (OAuth 2.0 Client Credentials)
```

- `EmailService.sendMail()` → delegates to `GraphEmailService.sendEmail()`
- `EmailService.sendPasswordReset()` → builds HTML template, calls `sendMail()`
- In development mode with `ENABLE_GRAPH_EMAIL=false`, emails are logged to console

## Development Mode (No Azure AD)

When `ENABLE_GRAPH_EMAIL` is `false` or not set, emails are **logged to console** instead of sent. 
This is the default for local development — no external services required.

## Testing

```powershell
cd gcredit-project/backend
npx jest --no-coverage --testPathPattern="email|auth" --forceExit
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Graph Email disabled" warning | Set `ENABLE_GRAPH_EMAIL=true` and configure Azure AD vars |
| "Graph client not initialized" | Verify Azure AD credentials are correct |
| 403 from Graph API | Ensure app has `Mail.Send` application permission (not delegated) |
| Rate limited (429) | GraphEmailService has built-in retry with exponential backoff |
