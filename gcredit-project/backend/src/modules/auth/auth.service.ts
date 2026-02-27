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
import { User, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { maskEmailForLog } from '../../common/utils/log-sanitizer';
import { M365SyncService } from '../../m365-sync/m365-sync.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AzureAdProfile } from './interfaces/azure-ad-profile.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private m365SyncService: M365SyncService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email already exists (case-insensitive)
    const normalizedEmail = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
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
        email: normalizedEmail,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.EMPLOYEE,
      },
    });

    // Audit logging via NestJS Logger — full audit trail system deferred to Phase 2
    this.logger.log(`[AUDIT] User registered: user:${user.id}`);

    // 4. Generate JWT tokens (auto-login after registration)
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: randomBytes(16).toString('hex') },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      } as JwtSignOptions,
    );

    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 5. Return tokens and user profile (without password hash)
    const { passwordHash: _hash, ...userProfile } = user;
    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }

  async login(dto: LoginDto) {
    // 1. Find user by email (case-insensitive — M365 sync stores lowercase)
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2.5. Check if account is locked
    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        // Still locked — don't reveal remaining time
        throw new UnauthorizedException('Invalid credentials');
      }
      // Lock expired — will be fully reset on successful login below
    }

    // Story 13.1 AC #11 / DEC-011-13: Block password login for M365 users
    // M365 users (having azureId) must use SSO — different error message than "Invalid credentials"
    if (user.azureId) {
      throw new UnauthorizedException(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );
    }

    // Story 12.3a AC #32: Empty passwordHash guard (M365 users with no local password)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: attempts,
      };

      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        this.logger.warn(
          `[SECURITY] Account locked after ${attempts} failed attempts: user ${user.id}`,
          'AccountLockout',
        );
      } else {
        this.logger.warn(
          `Failed login attempt ${attempts}/${this.MAX_LOGIN_ATTEMPTS} for user ${user.id}`,
          'LoginAttempt',
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Story 12.3a AC #31: Login-time mini-sync for M365 users
    let freshUser = user;
    if (user.azureId) {
      const syncResult = await this.m365SyncService.syncUserFromGraph({
        id: user.id,
        azureId: user.azureId,
        lastSyncAt: user.lastSyncAt,
      });
      if (syncResult.rejected) {
        throw new UnauthorizedException('Invalid credentials');
      }
      // Refresh user data after sync (role may have changed)
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
      if (updatedUser) {
        freshUser = updatedUser;
      }
    }

    // 4. Generate JWT tokens — use FRESH role from synced user data
    const payload = {
      sub: freshUser.id,
      email: freshUser.email,
      role: freshUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 5. Generate refresh token with longer expiry
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: randomBytes(16).toString('hex') },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      } as JwtSignOptions,
    );

    // 6. Store refresh token in database (use same expiry as JWT)
    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 7. Update lastLoginAt + reset lockout counters
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // 8. Log successful login
    this.logger.log(
      `Successful login: user:${freshUser.id} (role: ${freshUser.role})`,
      'LoginSuccess',
    );

    // 9. Return tokens and user profile (without password hash)
    const { passwordHash: _hash2, ...userProfile } = freshUser;

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
      this.logger.log(
        `[AUDIT] Password reset requested: ${maskEmailForLog(user.email)}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send reset email: ${(error as Error).message}`,
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
    this.logger.log(
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
    const newRefreshToken = this.jwtService.sign(
      { sub: tokenRecord.user.id, jti: randomBytes(16).toString('hex') },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      } as JwtSignOptions,
    );

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

      this.logger.log(`[AUDIT] User logged out: user:${tokenRecord.user.id}`);
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
        department: true,
        azureId: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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

    // SSO users' profile is managed by Microsoft 365 — block local edits
    if (user.azureId) {
      throw new BadRequestException(
        'SSO user profile is managed by Microsoft 365. Changes must be made in Azure AD.',
      );
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

    this.logger.log(`[AUDIT] Profile updated: user:${userId}`);

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

    // SSO users have no local password — block password change
    if (user.azureId) {
      throw new BadRequestException(
        'SSO user passwords are managed by Microsoft 365. Please change your password in Azure AD.',
      );
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

    this.logger.log(`[AUDIT] Password changed: user:${userId}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * SSO Login — find user by azureId and issue JWT tokens
   * Called from SSO callback after successful Azure AD token exchange
   *
   * @returns { accessToken, refreshToken, user } on success
   * @returns { error: string } if user not found, inactive, etc.
   */
  async ssoLogin(profile: AzureAdProfile): Promise<
    | {
        accessToken: string;
        refreshToken: string;
        user: Record<string, unknown>;
      }
    | { error: string }
  > {
    // 1. Look up user by azureId (oid from Azure AD)
    const user = await this.prisma.user.findUnique({
      where: { azureId: profile.oid },
    });

    // 2. User not found — JIT provisioning (Story 13.2)
    let freshUser: User | null = null;
    let isJitUser = false;
    if (!user) {
      // JIT User Provisioning — auto-create user from Azure AD profile
      const jitUser = await this.createSsoUser(profile);

      // Graph API mini-sync (same as returning-user path)
      try {
        const syncResult = await this.m365SyncService.syncUserFromGraph({
          id: jitUser.id,
          azureId: jitUser.azureId!,
          lastSyncAt: jitUser.lastSyncAt,
        });
        if (syncResult.rejected) {
          this.logger.warn(
            `[SECURITY] JIT user sync rejected: user:${jitUser.id}, reason: ${syncResult.reason}`,
          );
          // Deactivate JIT user — M365 account is disabled
          await this.prisma.user.update({
            where: { id: jitUser.id },
            data: { isActive: false },
          });
          return { error: 'sso_failed' };
        }
      } catch (syncError) {
        // Sync failure is non-fatal for JIT (AC #4) — user keeps EMPLOYEE defaults
        this.logger.warn(
          `[SSO] JIT sync failed for user:${jitUser.id} — continuing with defaults: ${(syncError as Error).message}`,
        );
      }

      // Audit log + admin notification (AC #10)
      await this.createJitAuditLog(jitUser);

      // Re-fetch user to get post-sync data (role, department, managerId)
      freshUser = await this.prisma.user.findUnique({
        where: { id: jitUser.id },
      });
      if (!freshUser) {
        freshUser = jitUser;
      }
      isJitUser = true;
    } else {
      freshUser = user;
    }

    // 3. Check if user is active
    if (!freshUser.isActive) {
      this.logger.warn(
        `[SECURITY] SSO login blocked for disabled account: user:${freshUser.id}`,
      );
      return { error: 'account_disabled' };
    }

    // 4. Login-time mini-sync for returning M365 users (skip for JIT — already synced above)
    if (!isJitUser && freshUser.azureId) {
      const syncResult = await this.m365SyncService.syncUserFromGraph({
        id: freshUser.id,
        azureId: freshUser.azureId,
        lastSyncAt: freshUser.lastSyncAt,
      });
      if (syncResult.rejected) {
        this.logger.warn(
          `[SECURITY] SSO login rejected by M365 sync: user:${freshUser.id}`,
        );
        return { error: 'sso_failed' };
      }
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: freshUser.id },
      });
      if (updatedUser) {
        freshUser = updatedUser;
      }
    }

    // 5. Generate JWT tokens — same payload as password login
    const payload = {
      sub: freshUser.id,
      email: freshUser.email,
      role: freshUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = this.jwtService.sign(
      { sub: freshUser.id, jti: randomBytes(16).toString('hex') },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      } as JwtSignOptions,
    );

    // 6. Store refresh token in DB
    const expiresAt = this.calculateExpiryDate(refreshExpiresIn);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: freshUser.id,
        expiresAt,
      },
    });

    // 7. Update lastLoginAt + reset lockout counters
    await this.prisma.user.update({
      where: { id: freshUser.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    this.logger.log(
      `[SSO] Successful SSO login: user:${freshUser.id} (role: ${freshUser.role})`,
    );

    const { passwordHash: _hash, ...userProfile } = freshUser;
    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
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

  /**
   * JIT User Provisioning — create new user from Azure AD SSO first login.
   * Called when ssoLogin() finds no user with matching azureId.
   *
   * Story 13.2 AC #1, #6: auto-create user, handle race condition (P2002).
   */
  private async createSsoUser(profile: AzureAdProfile): Promise<User> {
    const nameParts = profile.displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const user = await this.prisma.user.create({
        data: {
          azureId: profile.oid,
          email: profile.email.toLowerCase(),
          firstName,
          lastName,
          passwordHash: '', // SSO-only — cannot use password login (DEC-011-13)
          isActive: true,
          role: UserRole.EMPLOYEE, // Default — upgraded by syncUserFromGraph() or Full Sync
        },
      });

      this.logger.log(
        `[SSO] JIT user provisioned: user:${user.id} (azureId: ${profile.oid})`,
      );

      // Admin bootstrap: INITIAL_ADMIN_EMAIL (DEC-005 Resolution B)
      const initialAdminEmail = this.config.get<string>('INITIAL_ADMIN_EMAIL');
      if (
        initialAdminEmail &&
        user.email === initialAdminEmail.trim().toLowerCase()
      ) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN, roleSetManually: true },
        });
        user.role = UserRole.ADMIN;
        this.logger.warn(
          `[SECURITY] Admin bootstrapped via INITIAL_ADMIN_EMAIL: user:${user.id}`,
        );
      }

      return user;
    } catch (error) {
      // Handle race condition: concurrent first-login with same azureId
      const prismaError = error as {
        code?: string;
        meta?: { target?: string[] };
      };
      if (
        prismaError.code === 'P2002' &&
        prismaError.meta?.target?.includes('azureId')
      ) {
        // Prisma UniqueConstraintViolation on azureId — race condition recovery
        this.logger.warn(
          `[SSO] JIT race condition: azureId:${profile.oid} already exists — fetching existing user`,
        );
        const existing = await this.prisma.user.findUnique({
          where: { azureId: profile.oid },
        });
        if (existing) return existing;
      }
      throw error;
    }
  }

  /**
   * Create audit log entry for JIT user provisioning.
   * Visible in Admin Activity Feed — prompts admin to run Full Sync.
   *
   * Story 13.2 AC #10: audit log failure must NOT block login.
   */
  private async createJitAuditLog(user: User): Promise<void> {
    try {
      await this.prisma.userAuditLog.create({
        data: {
          userId: user.id,
          action: 'JIT_PROVISIONED',
          changes: {
            source: 'SSO_FIRST_LOGIN',
            email: user.email,
            azureId: user.azureId,
            message: `New user ${user.firstName} ${user.lastName} (${user.email}) auto-provisioned via SSO. Run Full Sync to update manager relationships and role assignments.`,
          },
          source: 'SYSTEM',
          actorId: null,
        },
      });

      this.logger.log(
        `[AUDIT] JIT user provisioned: user:${user.id} — recommend Full Sync for complete role/manager derivation`,
      );
    } catch (error) {
      // Audit log failure should not block login
      this.logger.error(
        `[AUDIT] Failed to create JIT audit log for user:${user.id}: ${(error as Error).message}`,
      );
    }
  }
}
