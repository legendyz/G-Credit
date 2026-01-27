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
   * Reference: https://www.imsglobal.org/spec/ob/v2p0/
   */
  generateAssertion(params: {
    badgeId: string;
    template: BadgeTemplate;
    recipient: User;
    issuer: User;
    issuedAt: Date;
    expiresAt?: Date;
    evidenceUrl?: string;
  }) {
    const { badgeId, template, recipient, issuer, issuedAt, expiresAt, evidenceUrl } = params;

    // Hash recipient email (privacy-preserving)
    const recipientHash = this.hashEmail(recipient.email);

    const assertion = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: `${this.baseUrl}/api/badges/${badgeId}/assertion`,

      // Badge Class
      badge: {
        type: 'BadgeClass',
        id: `${this.baseUrl}/api/badge-templates/${template.id}`,
        name: template.name,
        description: template.description,
        image: template.imageUrl,
        criteria: {
          narrative: template.issuanceCriteria?.description || 'Badge awarded for achievement',
        },
        issuer: this.issuerProfile,
      },

      // Recipient (hashed)
      recipient: {
        type: 'email',
        hashed: true,
        salt: this.getSalt(),
        identity: recipientHash,
      },

      // Issuance metadata
      issuedOn: issuedAt.toISOString(),
      ...(expiresAt && { expires: expiresAt.toISOString() }),

      // Verification
      verification: {
        type: 'hosted',
        url: `${this.baseUrl}/api/badges/${badgeId}/assertion`,
      },

      // Evidence (optional)
      ...(evidenceUrl && {
        evidence: [
          {
            id: evidenceUrl,
            name: 'Supporting Evidence',
            description: 'Evidence of achievement',
          },
        ],
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
}
