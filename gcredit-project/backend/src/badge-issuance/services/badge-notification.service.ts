import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/email.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Badge Notification Service
 *
 * Handles sending email notifications for badge-related events:
 * - Badge issuance (claim notification)
 * - Badge revocation (future)
 */
@Injectable()
export class BadgeNotificationService {
  private readonly logger = new Logger(BadgeNotificationService.name);
  private badgeClaimTemplate: string;

  constructor(private emailService: EmailService) {
    // Load email template on service initialization
    // In development: load from src directory
    // In production: load from dist directory
    let templatePath = path.join(__dirname, '../templates/badge-claim-notification.html');
    
    // If template not found in dist, try src directory (development)
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'src/badge-issuance/templates/badge-claim-notification.html');
    }
    
    try {
      this.badgeClaimTemplate = fs.readFileSync(templatePath, 'utf-8');
      this.logger.log('✅ Badge claim email template loaded');
    } catch (error) {
      this.logger.error(`❌ Failed to load email template: ${error.message}`);
      throw new Error(`Email template not found at ${templatePath}`);
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

      // Send email via EmailService
      await this.emailService.sendMail({
        to: params.recipientEmail,
        subject: `🎓 You've earned the ${params.badgeName} badge!`,
        html,
      });

      this.logger.log(`✅ Badge claim notification sent to ${params.recipientEmail}`);
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
   * 
   * TODO: Implement in Story 4.6
   */
  async sendBadgeRevocationNotification(params: {
    recipientEmail: string;
    recipientName: string;
    badgeName: string;
    revocationReason: string;
  }): Promise<void> {
    this.logger.warn('Badge revocation notification not yet implemented (Story 4.6)');
    // Placeholder for Story 4.6 implementation
  }
}
