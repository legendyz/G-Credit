import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClient } from '@azure/communication-email';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email Service
 *
 * Handles sending emails for password reset and badge notifications.
 * Development: Uses Ethereal (fake SMTP) - emails viewable via preview URL
 * Production: Uses Azure Communication Services
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
  private acsClient: EmailClient | null = null;
  private etherealTransporter: Transporter | null = null;
  private readonly isDevelopment: boolean;
  private readonly fromAddress: string;
  private readonly useGraphEmail: boolean;
  private etherealInitialized = false;

  constructor(private config: ConfigService) {
    this.isDevelopment = this.config.get<string>('NODE_ENV') !== 'production';
    this.fromAddress = this.config.get<string>('EMAIL_FROM', 'badges@gcredit.example.com');
    this.useGraphEmail = this.config.get<string>('ENABLE_GRAPH_EMAIL', 'false') === 'true';

    if (this.useGraphEmail) {
      // Skip Ethereal when Graph Email is configured
      this.logger.log('✅ EmailService initialized (Graph Email enabled - Ethereal skipped)');
    } else if (this.isDevelopment) {
      // Initialize Ethereal asynchronously (non-blocking)
      this.initializeEthereal().catch(err => {
        this.logger.warn('⚠️ Ethereal initialization delayed, will retry on first email send');
      });
    } else {
      this.initializeACS();
    }
  }

  /**
   * Initialize Azure Communication Services (Production)
   */
  private initializeACS(): void {
    const connectionString = this.config.get<string>('AZURE_COMMUNICATION_CONNECTION_STRING');
    if (!connectionString) {
      this.logger.warn('⚠️ AZURE_COMMUNICATION_CONNECTION_STRING not configured');
      return;
    }
    this.acsClient = new EmailClient(connectionString);
    this.logger.log('✅ Azure Communication Services Email initialized');
  }

  /**
   * Initialize Ethereal (Development)
   */
  private async initializeEthereal(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.etherealTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.etherealInitialized = true;
      this.logger.log('✅ Ethereal Email initialized (development)');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Ethereal:', error.message);
    }
  }

  /**
   * Send email (generic method for all email types)
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      if (this.isDevelopment) {
        await this.sendViaEthereal(options);
      } else {
        await this.sendViaACS(options);
      }
      this.logger.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error.message);
      // Don't throw - email failure shouldn't block operations
    }
  }

  /**
   * Send via Azure Communication Services
   */
  private async sendViaACS(options: SendMailOptions): Promise<void> {
    if (!this.acsClient) {
      throw new Error('Azure Communication Services not initialized');
    }

    const message = {
      senderAddress: this.fromAddress,
      content: {
        subject: options.subject,
        html: options.html,
        plainText: options.text || this.stripHtml(options.html),
      },
      recipients: {
        to: [{ address: options.to }],
      },
    };

    const poller = await this.acsClient.beginSend(message);
    await poller.pollUntilDone();
  }

  /**
   * Send via Ethereal (Development)
   */
  private async sendViaEthereal(options: SendMailOptions): Promise<void> {
    // Wait for initialization if not ready (max 5 seconds)
    let retries = 0;
    while (!this.etherealInitialized && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!this.etherealTransporter) {
      this.logger.warn('⚠️ Ethereal not initialized, logging email to console');
      console.log('\n' + '='.repeat(80));
      console.log('📧 [DEV MODE] Email (Ethereal not available)');
      console.log('='.repeat(80));
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('='.repeat(80) + '\n');
      return;
    }

    const info = await this.etherealTransporter.sendMail({
      from: this.fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    this.logger.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Send password reset email (legacy method, now uses sendMail)
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
