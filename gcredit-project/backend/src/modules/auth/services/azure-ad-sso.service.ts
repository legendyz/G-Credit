import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { AzureAdConfigService } from '../config/azure-ad.config';
import { AzureAdProfile } from '../interfaces/azure-ad-profile.interface';

export interface SsoAuthUrl {
  authUrl: string;
  codeVerifier: string;
  state: string;
}

@Injectable()
export class AzureAdSsoService {
  private readonly logger = new Logger(AzureAdSsoService.name);

  constructor(private azureAdConfig: AzureAdConfigService) {}

  /**
   * Generate Azure AD authorize URL with PKCE and state for CSRF protection
   */
  async generateAuthUrl(): Promise<SsoAuthUrl> {
    this.ensureConfigured();

    const config = this.azureAdConfig.getSsoConfig();
    const msalClient = this.azureAdConfig.getMsalClient();

    // Generate PKCE code verifier (43-128 chars, URL-safe)
    const codeVerifier = randomBytes(32).toString('base64url');

    // Generate code challenge from verifier (S256)
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate random state for CSRF protection
    const state = randomBytes(16).toString('hex');

    const authCodeUrlParams = {
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      codeChallenge,
      codeChallengeMethod: 'S256' as const,
      state,
    };

    const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParams);

    this.logger.log('[SSO] Generated Azure AD authorize URL');

    return { authUrl, codeVerifier, state };
  }

  /**
   * Exchange authorization code for tokens and extract user profile
   * @param code Authorization code from Azure AD callback
   * @param codeVerifier PKCE code verifier stored during login redirect
   */
  async handleCallback(
    code: string,
    codeVerifier: string,
  ): Promise<AzureAdProfile> {
    this.ensureConfigured();

    const config = this.azureAdConfig.getSsoConfig();
    const msalClient = this.azureAdConfig.getMsalClient();

    const tokenRequest = {
      code,
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      codeVerifier,
    };

    const result = await msalClient.acquireTokenByCode(tokenRequest);

    // Extract claims from id_token
    const claims = result.idTokenClaims as Record<string, unknown>;

    const oid = claims.oid as string | undefined;
    if (!oid) {
      this.logger.warn(
        '[SECURITY] SSO callback: missing oid claim in id_token',
      );
      throw new Error('Missing oid claim in Azure AD id_token');
    }

    const email =
      (claims.preferred_username as string) || (claims.email as string) || '';
    const displayName = (claims.name as string) || '';

    if (!email) {
      this.logger.warn(
        '[SECURITY] SSO callback: missing email/preferred_username claim in id_token',
      );
      throw new Error('Missing email claim in Azure AD id_token');
    }

    this.logger.log(`[SSO] Token exchange successful for oid:${oid}`);

    return {
      oid,
      email: email.toLowerCase(),
      displayName,
    };
  }

  /**
   * Throw 503 if SSO is not configured
   */
  private ensureConfigured(): void {
    if (!this.azureAdConfig.isConfigured()) {
      throw new ServiceUnavailableException(
        'Azure AD SSO is not configured. Please contact your administrator.',
      );
    }
  }
}
