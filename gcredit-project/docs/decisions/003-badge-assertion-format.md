
# ADR-003: Open Badges 2.0 Assertion Format


**ADR Number:** 003  
**Status:** ✅ Accepted  
**Date:** 2026-01-27  
**Deciders:** Development Team  
**Tags:** badge-issuance, open-badges, standards-compliance

---

## Context

Sprint 3 implements badge issuance functionality. We need to decide on the format for badge assertions (the digital representation of issued badges). The chosen format must:

1. Be verifiable and tamper-proof
2. Support export and sharing across platforms
3. Comply with industry standards
4. Enable future integration with external credential platforms
5. Support evidence attachments and expiration dates

## Decision Drivers

- **Interoperability**: Badges should be portable across systems
- **Verification**: Third parties must be able to verify authenticity
- **Future-proofing**: Format should be widely adopted and stable
- **Compliance**: Meet enterprise and education sector requirements
- **Developer Experience**: Clear specification and tooling support

## Options Considered

### Option 1: Open Badges 2.0 (IMS Global / 1EdTech) ✅ **SELECTED**

**Format:** JSON-LD (Linked Data)

**Example Structure:**
```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "https://gcredit.example.com/api/badges/{uuid}/assertion",
  "badge": {
    "type": "BadgeClass",
    "id": "https://gcredit.example.com/api/badge-templates/{templateId}",
    "name": "Azure Fundamentals Expert",
    "description": "Completed Azure Fundamentals certification",
    "image": "https://storage.azure.com/badges/azure-fundamentals.png",
    "criteria": {
      "narrative": "Pass Azure AZ-900 exam with 700+ score"
    },
    "issuer": {
      "type": "Profile",
      "id": "https://gcredit.example.com/issuer",
      "name": "G-Credit Learning & Development",
      "url": "https://gcredit.example.com",
      "email": "badges@gcredit.example.com"
    }
  },
  "recipient": {
    "type": "email",
    "hashed": true,
    "salt": "deadsea",
    "identity": "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5"
  },
  "issuedOn": "2026-01-27T10:00:00Z",
  "expires": "2027-01-27T10:00:00Z",
  "verification": {
    "type": "hosted",
    "url": "https://gcredit.example.com/api/badges/{uuid}/assertion"
  },
  "evidence": [
    {
      "id": "https://storage.azure.com/evidence/exam-result-12345.pdf",
      "name": "Exam Result Certificate",
      "description": "Official exam score report"
    }
  ]
}
```

**Pros:**
- ✅ Industry standard (adopted by 1EdTech, Mozilla, Credly, Accredible)
- ✅ Wide ecosystem support (LinkedIn, Badgr, Canvas LMS)
- ✅ Built-in verification mechanism
- ✅ Privacy-preserving (hashed recipient identity)
- ✅ Supports evidence, expiration, revocation
- ✅ JSON-LD enables semantic web integration
- ✅ Future migration path to Open Badges 3.0

**Cons:**
- ⚠️ Requires understanding of JSON-LD context
- ⚠️ Recipient hashing adds complexity
- ⚠️ Hosted verification requires public endpoint

**Implementation Requirements:**
- Store `assertionJson` as Prisma `Json` field
- Generate unique assertion URLs (`/api/badges/{id}/assertion`)
- Implement SHA-256 hashing for recipient identity
- Create public verification endpoint (no auth required)
- Support evidence file uploads to Azure Blob Storage

---

### Option 2: Custom JSON Format

**Pros:**
- ✅ Full control over structure
- ✅ Simpler implementation

**Cons:**
- ❌ No interoperability with external platforms
- ❌ Custom verification infrastructure needed
- ❌ Reinventing the wheel
- ❌ Limited adoption potential

**Verdict:** Rejected - Violates architectural principle of standards compliance

---

### Option 3: Open Badges 3.0 (Verifiable Credentials)

**Pros:**
- ✅ Latest standard (W3C Verifiable Credentials)
- ✅ Blockchain/DID support

**Cons:**
- ❌ Still emerging standard (limited adoption as of 2026)
- ❌ Complex implementation (cryptographic signatures)
- ❌ Tooling not yet mature
- ❌ Overkill for enterprise internal use case

**Verdict:** Rejected for Sprint 3 - Consider for future upgrade path

