import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  Query,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AzureAdSsoService } from './services/azure-ad-sso.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/request-with-user.interface';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService,
    private azureAdSsoService: AzureAdSsoService,
    private configService: ConfigService,
  ) {}

  // Rate limit: 3 registrations per hour per IP (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts. Default: 3/hour.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    // Story 11.25 AC-M4: Only return user profile — tokens are in httpOnly cookies only
    return { user: result.user };
  }

  // Rate limit: 5 login attempts per minute per IP (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts. Default: 5/min.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    // Story 11.25 AC-M4: Only return user profile — tokens are in httpOnly cookies only
    return { user: result.user };
  }

  // Rate limit: 3 password reset requests per 5 minutes (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 300000, limit: 3 } })
  @Public()
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 429,
    description: 'Too many reset requests. Default: 3/5min.',
  })
  async requestReset(@Body() dto: RequestResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // Rate limit: 5 reset attempts per 5 minutes (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 300000, limit: 5 } })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 429,
    description: 'Too many reset attempts. Default: 5/5min.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // Rate limit: 10 refresh per minute (more lenient for valid sessions)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 429,
    description: 'Too many refresh requests. Default: 10/min.',
  })
  async refresh(
    @Body('refreshToken') bodyRefreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Dual-read: prefer cookie, fallback to body (transition period)
    const refreshToken: string =
      (req.cookies?.refresh_token as string) || bodyRefreshToken;
    const result = await this.authService.refreshAccessToken(refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    // Story 11.25 AC-M4: Tokens only in httpOnly cookies
    return { message: 'Token refreshed' };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') bodyRefreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Dual-read: prefer cookie, fallback to body
    const refreshToken: string =
      (req.cookies?.refresh_token as string) || bodyRefreshToken;
    // Clear httpOnly cookies (Story 11.25 AC-M3: match setCookie attributes exactly)
    res.clearCookie('access_token', this.getCookieOptions('/api'));
    res.clearCookie('refresh_token', this.getCookieOptions('/api/auth'));
    return this.authService.logout(refreshToken);
  }

  // Skip rate limiting for authenticated profile access (already protected by JWT)
  @SkipThrottle()
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  // Rate limit: 3 password changes per hour (prevent brute force)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 429,
    description: 'Too many password change attempts. Default: 3/hour.',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  // ====== SSO Endpoints (Story 13.1) ======

  /**
   * SSO Login Redirect — initiates Azure AD OAuth flow
   * Generates PKCE challenge + state, stores in signed cookie, redirects to Azure AD
   */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @Get('sso/login')
  @ApiResponse({
    status: 429,
    description: 'Too many SSO login requests. Default: 10/min.',
  })
  async ssoLogin(@Res() res: Response) {
    const { authUrl, codeVerifier, state } =
      await this.azureAdSsoService.generateAuthUrl();

    // Store codeVerifier + state in httpOnly cookie (5 min max-age)
    const ssoStatePayload = JSON.stringify({ codeVerifier, state });
    res.cookie('sso_state', ssoStatePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/sso',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    this.logger.log('[SSO] Redirecting to Azure AD authorize URL');
    return res.redirect(authUrl);
  }

  /**
   * SSO Callback — Azure AD redirects here after user authentication
   * Validates state, exchanges code for tokens, issues JWT cookies, redirects to frontend
   */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @Get('sso/callback')
  @ApiResponse({
    status: 429,
    description: 'Too many SSO callback requests. Default: 10/min.',
  })
  async ssoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') azureError: string,
    @Query('error_description') errorDescription: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    // Clear SSO state cookie regardless of outcome
    const clearSsoCookie = () => {
      res.clearCookie('sso_state', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/sso',
      });
    };

    try {
      // Handle Azure AD error (user cancelled, denied, etc.)
      if (azureError) {
        this.logger.warn(
          `[SECURITY] Azure AD SSO error: ${azureError} — ${errorDescription || 'no description'}`,
        );
        clearSsoCookie();
        const errorCode =
          azureError === 'access_denied' ? 'sso_cancelled' : 'sso_failed';
        return res.redirect(`${frontendUrl}/login?error=${errorCode}`);
      }

      // Validate required params
      if (!code || !state) {
        this.logger.warn(
          '[SECURITY] SSO callback missing code or state parameter',
        );
        clearSsoCookie();
        return res.redirect(`${frontendUrl}/login?error=sso_failed`);
      }

      // Retrieve and validate stored state from cookie
      const ssoStateCookie = req.cookies?.sso_state as string;
      if (!ssoStateCookie) {
        this.logger.warn(
          '[SECURITY] SSO callback: missing sso_state cookie (expired or tampered)',
        );
        clearSsoCookie();
        return res.redirect(`${frontendUrl}/login?error=sso_failed`);
      }

      let storedState: { codeVerifier: string; state: string };
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        storedState = JSON.parse(ssoStateCookie);
      } catch {
        this.logger.warn('[SECURITY] SSO callback: corrupted sso_state cookie');
        clearSsoCookie();
        return res.redirect(`${frontendUrl}/login?error=sso_failed`);
      }

      // CSRF protection: validate state matches
      if (state !== storedState.state) {
        this.logger.warn(
          '[SECURITY] SSO callback: state mismatch (potential CSRF)',
        );
        clearSsoCookie();
        return res.redirect(`${frontendUrl}/login?error=sso_failed`);
      }

      // Exchange code for tokens via MSAL
      const profile = await this.azureAdSsoService.handleCallback(
        code,
        storedState.codeVerifier,
      );

      // SSO login via AuthService (find user, generate JWT, etc.)
      const loginResult = await this.authService.ssoLogin(profile);

      clearSsoCookie();

      // Handle error responses from ssoLogin
      if ('error' in loginResult) {
        const errorCode = loginResult.error;
        this.logger.warn(`[SSO] SSO login failed: ${errorCode}`);
        return res.redirect(`${frontendUrl}/login?error=${errorCode}`);
      }

      // Success — set auth cookies and redirect to frontend
      this.setAuthCookies(
        res,
        loginResult.accessToken,
        loginResult.refreshToken,
      );

      this.logger.log('[SSO] SSO callback success — redirecting to frontend');
      return res.redirect(`${frontendUrl}/sso/callback?success=true`);
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Unknown SSO error';
      this.logger.error(`[SECURITY] SSO callback exception: ${errMsg}`);

      clearSsoCookie();

      // Check for specific MSAL errors
      if (errMsg.includes('oid')) {
        return res.redirect(`${frontendUrl}/login?error=sso_invalid_token`);
      }

      return res.redirect(`${frontendUrl}/login?error=sso_failed`);
    }
  }

  /**
   * Story 11.25 AC-M3: Shared cookie options to ensure setCookie and clearCookie
   * use identical attributes (httpOnly, secure, sameSite, path).
   * Browsers require exact attribute match to clear cookies.
   */
  private getCookieOptions(path: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path,
    };
  }

  /**
   * Set httpOnly cookies for JWT tokens (Story 11.6 - SEC-002)
   * Access token: path=/api (all API requests)
   * Refresh token: path=/api/auth (auth endpoints only)
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      ...this.getCookieOptions('/api'),
      maxAge: 15 * 60 * 1000, // 15 min (match JWT expiry)
    });

    res.cookie('refresh_token', refreshToken, {
      ...this.getCookieOptions('/api/auth'),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
