import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BadgeStatus } from '@prisma/client';

@Injectable()
export class BadgeVerificationService {
  private readonly logger = new Logger(BadgeVerificationService.name);

  constructor(private prisma: PrismaService) {}

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
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        evidenceFiles: {
          select: {
            id: true,
            fileName: true,
            blobUrl: true,
            uploadedAt: true,
          }
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

    // Log successful verification
    this.logger.log({
      action: 'BADGE_VERIFICATION_SUCCESS',
      verificationId,
      badgeId: badge.id,
      status: badge.status,
    });

    // Format response for frontend
    return {
      id: badge.id,
      verificationId: badge.verificationId,
      status: badge.status,
      
      badge: {
        name: badge.template.name,
        description: badge.template.description,
        imageUrl: badge.template.imageUrl,
        criteria: (badge.template.issuanceCriteria as any)?.description || 'No criteria specified',
        category: badge.template.category,
        skills: badge.template.skillIds || [],
      },

      recipient: {
        name: `${badge.recipient.firstName} ${badge.recipient.lastName}`,
        // Partially mask email for privacy (e.g., j***@example.com)
        email: this.maskEmail(badge.recipient.email),
      },

      issuer: {
        name: `${badge.issuer.firstName} ${badge.issuer.lastName}`,
        email: badge.issuer.email,
      },

      issuedAt: badge.issuedAt,
      expiresAt: badge.expiresAt,
      claimedAt: badge.claimedAt,

      // Revocation details (if applicable)
      ...(badge.status === BadgeStatus.REVOKED && {
        revokedAt: badge.revokedAt,
        revocationReason: badge.revocationReason,
      }),

      // Evidence files from Sprint 4
      evidenceFiles: badge.evidenceFiles.map((file: any) => ({
        filename: file.fileName,
        blobUrl: file.blobUrl,
        uploadedAt: file.uploadedAt,
      })),

      // Open Badges 2.0 assertion (from Story 6.1)
      assertionJson: badge.assertionJson,
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
}
