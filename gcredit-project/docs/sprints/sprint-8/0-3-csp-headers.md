# Story 0.3: CSP Security Headers

**Story ID:** Story 0.3  
**Epic:** Security Hardening  
**Sprint:** Sprint 8  
**Priority:** HIGH  
**Story Points:** 1  
**Status:** Sprint 8 Backlog  
**Created:** February 1, 2026 (Split from Story 0.2 during Technical Review)

---

## Context

During Sprint 7 Technical Review, the Software Architect identified that using localStorage for JWT tokens requires Content Security Policy (CSP) headers to mitigate XSS attacks.

This was originally in Story 0.2 scope but was split out because:
- It's a backend-only task (Story 0.2 is frontend-focused)
- Not required for Sprint 7 UAT (internal testing environment)
- Can be implemented independently in Sprint 8

**Reference:** Sprint 7 Technical Review Meeting Minutes, Decision #4

---

## User Story

**As a** Security Team member,  
**I want** Content Security Policy headers configured in the backend,  
**So that** XSS attacks are mitigated when using localStorage for token storage.

---

## Acceptance Criteria

### AC1: Helmet Middleware Installed
**Given** the NestJS backend application  
**When** I check the dependencies  
**Then** `@nestjs/helmet` is installed and configured

- [ ] Install `@nestjs/helmet` package
- [ ] Import and configure in `main.ts`
- [ ] Verify middleware loads on application startup

### AC2: CSP Directives Configured
**Given** the application is running  
**When** I check the HTTP response headers  
**Then** I see Content-Security-Policy header with appropriate directives

**Required CSP Directives:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://graph.microsoft.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

**Key Points:**
- `script-src 'self'` - Only allow scripts from our domain (prevents XSS)
- `connect-src` includes Microsoft Graph API for M365 integration
- `style-src 'unsafe-inline'` - Required for Tailwind CSS (consider nonce in production)
- `img-src data: https:` - Allow base64 images and external badge images

### AC3: Development Mode Compatibility
**Given** I am running the app in development mode  
**When** I use the frontend with CSP headers  
**Then** no console errors appear related to CSP violations

- [ ] Test with Vite dev server (localhost:5173)
- [ ] Verify hot module reload works
- [ ] Check browser DevTools for CSP violation warnings

### AC4: Production CSP Testing
**Given** the application is built for production  
**When** I test with production build  
**Then** CSP headers do not break functionality

- [ ] Build frontend with `npm run build`
- [ ] Serve production build
- [ ] Test login, navigation, badge verification flows
- [ ] Check for any CSP violations in console

---

## Technical Details

### Implementation Approach

**File:** `gcredit-project/backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Helmet with CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires inline styles
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://graph.microsoft.com'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow external images
    }),
  );

  // ... rest of configuration
  await app.listen(3000);
}
bootstrap();
```

### Testing CSP

**1. Check Headers (curl):**
```bash
curl -I http://localhost:3000/api/health
```

**2. Browser DevTools:**
- Open Console tab
- Look for CSP violation warnings (should be none)

**3. Test Scenarios:**
- Login flow (token storage)
- M365 API calls (connect-src)
- Badge image display (img-src)
- Navigation (script-src)

---

## Definition of Done

- [ ] `@nestjs/helmet` installed and configured
- [ ] CSP headers present in HTTP responses
- [ ] All CSP directives match security requirements
- [ ] No CSP violations in dev mode
- [ ] No CSP violations in production build
- [ ] All existing E2E tests pass
- [ ] Manual testing: Login, navigation, badge verification work
- [ ] Code committed to `sprint-8/security-hardening` branch
- [ ] PR reviewed and merged

---

## Dependencies

**Depends On:**
- Story 0.2a (Login System) - Must be implemented first to test localStorage

**Blocks:**
- None (security enhancement, not blocking feature)

---

## Risks & Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind inline styles break | Medium | Use `'unsafe-inline'` for `style-src` (acceptable tradeoff) |
| External badge images blocked | Medium | Include `https:` in `img-src` |
| Vite HMR breaks in dev mode | Low | Test thoroughly, adjust CSP for dev if needed |
| Microsoft Graph API blocked | High | Explicitly allow `graph.microsoft.com` in `connect-src` |

---

## Estimate Breakdown

| Task | Time |
|------|------|
| Install and configure Helmet | 15 min |
| Configure CSP directives | 15 min |
| Test dev mode | 10 min |
| Test production build | 10 min |
| Manual testing (all flows) | 10 min |
| **Total** | **60 min (1h)** |

---

## Future Enhancements (Technical Debt)

1. **CSP Nonce for Inline Styles:**
   - Replace `'unsafe-inline'` with nonce-based CSP
   - Requires Vite plugin configuration
   - Ticket: Create in Sprint 9+

2. **Strict CSP for External Resources:**
   - Whitelist specific badge image domains (not all `https:`)
   - Requires badge issuer registry
   - Ticket: Create after Badge Issuance MVP

3. **CSP Reporting:**
   - Add `report-uri` directive
   - Setup CSP violation logging endpoint
   - Monitor production violations
   - Ticket: Create in Sprint 9+

---

## References

- Sprint 7 Technical Review Meeting Minutes (Feb 1, 2026)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [NestJS Helmet Documentation](https://docs.nestjs.com/security/helmet)
- ADR-007: Security Best Practices (to be updated with CSP requirements)

---

**Created By:** Bob (Scrum Master)  
**Date:** February 1, 2026  
**Reason:** Split from Story 0.2 during Sprint 7 Technical Review (Decision #4)
