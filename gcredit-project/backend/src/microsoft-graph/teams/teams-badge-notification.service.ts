/**
 * Teams Badge Notification Service
 *
 * Story 7.4 - Microsoft Teams Notifications
 * Sends badge issuance notifications to Microsoft Teams with Adaptive Cards
 * Task 6: Implements email fallback when Teams notification fails
 *
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see docs/sprints/sprint-6/adaptive-card-specs.md
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphTeamsService } from '../services/graph-teams.service';
import { PrismaService } from '../../common/prisma.service';
import type { Badge, BadgeTemplate } from '@prisma/client';
import { BadgeNotificationService } from '../../badge-issuance/services/badge-notification.service';
import {
  BadgeNotificationCardBuilder,
  BadgeNotificationCardData,
} from './adaptive-cards/badge-notification.builder';

@Injectable()
export class TeamsBadgeNotificationService {
  private readonly logger = new Logger(TeamsBadgeNotificationService.name);

  constructor(
    private readonly graphTeamsService: GraphTeamsService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailNotificationService: BadgeNotificationService,
  ) {}

  /**
   * Send badge issuance notification via email
   *
   * Sends email notification when a badge is issued.
   * For Teams channel sharing, use shareBadgeToTeamsChannel() instead.
   *
   * @param badgeId - Badge ID that was issued
   * @param recipientUserId - User ID of badge recipient
   */
  async sendBadgeIssuanceNotification(
    badgeId: string,
    recipientUserId: string,
  ): Promise<void> {
    // Fetch badge data
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: true,
        issuer: true,
      },
    });

    if (!badge) {
      throw new Error(`Badge not found: ${badgeId}`);
    }

    // Fetch recipient
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
    });

    if (!recipient) {
      throw new Error(`Recipient not found: ${recipientUserId}`);
    }

    // Send email notification
    const platformUrl = this.configService.get<string>(
      'PLATFORM_URL',
      'http://localhost:5173',
    );
    const claimUrl =
      badge.status === 'PENDING'
        ? `${platformUrl}/claim?token=${badge.claimToken}`
        : undefined;

    try {
      await this.sendEmailFallback(badge, recipient, claimUrl);
      this.logger.log(`✅ Badge issuance email sent to ${recipient.email}`);
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send badge issuance email to ${recipient.email}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Share badge to Microsoft Teams Channel
   *
   * Fetches badge, recipient, and credential data, then sends Teams channel message
   * with Adaptive Card showing badge details and action buttons.
   * This method does NOT require a Teams App to be installed.
   *
   * @param badgeId - Badge ID to share
   * @param recipientUserId - User ID of badge recipient
   * @param teamId - Target Teams team ID
   * @param channelId - Target Teams channel ID
   * @throws Error if badge, user, or credential not found
   * @throws Error if Teams notification fails
   */
  async shareBadgeToTeamsChannel(
    badgeId: string,
    recipientUserId: string,
    teamId: string,
    channelId: string,
  ): Promise<void> {
    // Check if Teams notifications are enabled
    if (!this.graphTeamsService.isGraphTeamsEnabled()) {
      this.logger.warn(
        '⚠️ Teams notifications disabled, skipping notification',
      );
      return;
    }

    this.logger.log(
      `📢 Preparing Teams notification for badge ${badgeId} → user ${recipientUserId}`,
    );

    // 1. Fetch badge data with template and issuer
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: true,
        issuer: true,
      },
    });

    if (!badge) {
      throw new Error(`Badge not found: ${badgeId}`);
    }

    // 2. Fetch recipient user
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
    });

    if (!recipient) {
      throw new Error(`Recipient user not found: ${recipientUserId}`);
    }

    // 3. Build Adaptive Card data
    const platformUrl = this.configService.get<string>('PLATFORM_URL');
    const badgeWalletUrl = `${platformUrl}/wallet`;

    const cardData: BadgeNotificationCardData = {
      badgeImageUrl:
        badge.template.imageUrl || 'https://default-badge-image.png',
      badgeName: badge.template.name,
      issuerName: this.getFullName(badge.issuer),
      recipientName: this.getFullName(recipient),
      issueDate: BadgeNotificationCardBuilder.formatDate(badge.issuedAt),
      badgeId: badge.id,
      badgeDescription: badge.template.description || '',
      badgeWalletUrl,
      claimUrl:
        badge.status === 'PENDING'
          ? `${platformUrl}/claim?token=${badge.claimToken}`
          : undefined,
    };

    // 5. Build Adaptive Card
    const adaptiveCard = BadgeNotificationCardBuilder.build(cardData);

    // 6. Send Teams channel message (no Teams App required!)
    const message = `🎉 **${this.getFullName(recipient)}** earned the **${badge.template.name}** badge!`;

    try {
      await this.graphTeamsService.sendChannelMessage(
        teamId,
        channelId,
        message,
        adaptiveCard,
      );

      this.logger.log(
        `✅ Teams channel message sent successfully for badge ${badgeId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send Teams channel message for badge ${badgeId}: ${(error as Error).message}`,
      );

      // Task 6: Email fallback
      this.logger.log(
        `📧 Attempting email fallback for badge ${badgeId} → ${recipient.email}`,
      );

      try {
        await this.sendEmailFallback(badge, recipient, cardData.claimUrl);
        this.logger.log(
          `✅ Email fallback sent successfully to ${recipient.email}`,
        );
      } catch (emailError: unknown) {
        this.logger.error(
          `❌ Email fallback also failed for ${recipient.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
        );
        // Don't throw - notification failure shouldn't block badge issuance
      }
    }
  }

  /**
   * Send email notification as fallback when Teams notification fails
   *
   * Task 6: Email Fallback
   * Uses existing email template from Story 7.2
   */
  private async sendEmailFallback(
    badge: Badge & { template: BadgeTemplate },
    recipient: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    },
    claimUrl?: string,
  ): Promise<void> {
    const platformUrl = this.configService.get<string>('PLATFORM_URL');
    const finalClaimUrl =
      claimUrl || `${platformUrl}/claim?token=${badge.claimToken}`;

    await this.emailNotificationService.sendBadgeClaimNotification({
      recipientEmail: recipient.email,
      recipientName: this.getFullName(recipient),
      badgeName: badge.template.name,
      badgeDescription:
        badge.template.description || 'Congratulations on earning this badge!',
      badgeImageUrl:
        badge.template.imageUrl || 'https://default-badge-image.png',
      claimUrl: finalClaimUrl,
    });
  }

  /**
   * Helper to get full name from user object
   */
  private getFullName(user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string {
    const parts = [];
    if (user.firstName) parts.push(user.firstName);
    if (user.lastName) parts.push(user.lastName);
    return parts.length > 0 ? parts.join(' ') : user.email;
  }
}
