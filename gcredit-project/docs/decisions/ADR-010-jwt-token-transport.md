# ADR-010: JWT Token Transport Migration

## Status

Accepted

## Date

2026-02-14

## Context

JWT tokens were stored in `localStorage`, making them accessible to any JavaScript running on the page. This creates a significant XSS vulnerability: if an attacker injects malicious scripts (via stored XSS, third-party library compromise, or browser extension), they can steal the access and refresh tokens and impersonate the user.

The security audit (Sprint 11, SEC-002) flagged this as a **P1 risk** requiring remediation.

## Decision

Migrate JWT token transport from `localStorage` + `Authorization: Bearer` header to **httpOnly cookies** with the following configuration:

### Cookie Configuration

| Cookie | Path | httpOnly | Secure | SameSite | Max Age |
|--------|------|----------|--------|----------|---------|
| `access_token` | `/api` | ✅ | Production only | Lax | 15 min |
| `refresh_token` | `/api/auth` | ✅ | Production only | Lax | 7 days |

### Frontend Changes

- Created `apiFetch()` wrapper (`src/lib/apiFetch.ts`) with `credentials: 'include'`
- Replaced all 30+ `fetch()` + `Authorization: Bearer` patterns across 19 files
- Removed all `localStorage.getItem/setItem/removeItem('accessToken')` calls
- `authStore.ts` no longer stores tokens — only tracks `user` and `isAuthenticated`

### Backend Changes

- Added `cookie-parser` middleware in `main.ts`
- `auth.controller.ts`: Sets cookies on login, register, refresh; clears on logout
- `jwt.strategy.ts`: Dual-read extraction (cookie priority → header fallback)
- Refresh/logout endpoints: Dual-read refresh token from cookie or body

### Migration Strategy

**Dual-write period:** The backend still returns tokens in the JSON body alongside Set-Cookie headers. This allows:

1. Gradual frontend migration (completed in this sprint)
2. Mobile/API clients to continue using Bearer headers during transition
3. The header fallback in `jwt.strategy.ts` ensures backward compatibility

## Consequences

### Positive

- **XSS cannot steal tokens**: httpOnly cookies are inaccessible to JavaScript
- **Automatic token transport**: No manual header management; `credentials: 'include'` handles it
- **Reduced frontend complexity**: 30+ fetch patterns simplified to `apiFetch()`
- **Path-scoped tokens**: Refresh token only sent to `/api/auth` endpoints

### Negative

- **CSRF risk**: Mitigated by `SameSite=Lax` (only top-level navigation sends cookies for cross-site requests). API mutations use POST/PATCH/DELETE which are not triggered by `<form>` submissions from other origins.
- **Cookie size**: JWT tokens add ~300-500 bytes to every API request header
- **One-time migration effort**: 30+ fetch call sites updated across 19 frontend files
- **Dev proxy configuration**: Vite proxy requires `cookieDomainRewrite: 'localhost'`

### Risks

- If a future requirement needs the token value in JavaScript (e.g., WebSocket auth), a separate mechanism will be needed
- Cookie path `/api` means the access token is sent to all API routes, not just authenticated ones (minimal overhead)

## References

- [OWASP: Token Storage on Client Side](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-storage-on-client-side)
- SEC-002: Security Audit Finding
- Story 11.6: Sprint 11 implementation story
