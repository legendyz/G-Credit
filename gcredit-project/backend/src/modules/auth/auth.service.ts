import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Create user with EMPLOYEE role (SEC-P0-002: Role is always EMPLOYEE for new registrations)
    // Privilege escalation must go through admin approval workflow
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.EMPLOYEE,
      },
    });

    // 4. TODO: Add audit logging (Task 2.2.8)
    console.log(`[AUDIT] User registered: ${user.email} (${user.id})`);

    // 5. Return user without password hash
    const { passwordHash: _hash, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // TODO: Log failed attempt for rate limiting (Task 2.3.9)
      this.logger.warn(
        `Failed login attempt for user: ${dto.email}`,
        'LoginAttempt',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 5. Generate refresh token with longer expiry
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = this.jwtService.sign({ sub: user.id }, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    } as JwtSignOptions);

    // 6. Store refresh token in database (use same expiry as JWT)
    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 7. Update lastLoginAt timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Log successful login
    this.logger.log(
      `Successful login: ${user.email} (${user.id}, role: ${user.role})`,
      'LoginSuccess',
    );

    // 9. Return tokens and user profile (without password hash)
    const { passwordHash: _hash2, ...userProfile } = user;

    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }

  /**
   * Request password reset
   *
   * Generates a secure reset token and sends email to user.
   * Does not reveal whether email exists (security best practice).
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists (security best practice)
    if (!user) {
      // Still return success message
      return {
        message:
          'If the email exists in our system, you will receive a password reset link',
      };
    }

    // 2. Generate secure random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');

    // 3. Calculate expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // 4. Store token in database
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // 5. Send reset email
    try {
      await this.emailService.sendPasswordReset(user.email, token);
      console.log(`[AUDIT] Password reset requested: ${user.email}`);
    } catch (error: unknown) {
      console.error(
        `[ERROR] Failed to send reset email: ${(error as Error).message}`,
      );
      // Don't throw error - still return success to prevent email enumeration
    }

    return {
      message:
        'If the email exists in our system, you will receive a password reset link',
    };
  }

  /**
   * Reset password with token
   *
   * Validates token and updates user's password.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // 1. Find token in database
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Validate token exists and is not used
    if (!resetToken || resetToken.used) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate token has not expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // 2. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 3-4. Update password and mark token as used atomically
    // Architecture Audit: Prevents token reuse on crash between password update and token invalidation
    await this.prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Mark token as used (atomic with password update)
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
    });

    // 5. Log password reset
    console.log(
      `[AUDIT] Password reset completed: ${resetToken.user.email} (${resetToken.userId})`,
    );

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Refresh access token using refresh token
   *
   * Validates refresh token and issues new access token.
   * ARCH-P1-001: Implements token rotation - old refresh token is invalidated
   * and a new refresh token is issued with each refresh request.
   */
  async refreshAccessToken(refreshToken: string) {
    // 1. Verify refresh token JWT signature
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Check if token exists in database and is not revoked
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (tokenRecord.isRevoked) {
      // SECURITY: Potential token reuse attack detected
      this.logger.warn(
        `[SECURITY] Revoked refresh token reuse attempt for user: ${tokenRecord.user.email}`,
      );
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 3. Check if user is still active
    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 4. Generate new access token
    const newPayload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const accessToken = this.jwtService.sign(newPayload);

    // 5. ARCH-P1-001: Token Rotation - Invalidate old refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // 6. ARCH-P1-001: Generate and store new refresh token
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const newRefreshToken = this.jwtService.sign({ sub: tokenRecord.user.id }, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    } as JwtSignOptions);

    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);
    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt,
      },
    });

    this.logger.log(
      `[AUDIT] Token rotated: ${tokenRecord.user.email} (old token revoked, new token issued)`,
    );

    // 7. Return both tokens (frontend must update both)
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by revoking refresh token
   *
   * Marks the refresh token as revoked in the database.
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Find and revoke the refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (tokenRecord) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      console.log(`[AUDIT] User logged out: ${tokenRecord.user.email}`);
    }

    // Always return success (even if token not found - already logged out)
    return { message: 'Logged out successfully' };
  }

  /**
   * Get user profile
   *
   * Returns current user's profile information.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   *
   * Allows users to update their firstName and lastName.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName !== undefined ? dto.firstName : user.firstName,
        lastName: dto.lastName !== undefined ? dto.lastName : user.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[AUDIT] Profile updated: ${user.email} (${userId})`);

    return updatedUser;
  }

  /**
   * Change password
   *
   * Allows users to change their password after verifying current password.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    // 1. Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // 3. Check if new password is different from current
    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // 4. Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // 5. Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    console.log(`[AUDIT] Password changed: ${user.email} (${userId})`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Calculate expiry date from JWT expiry string (e.g., '7d', '24h', '30m')
   * @param expiresIn - JWT expiry string format
   * @returns Date object for database storage
   */
  private calculateExpiryDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 7 days if format is invalid
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      d: 24 * 60 * 60 * 1000, // days
      h: 60 * 60 * 1000, // hours
      m: 60 * 1000, // minutes
      s: 1000, // seconds
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
