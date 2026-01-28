# ADR-005: Open Badges 2.0 Integration Architecture

**ADR Number:** 005  
**Title:** Open Badges 2.0 Integration Architecture  
**Date:** 2026-01-28  
**Status:** ✅ Accepted  
**Author(s):** Winston (Architect)  
**Deciders:** LegendZhu (Tech Lead), Winston (Architect)  
**Sprint:** Sprint 5 (Epic 6 - Badge Verification)

---

## Context

### Problem Statement

G-Credit needs to make digital badges **interoperable with external credential platforms** (Credly, Badgr, LinkedIn, Open Badge Passport). Currently, badges exist only within the G-Credit system and cannot be verified or imported by third-party platforms. This limits their value and portability for employees.

**Core Requirement:** Implement **Open Badges 2.0** standard compliance to enable:
1. Badge verification by external parties without G-Credit login
2. Badge import into major credential platforms
3. Self-verifying badge images (baked badges)
4. Cryptographic integrity assurance

### Background

**Current System State (Sprint 0-4):**
- Badges stored in PostgreSQL with custom schema
- Badge images in Azure Blob Storage (PNG format)
- Authentication required for all API access (JWT-based)
- No external verification mechanism
- No JSON-LD assertion generation

**Open Badges 2.0 Specification:**
- **Standard Body:** IMS Global Learning Consortium
- **Version:** 2.0 (released 2017, mature and stable)
- **Adoption:** Used by Credly, Badgr, Mozilla Backpack, Acclaim
- **Core Concept:** Three-layer architecture (Issuer → BadgeClass → Assertion)
- **Data Format:** JSON-LD (linked data)
- **Verification Method:** Hosted verification (vs. signed badges)

**Constraints:**
- Must maintain backward compatibility with existing badge schema
- No GPG/PGP signing infrastructure (prefer hosted verification)
- Azure Blob Storage must remain single source of truth for images
- Public API must be secure but accessible without authentication

**Stakeholders Affected:**
- Employees (badge recipients) - want portable credentials
- HR departments - need to verify badges in applicant resumes
- External platforms (Credly, Badgr) - need standard format for import
- G-Credit administrators - need to maintain data integrity

### Goals

