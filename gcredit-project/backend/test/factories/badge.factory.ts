/**
 * Badge Factory (Story 8.8 - AC2)
 * TD-001: Test Data Factory Pattern for isolated test data
 *
 * Creates badges (issued credentials) with unique identifiers
 * to prevent data collisions in parallel tests.
 */

import { PrismaClient, Badge, BadgeStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface CreateBadgeOptions {
  templateId: string; // Required: badge template ID
  recipientId: string; // Required: recipient user ID
  issuerId: string; // Required: issuer user ID
  status?: BadgeStatus;
  claimToken?: string;
  evidenceUrl?: string;
  expiresAt?: Date;
  claimedAt?: Date;
  revokedAt?: Date;
  revocationReason?: string;
}

/**
 * Badge Factory for creating test badges
 */
export class BadgeFactory {
  private prisma: PrismaClient;
  private testPrefix: string;

  constructor(prisma: PrismaClient, testPrefix?: string) {
    this.prisma = prisma;
    this.testPrefix = testPrefix || uuidv4().substring(0, 8);
  }

  /**
   * Creates a pending badge (waiting to be claimed)
   */
  async createPending(options: CreateBadgeOptions): Promise<Badge> {
    return this.createBadge({ status: BadgeStatus.PENDING, ...options });
  }

  /**
   * Creates a claimed badge
   */
  async createClaimed(options: CreateBadgeOptions): Promise<Badge> {
    return this.createBadge({
      status: BadgeStatus.CLAIMED,
      claimedAt: new Date(),
      ...options,
    });
  }

  /**
   * Creates a revoked badge
   */
  async createRevoked(options: CreateBadgeOptions): Promise<Badge> {
    return this.createBadge({
      status: BadgeStatus.REVOKED,
      claimedAt: new Date(Date.now() - 86400000), // Claimed 1 day ago
      revokedAt: new Date(),
      revocationReason: options.revocationReason || 'Test revocation',
      ...options,
    });
  }

  /**
   * Creates an expired badge
   */
  async createExpired(options: CreateBadgeOptions): Promise<Badge> {
    const expiredDate = new Date(Date.now() - 86400000); // Expired 1 day ago
    return this.createBadge({
      status: BadgeStatus.CLAIMED,
      claimedAt: new Date(Date.now() - 365 * 86400000), // Claimed 1 year ago
      expiresAt: expiredDate,
      ...options,
    });
  }

  /**
   * Creates a badge with specified options
   */
  async createBadge(options: CreateBadgeOptions): Promise<Badge> {
    const uniqueId = uuidv4().substring(0, 8);
    const badgeId = uuidv4(); // Generate badge ID upfront for assertion URL
    const status = options.status || BadgeStatus.PENDING;
    const verificationId = uuidv4(); // Generate verification ID for assertion

    // Generate unique claim token
    const claimToken =
      options.claimToken || crypto.randomBytes(16).toString('hex');

    // Default expiration: 1 year from now
    const expiresAt =
      options.expiresAt || new Date(Date.now() + 365 * 86400000);
    const issuedAt = new Date();

    // Salt for email hashing (matches AssertionGeneratorService)
    const salt = crypto.randomBytes(16).toString('hex');

    // Generate recipient hash (SHA-256 of recipient ID + salt for privacy)
    const recipientHash = crypto
      .createHash('sha256')
      .update(`${options.recipientId}:${salt}`)
      .digest('hex');

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    // Generate Open Badges 2.0 JSON-LD assertion (matches AssertionGeneratorService format)
    // Reference: https://www.imsglobal.org/spec/ob/v2p0/
    const assertionJson = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: `${baseUrl}/api/badges/${badgeId}/assertion`,

      // Badge Class URL (not embedded object - per Open Badges 2.0 spec)
      badge: `${baseUrl}/api/badge-templates/${options.templateId}`,

      // Recipient (hashed for privacy)
      recipient: {
        type: 'email',
        hashed: true,
        salt: salt,
        identity: `sha256$${recipientHash}`,
      },

      // Issuance metadata
      issuedOn: issuedAt.toISOString(),
      ...(expiresAt && { expires: expiresAt.toISOString() }),

      // Verification (hosted type with verification URL)
      verification: {
        type: 'hosted',
        verificationUrl: `${baseUrl}/verify/${verificationId}`,
      },
    };

    return this.prisma.badge.create({
      data: {
        id: badgeId, // Use pre-generated ID to match assertion URL
        templateId: options.templateId,
        recipientId: options.recipientId,
        issuerId: options.issuerId,
        status,
        claimToken,
        evidenceUrl:
          options.evidenceUrl ||
          `https://example.com/evidence/${this.testPrefix}-${uniqueId}.pdf`,
        expiresAt,
        claimedAt: options.claimedAt,
        revokedAt: options.revokedAt,
        revocationReason: options.revocationReason,
        assertionJson, // Story 8.8: Open Badges 2.0 JSON-LD assertion
        recipientHash, // Story 8.8: Required field for privacy
      },
    });
  }

  /**
   * Creates multiple badges at once
   */
  async createMany(
    count: number,
    options: CreateBadgeOptions,
  ): Promise<Badge[]> {
    const badges: Badge[] = [];
    for (let i = 0; i < count; i++) {
      badges.push(await this.createBadge(options));
    }
    return badges;
  }

  /**
   * Creates badges with different statuses for testing
   */
  async createStatusSet(options: Omit<CreateBadgeOptions, 'status'>): Promise<{
    pending: Badge;
    claimed: Badge;
    revoked: Badge;
  }> {
    const pending = await this.createPending(options);
    const claimed = await this.createClaimed(options);
    const revoked = await this.createRevoked(options);

    return { pending, claimed, revoked };
  }

  /**
   * Get the claim URL for a badge
   */
  static getClaimUrl(badge: Badge): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/claim/${badge.claimToken}`;
  }

  /**
   * Get the verification URL for a badge
   */
  static getVerificationUrl(badge: Badge): string {
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/verify/${badge.verificationId}`;
  }
}

export default BadgeFactory;
