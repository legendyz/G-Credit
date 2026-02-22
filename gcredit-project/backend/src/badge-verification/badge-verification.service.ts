import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BadgeStatus } from '@prisma/client';
import { AssertionGeneratorService } from '../badge-issuance/services/assertion-generator.service';

@Injectable()
export class BadgeVerificationService {
  private readonly logger = new Logger(BadgeVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private assertionGenerator: AssertionGeneratorService,
  ) {}

  /**
   * Story 6.2: Verify badge by verificationId (public endpoint)
   * @param verificationId - Unique verification UUID
   * @returns Badge details with template, recipient, issuer, and assertion
   */
  async verifyBadge(verificationId: string) {
    // Log verification attempt (for security monitoring)
    this.logger.log({
      action: 'BADGE_VERIFICATION_REQUEST',
      verificationId,
      timestamp: new Date().toISOString(),
    });

    const badge = await this.prisma.badge.findUnique({
      where: { verificationId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            issuanceCriteria: true,
            category: true,
            skillIds: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        revoker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        evidenceFiles: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            blobUrl: true,
            uploadedAt: true,
            type: true,
            sourceUrl: true,
          },
        },
      },
    });

    if (!badge) {
      this.logger.warn({
        action: 'BADGE_VERIFICATION_FAILED',
        verificationId,
        reason: 'NOT_FOUND',
      });
      return null;
    }

    // Story 11.4: PRIVATE badges return 404 on verification page (C-3 Option B)
    if (badge.visibility === 'PRIVATE') {
      this.logger.log({
        action: 'BADGE_VERIFICATION_BLOCKED',
        verificationId,
        reason: 'PRIVATE_VISIBILITY',
      });
      return null;
    }

    // Log successful verification
    this.logger.log({
      action: 'BADGE_VERIFICATION_SUCCESS',
      verificationId,
      badgeId: badge.id,
      status: badge.status,
    });

    // Sprint 5 Story 6.5: Verify assertion integrity
    let integrityStatus = null;
    if (badge.metadataHash && badge.assertionJson) {
      const computedHash = this.assertionGenerator.computeAssertionHash(
        badge.assertionJson,
      );
      const integrityVerified = computedHash === badge.metadataHash;

      integrityStatus = {
        verified: integrityVerified,
        hash: badge.metadataHash,
      };

      if (!integrityVerified) {
        this.logger.error({
          action: 'INTEGRITY_VIOLATION',
          badgeId: badge.id,
          verificationId,
          storedHash: badge.metadataHash,
          computedHash,
        });
      }
    }

    // Format response for frontend

    // Story 11.18: Resolve skill UUIDs to display names
    // Story 12.2: Include category color for colored skill tags
    const skills = badge.template.skillIds?.length
      ? await this.prisma.skill.findMany({
          where: { id: { in: badge.template.skillIds } },
          select: {
            id: true,
            name: true,
            category: { select: { color: true } },
          },
        })
      : [];

    return {
      id: badge.id,
      verificationId: badge.verificationId,
      status: badge.status,

      badge: {
        name: badge.template.name,
        description: badge.template.description,
        imageUrl: badge.template.imageUrl,
        criteria:
          ((badge.template.issuanceCriteria as Record<string, unknown>)
            ?.description as string) || 'No criteria specified',
        category: badge.template.category,
        skills: skills.map((s) => ({
          id: s.id,
          name: s.name,
          categoryColor: s.category?.color ?? null,
        })),
      },

      recipient: {
        name: `${badge.recipient.firstName} ${badge.recipient.lastName}`,
        // Partially mask email for privacy (e.g., j***@example.com)
        email: this.maskEmail(badge.recipient.email),
      },

      issuer: {
        name: `${badge.issuer.firstName} ${badge.issuer.lastName}`,
        email: this.maskEmail(badge.issuer.email),
      },

      issuedAt: badge.issuedAt,
      expiresAt: badge.expiresAt,
      claimedAt: badge.claimedAt,

      // Story 9.2: Revocation details with categorization
      // isValid is false for REVOKED, PENDING, and dynamically expired badges
      isValid:
        badge.status !== BadgeStatus.REVOKED &&
        badge.status !== BadgeStatus.PENDING &&
        !(badge.expiresAt && new Date(badge.expiresAt) < new Date()),
      ...(badge.status === BadgeStatus.REVOKED && {
        revokedAt: badge.revokedAt,
        revocationReason: badge.revocationReason,
        revocationNotes: badge.revocationNotes,
        // Categorize reason as public or private per DEVELOPER-CONTEXT.md Decision #3
        isPublicReason: this.isPublicRevocationReason(badge.revocationReason),
        revokedBy: badge.revoker
          ? {
              name: `${badge.revoker.firstName} ${badge.revoker.lastName}`,
              role: badge.revoker.role,
            }
          : null,
      }),

      // Evidence files — Story 12.6: include type/sourceUrl for URL evidence
      evidenceFiles: badge.evidenceFiles.map((file) => ({
        id: file.id,
        filename: file.fileName,
        originalName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        blobUrl: file.blobUrl,
        uploadedAt: file.uploadedAt,
        type: file.type,
        sourceUrl: file.sourceUrl,
      })),

      // Open Badges 2.0 assertion (from Story 6.1)
      assertionJson: badge.assertionJson,

      // Sprint 5 Story 6.5: Integrity verification status
      ...(integrityStatus && {
        integrity: integrityStatus,
      }),
    };
  }

  /**
   * Mask email for privacy protection
   * Example: john.doe@example.com → j***@example.com
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 1) {
      return `*@${domain}`;
    }
    const masked = localPart[0] + '***';
    return `${masked}@${domain}`;
  }

  /**
   * Story 9.2: Determine if revocation reason is public-safe
   * Per DEVELOPER-CONTEXT.md Decision #3:
   * - Public reasons: Expired, Issued in Error → show on verification page
   * - Private reasons: Policy Violation, Fraud → show generic message
   */
  private isPublicRevocationReason(reason: string | null): boolean {
    if (!reason) return false;

    const publicReasons = ['Expired', 'Issued in Error'];
    return publicReasons.includes(reason);
  }
}
