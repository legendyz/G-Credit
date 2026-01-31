import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphEmailService } from '../../microsoft-graph/services/graph-email.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Badge Notification Service
 *
 * Handles sending email notifications for badge-related events:
 * - Badge issuance (claim notification)
 * - Badge revocation (future)
 * 
 * Uses Microsoft Graph Email Service for production-quality email delivery
 */
@Injectable()
export class BadgeNotificationService {
  private readonly logger = new Logger(BadgeNotificationService.name);
  private badgeClaimTemplate: string;
  private badgeRevocationTemplate: string;
  private readonly useGraphEmail: boolean;
  private readonly fromEmail: string;

  constructor(
    private graphEmailService: GraphEmailService,
    private configService: ConfigService,
  ) {
    this.useGraphEmail = this.configService.get<string>('ENABLE_GRAPH_EMAIL', 'false') === 'true';
    this.fromEmail = this.configService.get<string>('GRAPH_EMAIL_FROM', 'M365DevAdmin@2wjh85.onmicrosoft.com');
    // Load badge claim email template
    let claimTemplatePath = path.join(__dirname, '../templates/badge-claim-notification.html');
    
    // If template not found in dist, try src directory (development)
    if (!fs.existsSync(claimTemplatePath)) {
      claimTemplatePath = path.join(process.cwd(), 'src/badge-issuance/templates/badge-claim-notification.html');
    }
    
    try {
      this.badgeClaimTemplate = fs.readFileSync(claimTemplatePath, 'utf-8');
      this.logger.log('✅ Badge claim email template loaded');
    } catch (error) {
      this.logger.error(`❌ Failed to load claim email template: ${error.message}`);
      throw new Error(`Email template not found at ${claimTemplatePath}`);
    }

    // Load badge revocation email template
    let revocationTemplatePath = path.join(__dirname, '../templates/badge-revocation-notification.html');
    
    if (!fs.existsSync(revocationTemplatePath)) {
      revocationTemplatePath = path.join(process.cwd(), 'src/badge-issuance/templates/badge-revocation-notification.html');
    }
    
    try {
      this.badgeRevocationTemplate = fs.readFileSync(revocationTemplatePath, 'utf-8');
      this.logger.log('✅ Badge revocation email template loaded');
    } catch (error) {
      this.logger.error(`❌ Failed to load revocation email template: ${error.message}`);
      throw new Error(`Email template not found at ${revocationTemplatePath}`);
    }
  }

  /**
   * Send badge claim notification email
   *
   * @param params Email parameters including recipient info and badge details
   */
  async sendBadgeClaimNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeName: string;
    badgeDescription: string;
    badgeImageUrl: string;
    claimUrl: string;
  }): Promise<void> {
    try {
      // Replace template variables with actual values
      const html = this.badgeClaimTemplate
        .replace(/\{\{recipientName\}\}/g, params.recipientName || 'there')
        .replace(/\{\{badgeName\}\}/g, params.badgeName)
        .replace(/\{\{badgeDescription\}\}/g, params.badgeDescription)
        .replace(/\{\{badgeImageUrl\}\}/g, params.badgeImageUrl)
        .replace(/\{\{claimUrl\}\}/g, params.claimUrl);

      // Send email via Microsoft Graph Email Service
      if (this.useGraphEmail && this.graphEmailService.isGraphEmailEnabled()) {
        await this.graphEmailService.sendEmail(
          this.fromEmail,
          [params.recipientEmail],
          `🎓 You've earned the ${params.badgeName} badge!`,
          html,
        );
        this.logger.log(`✅ Badge claim notification sent via Graph Email to ${params.recipientEmail}`);
      } else {
        this.logger.warn(`⚠️ Graph Email disabled, notification not sent to ${params.recipientEmail}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send badge notification:`, error);
      // Don't throw - email failure shouldn't block badge issuance
      // The error is logged for monitoring but operation continues
    }
  }

  /**
   * Send badge revocation notification
   * 
   * @param params Revocation notification parameters
   */
  async sendBadgeRevocationNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeName: string;
    revocationReason: string;
  }): Promise<void> {
    try {
      // Replace template variables with actual values
      const html = this.badgeRevocationTemplate
        .replace(/\{\{recipientName\}\}/g, params.recipientName || 'there')
        .replace(/\{\{badgeName\}\}/g, params.badgeName)
        .replace(/\{\{revocationReason\}\}/g, params.revocationReason);

      // Send email via Microsoft Graph Email Service
      if (this.useGraphEmail && this.graphEmailService.isGraphEmailEnabled()) {
        await this.graphEmailService.sendEmail(
          this.fromEmail,
          [params.recipientEmail],
          `Badge Revoked: ${params.badgeName}`,
          html,
        );
        this.logger.log(`✅ Revocation notification sent via Graph Email to ${params.recipientEmail}`);
      } else {
        this.logger.warn(`⚠️ Graph Email disabled, revocation notification not sent to ${params.recipientEmail}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send revocation notification:`, error);
      // Don't throw - email failure shouldn't block revocation operation
    }
  }
}
