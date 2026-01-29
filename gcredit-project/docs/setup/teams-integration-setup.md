# Microsoft Teams Integration Setup Guide

**Story:** 7.4 - Microsoft Teams Notifications  
**Last Updated:** 2026-01-30

## Overview

This guide explains how to configure Microsoft Teams notifications for badge issuance in the G-Credit platform.

## Prerequisites

- Microsoft 365 tenant with Teams
- Azure AD app registration with Graph API permissions
- Admin access to configure app permissions

## Configuration Steps

### 1. Environment Variables

Add the following variables to your `.env` file:

```bash
# Microsoft Graph API (required for Teams notifications)
GRAPH_TENANT_ID="your-tenant-id-here"
GRAPH_CLIENT_ID="your-client-id-here"
GRAPH_CLIENT_SECRET="your-client-secret-here"

# Teams Notifications Control
ENABLE_TEAMS_NOTIFICATIONS="true"

# Default Teams Channel (optional)
DEFAULT_TEAMS_TEAM_ID="your-team-id"
DEFAULT_TEAMS_CHANNEL_ID="your-channel-id"

# Platform URLs
PLATFORM_URL="https://your-domain.com"
FRONTEND_URL="https://your-domain.com"
```

### 2. Get Your Tenant ID

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **Overview**
3. Copy the **Tenant ID** value

### 3. Get Team ID and Channel ID

**Option A: Using Microsoft Teams Web**
1. Open Teams in browser: https://teams.microsoft.com
2. Navigate to your team → channel
3. Click "..." → **Get link to channel**
4. The URL format is: `https://teams.microsoft.com/l/channel/{channelId}/...?groupId={teamId}`
5. Extract `teamId` (after `groupId=`) and `channelId` (after `/channel/`)

**Option B: Using Graph API**
```bash
# List all teams
GET https://graph.microsoft.com/v1.0/me/joinedTeams

# List channels in a team
GET https://graph.microsoft.com/v1.0/teams/{team-id}/channels
```

### 4. Required Graph API Permissions

Your Azure AD app needs these **Application permissions**:

- `TeamsActivity.Send` - Send Teams activity feed notifications
- `User.Read.All` - Read user profiles
- `ChannelMessage.Send` - Send messages to channels (optional)

**How to add permissions:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Select your app
4. Go to **API permissions** > **Add a permission**
5. Select **Microsoft Graph** > **Application permissions**
6. Add the permissions listed above
7. Click **Grant admin consent**

### 5. Verify Configuration

Start the backend server and check logs:

```bash
npm run start:dev
```

Look for these startup messages:

```
✅ Teams notifications are ENABLED
✅ Graph Token Provider initialized
✅ Graph Teams Service initialized
```

If you see warnings:
```
⚠️  Missing Microsoft Graph API configuration: GRAPH_TENANT_ID, GRAPH_CLIENT_ID
```

Check your `.env` file and ensure all required variables are set.

## Testing

### 1. Test Badge Issuance

Issue a badge to a user:

```bash
POST /api/badges
{
  "templateId": "your-template-id",
  "recipientId": "user-id",
  "evidenceUrl": "https://example.com/evidence.pdf"
}
```

The recipient should receive:
- ✅ Teams notification with Adaptive Card
- ✅ Email notification (if Teams fails)

### 2. Test Claim Action

Click "Claim Badge" button in Teams notification.

Expected behavior:
- Badge status updates to `CLAIMED`
- Adaptive Card updates to show claimed status
- No errors in backend logs

## Troubleshooting

### Teams Notifications Not Sent

**Check 1: Configuration**
```bash
# Verify env variables
echo $ENABLE_TEAMS_NOTIFICATIONS  # Should be "true"
echo $GRAPH_TENANT_ID             # Should not be empty
```

**Check 2: Permissions**
- Ensure admin consent granted for Graph API permissions
- Check user has Teams license
- Verify user email matches Azure AD

**Check 3: Logs**
```bash
# Backend logs
grep "Teams notification" backend.log

# Look for:
✅ Teams notification sent successfully
# OR
❌ Failed to send Teams notification
📧 Attempting email fallback
```

### Email Fallback Not Working

**Check email service configuration:**
```bash
# Verify SMTP or Graph Email settings
echo $GRAPH_CLIENT_ID
echo $GRAPH_CLIENT_SECRET
```

If both Teams and email fail, check:
1. Network connectivity to Graph API
2. Service principal credentials
3. User permissions in Azure AD

### "Permission Denied" Errors

**Solution:**
1. Go to Azure Portal → App registrations
2. Select your app → API permissions
3. Ensure **admin consent** is granted (green checkmark)
4. If not, click **Grant admin consent for [Tenant]**

### Adaptive Card Not Displaying

**Common causes:**
- Invalid Adaptive Card JSON schema
- Missing required fields in card
- Teams client version too old (needs 1.4 support)

**Solution:**
Test your card at: https://adaptivecards.io/designer/

## Configuration Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_TEAMS_NOTIFICATIONS` | No | `false` | Enable/disable Teams notifications |
| `GRAPH_TENANT_ID` | Yes* | - | Azure AD tenant ID |
| `GRAPH_CLIENT_ID` | Yes* | - | App registration client ID |
| `GRAPH_CLIENT_SECRET` | Yes* | - | App registration secret |
| `DEFAULT_TEAMS_TEAM_ID` | No | - | Default team for notifications |
| `DEFAULT_TEAMS_CHANNEL_ID` | No | - | Default channel for notifications |
| `PLATFORM_URL` | Yes | `http://localhost:3000` | Backend API URL |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Frontend app URL |

\* Required only if `ENABLE_TEAMS_NOTIFICATIONS=true`

## Email Fallback

If Teams notification fails (network issues, user not licensed, etc.), the system automatically:

1. Logs the Teams failure
2. Sends email notification using existing template
3. Continues badge issuance (non-blocking)

This ensures users always receive notification even if Teams is unavailable.

## Security Notes

- Never commit `.env` file to git
- Rotate `GRAPH_CLIENT_SECRET` regularly
- Use Azure Key Vault in production
- Limit Graph API permissions to minimum required
- Enable audit logging for Teams messages

## Related Documentation

- [ADR-008: Microsoft Graph Integration Strategy](../../architecture/ADR-008-microsoft-graph.md)
- [Story 0.4: Graph Module Foundation](../../sprints/sprint-6/0-4-graph-foundation.md)
- [Story 7.4: Teams Notifications](../../sprints/sprint-6/7-4-teams-notifications.md)
- [Adaptive Card Specifications](../../sprints/sprint-6/adaptive-card-specs.md)

## Support

For issues or questions:
1. Check backend logs: `npm run start:dev`
2. Verify configuration: Review this guide
3. Test Graph API: Use [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
4. Open GitHub issue with logs and configuration (redact secrets!)
