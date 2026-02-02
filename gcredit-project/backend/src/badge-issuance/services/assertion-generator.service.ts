import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface BadgeTemplate {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  issuanceCriteria: any;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

@Injectable()
export class AssertionGeneratorService {
  private readonly baseUrl: string;
  private readonly issuerProfile: any;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    this.issuerProfile = {
      type: 'Profile',
      id: `${this.baseUrl}/issuer`,
      name: 'G-Credit Learning & Development',
      url: this.baseUrl,
      email: this.configService.get('EMAIL_FROM', 'badges@gcredit.example.com'),
    };
  }

  /**
   * Generate Open Badges 2.0 compliant assertion
   * Sprint 5 Story 6.1: Updated to match spec exactly
   * Reference: https://www.imsglobal.org/spec/ob/v2p0/
   */
  generateAssertion(params: {
    badgeId: string;
    verificationId: string;
    template: BadgeTemplate;
    recipient: User;
    issuer: User;
    issuedAt: Date;
    expiresAt?: Date;
    evidenceUrl?: string;
    evidenceUrls?: string[]; // Sprint 5: Support multiple evidence files
  }) {
    const {
      badgeId,
      verificationId,
      template,
      recipient,
      issuer,
      issuedAt,
      expiresAt,
      evidenceUrl,
      evidenceUrls,
    } = params;

    // Salt for email hashing
    const salt = this.getSalt();

    // Hash recipient email (privacy-preserving)
    const emailHash = crypto
      .createHash('sha256')
      .update(recipient.email.toLowerCase() + salt)
      .digest('hex');

    const assertion = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: `${this.baseUrl}/api/badges/${badgeId}/assertion`,

      // Badge Class URL (not embedded object - per Open Badges 2.0 spec)
      badge: `${this.baseUrl}/api/badge-templates/${template.id}`,

      // Recipient (hashed for privacy)
      recipient: {
        type: 'email',
        hashed: true,
        salt: salt,
        identity: `sha256$${emailHash}`,
      },

      // Issuance metadata
      issuedOn: issuedAt.toISOString(),
      ...(expiresAt && { expires: expiresAt.toISOString() }),

      // Verification (hosted type with verification URL)
      verification: {
        type: 'hosted',
        verificationUrl: `${this.baseUrl}/verify/${verificationId}`,
      },

      // Evidence URLs (optional, array of strings)
      ...(evidenceUrls &&
        evidenceUrls.length > 0 && {
          evidence: evidenceUrls,
        }),
      // Backward compatibility: single evidenceUrl
      ...(evidenceUrl &&
        !evidenceUrls && {
          evidence: [evidenceUrl],
        }),
    };

    return assertion;
  }

  /**
   * Hash email with SHA-256 for privacy
   * Format: sha256$<hexdigest>
   */
  hashEmail(email: string): string {
    const salt = this.getSalt();
    const hash = crypto
      .createHash('sha256')
      .update(email.toLowerCase() + salt)
      .digest('hex');
    return `sha256$${hash}`;
  }

  /**
   * Get salt for email hashing (from env or default)
   */
  private getSalt(): string {
    return this.configService.get('BADGE_SALT', 'gcredit-default-salt');
  }

  /**
   * Generate unique claim token (32 characters)
   */
  generateClaimToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get assertion URL for badge
   */
  getAssertionUrl(badgeId: string): string {
    return `${this.baseUrl}/api/badges/${badgeId}/assertion`;
  }

  /**
   * Get claim URL for badge
   */
  getClaimUrl(claimToken: string): string {
    return `${this.baseUrl}/claim-badge?token=${claimToken}`;
  }

  /**
   * Compute SHA-256 hash of assertion JSON for integrity verification
   * Sprint 5 Story 6.5: Metadata immutability
   */
  computeAssertionHash(assertion: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(assertion))
      .digest('hex');
  }

  /**
   * Verify assertion integrity by comparing stored hash with computed hash
   * Sprint 5 Story 6.5: Integrity validation
   *
   * @returns true if hashes match, false if tampered
   */
  verifyAssertionIntegrity(assertion: any, storedHash: string): boolean {
    const computedHash = this.computeAssertionHash(assertion);
    return computedHash === storedHash;
  }
}
