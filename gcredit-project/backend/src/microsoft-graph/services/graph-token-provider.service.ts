import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

/**
 * Microsoft Graph Token Provider Service
 *
 * Manages OAuth 2.0 Client Credentials authentication for Microsoft Graph API.
 * Implements token caching and automatic refresh via @azure/identity.
 *
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see Sprint 6 Story 0.4: Microsoft Graph Module Foundation
 */
@Injectable()
export class GraphTokenProviderService implements OnModuleInit {
  private readonly logger = new Logger(GraphTokenProviderService.name);
  private credential: ClientSecretCredential | null = null;
  private authProvider: TokenCredentialAuthenticationProvider | null = null;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Azure Identity credential on module startup
   *
   * Creates ClientSecretCredential with tenant/client/secret from environment.
   * Gracefully degrades when configuration is missing (for test environments).
   */
  onModuleInit() {
    const tenantId = this.configService.get<string>('AZURE_TENANT_ID');
    const clientId = this.configService.get<string>('AZURE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AZURE_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      this.logger.warn(
        '⚠️ Azure AD configuration not set - Graph API features disabled',
      );
      this.logger.warn(
        'Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET to enable',
      );
      this.initialized = true;
      return;
    }

    try {
      this.credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret,
      );

      // Create auth provider with Graph API scope
      const scopes = [
        this.configService.get<string>(
          'GRAPH_API_SCOPE',
          'https://graph.microsoft.com/.default',
        ),
      ];

      this.authProvider = new TokenCredentialAuthenticationProvider(
        this.credential,
        { scopes },
      );

      this.initialized = true;
      this.logger.log('✅ Graph Token Provider initialized');
      this.logger.log(`📋 Tenant: ${tenantId}`);
      this.logger.log(`📋 Client: ${clientId}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize Graph Token Provider', error);
      this.initialized = true; // Mark as initialized even on error to allow app to start
    }
  }

  /**
   * Check if Graph API is available
   */
  isAvailable(): boolean {
    return this.authProvider !== null;
  }

  /**
   * Get authentication provider for Microsoft Graph Client
   *
   * Returns TokenCredentialAuthenticationProvider configured with
   * Client Credentials flow. Token caching/refresh handled by @azure/identity.
   *
   * @returns Authentication provider for Graph Client or null if not configured
   */
  getAuthProvider(): TokenCredentialAuthenticationProvider | null {
    return this.authProvider;
  }

  /**
   * Get access token directly (for debugging/testing)
   *
   * Requests fresh token from Azure AD. Use sparingly - prefer getAuthProvider()
   * which handles caching automatically.
   *
   * @returns Promise resolving to access token
   * @throws Error if Graph API is not configured
   */
  async getAccessToken(): Promise<string> {
    if (!this.credential) {
      throw new Error(
        'Graph API not configured - Azure AD credentials missing',
      );
    }

    try {
      const tokenResponse = await this.credential.getToken(
        'https://graph.microsoft.com/.default',
      );
      return tokenResponse.token;
    } catch (error) {
      this.logger.error('❌ Failed to acquire access token', error);
      throw error;
    }
  }
}
