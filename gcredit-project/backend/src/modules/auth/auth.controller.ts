import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/request-with-user.interface';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  // Rate limit: 3 registrations per hour per IP (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  // Rate limit: 5 login attempts per minute per IP (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    // Dual-write: body still returns tokens (transition period)
    return result;
  }

  // Rate limit: 3 password reset requests per 5 minutes (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 300000, limit: 3 } })
  @Public()
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  async requestReset(@Body() dto: RequestResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // Rate limit: 5 reset attempts per 5 minutes (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 300000, limit: 5 } })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // Rate limit: 10 refresh per minute (more lenient for valid sessions)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
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
    return result;
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
    // Clear httpOnly cookies
    res.clearCookie('access_token', { path: '/api' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
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
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
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
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api',
      maxAge: 15 * 60 * 1000, // 15 min (match JWT expiry)
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
