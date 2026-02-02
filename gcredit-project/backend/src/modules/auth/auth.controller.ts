import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
} from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Rate limit: 3 registrations per hour per IP (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Rate limit: 5 login attempts per minute per IP (Story 8.6 - SEC-P1-004)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  // Skip rate limiting for authenticated profile access (already protected by JWT)
  @SkipThrottle()
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.userId, dto);
  }

  // Rate limit: 3 password changes per hour (prevent brute force)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }
}
