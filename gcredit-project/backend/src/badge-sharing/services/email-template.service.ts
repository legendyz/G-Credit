import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface BadgeEmailData {
  badgeId: string;
  badgeImageUrl: string | null;
  badgeName: string;
  badgeDescription: string;
  issuerName: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: Date;
  expiryDate: Date | null;
  verificationId: string;
  claimToken: string | null;
  earnedCount?: number;
  personalMessage?: string;
  isShared?: boolean;
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private template: HandlebarsTemplateDelegate;
  private textTemplate: string;

  constructor(private configService: ConfigService) {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    try {
      // Load HTML template
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        'badge-notification.html',
      );
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      this.template = Handlebars.compile(templateSource);

      // Load plain text template
      this.textTemplate = this.createTextTemplate();

      this.logger.log('Email templates loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load email templates', error);
      throw error;
    }
  }

  /**
   * Render HTML email from badge data
   */
  renderHtml(data: BadgeEmailData): string {
    const platformUrl = this.configService.get<string>(
      'PLATFORM_URL',
      'http://localhost:5173',
    );
    const apiUrl = this.configService.get<string>(
      'API_URL',
      'http://localhost:3000',
    );

    return this.template({
      platformUrl,
      badgeImageUrl:
        data.badgeImageUrl ||
        'https://via.placeholder.com/200x200/2563EB/FFFFFF?text=Badge',
      badgeName: data.badgeName,
      issuerName: data.issuerName,
      badgeDescription: data.badgeDescription || 'No description provided',
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      issueDate: this.formatDate(data.issueDate),
      expiryDate: data.expiryDate ? this.formatDate(data.expiryDate) : null,
      verificationUrl: `${platformUrl}/verify/${data.verificationId}`,
      claimUrl: data.claimToken
        ? `${platformUrl}/claim?token=${data.claimToken}`
        : null,
      earnedCount: data.earnedCount,
      personalMessage: data.personalMessage,
      isShared: data.isShared || false,
      helpUrl: `${platformUrl}/help`,
      privacyUrl: `${platformUrl}/privacy`,
    });
  }

  /**
   * Render plain text email (fallback for text-only clients)
   */
  renderText(data: BadgeEmailData): string {
    const platformUrl = this.configService.get<string>(
      'PLATFORM_URL',
      'http://localhost:5173',
    );

    let text = '';

    if (data.isShared && data.personalMessage) {
      text += `${data.personalMessage}\n\n`;
    }

    text += `🎉 ${data.isShared ? 'Badge Shared With You' : "Congratulations! You've Earned a New Badge"}\n\n`;
    text += `${data.badgeName}\n`;
    text += `Issued by ${data.issuerName}\n\n`;

    if (data.badgeDescription) {
      text += `${data.badgeDescription}\n\n`;
    }

    text += `BADGE DETAILS:\n`;
    text += `- Recipient: ${data.recipientName}\n`;
    text += `- Issued Date: ${this.formatDate(data.issueDate)}\n`;

    if (data.expiryDate) {
      text += `- Expires: ${this.formatDate(data.expiryDate)}\n`;
    }

    text += `\nVIEW YOUR BADGE:\n`;
    text += `${platformUrl}/verify/${data.verificationId}\n`;

    if (data.claimToken) {
      text += `\nCLAIM YOUR BADGE:\n`;
      text += `${platformUrl}/claim?token=${data.claimToken}\n`;
    }

    if (data.earnedCount) {
      text += `\nJOIN THE COMMUNITY:\n`;
      text += `${data.earnedCount} professionals have earned this badge.\n`;
    }

    text += `\n---\n`;
    text += `G-Credit - Your Digital Credential Platform\n`;
    text += `Help: ${platformUrl}/help\n`;
    text += `Privacy: ${platformUrl}/privacy\n`;
    text += `\n© 2026 G-Credit. All rights reserved.\n`;
    text += `This email was sent to ${data.recipientEmail}\n`;

    return text;
  }

  /**
   * Format date for email display
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Create plain text template (fallback)
   */
  private createTextTemplate(): string {
    return `
🎉 Congratulations! You've Earned a New Badge

{{badgeName}}
Issued by {{issuerName}}

{{badgeDescription}}

BADGE DETAILS:
- Recipient: {{recipientName}}
- Issued Date: {{issueDate}}
{{#if expiryDate}}- Expires: {{expiryDate}}{{/if}}

VIEW YOUR BADGE:
{{verificationUrl}}

{{#if claimUrl}}
CLAIM YOUR BADGE:
{{claimUrl}}
{{/if}}

{{#if earnedCount}}
JOIN THE COMMUNITY:
{{earnedCount}} professionals have earned this badge.
{{/if}}

---
G-Credit - Your Digital Credential Platform
Help: {{helpUrl}}
Privacy: {{privacyUrl}}

© 2026 G-Credit. All rights reserved.
This email was sent to {{recipientEmail}}
    `.trim();
  }
}
