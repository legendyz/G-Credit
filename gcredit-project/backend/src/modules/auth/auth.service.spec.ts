/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { M365SyncService } from '../../m365-sync/m365-sync.service';
import { UserRole } from '@prisma/client';
import {
  anyString,
  anyDate,
  containing,
} from '../../../test/helpers/jest-typed-matchers';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { hash: jest.Mock; compare: jest.Mock };

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
      count: jest.fn().mockResolvedValue(0), // ADR-017: computeIsManager()
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
    userAuditLog: {
      create: jest.fn().mockResolvedValue({}),
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

  const mockM365SyncService = {
    syncUserFromGraph: jest.fn().mockResolvedValue({ rejected: false }),
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
        { provide: M365SyncService, useValue: mockM365SyncService },
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
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should reset failedLoginAttempts on successful login', async () => {
      const userWithAttempts = { ...mockUser, failedLoginAttempts: 3 };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithAttempts);
      bcrypt.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(userWithAttempts);

      await service.login({ email: 'test@example.com', password: 'correct' });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          lockedUntil: null,
        }) as unknown,
      });
    });

    it('should increment failedLoginAttempts on wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser });
      bcrypt.compare.mockResolvedValue(false);
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({ failedLoginAttempts: 1 }) as unknown,
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWith4Failures = { ...mockUser, failedLoginAttempts: 4 };
      mockPrismaService.user.findUnique.mockResolvedValue(userWith4Failures);
      bcrypt.compare.mockResolvedValue(false);
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date) as unknown,
        }) as unknown,
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
      bcrypt.compare.mockResolvedValue(true);
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
        }) as unknown,
      });
    });

    it('should return generic error for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'any' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });

  // ============================================================
  // Story 12.3a — Task 16h: Login-time Mini-sync Tests
  // ============================================================
  describe('login - Mini-sync (Story 12.3a)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should reject login for M365 user with azureId set — SSO message (Story 13.1 AC #11)', async () => {
      const m365UserNoPassword = {
        ...mockUser,
        azureId: 'azure-id-123',
        passwordHash: '',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(m365UserNoPassword);

      await expect(
        service.login({ email: 'test@example.com', password: 'any' }),
      ).rejects.toThrow(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );

      // Should NOT call bcrypt.compare
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should reject login for M365 user with azureId + valid passwordHash — SSO message (AC #11)', async () => {
      const m365UserWithPassword = {
        ...mockUser,
        azureId: 'azure-id-123',
        passwordHash: '$2b$10$hashedpassword',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(m365UserWithPassword);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct' }),
      ).rejects.toThrow(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );

      // Should NOT call bcrypt.compare — check fires before password verification
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should reject login for user with null passwordHash and no azureId (AC #32)', async () => {
      const userNullHash = {
        ...mockUser,
        azureId: null,
        passwordHash: null,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userNullHash);

      await expect(
        service.login({ email: 'test@example.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should block M365 user (azureId set) from password login \u2014 triggers before mini-sync', async () => {
      const m365User = {
        ...mockUser,
        azureId: 'azure-id-123',
        lastSyncAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(m365User);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct' }),
      ).rejects.toThrow(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );

      // Mini-sync must NOT be called — azureId check fires before password verification
      expect(mockM365SyncService.syncUserFromGraph).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should reject login when M365 account has azureId set — blocks password login (Story 13.1)', async () => {
      const m365User = {
        ...mockUser,
        azureId: 'azure-id-123',
        lastSyncAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(m365User);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct' }),
      ).rejects.toThrow(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );
    });

    it('should allow login for local user (no azureId) — no regression (Story 13.1)', async () => {
      const localUser = { ...mockUser, azureId: null };
      mockPrismaService.user.findUnique.mockResolvedValue(localUser);
      bcrypt.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(localUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(result).toHaveProperty('accessToken');
      expect(mockM365SyncService.syncUserFromGraph).not.toHaveBeenCalled();
    });

    it('should use fresh role in JWT payload after mini-sync (AC #31)', async () => {
      // NOTE: With Story 13.1, M365 users (azureId set) are blocked from password login.
      // Mini-sync now happens only via SSO flow. This test verifies the ssoLogin path instead.
      // The local user path (no azureId) doesn't trigger mini-sync.
      const localUser = {
        ...mockUser,
        azureId: null,
        role: UserRole.EMPLOYEE,
        lastSyncAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(localUser);
      bcrypt.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(localUser);

      await service.login({ email: 'test@example.com', password: 'correct' });

      // Local user JWT uses their current role directly
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.EMPLOYEE,
        }),
      );
    });

    it('should return user profile without passwordHash in login response', async () => {
      const localUser = {
        ...mockUser,
        azureId: null,
        role: UserRole.EMPLOYEE,
        department: 'Engineering',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(localUser);
      bcrypt.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('test-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(localUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct',
      });

      // Password hash must NOT be in response
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.role).toBe(UserRole.EMPLOYEE);
      expect(result.user.department).toBe('Engineering');
    });

    it('should block M365 user (azureId set) from password login even with valid password', async () => {
      const m365User = {
        ...mockUser,
        azureId: 'azure-id-123',
        lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };
      mockPrismaService.user.findUnique.mockResolvedValue(m365User);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct' }),
      ).rejects.toThrow(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );

      // No password comparison should happen
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should block M365 user from password login regardless of sync status', async () => {
      const m365User = {
        ...mockUser,
        azureId: 'azure-id-123',
        lastSyncAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      };
      mockPrismaService.user.findUnique.mockResolvedValue(m365User);

      await expect(
        service.login({ email: 'test@example.com', password: 'correct' }),
      ).rejects.toThrow(
        'This account is managed by Microsoft 365. Please use "Sign in with Microsoft".',
      );

      // Mini-sync should NOT be called — azureId check fires before any password/sync logic
      expect(mockM365SyncService.syncUserFromGraph).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Story 13.1 — SSO Login Tests (ssoLogin method)
  // ============================================================
  describe('ssoLogin (Story 13.1)', () => {
    const mockSsoProfile = {
      oid: 'azure-oid-123',
      email: 'sso@example.com',
      displayName: 'SSO User',
    };

    const mockM365User = {
      ...mockUser,
      id: 'sso-user-123',
      email: 'sso@example.com',
      azureId: 'azure-oid-123',
      isActive: true,
      lastSyncAt: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.sign.mockReturnValue('sso-jwt-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(mockM365User);
      mockM365SyncService.syncUserFromGraph.mockResolvedValue({
        rejected: false,
      });
    });

    it('should return accessToken + refreshToken + user for existing active user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      const result = await service.ssoLogin(mockSsoProfile);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect('error' in result).toBe(false);
    });

    it('should JIT provision new user when azureId not found (Story 13.2 replaces sso_no_account)', async () => {
      const createdJitUser = {
        ...mockM365User,
        id: 'jit-new-user',
        passwordHash: '',
        role: UserRole.EMPLOYEE,
      };
      // First findUnique (azureId lookup) → null, second (re-fetch after JIT) → created user
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // lookup by azureId
        .mockResolvedValueOnce(createdJitUser); // re-fetch after JIT + sync
      mockPrismaService.user.create.mockResolvedValue(createdJitUser);
      mockPrismaService.user.update.mockResolvedValue(createdJitUser);

      const result = await service.ssoLogin(mockSsoProfile);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            azureId: 'azure-oid-123',
            passwordHash: '',
            role: UserRole.EMPLOYEE,
          }),
        }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('error');
    });

    it('should return { error: account_disabled } for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockM365User,
        isActive: false,
      });

      const result = await service.ssoLogin(mockSsoProfile);

      expect(result).toEqual({ error: 'account_disabled' });
    });

    it('should lookup user by azureId (oid)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      await service.ssoLogin(mockSsoProfile);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { azureId: 'azure-oid-123' },
      });
    });

    it('should update lastLoginAt on successful SSO login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      await service.ssoLogin(mockSsoProfile);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockM365User.id },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
            failedLoginAttempts: 0,
            lockedUntil: null,
          }),
        }),
      );
    });

    it('should trigger mini-sync for M365 user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      await service.ssoLogin(mockSsoProfile);

      expect(mockM365SyncService.syncUserFromGraph).toHaveBeenCalledWith({
        id: mockM365User.id,
        azureId: mockM365User.azureId,
        lastSyncAt: mockM365User.lastSyncAt,
      });
    });

    it('should return { error: sso_failed } when mini-sync rejects', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);
      mockM365SyncService.syncUserFromGraph.mockResolvedValue({
        rejected: true,
        reason: 'Account disabled in M365',
      });

      const result = await service.ssoLogin(mockSsoProfile);

      expect(result).toEqual({ error: 'sso_failed' });
    });

    it('should not include passwordHash in returned user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      const result = await service.ssoLogin(mockSsoProfile);

      expect('user' in result && result.user).toBeDefined();
      if ('user' in result) {
        expect(result.user).not.toHaveProperty('passwordHash');
      }
    });

    it('should generate JWT with { sub, email, role } payload', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      await service.ssoLogin(mockSsoProfile);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockM365User.id,
          email: mockM365User.email,
          role: mockM365User.role,
          isManager: false,
        }),
      );
    });

    it('should store refresh token in database', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockM365User);

      await service.ssoLogin(mockSsoProfile);

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: 'sso-jwt-token',
            userId: mockM365User.id,
          }),
        }),
      );
    });
  });

  // ============================================================
  // ADR-017: JWT isManager Claim Tests
  // ============================================================
  describe('JWT isManager claim (ADR-017)', () => {
    it('should include isManager: false for user with no direct reports (login)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockJwtService.sign.mockReturnValue('test-token');

      await service.login({ email: mockUser.email, password: 'password123' });

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { managerId: mockUser.id },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ isManager: false }),
      );
    });

    it('should include isManager: true for user with direct reports (login)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.count.mockResolvedValue(3);
      mockJwtService.sign.mockReturnValue('test-token');

      await service.login({ email: mockUser.email, password: 'password123' });

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { managerId: mockUser.id },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ isManager: true }),
      );
    });

    it('should recompute isManager on token refresh', async () => {
      mockPrismaService.user.count.mockResolvedValue(2);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockRefreshTokenRecord,
      );
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-token');
      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });

      await service.refreshAccessToken('valid-refresh-token');

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { managerId: mockUser.id },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ isManager: true }),
      );
    });

    it('should set isManager: false for registration (no direct reports possible)', async () => {
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null); // no existing user
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-token');

      await service.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      });

      // computeIsManager should NOT be called for registration
      expect(mockPrismaService.user.count).not.toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ isManager: false }),
      );
    });

    it('should include isManager: true for SSO user with direct reports', async () => {
      const mockSsoMgr = {
        oid: 'azure-mgr-oid',
        email: 'mgr@example.com',
        displayName: 'Manager User',
      };
      const mockMgrUser = {
        ...mockUser,
        id: 'mgr-user-id',
        email: 'mgr@example.com',
        azureId: 'azure-mgr-oid',
        isActive: true,
        lastSyncAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockMgrUser);
      mockPrismaService.user.update.mockResolvedValue(mockMgrUser);
      mockPrismaService.user.count.mockResolvedValue(5); // has direct reports
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('sso-mgr-token');
      mockM365SyncService.syncUserFromGraph.mockResolvedValue({
        rejected: false,
      });

      await service.ssoLogin(mockSsoMgr);

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { managerId: mockMgrUser.id },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ isManager: true }),
      );
    });
  });
});