1. **Interoperability:** Badges must validate on Open Badges Validator (https://openbadgesvalidator.imsglobal.org/)
2. **Portability:** Employees can download self-verifying badge images
3. **Security:** Public verification API doesn't compromise system security
4. **Data Integrity:** Badge assertions remain tamper-proof and immutable
5. **Minimal Disruption:** Existing badge issuance workflows unchanged

---

## Decision

### Solution

**Adopt Open Badges 2.0 Hosted Verification architecture** with the following implementation:

#### 1. JSON-LD Assertion Generation

Generate Open Badges 2.0 compliant JSON-LD assertions for all badges:

```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "https://g-credit.com/api/badges/{badgeId}/assertion",
  "badge": "https://g-credit.com/api/badge-templates/{templateId}",
  "recipient": {
    "type": "email",
    "hashed": true,
    "identity": "sha256$<hash>",
    "salt": "<random-salt>"
  },
  "issuedOn": "2026-01-28T10:30:00Z",
  "verification": {
    "type": "hosted",
    "verificationUrl": "https://g-credit.com/verify/{verificationId}"
  },
  "evidence": ["https://..."],
  "expires": "2027-01-28T10:30:00Z"
}
```

**Key Design Choices:**
- **Hosted Verification:** No GPG signatures (simpler, aligns with Azure hosting)
- **Hashed Recipients:** SHA-256 hash of email + salt (privacy protection)
- **URL-based IDs:** RESTful API endpoints serve as assertion IDs
- **Evidence Support:** Link to Sprint 4's evidence file system

#### 2. Three-Tier Data Model Mapping

Map G-Credit's existing schema to Open Badges 2.0 layers:

| Open Badges Layer | G-Credit Entity | API Endpoint |
|-------------------|-----------------|--------------|
| **Issuer** | Organization (hardcoded: "G-Credit") | `/api/issuer` |
| **BadgeClass** | `badge_templates` table | `/api/badge-templates/{id}` |
| **Assertion** | `badges` table | `/api/badges/{id}/assertion` |

**Database Schema Extension (minimal changes):**
```prisma
model Badge {
  // Existing fields...
  verificationId  String  @unique  // UUID for public verification
  metadataHash    String?          // SHA-256 hash of JSON-LD assertion
  
  @@index([verificationId])
}
```

#### 3. Public Verification API

Create public REST endpoints (no authentication):

- **`GET /verify/{verificationId}`** - Human-readable verification page
- **`GET /api/verify/{verificationId}`** - Machine-readable JSON-LD assertion
- **`GET /badges/{id}/download/png`** - Baked badge PNG download

**Security via:**
- Rate limiting (1000 req/hr per IP)
- CORS configuration (allow all origins)
- No sensitive data exposure (recipient email hashed)

#### 4. Baked Badge Implementation

Embed JSON-LD assertion into PNG iTXt chunk:

```typescript
// Using sharp package
await sharp(imageBuffer)
  .withMetadata({
    iTXt: {
      keyword: 'openbadges',
      value: JSON.stringify(assertion)
    }
  })
  .png()
  .toBuffer();
```

**Technical Justification:**
- PNG iTXt chunk is part of Open Badges 2.0 baking spec
- sharp package is industry standard (used by Credly, Badgr)
- Metadata preserved when badge shared/uploaded

### Rationale

**Why Hosted Verification (vs. Signed Badges)?**

1. **Simpler Implementation:** No GPG key management, no signing infrastructure
2. **Better for Cloud:** Hosted verification aligns with Azure App Service deployment
3. **Real-time Revocation:** Can revoke badges instantly (signed badges can't be recalled)
4. **Lower Maintenance:** No key rotation, no certificate expiration concerns
5. **Industry Adoption:** 80%+ of Open Badges platforms support hosted verification

**Why JSON-LD (vs. Plain JSON)?**

1. **Semantic Clarity:** Linked data provides unambiguous field meanings
2. **Standard Compliance:** Required by Open Badges 2.0 specification
3. **Future-Proof:** Enables advanced querying and graph-based relationships
4. **Platform Compatibility:** All major platforms (Credly, Badgr) expect JSON-LD

**Why Minimal Schema Changes?**

1. **Risk Mitigation:** Only 2 new columns (`verificationId`, `metadataHash`)
2. **Backward Compatibility:** Existing badge data unchanged
3. **Migration Safety:** Can generate verificationId for existing badges
4. **Performance:** Indexed verificationId enables fast public lookups

### Alternatives Considered

#### Alternative 1: Signed Badges (GPG/PGP)

- **Description:** Use GPG signatures to cryptographically sign badge assertions
- **Pros:**
  - No server dependency for verification (fully offline)
  - Stronger cryptographic guarantee (tamper-proof)
  - Badge portable even if G-Credit server goes down
- **Cons:**
  - Requires GPG key infrastructure (generation, storage, rotation)
  - Azure Key Vault integration complexity
  - Cannot revoke badges after signing
  - Key expiration requires re-signing all badges
  - Higher implementation complexity (2-3 weeks vs. 1 week)
- **Reason for Rejection:** Overkill for internal credential system; hosted verification sufficient for MVP

#### Alternative 2: Open Badges 3.0

- **Description:** Adopt newer Open Badges 3.0 specification (released 2022)
- **Pros:**
  - Latest standard with improved JSON-LD structure
  - Better alignment with Verifiable Credentials (W3C VC)
  - More flexible evidence and criteria modeling
- **Cons:**
  - Lower platform adoption (Credly/Badgr still primarily 2.0)
  - More complex data model (steeper learning curve)
  - Less mature tooling and validators
  - Migration path from 2.0 unclear
- **Reason for Rejection:** Open Badges 2.0 has broader compatibility; can upgrade to 3.0 later if needed

#### Alternative 3: Custom Verification Format

- **Description:** Design proprietary JSON format for G-Credit badges
- **Pros:**
  - Full control over schema design
  - No dependency on external standards
  - Simpler data model (no JSON-LD complexity)
- **Cons:**
  - Zero interoperability with external platforms
  - Defeats purpose of digital credentials (portability)
  - Employees cannot import badges to LinkedIn, Credly, etc.
  - No ecosystem support (validators, importers, displayers)
- **Reason for Rejection:** Violates core requirement of interoperability

#### Alternative 4: OAuth2 Protected Verification API

- **Description:** Require OAuth2 tokens for verification API access
- **Pros:**
  - Stricter access control
  - Can track which platforms verify badges
  - Prevent API abuse more effectively
- **Cons:**
  - Breaks "public verification" requirement
  - External users can't verify badges in resumes
  - Credly/Badgr can't import badges without OAuth setup
  - Adds friction to verification flow
- **Reason for Rejection:** Public verification is core to Open Badges philosophy

---

## Consequences

### Positive Consequences

1. **Interoperability Unlocked:**
   - Badges can be imported into Credly, Badgr, LinkedIn Certifications
   - HR departments can verify badges using standard tools
   - Employees gain portable credentials that work anywhere

2. **Industry Credibility:**
   - Compliance with IMS Global standard signals professionalism
   - Badges validate on Open Badges Validator (third-party assurance)
   - Aligns with educational technology best practices

3. **Future-Proof:**
   - Open Badges 2.0 is mature and stable (7+ years)
   - Clear migration path to Open Badges 3.0 if needed
   - Hosted verification pattern compatible with W3C Verifiable Credentials

4. **Security by Design:**
   - Recipient email privacy via hashing (GDPR-friendly)
   - Immutability via SHA-256 metadata hashing
   - Rate limiting prevents abuse of public API

5. **Minimal Technical Debt:**
   - Only 2 new database columns
   - Existing badge issuance flows unchanged
   - No infrastructure additions (no GPG, no signing servers)

### Negative Consequences

1. **Public API Attack Surface:**
   - New unauthenticated endpoints increase attack vectors
   - **Mitigation:** Rate limiting, CORS, comprehensive monitoring
   - **Mitigation:** No sensitive data in public API responses

2. **Revocation Visibility:**
   - Revoked badges still return data (with revoked status)
   - **Mitigation:** Clear "REVOKED" banner in verification UI
   - **Mitigation:** Cache-Control headers prevent stale data

3. **Storage Overhead:**
   - Baked badges duplicate assertion data (in PNG + database)
   - **Mitigation:** Azure Blob Storage is cheap ($0.018/GB)
   - **Impact:** ~100KB per badge (assertion + image) = $0.0018/1000 badges

4. **JSON-LD Learning Curve:**
   - Developers unfamiliar with linked data concepts
   - **Mitigation:** Comprehensive documentation in backlog.md
   - **Mitigation:** Reference implementations from Credly/Badgr

5. **Dependency on sharp Package:**
   - Native module (platform-specific binaries)
   - **Mitigation:** Lock version in package.json (sharp@^0.33.0)
   - **Mitigation:** Windows installation guide created (Sprint 5 doc)

### Risks

#### Risk 1: Open Badges Specification Changes

- **Description:** IMS Global releases breaking changes to specification
- **Probability:** Low (Open Badges 2.0 stable since 2017)
- **Impact:** Medium (require assertion format updates)
- **Mitigation:** 
  - Monitor IMS Global announcements
  - Version assertion format in API responses
  - Maintain backward compatibility for 12 months

#### Risk 2: External Platform Compatibility Issues

- **Description:** Credly/Badgr reject G-Credit badges due to format issues
- **Probability:** Medium (first implementation, subtle spec compliance)
- **Impact:** High (blocks employee badge portability)
- **Mitigation:**
  - Validate all assertions with Open Badges Validator before release
  - Manual testing with Credly/Badgr imports (Sprint 5 Story 6.4)
  - Create comprehensive testing guide (external-validator-testing-guide.md)

#### Risk 3: Rate Limiting Too Strict

- **Description:** 1000 req/hr limit blocks legitimate verification traffic
- **Probability:** Low (unlikely in MVP phase)
- **Impact:** Medium (verification pages fail to load)
- **Mitigation:**
  - Monitor rate limit hit rates in Azure Application Insights
  - Implement tiered rate limiting (higher for known platforms)
  - Adjust limits based on real usage patterns

#### Risk 4: Metadata Hash Tampering

- **Description:** Database compromise allows modifying badge data without updating hash
- **Probability:** Very Low (requires database-level breach)
- **Impact:** High (integrity verification fails)
- **Mitigation:**
  - Application-level integrity checks on every verification
  - Audit log for all badge modifications
  - Automated alerts on hash mismatches
  - Regular integrity scans of badge database

---

## Implementation

### Changes Required

#### Backend (NestJS)

- [x] **Verification Module Creation**
  - [ ] `src/verification/verification.module.ts`
  - [ ] `src/verification/verification.controller.ts`
  - [ ] `src/verification/verification.service.ts`

- [x] **Badge Service Extensions**
  - [ ] `generateOpenBadgesAssertion()` method
  - [ ] `generateBakedBadge()` method
  - [ ] `verifyIntegrity()` method

- [x] **Database Migration**
  - [ ] Add `verificationId` column (String, unique)
  - [ ] Add `metadataHash` column (String, 64 chars)
  - [ ] Generate verificationId for existing badges

- [x] **Public Decorator**
  - [ ] `src/common/decorators/public.decorator.ts`
  - [ ] Modify JWT auth guard to respect @Public()

- [x] **Rate Limiting**
  - [ ] Install `@nestjs/throttler@^5.0.0`
  - [ ] Configure global rate limiting (1000 req/hr)

#### Frontend (React)

- [x] **Verification Page**
  - [ ] `src/pages/VerifyBadgePage.tsx`
  - [ ] Public route configuration
  - [ ] Open Graph meta tags

- [x] **Badge Download UI**
  - [ ] Add "Download PNG" button to badge details
  - [ ] Add "Download JSON-LD" button

#### Dependencies

- [x] **NPM Packages**
  - [ ] Install `sharp@^0.33.0` (PNG processing)
  - [ ] Lock version in package.json

#### Documentation

- [x] **Technical Docs**
  - [ ] Open Badges 2.0 concepts guide (in backlog.md)
  - [ ] Public API security configuration guide
  - [ ] External validator testing guide
  - [ ] sharp installation guide (Windows-specific)

### Migration Path

**Phase 1: Backfill Existing Badges (Sprint 5 Start)**

```typescript
// Generate verificationId for all existing badges
async function backfillVerificationIds() {
  const badges = await prisma.badge.findMany({
    where: { verificationId: null }
  });
  
  for (const badge of badges) {
    const verificationId = uuidv4();
    const assertion = await generateOpenBadgesAssertion(badge);
    const metadataHash = computeHash(assertion);
    
    await prisma.badge.update({
      where: { id: badge.id },
      data: { verificationId, metadataHash }
    });
  }
}
```

**Phase 2: Deploy Public API (Sprint 5 Mid)**

1. Deploy verification endpoints to staging
2. Test with Open Badges Validator
3. Import test badge into Credly/Badgr
4. Deploy to production

**Phase 3: Enable Badge Downloads (Sprint 5 End)**

1. Add download buttons to existing badge detail pages
2. Generate baked badges on-demand (lazy generation)
3. Cache baked badges in Azure Blob Storage

### Testing Strategy

#### Unit Tests (20 tests)

- JSON-LD assertion generation
- Recipient email hashing
- Metadata hash computation
- Integrity verification logic

#### Integration Tests (5 tests)

- Open Badges Validator compliance
- Credly badge import
- Badgr badge import

#### E2E Tests (15 tests)

- Public verification page loads without auth
- Verification API returns valid JSON-LD
- Baked badge download
- Rate limiting enforcement
- Revoked badge display

#### Manual Testing

- Facebook Sharing Debugger (Open Graph tags)
- Twitter Card Validator
- LinkedIn Post Inspector

---

## References

### External Standards

- [Open Badges 2.0 Specification](https://www.imsglobal.org/spec/ob/v2p0/) - IMS Global
- [Open Badges Baking Specification](https://www.imsglobal.org/spec/ob/v2p0/#baking) - PNG iTXt chunk format
- [JSON-LD 1.1 Specification](https://www.w3.org/TR/json-ld11/) - W3C
- [Open Badges Validator](https://openbadgesvalidator.imsglobal.org/) - Compliance testing

### Platform Documentation

- [Credly Badge Import](https://support.credly.com/hc/en-us/articles/360021222231) - How badges are validated
- [Badgr Open Badges Support](https://support.badgr.com/hc/en-us/articles/360042344032) - Import requirements
- [Mozilla Backpack](https://github.com/mozilla/openbadges-backpack) - Reference implementation

### Internal Documents

- [Sprint 5 Backlog](../sprints/sprint-5/backlog.md) - User stories and acceptance criteria
- [Sharp Installation Guide](../sprints/sprint-5/sharp-installation-guide.md) - Windows setup
- [External Validator Testing Guide](../sprints/sprint-5/external-validator-testing-guide.md) - Platform testing
- [ADR-006: Public API Security](./006-public-api-security.md) - Security architecture
- [ADR-007: Baked Badge Storage](./007-baked-badge-storage.md) - Storage strategy

### Technical References

- [sharp Package Documentation](https://sharp.pixelplumbing.com/) - PNG manipulation
- [NestJS Throttler](https://docs.nestjs.com/security/rate-limiting) - Rate limiting
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate) - Schema changes

---

**Decision Status:** ✅ **ACCEPTED**  
**Implementation Sprint:** Sprint 5 (2026-01-29 to 2026-02-07)  
**Review Date:** 2026-02-07 (Sprint 5 Retrospective)  
**Last Updated:** 2026-01-28  
**Document Owner:** Winston (Architect)
