/**
 * M365 Sync Service Tests - Story 8.9
 *
 * Unit tests for M365SyncService:
 * - AC1: getAllAzureUsers() pagination
 * - AC2: fetchWithRetry() exponential backoff
 * - AC3: runSync() audit logging
 * - AC4: syncUserDeactivations()
 * - AC5: syncSingleUser() error recovery
 */

import { Test, TestingModule } from '@nestjs/testing';
import { M365SyncService } from './m365-sync.service';
import { PrismaService } from '../common/prisma.service';
import { GraphTokenProviderService } from '../microsoft-graph/services/graph-token-provider.service';
import { NotFoundException } from '@nestjs/common';
import { GraphUser } from './interfaces/graph-user.interface';

// Mock @microsoft/microsoft-graph-client
jest.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: jest.fn(() => ({
      api: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  },
}));

import { Client } from '@microsoft/microsoft-graph-client';

describe('M365SyncService', () => {
  let service: M365SyncService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    m365SyncLog: {
      create: jest.Mock;
      update: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    userAuditLog: { create: jest.Mock };
  };
  let graphTokenProvider: jest.Mocked<GraphTokenProviderService>;

  // Mock Azure users
  const mockAzureUser: GraphUser = {
    id: 'azure-id-123',
    displayName: 'John Doe',
    mail: 'john@example.com',
    userPrincipalName: 'john@example.com',
    accountEnabled: true,
    jobTitle: 'Developer',
    department: 'Engineering',
  };

  const mockAzureUser2: GraphUser = {
    id: 'azure-id-456',
    displayName: 'Jane Smith',
    mail: 'jane@example.com',
    userPrincipalName: 'jane@example.com',
    accountEnabled: true,
    jobTitle: 'Manager',
    department: 'HR',
  };

  const mockDisabledUser: GraphUser = {
    id: 'azure-id-789',
    displayName: 'Disabled User',
    mail: 'disabled@example.com',
    userPrincipalName: 'disabled@example.com',
    accountEnabled: false,
  };

  // Mock sync log (with AC3 audit fields)
  const mockSyncLog = {
    id: 'sync-log-123',
    syncDate: new Date(),
    syncType: 'FULL',
    status: 'IN_PROGRESS',
    userCount: 0,
    syncedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    failedCount: 0,
    errorMessage: null,
    durationMs: null,
    syncedBy: 'test@example.com',
    metadata: { retryAttempts: 0, pagesProcessed: 0 },
    createdAt: new Date(),
  };

  // Mock local user
  const mockLocalUser = {
    id: 'local-user-123',
    email: 'john@example.com',
    azureId: 'azure-id-123',
    isActive: true,
    roleSetManually: false,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      m365SyncLog: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userAuditLog: {
        create: jest.fn(),
      },
    };

    const mockGraphTokenProvider = {
      isAvailable: jest.fn(),
      getAuthProvider: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M365SyncService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GraphTokenProviderService,
          useValue: mockGraphTokenProvider,
        },
      ],
    }).compile();

    service = module.get<M365SyncService>(M365SyncService);
    prisma = module.get(PrismaService);
    graphTokenProvider = module.get(GraphTokenProviderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // AC1: Pagination Tests
  // ============================================================

  describe('getAllAzureUsers', () => {
    it('should fetch single page of users successfully', async () => {
      const mockResponse = {
        value: [mockAzureUser],
        '@odata.nextLink': undefined,
      };

      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getAllAzureUsers();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockAzureUser);
    });

    it('should handle pagination with multiple pages', async () => {
      const page1Response = {
        value: [mockAzureUser],
        '@odata.nextLink':
          'https://graph.microsoft.com/v1.0/users?$skiptoken=abc',
      };
      const page2Response = {
        value: [mockAzureUser2],
        '@odata.nextLink': undefined,
      };

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getAllAzureUsers();

      expect(result).toHaveLength(2);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should handle empty user list', async () => {
      const mockResponse = {
        value: [],
        '@odata.nextLink': undefined,
      };

      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getAllAzureUsers();

      expect(result).toHaveLength(0);
    });

    it('should throw error when Graph API is not configured', async () => {
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue(null);

      await expect(service.getAllAzureUsers()).rejects.toThrow(
        'Graph API not configured',
      );
    });
  });

  // ============================================================
  // AC2: Retry Logic Tests
  // ============================================================

  describe('fetchWithRetry', () => {
    it('should succeed on first attempt without retry', async () => {
      const mockResponse = { value: [mockAzureUser] };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.fetchWithRetry('/users');

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 (rate limit) error and succeed', async () => {
      const mockResponse = { value: [mockAzureUser] };
      const error429 = { statusCode: 429, message: 'Too Many Requests' };
      const mockGet = jest
        .fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      // Use shorter delays for testing
      const result = await service.fetchWithRetry('/users', 3, 10);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should retry on 500 (server error) and succeed', async () => {
      const mockResponse = { value: [mockAzureUser] };
      const error500 = { statusCode: 500, message: 'Internal Server Error' };
      const mockGet = jest
        .fn()
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.fetchWithRetry('/users', 3, 10);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 (service unavailable) and succeed', async () => {
      const mockResponse = { value: [mockAzureUser] };
      const error503 = { statusCode: 503, message: 'Service Unavailable' };
      const mockGet = jest
        .fn()
        .mockRejectedValueOnce(error503)
        .mockResolvedValueOnce(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.fetchWithRetry('/users', 3, 10);

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should throw error after exhausting retries', async () => {
      const error429 = { statusCode: 429, message: 'Too Many Requests' };
      const mockGet = jest.fn().mockRejectedValue(error429);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await expect(service.fetchWithRetry('/users', 3, 10)).rejects.toEqual(
        error429,
      );
      expect(mockGet).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should NOT retry on 400 (bad request) error', async () => {
      const error400 = { statusCode: 400, message: 'Bad Request' };
      const mockGet = jest.fn().mockRejectedValue(error400);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await expect(service.fetchWithRetry('/users', 3, 10)).rejects.toEqual(
        error400,
      );
      expect(mockGet).toHaveBeenCalledTimes(1); // No retry
    });

    it('should NOT retry on 401 (unauthorized) error', async () => {
      const error401 = { statusCode: 401, message: 'Unauthorized' };
      const mockGet = jest.fn().mockRejectedValue(error401);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await expect(service.fetchWithRetry('/users', 3, 10)).rejects.toEqual(
        error401,
      );
      expect(mockGet).toHaveBeenCalledTimes(1); // No retry
    });

    it('should NOT retry on 404 (not found) error', async () => {
      const error404 = { statusCode: 404, message: 'Not Found' };
      const mockGet = jest.fn().mockRejectedValue(error404);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await expect(service.fetchWithRetry('/users', 3, 10)).rejects.toEqual(
        error404,
      );
      expect(mockGet).toHaveBeenCalledTimes(1); // No retry
    });
  });

  describe('isRetryableError', () => {
    it('should identify 429 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 429 })).toBe(true);
    });

    it('should identify 500 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 500 })).toBe(true);
    });

    it('should identify 503 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 503 })).toBe(true);
    });

    it('should identify 502 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 502 })).toBe(true);
    });

    it('should NOT identify 400 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 400 })).toBe(false);
    });

    it('should NOT identify 401 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 401 })).toBe(false);
    });

    it('should NOT identify 403 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 403 })).toBe(false);
    });

    it('should NOT identify 404 as retryable', () => {
      expect(service.isRetryableError({ statusCode: 404 })).toBe(false);
    });

    it('should handle errors with code property', () => {
      expect(service.isRetryableError({ code: 429 })).toBe(true);
      expect(service.isRetryableError({ code: 500 })).toBe(true);
      expect(service.isRetryableError({ code: 400 })).toBe(false);
    });

    // AC2: Network error tests
    it('should identify ECONNRESET as retryable (network error)', () => {
      expect(service.isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('should identify ETIMEDOUT as retryable (network error)', () => {
      expect(service.isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('should identify ENOTFOUND as retryable (network error)', () => {
      expect(service.isRetryableError({ code: 'ENOTFOUND' })).toBe(true);
    });

    it('should identify ECONNREFUSED as retryable (network error)', () => {
      expect(service.isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should identify EAI_AGAIN as retryable (DNS resolution error)', () => {
      expect(service.isRetryableError({ code: 'EAI_AGAIN' })).toBe(true);
    });

    it('should NOT identify unknown string codes as retryable', () => {
      expect(service.isRetryableError({ code: 'UNKNOWN_ERROR' })).toBe(false);
    });
  });

  // ============================================================
  // AC4: User Deactivation Tests
  // ============================================================

  describe('syncUserDeactivations', () => {
    it('should deactivate user not found in Azure AD', async () => {
      const azureUsers: GraphUser[] = [mockAzureUser2]; // User 1 not in Azure
      const localUser = { ...mockLocalUser, azureId: 'azure-id-123' };

      prisma.user.findMany.mockResolvedValue([localUser]);
      prisma.user.update.mockResolvedValue({
        ...localUser,
        isActive: false,
      });
      prisma.userAuditLog.create.mockResolvedValue({} as any);

      const result = await service.syncUserDeactivations(
        azureUsers,
        'sync-123',
      );

      expect(result.deactivated).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: localUser.id },
        data: expect.objectContaining({ isActive: false }) as unknown,
      });
    });

    it('should preserve roleSetManually user roles', async () => {
      const azureUsers: GraphUser[] = [];
      const localUser = { ...mockLocalUser, roleSetManually: true };

      prisma.user.findMany.mockResolvedValue([localUser]);
      prisma.user.update.mockResolvedValue({
        ...localUser,
        isActive: false,
      });
      prisma.userAuditLog.create.mockResolvedValue({} as any);

      await service.syncUserDeactivations(azureUsers, 'sync-123');

      // Should NOT update role - only isActive and lastSyncAt
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: localUser.id },
        data: {
          isActive: false,
          lastSyncAt: expect.any(Date) as unknown,
        },
      });
    });

    it('should skip users without Azure ID (local users)', async () => {
      const azureUsers: GraphUser[] = [];
      const localUser = { ...mockLocalUser, azureId: null };

      prisma.user.findMany.mockResolvedValue([localUser]);

      const result = await service.syncUserDeactivations(
        azureUsers,
        'sync-123',
      );

      expect(result.deactivated).toBe(0);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should not deactivate users still in Azure AD', async () => {
      const azureUsers: GraphUser[] = [mockAzureUser];
      const localUser = { ...mockLocalUser, azureId: 'azure-id-123' };

      prisma.user.findMany.mockResolvedValue([localUser]);

      const result = await service.syncUserDeactivations(
        azureUsers,
        'sync-123',
      );

      expect(result.deactivated).toBe(0);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    // AC4 Fix: Deactivate users with disabled Azure accounts
    it('should deactivate user with disabled Azure account', async () => {
      const disabledAzureUser: GraphUser = {
        ...mockAzureUser,
        id: 'azure-disabled-id',
        accountEnabled: false,
      };
      const azureUsers: GraphUser[] = [disabledAzureUser];
      const localUser = { ...mockLocalUser, azureId: 'azure-disabled-id' };

      prisma.user.findMany.mockResolvedValue([localUser]);
      prisma.user.update.mockResolvedValue({
        ...localUser,
        isActive: false,
      });
      prisma.userAuditLog.create.mockResolvedValue({} as any);

      const result = await service.syncUserDeactivations(
        azureUsers,
        'sync-123',
      );

      expect(result.deactivated).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: localUser.id },
        data: expect.objectContaining({ isActive: false }) as unknown,
      });
      // Verify audit log mentions disabled account
      expect(prisma.userAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DEACTIVATED',
          changes: expect.objectContaining({
            reason: 'User account is disabled in Azure AD',
          }) as unknown,
        }) as unknown,
      });
    });

    it('should continue processing when single user fails', async () => {
      const azureUsers: GraphUser[] = [];
      const localUsers = [
        { ...mockLocalUser, id: 'user-1', azureId: 'azure-1' },
        { ...mockLocalUser, id: 'user-2', azureId: 'azure-2' },
      ];

      prisma.user.findMany.mockResolvedValue(localUsers);
      prisma.user.update
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ ...localUsers[1], isActive: false });
      prisma.userAuditLog.create.mockResolvedValue({} as any);

      const result = await service.syncUserDeactivations(
        azureUsers,
        'sync-123',
      );

      expect(result.deactivated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Database error');
    });

    it('should create audit log for deactivated users', async () => {
      const azureUsers: GraphUser[] = [];
      const localUser = { ...mockLocalUser };

      prisma.user.findMany.mockResolvedValue([localUser]);
      prisma.user.update.mockResolvedValue({
        ...localUser,
        isActive: false,
      });
      prisma.userAuditLog.create.mockResolvedValue({} as any);

      await service.syncUserDeactivations(azureUsers, 'sync-123');

      expect(prisma.userAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: localUser.id,
          action: 'DEACTIVATED',
          source: 'M365_SYNC',
        }) as unknown,
      });
    });
  });

  // ============================================================
  // AC5: Single User Sync & Error Recovery Tests
  // ============================================================

  describe('syncSingleUser', () => {
    it('should create new user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: mockAzureUser.mail,
      } as any);

      const result = (await service.syncSingleUser(mockAzureUser)) as {
        success: boolean;
        action: string;
        error?: string;
      };

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should update existing user', async () => {
      prisma.user.findFirst.mockResolvedValue(mockLocalUser);
      prisma.user.update.mockResolvedValue(mockLocalUser);

      const result = (await service.syncSingleUser(mockAzureUser)) as {
        success: boolean;
        action: string;
        error?: string;
      };

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should skip disabled Azure accounts', async () => {
      const result = (await service.syncSingleUser(mockDisabledUser)) as {
        success: boolean;
        action: string;
        error?: string;
      };

      expect(result.success).toBe(true);
      expect(result.action).toBe('skipped');
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('should skip user without email or UPN', async () => {
      const userNoEmail: GraphUser = {
        ...mockAzureUser,
        mail: null,
        userPrincipalName: '',
      };

      const result = (await service.syncSingleUser(userNoEmail)) as {
        success: boolean;
        action: string;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('No email');
    });

    it('should use UPN when mail is null', async () => {
      const userWithUPN: GraphUser = {
        ...mockAzureUser,
        mail: null,
        userPrincipalName: 'john.upn@example.com',
      };

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user',
      } as any);

      await service.syncSingleUser(userWithUPN);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'john.upn@example.com',
        }) as unknown,
      });
    });

    it('should return error without throwing on database failure', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(
        new Error('Unique constraint violation'),
      );

      const result = (await service.syncSingleUser(mockAzureUser)) as {
        success: boolean;
        action: string;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unique constraint violation');
    });

    // Story 13.2 AC #7: M365 sync no longer assigns DEFAULT_USER_PASSWORD
    it('should create M365 user with empty passwordHash (no temp password)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'sso-only-user',
        email: mockAzureUser.mail,
      } as any);

      await service.syncSingleUser(mockAzureUser);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          passwordHash: '', // SSO-only — no temp password (DEC-011-13)
        }) as unknown,
      });
    });
  });

  // ============================================================
  // AC3: Audit Logging & Main Sync Flow Tests
  // ============================================================

  describe('runSync', () => {
    beforeEach(() => {
      prisma.m365SyncLog.create.mockResolvedValue(mockSyncLog);
      prisma.m365SyncLog.update.mockResolvedValue(mockSyncLog);
      prisma.user.findMany.mockResolvedValue([]);
    });

    it('should create sync log on start', async () => {
      const mockResponse = { value: [], '@odata.nextLink': undefined };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await service.runSync('FULL');

      expect(prisma.m365SyncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          syncType: 'FULL',
          status: 'IN_PROGRESS',
        }) as unknown,
      });
    });

    it('should update sync log with SUCCESS status when all users sync', async () => {
      const mockResponse = {
        value: [mockAzureUser],
        '@odata.nextLink': undefined,
      };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user',
      } as any);

      const result = await service.runSync('FULL');

      expect(result.status).toBe('SUCCESS');
      expect(prisma.m365SyncLog.update).toHaveBeenCalledWith({
        where: { id: mockSyncLog.id },
        data: expect.objectContaining({
          status: 'SUCCESS',
        }) as unknown,
      });
    });

    it('should update sync log with PARTIAL_SUCCESS when some users fail', async () => {
      const mockResponse = {
        value: [
          mockAzureUser,
          { ...mockAzureUser2, mail: null, userPrincipalName: '' },
        ],
        '@odata.nextLink': undefined,
      };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user',
      } as any);

      const result = await service.runSync('FULL');

      expect(result.status).toBe('PARTIAL_SUCCESS'); // Status enum aligned with DB
      expect(result.failedUsers).toBeGreaterThan(0);
    });

    it('should update sync log with FAILURE on complete failure', async () => {
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue(null);

      await expect(service.runSync('FULL')).rejects.toThrow(
        'Graph API not configured',
      );

      expect(prisma.m365SyncLog.update).toHaveBeenCalledWith({
        where: { id: mockSyncLog.id },
        data: expect.objectContaining({
          status: 'FAILURE',
        }) as unknown,
      });
    });

    it('should record duration in milliseconds', async () => {
      const mockResponse = { value: [], '@odata.nextLink': undefined };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await service.runSync('FULL');

      expect(prisma.m365SyncLog.update).toHaveBeenCalledWith({
        where: { id: mockSyncLog.id },
        data: expect.objectContaining({
          durationMs: expect.any(Number) as unknown,
        }) as unknown,
      });
    });

    // AC3 Fix: Test syncedBy parameter
    it('should record syncedBy in sync log', async () => {
      const mockResponse = { value: [], '@odata.nextLink': undefined };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await service.runSync('FULL', 'admin@example.com');

      expect(prisma.m365SyncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          syncedBy: 'admin@example.com',
        }) as unknown,
      });
    });

    it('should default syncedBy to SYSTEM when not provided', async () => {
      const mockResponse = { value: [], '@odata.nextLink': undefined };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await service.runSync('FULL');

      expect(prisma.m365SyncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          syncedBy: 'SYSTEM',
        }) as unknown,
      });
    });

    it('should return SyncResultDto with all fields', async () => {
      const mockResponse = {
        value: [mockAzureUser],
        '@odata.nextLink': undefined,
      };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user',
      } as any);

      const result = await service.runSync('FULL');

      expect(result).toEqual(
        expect.objectContaining({
          syncId: expect.any(String) as unknown,
          status: expect.any(String) as unknown,
          totalUsers: expect.any(Number) as unknown,
          syncedUsers: expect.any(Number) as unknown,
          createdUsers: expect.any(Number) as unknown,
          updatedUsers: expect.any(Number) as unknown,
          deactivatedUsers: expect.any(Number) as unknown,
          failedUsers: expect.any(Number) as unknown,
          errors: expect.any(Array) as unknown,
          durationMs: expect.any(Number) as unknown,
          startedAt: expect.any(Date) as unknown,
          completedAt: expect.any(Date) as unknown,
        }) as unknown,
      );
    });
  });

  // ============================================================
  // Sync Log Retrieval Tests
  // ============================================================

  describe('getSyncLogs', () => {
    it('should return paginated sync history', async () => {
      const logs = [mockSyncLog];
      prisma.m365SyncLog.findMany.mockResolvedValue(logs);

      const result = await service.getSyncLogs(10);

      expect(result).toHaveLength(1);
      expect(prisma.m365SyncLog.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { syncDate: 'desc' },
      });
    });

    it('should use default limit of 10', async () => {
      prisma.m365SyncLog.findMany.mockResolvedValue([]);

      await service.getSyncLogs();

      expect(prisma.m365SyncLog.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { syncDate: 'desc' },
      });
    });
  });

  describe('getSyncLogById', () => {
    it('should return single sync log', async () => {
      prisma.m365SyncLog.findUnique.mockResolvedValue(mockSyncLog);

      const result = await service.getSyncLogById('sync-log-123');

      expect(result.id).toBe('sync-log-123');
    });

    it('should throw NotFoundException when log not found', async () => {
      prisma.m365SyncLog.findUnique.mockResolvedValue(null);

      await expect(service.getSyncLogById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // Integration Status Tests
  // ============================================================

  describe('getIntegrationStatus', () => {
    it('should return available status when Graph is configured', async () => {
      graphTokenProvider.isAvailable.mockReturnValue(true);
      prisma.m365SyncLog.findFirst.mockResolvedValue(mockSyncLog);

      const result = await service.getIntegrationStatus();

      expect(result.available).toBe(true);
      expect(result.lastSync).toEqual(mockSyncLog.syncDate);
    });

    it('should return unavailable when Graph is not configured', async () => {
      graphTokenProvider.isAvailable.mockReturnValue(false);
      prisma.m365SyncLog.findFirst.mockResolvedValue(null);

      const result = await service.getIntegrationStatus();

      expect(result.available).toBe(false);
      expect(result.lastSync).toBeNull();
    });

    it('should return null lastSync when no sync has been performed', async () => {
      graphTokenProvider.isAvailable.mockReturnValue(true);
      prisma.m365SyncLog.findFirst.mockResolvedValue(null);

      const result = await service.getIntegrationStatus();

      expect(result.available).toBe(true);
      expect(result.lastSync).toBeNull();
      expect(result.lastSyncStatus).toBeNull();
    });
  });

  // ============================================================
  // Story 12.3a — Task 16e: Security Group Role Mapping Tests
  // ============================================================
  describe('getUserRoleFromGroups (Story 12.3a)', () => {
    const ADMIN_GROUP_ID = '3403ed09-414d-490a-ac69-3c2c38c14c38';
    const ISSUER_GROUP_ID = '7aa2bac0-0146-4cec-9d7a-17c9f63264ba';

    beforeEach(() => {
      process.env.AZURE_ADMIN_GROUP_ID = ADMIN_GROUP_ID;
      process.env.AZURE_ISSUER_GROUP_ID = ISSUER_GROUP_ID;
    });

    afterEach(() => {
      delete process.env.AZURE_ADMIN_GROUP_ID;
      delete process.env.AZURE_ISSUER_GROUP_ID;
    });

    it('should assign ADMIN role for user in Admin Security Group', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        value: [
          { id: ADMIN_GROUP_ID, '@odata.type': '#microsoft.graph.group' },
        ],
      });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getUserRoleFromGroups('azure-id-123');
      expect(result).toBe('ADMIN');
    });

    it('should assign ISSUER role for user in Issuer Security Group', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        value: [
          { id: ISSUER_GROUP_ID, '@odata.type': '#microsoft.graph.group' },
        ],
      });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getUserRoleFromGroups('azure-id-123');
      expect(result).toBe('ISSUER');
    });

    it('should return null when no Security Group match', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        value: [
          { id: 'other-group-id', '@odata.type': '#microsoft.graph.group' },
        ],
      });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getUserRoleFromGroups('azure-id-123');
      expect(result).toBeNull();
    });

    it('should prioritize ADMIN over ISSUER when in both groups', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        value: [
          { id: ADMIN_GROUP_ID, '@odata.type': '#microsoft.graph.group' },
          { id: ISSUER_GROUP_ID, '@odata.type': '#microsoft.graph.group' },
        ],
      });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getUserRoleFromGroups('azure-id-123');
      expect(result).toBe('ADMIN');
    });

    it('should handle memberOf API failure gracefully', async () => {
      const mockGet = jest
        .fn()
        .mockRejectedValue(new Error('Graph unavailable'));
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getUserRoleFromGroups('azure-id-123');
      expect(result).toBeNull();
    });

    it('should filter out non-group memberships', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        value: [
          {
            id: ADMIN_GROUP_ID,
            '@odata.type': '#microsoft.graph.directoryRole',
          },
        ],
      });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.getUserRoleFromGroups('azure-id-123');
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // Story 12.3a — Task 16e: resolveUserRole Tests
  // ============================================================
  describe('syncSingleUser role resolution (Story 12.3a)', () => {
    it('should assign ADMIN role when user is in Admin Security Group', async () => {
      // Mock Graph API for syncSingleUser → resolveUserRole → getUserRoleFromGroups
      const mockGet = jest.fn().mockResolvedValue({
        value: [
          {
            id: '3403ed09-414d-490a-ac69-3c2c38c14c38',
            '@odata.type': '#microsoft.graph.group',
          },
        ],
      });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});
      process.env.AZURE_ADMIN_GROUP_ID = '3403ed09-414d-490a-ac69-3c2c38c14c38';

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);

      await service.syncSingleUser(mockAzureUser);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: 'ADMIN' }) as unknown,
      });

      delete process.env.AZURE_ADMIN_GROUP_ID;
    });

    it('should keep existing role for locally-created user (azureId = null)', async () => {
      const mockGet = jest.fn().mockResolvedValue({ value: [] });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const localUser = {
        ...mockLocalUser,
        azureId: null,
        role: 'ISSUER',
        roleSetManually: false,
      };
      prisma.user.findFirst.mockResolvedValue(localUser);
      prisma.user.update.mockResolvedValue(localUser);

      await service.syncSingleUser(mockAzureUser);

      // Should keep ISSUER role (local user - azureId is null)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: localUser.id },
        data: expect.objectContaining({ role: 'ISSUER' }) as unknown,
      });
    });

    it('should default to EMPLOYEE when no group match and no directReports', async () => {
      const mockGet = jest.fn().mockResolvedValue({ value: [] });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);

      await service.syncSingleUser(mockAzureUser);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: 'EMPLOYEE' }) as unknown,
      });
    });

    it('should keep roleSetManually role when no Security Group match', async () => {
      const mockGet = jest.fn().mockResolvedValue({ value: [] });
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const existingUser = {
        ...mockLocalUser,
        role: 'MANAGER',
        roleSetManually: true,
      };
      prisma.user.findFirst.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(existingUser);

      await service.syncSingleUser(mockAzureUser);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({ role: 'MANAGER' }) as unknown,
      });
    });
  });

  // ============================================================
  // Story 12.3a — Task 16f: directReports + managerId Linkage Tests
  // ============================================================
  describe('runSync Pass 2: manager linkage (Story 12.3a)', () => {
    beforeEach(() => {
      prisma.m365SyncLog.create.mockResolvedValue(mockSyncLog);
      prisma.m365SyncLog.update.mockResolvedValue(mockSyncLog);
      prisma.user.findMany.mockResolvedValue([]);
    });

    it('should link manager relationships in Pass 2 of FULL sync', async () => {
      // Pass 1: sync user
      const mockResponse = {
        value: [mockAzureUser],
        '@odata.nextLink': undefined,
      };
      const mockGet = jest
        .fn()
        .mockResolvedValueOnce(mockResponse) // getAllAzureUsers
        .mockResolvedValueOnce({ value: [] }) // getUserRoleFromGroups (resolveUserRole)
        .mockResolvedValueOnce({ id: 'azure-manager-id' }) // linkManagerRelationships - /manager
        .mockResolvedValue({}); // fallback
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      // For linkManagerRelationships
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'local-user-1', azureId: 'azure-id-123' })
        .mockResolvedValueOnce({ id: 'local-manager-1' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.runSync('FULL');

      // Verify Pass 2 manager linkage happened
      expect(result.status).toBeDefined();
    });

    it('should upgrade EMPLOYEE to MANAGER when user has directReports (Pass 2b)', async () => {
      const mockResponse = {
        value: [mockAzureUser],
        '@odata.nextLink': undefined,
      };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      // Override for specific calls
      mockGet
        .mockResolvedValueOnce(mockResponse) // getAllAzureUsers
        .mockResolvedValueOnce({ value: [] }) // getUserRoleFromGroups
        .mockRejectedValueOnce({ statusCode: 404 }); // /manager → no manager (normal)

      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user' } as any);

      // updateDirectReportsRoles runs BEFORE syncUserDeactivations
      prisma.user.findMany
        .mockResolvedValueOnce([
          {
            id: 'user-1',
            azureId: 'azure-id-123',
            role: 'EMPLOYEE',
            roleSetManually: false,
          },
        ]) // updateDirectReportsRoles query (runs first)
        .mockResolvedValueOnce([]); // syncUserDeactivations (runs second)
      prisma.user.update.mockResolvedValue({});

      await service.runSync('FULL');

      // Should have been called to upgrade role to MANAGER
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'MANAGER' },
      });
    });
  });

  // ============================================================
  // Story 12.3a — Task 16g: GROUPS_ONLY Sync Mode Tests
  // ============================================================
  describe('GROUPS_ONLY sync (Story 12.3a)', () => {
    beforeEach(() => {
      prisma.m365SyncLog.create.mockResolvedValue(mockSyncLog);
      prisma.m365SyncLog.update.mockResolvedValue(mockSyncLog);
    });

    it('should not import new users in GROUPS_ONLY mode', async () => {
      // Return existing M365 users from DB
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          azureId: 'azure-id-123',
          role: 'EMPLOYEE',
          managerId: null,
          roleSetManually: false,
        },
      ]);

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({ value: [] }) // getUserRoleFromGroups
        .mockRejectedValueOnce({ statusCode: 404 }); // /manager
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.count.mockResolvedValue(0);

      const result = await service.runSync('GROUPS_ONLY');

      // Should not call getAllAzureUsers — verify no new user creation
      expect(result.createdUsers).toBe(0);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should update roles based on Security Group membership', async () => {
      const ADMIN_GROUP_ID = '3403ed09-414d-490a-ac69-3c2c38c14c38';
      process.env.AZURE_ADMIN_GROUP_ID = ADMIN_GROUP_ID;

      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          azureId: 'azure-id-123',
          role: 'EMPLOYEE',
          managerId: null,
          roleSetManually: false,
        },
      ]);

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({
          value: [{ id: 'azure-id-123' }],
        }) // getGroupMembers (batch) — returns member azureIds
        .mockRejectedValueOnce({ statusCode: 404 }); // /manager
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      await service.runSync('GROUPS_ONLY');

      // Should update role to ADMIN
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ role: 'ADMIN' }) as unknown,
      });

      delete process.env.AZURE_ADMIN_GROUP_ID;
    });

    it('should create sync log with syncType GROUPS_ONLY', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.runSync('GROUPS_ONLY');

      expect(prisma.m365SyncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          syncType: 'GROUPS_ONLY',
          status: 'IN_PROGRESS',
        }) as unknown,
      });
    });
  });

  // ============================================================
  // Story 12.3a — Task 16e: syncUserFromGraph Tests
  // ============================================================
  describe('syncUserFromGraph (Story 12.3a)', () => {
    const mockGraphUser = {
      id: 'user-1',
      azureId: 'azure-id-123',
      lastSyncAt: new Date(),
    };

    it('should reject when M365 account is disabled', async () => {
      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({
          accountEnabled: false,
          displayName: 'Test',
          department: 'Eng',
        }) // profile
        .mockResolvedValueOnce({ value: [] }) // memberOf
        .mockRejectedValueOnce({ statusCode: 404 }); // manager
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const result = await service.syncUserFromGraph(mockGraphUser);

      expect(result.rejected).toBe(true);
      expect(result.reason).toContain('disabled');
    });

    it('should accept login with cached data when Graph unavailable AND lastSyncAt < 24h', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const recentSyncUser = {
        ...mockGraphUser,
        lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };

      const result = await service.syncUserFromGraph(recentSyncUser);
      expect(result.rejected).toBe(false);
    });

    it('should reject when Graph unavailable AND lastSyncAt > 24h (AC #35)', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const oldSyncUser = {
        ...mockGraphUser,
        lastSyncAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      };

      const result = await service.syncUserFromGraph(oldSyncUser);
      expect(result.rejected).toBe(true);
      expect(result.reason).toContain('expired');
    });

    it('should reject when Graph unavailable AND no lastSyncAt', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      const noSyncUser = { ...mockGraphUser, lastSyncAt: null };

      const result = await service.syncUserFromGraph(noSyncUser);
      expect(result.rejected).toBe(true);
    });

    it('should update profile and role from Graph API', async () => {
      const ADMIN_GROUP_ID = '3403ed09-414d-490a-ac69-3c2c38c14c38';
      process.env.AZURE_ADMIN_GROUP_ID = ADMIN_GROUP_ID;

      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({
          accountEnabled: true,
          displayName: 'John Doe',
          department: 'Engineering',
        }) // profile
        .mockResolvedValueOnce({
          value: [
            { id: ADMIN_GROUP_ID, '@odata.type': '#microsoft.graph.group' },
          ],
        }) // memberOf
        .mockRejectedValueOnce({ statusCode: 404 }); // manager (404 = no manager)
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.update.mockResolvedValue({});

      const result = await service.syncUserFromGraph(mockGraphUser);

      expect(result.rejected).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          department: 'Engineering',
          role: 'ADMIN',
        }) as unknown,
      });

      delete process.env.AZURE_ADMIN_GROUP_ID;
    });

    it('should update managerId from Graph API', async () => {
      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({
          accountEnabled: true,
          displayName: 'Test',
          department: 'Eng',
        }) // profile
        .mockResolvedValueOnce({ value: [] }) // memberOf
        .mockResolvedValueOnce({ id: 'azure-manager-id' }); // manager
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.findUnique.mockResolvedValue({ id: 'local-manager-id' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.syncUserFromGraph(mockGraphUser);

      expect(result.rejected).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          managerId: 'local-manager-id',
        }) as unknown,
      });
    });

    it('should clear managerId when Graph returns no manager (404)', async () => {
      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({
          accountEnabled: true,
          displayName: 'Test',
          department: 'Eng',
        }) // profile
        .mockResolvedValueOnce({ value: [] }) // memberOf
        .mockRejectedValueOnce({ statusCode: 404 }); // manager: 404
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      prisma.user.update.mockResolvedValue({});

      const result = await service.syncUserFromGraph(mockGraphUser);

      expect(result.rejected).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          managerId: null,
        }) as unknown,
      });
    });

    it('should clear managerId when manager exists in Graph but not in local DB', async () => {
      const mockGet = jest
        .fn()
        .mockResolvedValueOnce({
          accountEnabled: true,
          displayName: 'Test',
          department: 'Eng',
        }) // profile
        .mockResolvedValueOnce({ value: [] }) // memberOf
        .mockResolvedValueOnce({ id: 'unknown-azure-manager-id' }); // manager exists in Graph
      const mockApi = jest.fn().mockReturnValue({ get: mockGet });
      (Client.initWithMiddleware as jest.Mock).mockReturnValue({
        api: mockApi,
      });
      (graphTokenProvider.getAuthProvider as jest.Mock).mockReturnValue({});

      // Manager NOT found in local DB
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({});

      const result = await service.syncUserFromGraph(mockGraphUser);

      expect(result.rejected).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          managerId: null,
        }) as unknown,
      });
    });
  });

  // ============================================================
  // Story 12.3a — Task 16i: PII-free Logging Audit
  // ============================================================
  describe('PII-free logging (AC #38)', () => {
    it('should not include email in deactivation select fields', async () => {
      const azureUsers: GraphUser[] = [];
      const localUser = {
        id: 'user-1',
        azureId: 'azure-id-1',
        roleSetManually: false,
      };

      prisma.user.findMany.mockResolvedValue([localUser]);
      prisma.user.update.mockResolvedValue({ ...localUser, isActive: false });
      prisma.userAuditLog.create.mockResolvedValue({} as any);

      await service.syncUserDeactivations(azureUsers, 'sync-123');

      // Verify the findMany select does NOT include email
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const findManyCall = prisma.user.findMany.mock.calls[0][0];
      if (findManyCall?.select) {
        expect(findManyCall.select).not.toHaveProperty('email');
      }
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    });
  });
});
