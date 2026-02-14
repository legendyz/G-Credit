import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { UserRole } from '@prisma/client';
import {
  anyString,
  anyDate,
  containing,
} from '../../../test/helpers/jest-typed-matchers';

describe('AuthService', () => {
  let service: AuthService;
  let _prismaService: PrismaService;
  let _jwtService: JwtService;
  let _configService: ConfigService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.EMPLOYEE,
    isActive: true,
    passwordHash: '$2b$10$hashedpassword',
    emailVerified: false,
    lastLoginAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshTokenRecord = {
    id: 'token-123',
    token: 'valid-refresh-token',
    userId: 'user-123',
    user: mockUser,
    isRevoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret-32-characters-long',
        JWT_REFRESH_SECRET: 'test-refresh-secret-32-chars-long',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  const mockEmailService = {
    sendPasswordReset: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _jwtService = module.get<JwtService>(JwtService);
    _configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // ARCH-P1-001: Token Rotation Tests
  // ============================================================
  describe('refreshAccessToken - Token Rotation (ARCH-P1-001)', () => {
    beforeEach(() => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });
      mockJwtService.sign.mockReturnValue('new-token');
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockRefreshTokenRecord,
      );
      mockPrismaService.refreshToken.update.mockResolvedValue({
        ...mockRefreshTokenRecord,
        isRevoked: true,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'new-token-id',
        token: 'new-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
      });
    });

    it('should return both accessToken and new refreshToken on successful refresh', async () => {
      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-token');
    });

    it('should invalidate old refresh token when rotating', async () => {
      await service.refreshAccessToken('valid-refresh-token');

      // Verify old token was revoked
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshTokenRecord.id },
        data: { isRevoked: true },
      });
    });

    it('should create new refresh token in database', async () => {
      await service.refreshAccessToken('valid-refresh-token');

      // Verify new token was created
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: containing({
          token: anyString(),
          userId: 'user-123',
          expiresAt: anyDate(),
        }),
      });
    });

    it('should reject revoked refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        isRevoked: true,
      });

      await expect(
        service.refreshAccessToken('revoked-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      await expect(
        service.refreshAccessToken('expired-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject token not found in database', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshAccessToken('unknown-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject refresh for inactive user', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        user: { ...mockUser, isActive: false },
      });

      await expect(
        service.refreshAccessToken('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid JWT signature', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.refreshAccessToken('tampered-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================================
  // Architecture Audit: Password Reset Transaction Safety
  // ============================================================
  describe('resetPassword - atomic transaction (Arch Audit)', () => {
    const mockResetToken = {
      id: 'token-id-123',
      token: 'valid-reset-token',
      userId: 'user-123',
      used: false,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      createdAt: new Date(),
      user: mockUser,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        mockResetToken,
      );
      // Mock $transaction to execute the callback with tx delegate
      mockPrismaService.$transaction.mockImplementation(
        async (
          callback: (tx: {
            user: { update: jest.Mock };
            passwordResetToken: { update: jest.Mock };
          }) => Promise<void>,
        ) => {
          return callback({
            user: { update: jest.fn().mockResolvedValue({}) },
            passwordResetToken: { update: jest.fn().mockResolvedValue({}) },
          });
        },
      );
    });

    it('should wrap password update and token invalidation in $transaction', async () => {
      await service.resetPassword('valid-reset-token', 'NewPassword123!');

      // Verify $transaction was called (atomic operation)
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should update password and mark token as used atomically', async () => {
      const txUserUpdate = jest.fn().mockResolvedValue({});
      const txTokenUpdate = jest.fn().mockResolvedValue({});

      mockPrismaService.$transaction.mockImplementation(
        async (
          callback: (tx: {
            user: { update: jest.Mock };
            passwordResetToken: { update: jest.Mock };
          }) => Promise<void>,
        ) => {
          return callback({
            user: { update: txUserUpdate },
            passwordResetToken: { update: txTokenUpdate },
          });
        },
      );

      await service.resetPassword('valid-reset-token', 'NewPassword123!');

      // Verify both operations happened inside transaction
      expect(txUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { passwordHash: anyString() },
      });
      expect(txTokenUpdate).toHaveBeenCalledWith({
        where: { id: 'token-id-123' },
        data: { used: true },
      });
    });
  });

  // ============================================================
  // Story 11.1: Account Lockout Tests
  // ============================================================
  describe('login - Account Lockout (SEC-001)', () => {
    const bcrypt = require('bcrypt');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should reset failedLoginAttempts on successful login', async () => {
      const userWithAttempts = { ...mockUser, failedLoginAttempts: 3 };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithAttempts);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(userWithAttempts);

      await service.login({ email: 'test@example.com', password: 'correct' });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          lockedUntil: null,
        }),
      });
    });

    it('should increment failedLoginAttempts on wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({ failedLoginAttempts: 1 }),
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWith4Failures = { ...mockUser, failedLoginAttempts: 4 };
      mockPrismaService.user.findUnique.mockResolvedValue(userWith4Failures);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      });
    });

    it('should reject login when account is locked (even with correct password)', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Locked for 30 more min
      };
      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct' }),
      ).rejects.toThrow(UnauthorizedException);

      // Should not even check password
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should allow login after lock expires', async () => {
      const expiredLockUser = {
        ...mockUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // Lock expired 1 second ago
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expiredLockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(expiredLockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          lockedUntil: null,
        }),
      });
    });

    it('should return generic error for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'any' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });
});
