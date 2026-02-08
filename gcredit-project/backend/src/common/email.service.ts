import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphEmailService } from '../microsoft-graph/services/graph-email.service';

/**
 * Email Service — Thin wrapper over GraphEmailService (TD-014)
 *
 * All email delivery is handled by Microsoft Graph API.
 * Legacy nodemailer/ACS/Ethereal paths have been removed.
 *
 * @see ADR-008: Microsoft Graph Integration Strategy
 */

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress: string;

  constructor(
    private config: ConfigService,
    private graphEmailService: GraphEmailService,
  ) {
    this.fromAddress = this.config.get<string>(
      'GRAPH_EMAIL_FROM',
      this.config.get<string>('EMAIL_FROM', 'badges@gcredit.example.com'),
    );
    this.logger.log(
      '✅ EmailService initialized (delegating to GraphEmailService)',
    );
  }

  /**
   * Send email via GraphEmailService
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const isDevelopment =
        this.config.get<string>('NODE_ENV') !== 'production';

      if (isDevelopment && !this.graphEmailService.isGraphEmailEnabled()) {
        // Dev mode fallback: log email to console
        this.logger.warn('⚠️ Graph Email disabled, logging email to console');
        console.log('\n' + '='.repeat(80));
        console.log('📧 [DEV MODE] Email (Graph Email not configured)');
        console.log('='.repeat(80));
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('='.repeat(80) + '\n');
        return;
      }

      await this.graphEmailService.sendEmail(
        this.fromAddress,
        [options.to],
        options.subject,
        options.html,
        options.text,
      );
      this.logger.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to send email to ${options.to}:`,
        (error as Error).message,
      );
      // Don't throw - email failure shouldn't block operations
    }
  }

  /**
   * Send password reset email
   *
   * @param email User's email address
   * @param token Reset token
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .warning { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>G-Credit Password Reset</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>We received a request to reset your password for your G-Credit account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
              <p class="warning">⚠️ This link expires in 1 hour.</p>
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>© 2026 G-Credit. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
    `;

    const text = `
G-Credit Password Reset Request

We received a request to reset your password for your G-Credit account.

Reset your password by visiting: ${resetUrl}

This link expires in 1 hour.

If you didn't request this password reset, please ignore this email.

© 2026 G-Credit. All rights reserved.
    `.trim();

    await this.sendMail({
      to: email,
      subject: 'G-Credit Password Reset Request',
      html,
      text,
    });
  }
}
