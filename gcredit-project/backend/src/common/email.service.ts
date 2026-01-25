import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Email Service
 * 
 * Handles sending emails for password reset and other notifications.
 * In development: logs to console instead of sending real emails.
 * In production: uses configured SMTP server.
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isDevelopment: boolean;

  constructor(private config: ConfigService) {
    this.isDevelopment = this.config.get<string>('NODE_ENV') !== 'production';

    // Only create transporter in production
    if (!this.isDevelopment) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: this.config.get<number>('SMTP_PORT') || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASSWORD'),
        },
      });
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

    const emailContent = {
      from: this.config.get<string>('SMTP_FROM') || 'noreply@gcredit.com',
      to: email,
      subject: 'G-Credit Password Reset Request',
      html: `
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
      `,
      text: `
G-Credit Password Reset Request

We received a request to reset your password for your G-Credit account.

Reset your password by visiting: ${resetUrl}

This link expires in 1 hour.

If you didn't request this password reset, please ignore this email.

© 2026 G-Credit. All rights reserved.
      `.trim(),
    };

    if (this.isDevelopment) {
      // In development: log to console instead of sending email
      console.log('\n' + '='.repeat(80));
      console.log('📧 [DEV MODE] Password Reset Email (not sent)');
      console.log('='.repeat(80));
      console.log(`To: ${emailContent.to}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${token}`);
      console.log('='.repeat(80) + '\n');
    } else {
      // In production: send real email
      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }
      await this.transporter.sendMail(emailContent);
      console.log(`✅ Password reset email sent to ${email}`);
    }
  }
}
