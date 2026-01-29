import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import { GraphTokenProviderService } from './graph-token-provider.service';

/**
 * Microsoft Graph Teams Service
 * 
 * Sends Microsoft Teams notifications via Graph API (TeamsActivity.Send permission).
 * Supports Adaptive Cards for rich notification experiences.
 * 
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see Sprint 6 Story 7.4: Microsoft Teams Notifications
 */
@Injectable()
export class GraphTeamsService implements OnModuleInit {
  private readonly logger = new Logger(GraphTeamsService.name);
  private graphClient: Client;
  private isEnabled: boolean;

  constructor(
    private readonly tokenProvider: GraphTokenProviderService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<boolean>(
      'ENABLE_GRAPH_TEAMS',
      false,
    );

    if (!this.isEnabled) {
      this.logger.warn('⚠️ Graph Teams disabled (ENABLE_GRAPH_TEAMS=false)');
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
        this.logger.error('❌ Failed to initialize Graph Teams on module init', error);
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

      this.logger.log('✅ Graph Teams Service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Graph Teams client', error);
      this.isEnabled = false;
    }
  }

  /**
   * Send Teams activity feed notification
   * 
   * Sends notification to user's Teams activity feed with optional Adaptive Card.
   * Uses /users/{userId}/teamwork/sendActivityNotification endpoint.
   * 
   * @param userId - Target user ID or email
   * @param activityType - Activity type identifier (e.g., 'badgeEarned')
   * @param previewText - Plain text preview shown in notification
   * @param templateParameters - Variables for activity template
   * @param adaptiveCard - Optional Adaptive Card JSON
   * @returns Promise resolving when notification sent
   */
  async sendActivityNotification(
    userId: string,
    activityType: string,
    previewText: string,
    templateParameters: Record<string, string>,
    adaptiveCard?: any,
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('⚠️ Graph Teams disabled, skipping notification');
      return;
    }

    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    const notification = {
      topic: {
        source: 'text',
        value: 'G-Credit Badge Platform',
      },
      activityType,
      previewText: {
        content: previewText,
      },
      templateParameters,
      ...(adaptiveCard && { card: adaptiveCard }),
    };

    try {
      this.logger.log(
        `📢 Sending Teams notification: ${activityType} → ${userId}`,
      );

      await this.graphClient
        .api(`/users/${userId}/teamwork/sendActivityNotification`)
        .post(notification);

      this.logger.log('✅ Teams notification sent successfully');
    } catch (error) {
      this.logger.error('❌ Failed to send Teams notification', error);
      throw error;
    }
  }

  /**
   * Check if Graph Teams is enabled
   */
  isGraphTeamsEnabled(): boolean {
    return this.isEnabled;
  }
}
