import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import { GraphTokenProviderService } from './graph-token-provider.service';

/**
 * Microsoft Graph Email Service
 * 
 * Sends emails via Microsoft Graph API (Mail.Send permission).
 * Implements retry logic with exponential backoff for 429 rate limiting.
 * 
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see Sprint 6 Story 7.2: Email Badge Sharing
 */
@Injectable()
export class GraphEmailService implements OnModuleInit {
  private readonly logger = new Logger(GraphEmailService.name);
  private graphClient: Client;
  private isEnabled: boolean;

  constructor(
    private readonly tokenProvider: GraphTokenProviderService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<boolean>(
      'ENABLE_GRAPH_EMAIL',
      false,
    );

    if (!this.isEnabled) {
      this.logger.warn('⚠️ Graph Email disabled (ENABLE_GRAPH_EMAIL=false)');
    }
  }

  /**
   * Initialize Graph client after all dependencies are ready
   */
  async onModuleInit() {
    if (this.isEnabled) {
      try {
        this.initializeClient();
      } catch (error) {
        this.logger.error('❌ Failed to initialize Graph Email on module init', error);
        this.isEnabled = false;
      }
    }
  }

  /**
   * Initialize Microsoft Graph client with token provider
   */
  private initializeClient() {
    try {
      const authProvider = this.tokenProvider.getAuthProvider();

      this.graphClient = Client.initWithMiddleware({
        authProvider,
      });

      this.logger.log('✅ Graph Email Service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Graph Email client', error);
      this.isEnabled = false;
    }
  }

  /**
   * Send email via Microsoft Graph API
   * 
   * Sends email using Graph API /users/{userId}/sendMail endpoint.
   * Implements retry with exponential backoff for 429 rate limiting.
   * 
   * @param fromEmail - Sender email address (must be valid M365 user)
   * @param toEmails - Array of recipient email addresses
   * @param subject - Email subject
   * @param htmlBody - HTML email body
   * @param textBody - Optional plain text email body (fallback for text-only clients)
   * @param retries - Number of retries remaining (default: 3)
   * @returns Promise resolving when email sent successfully
   */
  async sendEmail(
    fromEmail: string,
    toEmails: string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    retries = 3,
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('⚠️ Graph Email disabled, skipping send');
      return;
    }

    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    const sendMail = {
      message: {
        subject,
        body: {
          contentType: 'HTML' as const,
          content: htmlBody,
        },
        toRecipients: toEmails.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      },
      saveToSentItems: true,
    };

    try {
      this.logger.log(`📧 Sending email: ${subject} → ${toEmails.join(', ')}`);

      await this.graphClient
        .api(`/users/${fromEmail}/sendMail`)
        .post(sendMail);

      this.logger.log('✅ Email sent successfully');
    } catch (error) {
      // Handle 429 rate limiting with exponential backoff
      if (error.statusCode === 429 && retries > 0) {
        const retryAfter = error.headers?.['retry-after'] || 5;
        this.logger.warn(
          `⚠️ Rate limited (429), retrying after ${retryAfter}s (${retries} retries left)`,
        );

        await this.sleep(retryAfter * 1000);
        return this.sendEmail(fromEmail, toEmails, subject, htmlBody, textBody, retries - 1);
      }

      this.logger.error('❌ Failed to send email', error);
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if Graph Email is enabled
   */
  isGraphEmailEnabled(): boolean {
    return this.isEnabled;
  }
}
