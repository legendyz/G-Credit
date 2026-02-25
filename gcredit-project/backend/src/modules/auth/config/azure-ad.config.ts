import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfidentialClientApplication,
  Configuration,
  LogLevel,
} from '@azure/msal-node';

export interface AzureAdSsoConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

@Injectable()
export class AzureAdConfigService {
  private readonly logger = new Logger(AzureAdConfigService.name);
  private msalClient: ConfidentialClientApplication | null = null;
  private ssoConfig: AzureAdSsoConfig | null = null;

  constructor(private config: ConfigService) {
    this.initialize();
  }

  private initialize(): void {
    const clientId = this.config.get<string>('AZURE_SSO_CLIENT_ID');
    const clientSecret = this.config.get<string>('AZURE_SSO_CLIENT_SECRET');
    const tenantId = this.config.get<string>('AZURE_TENANT_ID');
    const redirectUri = this.config.get<string>('AZURE_SSO_REDIRECT_URI');
    const scopesStr = this.config.get<string>('AZURE_SSO_SCOPES');

    if (!clientId || !clientSecret || !tenantId || !redirectUri) {
      this.logger.warn(
        '[SSO] Azure AD SSO env vars missing (AZURE_SSO_CLIENT_ID, AZURE_SSO_CLIENT_SECRET, AZURE_TENANT_ID, AZURE_SSO_REDIRECT_URI). SSO endpoints will return 503.',
      );
      return;
    }

    this.ssoConfig = {
      clientId,
      clientSecret,
      tenantId,
      redirectUri,
      scopes: scopesStr
        ? scopesStr.split(' ').filter(Boolean)
        : ['openid', 'profile', 'email', 'User.Read'],
    };

    const msalConfig: Configuration = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message) => {
            if (level === LogLevel.Error) {
              this.logger.error(`[MSAL] ${message}`);
            }
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Error,
        },
      },
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
    this.logger.log('[SSO] Azure AD SSO configured successfully');
  }

  /**
   * Whether SSO is properly configured and available
   */
  isConfigured(): boolean {
    return this.msalClient !== null && this.ssoConfig !== null;
  }

  /**
   * Get the MSAL ConfidentialClientApplication instance
   * @throws Error if SSO is not configured
   */
  getMsalClient(): ConfidentialClientApplication {
    if (!this.msalClient) {
      throw new Error('Azure AD SSO is not configured');
    }
    return this.msalClient;
  }

  /**
   * Get SSO configuration values
   * @throws Error if SSO is not configured
   */
  getSsoConfig(): AzureAdSsoConfig {
    if (!this.ssoConfig) {
      throw new Error('Azure AD SSO is not configured');
    }
    return this.ssoConfig;
  }
}