---

## Decision

**We will use Open Badges 2.0 JSON-LD format** for badge assertions.

### Implementation Details

#### 1. Data Model (Prisma)
```prisma
model Badge {
  id            String      @id @default(uuid())
  assertionJson Json        // Stores complete OB 2.0 assertion
  assertionUrl  String      // Public verification URL
  recipientHash String      // SHA-256 hash of recipient email
  // ... other fields
}
```

#### 2. Assertion Generation Service
```typescript
// src/badge-issuance/services/assertion-generator.service.ts
export class AssertionGeneratorService {
  generateAssertion(badge: Badge, template: BadgeTemplate, recipient: User) {
    return {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: this.getAssertionUrl(badge.id),
      badge: this.generateBadgeClass(template),
      recipient: this.hashRecipient(recipient.email),
      issuedOn: badge.issuedAt.toISOString(),
      expires: badge.expiresAt?.toISOString(),
      verification: {
        type: 'hosted',
        url: this.getAssertionUrl(badge.id)
      },
      evidence: this.mapEvidence(badge.evidenceUrl)
    };
  }
}
```

#### 3. Public Verification Endpoint
```typescript
// GET /api/badges/:id/assertion (public, no auth)
@Public()
@Get(':id/assertion')
async getAssertion(@Param('id') id: string) {
  const badge = await this.badgeService.findOne(id);
  if (badge.status === 'REVOKED') {
    throw new GoneException('Badge has been revoked');
  }
  return badge.assertionJson;
}
```

#### 4. Recipient Privacy
- Hash recipient email with SHA-256 + salt
- Store both plaintext (for internal use) and hash (for assertion)
- Never expose unhashed email in public assertion

#### 5. Evidence Management
- Store evidence files in Azure Blob Storage (`evidence` container)
- Generate SAS URLs with 1-year expiration
- Include evidence array in assertion

---

## Consequences

### Positive
- ✅ **Interoperability**: Badges can be imported into LinkedIn, Mozilla Backpack, Credly
- ✅ **Verification**: Third parties can verify authenticity via public URL
- ✅ **Standards Compliance**: Meets IMS Global / 1EdTech specification
- ✅ **Future-Proof**: Clear migration path to Open Badges 3.0
- ✅ **Ecosystem**: Can integrate with existing badging platforms
- ✅ **Export**: Recipients can download badges as PNG with embedded JSON

### Negative
- ⚠️ **Complexity**: JSON-LD context and hashing add implementation overhead
- ⚠️ **Public Endpoints**: Requires careful security design (DDoS protection)
- ⚠️ **Email Privacy**: Must implement proper hashing (Lesson 13: DTO conversion)

### Risks & Mitigations
- **Risk**: Assertion URL becomes broken link
  - **Mitigation**: Store assertion JSON in database (永久保存)
  - **Mitigation**: Implement permanent redirects for old URLs

- **Risk**: Recipient email change breaks verification
  - **Mitigation**: Store both original email hash and current user reference
  - **Mitigation**: Support "re-issue" workflow for email changes

---

## Compliance & Standards

- **IMS Global Open Badges 2.0:** https://www.imsglobal.org/spec/ob/v2p0/
- **Open Badges Specification:** https://openbadges.org/
- **JSON-LD 1.0:** https://www.w3.org/TR/json-ld/
- **W3C Verifiable Credentials (future):** https://www.w3.org/TR/vc-data-model/

---

## References

- [Open Badges 2.0 Specification](https://www.imsglobal.org/spec/ob/v2p0/)
- [Mozilla Open Badges](https://github.com/mozilla/openbadges-specification)
- [Credly API Documentation](https://www.credly.com/docs/)
- [Architecture Document - Badge Verification](../../architecture/system-architecture.md#badge-verification)
- [Lesson 13: Prisma JSON Types](../../lessons-learned/lessons-learned.md#lesson-13)

---

## Review Schedule

- **Next Review:** Sprint 5 (after MVP completion)
- **Migration to OB 3.0:** Consider in Sprint 10+ (when tooling matures)
- **Verification:** Monitor external platform compatibility in production

---

**ADR Status:** ✅ Accepted  
**Implementation Sprint:** Sprint 3  
**Related ADRs:** ADR-004 (Email Service Selection)
