/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../common/prisma.service';
import { EmailService } from '../../../common/email.service';
import { M365SyncService } from '../../../m365-sync/m365-sync.service';
import { UserRole } from '@prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService — JIT User Provisioning (Story 13.2)', () => {
  let service: AuthService;

  const mockSsoProfile = {
    oid: 'azure-oid-jit-123',
    email: 'newuser@example.com',
    displayName: 'John Doe',
  };

  const mockJitUser = {
    id: 'jit-user-id-1',
    email: 'newuser@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.EMPLOYEE,
    azureId: 'azure-oid-jit-123',
    isActive: true,
    passwordHash: '',
    emailVerified: false,
    lastLoginAt: null,
    lastSyncAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    department: null,
    managerId: null,
    roleSetManually: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
    },
    userAuditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('jit-jwt-token'),
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
  });

  // ============================================================
  // Test 1: JIT creates user with correct fields
  // ============================================================
  it('should create new user when azureId not found (JIT provisioning)', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null) // azureId lookup → not found
      .mockResolvedValueOnce(mockJitUser); // re-fetch after JIT + sync
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);

    const result = await service.ssoLogin(mockSsoProfile);

    // Verify user.create called with correct JIT fields
    expect(mockPrismaService.user.create).toHaveBeenCalledWith({
      data: {
        azureId: 'azure-oid-jit-123',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: '', // SSO-only
        isActive: true,
        role: UserRole.EMPLOYEE,
      },
    });

    // Verify login succeeds with JWT tokens
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
    expect('error' in result).toBe(false);
  });

  // ============================================================
  // Test 2: JIT with sync failure → user still created with EMPLOYEE role
  // ============================================================
  it('should continue login if Graph API sync fails (non-fatal)', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null) // azureId lookup → not found
      .mockResolvedValueOnce(mockJitUser); // re-fetch
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);
    mockM365SyncService.syncUserFromGraph.mockRejectedValueOnce(
      new Error('Graph API connection timeout'),
    );

    const result = await service.ssoLogin(mockSsoProfile);

    // User should still be created and login should succeed
    expect(mockPrismaService.user.create).toHaveBeenCalled();
    expect(result).toHaveProperty('accessToken');
    expect('error' in result).toBe(false);
  });

  // ============================================================
  // Test 3: Admin bootstrap sets ADMIN role
  // ============================================================
  it('should set ADMIN role when email matches INITIAL_ADMIN_EMAIL', async () => {
    const adminProfile = {
      oid: 'azure-admin-oid',
      email: 'admin@example.com',
      displayName: 'Admin User',
    };
    const adminJitUser = {
      ...mockJitUser,
      id: 'admin-jit-id',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      azureId: 'azure-admin-oid',
    };

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'INITIAL_ADMIN_EMAIL') return 'admin@example.com';
      const config: Record<string, string> = {
        JWT_REFRESH_SECRET: 'test-refresh-secret-32-chars-long',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    });

    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null) // azureId lookup → not found
      .mockResolvedValueOnce({ ...adminJitUser, role: UserRole.ADMIN }); // re-fetch
    mockPrismaService.user.create.mockResolvedValue(adminJitUser);
    mockPrismaService.user.update.mockResolvedValue({
      ...adminJitUser,
      role: UserRole.ADMIN,
    });

    await service.ssoLogin(adminProfile);

    // Verify admin bootstrap: update called with ADMIN role
    expect(mockPrismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: adminJitUser.id },
        data: { role: UserRole.ADMIN, roleSetManually: true },
      }),
    );
  });

  // ============================================================
  // Test 4: Admin bootstrap case-insensitive
  // ============================================================
  it('should match INITIAL_ADMIN_EMAIL case-insensitively', async () => {
    const adminProfile = {
      oid: 'azure-admin-oid-2',
      email: 'Admin@Example.COM',
      displayName: 'Admin CaseTest',
    };
    const adminJitUser = {
      ...mockJitUser,
      id: 'admin-jit-id-2',
      email: 'admin@example.com', // createSsoUser lowercases email
      azureId: 'azure-admin-oid-2',
      firstName: 'Admin',
      lastName: 'CaseTest',
    };

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'INITIAL_ADMIN_EMAIL') return 'admin@example.com';
      const config: Record<string, string> = {
        JWT_REFRESH_SECRET: 'test-refresh-secret-32-chars-long',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    });

    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...adminJitUser, role: UserRole.ADMIN });
    mockPrismaService.user.create.mockResolvedValue(adminJitUser);
    mockPrismaService.user.update.mockResolvedValue({
      ...adminJitUser,
      role: UserRole.ADMIN,
    });

    await service.ssoLogin(adminProfile);

    // Should still bootstrap as ADMIN despite case difference
    expect(mockPrismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { role: UserRole.ADMIN, roleSetManually: true },
      }),
    );
  });

  // ============================================================
  // Test 5: Duplicate azureId → returns existing user (P2002 race condition)
  // ============================================================
  it('should handle race condition (P2002) by fetching existing user', async () => {
    const p2002Error = Object.assign(new Error('Unique constraint violation'), {
      code: 'P2002',
    });

    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null) // first azureId lookup → not found
      .mockResolvedValueOnce(mockJitUser) // P2002 recovery: fetch existing
      .mockResolvedValueOnce(mockJitUser); // re-fetch after sync
    mockPrismaService.user.create.mockRejectedValueOnce(p2002Error);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);

    const result = await service.ssoLogin(mockSsoProfile);

    // Login should succeed with the existing user
    expect(result).toHaveProperty('accessToken');
    expect('error' in result).toBe(false);
  });

  // ============================================================
  // Test 6: JIT emits audit log with JIT_PROVISIONED action
  // ============================================================
  it('should create JIT_PROVISIONED audit log entry', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockJitUser);
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);

    await service.ssoLogin(mockSsoProfile);

    expect(mockPrismaService.userAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: mockJitUser.id,
        action: 'JIT_PROVISIONED',
        source: 'SYSTEM',
        actorId: null,
        changes: expect.objectContaining({
          source: 'SSO_FIRST_LOGIN',
          email: mockJitUser.email,
          azureId: mockJitUser.azureId,
        }),
      }),
    });

    // Verify the message mentions Full Sync recommendation
    const auditCall = mockPrismaService.userAuditLog.create.mock.calls[0][0];
    expect(auditCall.data.changes.message).toContain('Full Sync');
  });

  // ============================================================
  // Test 7: Audit log failure doesn't block login
  // ============================================================
  it('should not fail login if audit log creation fails', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockJitUser);
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);
    mockPrismaService.userAuditLog.create.mockRejectedValueOnce(
      new Error('Database write failed'),
    );

    const result = await service.ssoLogin(mockSsoProfile);

    // Login should still succeed despite audit log failure
    expect(result).toHaveProperty('accessToken');
    expect('error' in result).toBe(false);
  });

  // ============================================================
  // Test 8: syncUserFromGraph rejected → deactivate JIT user
  // ============================================================
  it('should deactivate JIT user if M365 account is disabled (sync rejected)', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // azureId lookup → not found
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockM365SyncService.syncUserFromGraph.mockResolvedValueOnce({
      rejected: true,
      reason: 'M365 account disabled',
    });

    const result = await service.ssoLogin(mockSsoProfile);

    // Verify user deactivated
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: mockJitUser.id },
      data: { isActive: false },
    });

    // Verify login fails
    expect(result).toEqual({ error: 'sso_failed' });
  });

  // ============================================================
  // Test 9: JIT user gets passwordHash = '' (cannot password login)
  // ============================================================
  it('should set passwordHash to empty string for JIT users (SSO-only)', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockJitUser);
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);

    await service.ssoLogin(mockSsoProfile);

    const createCall = mockPrismaService.user.create.mock.calls[0][0];
    expect(createCall.data.passwordHash).toBe('');
  });

  // ============================================================
  // Test 10: JIT skips second mini-sync (already synced in JIT path)
  // ============================================================
  it('should not trigger mini-sync twice for JIT users', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockJitUser);
    mockPrismaService.user.create.mockResolvedValue(mockJitUser);
    mockPrismaService.user.update.mockResolvedValue(mockJitUser);

    await service.ssoLogin(mockSsoProfile);

    // syncUserFromGraph should be called exactly once (in JIT path), not twice
    expect(mockM365SyncService.syncUserFromGraph).toHaveBeenCalledTimes(1);
  });
});
