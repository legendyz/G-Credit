import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GraphEmailService } from '../microsoft-graph/services/graph-email.service';
import { EmailTemplateService } from './services/email-template.service';
import { BadgeAnalyticsService } from './services/badge-analytics.service';
import {
  ShareBadgeEmailDto,
  ShareBadgeEmailResponseDto,
} from './dto/share-badge-email.dto';

@Injectable()
export class BadgeSharingService {
  private readonly logger = new Logger(BadgeSharingService.name);

  constructor(
    private prisma: PrismaService,
    private graphEmailService: GraphEmailService,
    private emailTemplateService: EmailTemplateService,
    private badgeAnalyticsService: BadgeAnalyticsService,
    private configService: ConfigService,
  ) {}

  /**
   * Share a badge via email using Microsoft Graph API
   * @param dto Share badge email DTO
   * @param userId Current user ID (sender)
   * @returns Success response with details
   */
  async shareBadgeViaEmail(
    dto: ShareBadgeEmailDto,
    userId: string,
  ): Promise<ShareBadgeEmailResponseDto> {
    this.logger.log(
      `Sharing badge ${dto.badgeId} via email to ${dto.recipientEmail}`,
    );

    // Validate badge exists and user has access
    const badge = await this.prisma.badge.findUnique({
      where: { id: dto.badgeId },
      include: {
        template: {
          select: {
            name: true,
            description: true,
            imageUrl: true,
          },
        },
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        issuer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge with ID ${dto.badgeId} not found`);
    }

    // Verify user has permission to share this badge (must be recipient or issuer)
    this.logger.log(
      `Permission check: userId=${userId}, recipientId=${badge.recipientId}, issuerId=${badge.issuerId}`,
    );

    if (badge.recipientId !== userId && badge.issuerId !== userId) {
      throw new BadRequestException(
        'You do not have permission to share this badge',
      );
    }

    // Check if badge is in a shareable state
    if (badge.status === 'REVOKED') {
      throw new BadRequestException('Cannot share a revoked badge');
    }

    if (badge.status === 'EXPIRED') {
      throw new BadRequestException('Cannot share an expired badge');
    }

    // Get badge statistics for social proof
    const earnedCount = await this.prisma.badge.count({
      where: {
        templateId: badge.templateId,
        status: { in: ['CLAIMED', 'PENDING'] },
      },
    });

    // Get sender information
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!sender) {
      throw new NotFoundException('Sender user not found');
    }

    // Validate badge image URL (avoid broken images)
    const badgeImageUrl = this.isValidUrl(badge.template.imageUrl)
      ? badge.template.imageUrl
      : null;

    if (!badgeImageUrl && badge.template.imageUrl) {
      this.logger.warn(
        `Invalid badge image URL for badge ${badge.id}: ${badge.template.imageUrl}`,
      );
    }

    // Prepare email data
    const emailData = {
      badgeId: badge.id,
      badgeImageUrl,
      badgeName: badge.template.name,
      badgeDescription: badge.template.description || 'No description provided',
      issuerName: `${badge.issuer.firstName} ${badge.issuer.lastName}`,
      recipientName: `${badge.recipient.firstName} ${badge.recipient.lastName}`,
      recipientEmail: dto.recipientEmail,
      issueDate: badge.issuedAt,
      expiryDate: badge.expiresAt,
      verificationId: badge.verificationId,
      claimToken: badge.status === 'PENDING' ? badge.claimToken : null,
      earnedCount: earnedCount > 1 ? earnedCount : undefined,
      personalMessage: dto.personalMessage,
      isShared: true,
    };

    // Render email templates
    const htmlBody = this.emailTemplateService.renderHtml(emailData);
    const textBody = this.emailTemplateService.renderText(emailData);

    // Get sender email from config or use system email
    const fromEmail =
      this.configService.get<string>('GRAPH_EMAIL_FROM') ||
      sender.email ||
      'badges@g-credit.com';

    // Send email via Microsoft Graph
    try {
      // MOCK MODE: For development/testing only
      // Set MOCK_EMAIL_SERVICE=true in .env to skip actual email sending
      // WARNING: Never enable in production!
      const isMockMode =
        this.configService.get<string>('MOCK_EMAIL_SERVICE') === 'true';

      if (isMockMode) {
        this.logger.log('MOCK MODE: Skipping actual email send');
        this.logger.log(`Would send to: [masked]`);
        this.logger.log(
          `Subject: 🎉 ${sender.firstName} ${sender.lastName} shared a badge with you: "${badge.template.name}"`,
        );
      } else {
        await this.graphEmailService.sendEmail(
          fromEmail,
          [dto.recipientEmail],
          `🎉 ${sender.firstName} ${sender.lastName} shared a badge with you: "${badge.template.name}"`,
          htmlBody,
          textBody,
        );
      }

      this.logger.log(
        `Successfully sent badge ${dto.badgeId} via email to [masked]`,
      );

      // Record share event in analytics (Story 7.5)
      try {
        await this.badgeAnalyticsService.recordShare(
          badge.id,
          'email',
          userId,
          { recipientEmail: dto.recipientEmail },
        );
        this.logger.log(`Recorded email share event for badge ${badge.id}`);
      } catch (analyticsError: unknown) {
        const errMsg =
          analyticsError instanceof Error
            ? analyticsError.message
            : String(analyticsError);
        // Log but don't fail the request if analytics recording fails
        this.logger.warn(`Failed to record share analytics: ${errMsg}`);
      }

      // Record in global audit log for Admin Analytics (UAT-023)
      try {
        await this.prisma.auditLog.create({
          data: {
            entityType: 'Badge',
            entityId: badge.id,
            action: 'SHARED',
            actorId: userId,
            actorEmail:
              badge.recipientId === userId
                ? badge.recipient.email
                : badge.issuer.email,
            metadata: {
              platform: 'email',
              recipientEmail: dto.recipientEmail,
              templateName: badge.template.name,
            },
          },
        });
      } catch (auditError: unknown) {
        this.logger.warn(
          `Failed to record share audit log: ${auditError instanceof Error ? auditError.message : String(auditError)}`,
        );
      }

      return {
        success: true,
        message: 'Badge shared successfully via email',
        recipientEmail: dto.recipientEmail,
        badgeId: dto.badgeId,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to send badge via email: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException(`Failed to send email: ${err.message}`);
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get count of badges earned from same template (for social proof)
   * @param templateId Badge template ID
   * @returns Count of badges earned
   */
  async getBadgeEarnedCount(templateId: string): Promise<number> {
    return this.prisma.badge.count({
      where: {
        templateId,
        status: { in: ['CLAIMED', 'PENDING'] },
      },
    });
  }
}
