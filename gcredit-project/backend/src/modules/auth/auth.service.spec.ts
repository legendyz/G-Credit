import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { UserRole } from '@prisma/client';

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
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
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
        data: expect.objectContaining({
          token: expect.any(String),
          userId: 'user-123',
          expiresAt: expect.any(Date),
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
});
