import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
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

    // 3. Create user with specified role or default EMPLOYEE role
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: (dto.role as UserRole) || UserRole.EMPLOYEE, // Use provided role or default to EMPLOYEE
      },
    });

    // 4. TODO: Add audit logging (Task 2.2.8)
    console.log(`[AUDIT] User registered: ${user.email} (${user.id})`);

    // 5. Return user without password hash
    const { passwordHash: _, ...result } = user;
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
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      // TODO: Log failed attempt for rate limiting (Task 2.3.9)
      console.log(`[AUDIT] Failed login attempt: ${dto.email}`);
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
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any,
    );

    // 6. Update lastLoginAt timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 7. Log successful login
    console.log(`[AUDIT] Successful login: ${user.email} (${user.id})`);

    // 8. Return tokens and user profile (without password hash)
    const { passwordHash: _, ...userProfile} = user;
    
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
    } catch (error) {
      console.error(`[ERROR] Failed to send reset email: ${error.message}`);
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

    // 3. Update user password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // 4. Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // 5. Log password reset
    console.log(
      `[AUDIT] Password reset completed: ${resetToken.user.email} (${resetToken.userId})`,
    );

    return { message: 'Password has been reset successfully' };
  }
}
