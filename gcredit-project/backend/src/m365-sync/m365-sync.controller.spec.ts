/**
 * M365 Sync Controller Tests - Story 8.9
 *
 * Unit tests for M365SyncController:
 * - POST /api/admin/m365-sync - Trigger sync
 * - GET /api/admin/m365-sync/logs - Get sync history
 * - GET /api/admin/m365-sync/logs/:id - Get sync log details
 * - GET /api/admin/m365-sync/status - Get integration status
 */

import { Test, TestingModule } from '@nestjs/testing';
import { M365SyncController } from './m365-sync.controller';
import { M365SyncService } from './m365-sync.service';
import {
  TriggerSyncDto,
  SyncResultDto,
  SyncLogDto,
  IntegrationStatusDto,
} from './dto';

describe('M365SyncController', () => {
  let controller: M365SyncController;
  let service: jest.Mocked<M365SyncService>;

  const mockSyncResult: SyncResultDto = {
    syncId: 'sync-123',
    status: 'SUCCESS',
    totalUsers: 100,
    syncedUsers: 100,
    createdUsers: 5,
    updatedUsers: 95,
    deactivatedUsers: 2,
    failedUsers: 0,
    errors: [],
    durationMs: 5000,
    startedAt: new Date(),
    completedAt: new Date(),
  };

  const mockSyncLog: SyncLogDto = {
    id: 'sync-log-123',
    syncDate: new Date(),
    syncType: 'FULL',
    userCount: 100,
    syncedCount: 100,
    createdCount: 5,
    updatedCount: 95,
    failedCount: 0,
    status: 'SUCCESS',
    errorMessage: null,
    durationMs: 5000,
    syncedBy: 'admin@example.com',
    metadata: { retryAttempts: 0, pagesProcessed: 1 },
    createdAt: new Date(),
  };

  const mockIntegrationStatus: IntegrationStatusDto = {
    available: true,
    lastSync: new Date(),
    lastSyncStatus: 'SUCCESS',
    lastSyncUserCount: 100,
  };

  beforeEach(async () => {
    const mockService = {
      runSync: jest.fn(),
      getSyncLogs: jest.fn(),
      getSyncLogById: jest.fn(),
      getIntegrationStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [M365SyncController],
      providers: [
        {
          provide: M365SyncService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<M365SyncController>(M365SyncController);
    service = module.get(M365SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Mock request object with user for triggerSync tests
  const mockRequest = {
    user: {
      email: 'admin@example.com',
      id: 'admin-user-id',
    },
  };

  describe('triggerSync', () => {
    it('should trigger FULL sync by default', async () => {
      const dto: TriggerSyncDto = {};
      service.runSync.mockResolvedValue(mockSyncResult);

      const result = await controller.triggerSync(dto, mockRequest);

      expect(result).toEqual(mockSyncResult);
      expect(service.runSync).toHaveBeenCalledWith(
        undefined,
        'admin@example.com',
      );
    });

    it('should trigger FULL sync when specified', async () => {
      const dto: TriggerSyncDto = { syncType: 'FULL' };
      service.runSync.mockResolvedValue(mockSyncResult);

      const result = await controller.triggerSync(dto, mockRequest);

      expect(result).toEqual(mockSyncResult);
      expect(service.runSync).toHaveBeenCalledWith('FULL', 'admin@example.com');
    });

    it('should trigger INCREMENTAL sync when specified', async () => {
      const dto: TriggerSyncDto = { syncType: 'INCREMENTAL' };
      service.runSync.mockResolvedValue(mockSyncResult);

      await controller.triggerSync(dto, mockRequest);

      expect(service.runSync).toHaveBeenCalledWith(
        'INCREMENTAL',
        'admin@example.com',
      );
    });

    it('should propagate service errors', async () => {
      const dto: TriggerSyncDto = {};
      service.runSync.mockRejectedValue(new Error('Graph API not configured'));

      await expect(controller.triggerSync(dto, mockRequest)).rejects.toThrow(
        'Graph API not configured',
      );
    });

    it('should use user ID when email is not available', async () => {
      const dto: TriggerSyncDto = {};
      const reqWithoutEmail = { user: { id: 'user-123' } };
      service.runSync.mockResolvedValue(mockSyncResult);

      await controller.triggerSync(dto, reqWithoutEmail);

      expect(service.runSync).toHaveBeenCalledWith(undefined, 'user-123');
    });
  });

  describe('getSyncLogs', () => {
    it('should return sync logs with default limit', async () => {
      service.getSyncLogs.mockResolvedValue([mockSyncLog]);

      const result = await controller.getSyncLogs(10);

      expect(result).toHaveLength(1);
      expect(service.getSyncLogs).toHaveBeenCalledWith(10);
    });

    it('should return sync logs with custom limit', async () => {
      service.getSyncLogs.mockResolvedValue([mockSyncLog]);

      await controller.getSyncLogs(50);

      expect(service.getSyncLogs).toHaveBeenCalledWith(50);
    });

    it('should return empty array when no logs exist', async () => {
      service.getSyncLogs.mockResolvedValue([]);

      const result = await controller.getSyncLogs(10);

      expect(result).toHaveLength(0);
    });
  });

  describe('getSyncLogById', () => {
    it('should return sync log by ID', async () => {
      service.getSyncLogById.mockResolvedValue(mockSyncLog);

      const result = await controller.getSyncLogById('sync-log-123');

      expect(result).toEqual(mockSyncLog);
      expect(service.getSyncLogById).toHaveBeenCalledWith('sync-log-123');
    });

    it('should propagate NotFoundException', async () => {
      const error: Error & { status: number } = Object.assign(
        new Error('Not Found'),
        { status: 404 },
      );
      service.getSyncLogById.mockRejectedValue(error);

      await expect(controller.getSyncLogById('nonexistent')).rejects.toThrow(
        'Not Found',
      );
    });
  });

  describe('getIntegrationStatus', () => {
    it('should return integration status', async () => {
      service.getIntegrationStatus.mockResolvedValue(mockIntegrationStatus);

      const result = await controller.getIntegrationStatus();

      expect(result).toEqual(mockIntegrationStatus);
      expect(result.available).toBe(true);
    });

    it('should return unavailable when Graph is not configured', async () => {
      const unavailableStatus: IntegrationStatusDto = {
        available: false,
        lastSync: null,
        lastSyncStatus: null,
        lastSyncUserCount: null,
      };
      service.getIntegrationStatus.mockResolvedValue(unavailableStatus);

      const result = await controller.getIntegrationStatus();

      expect(result.available).toBe(false);
      expect(result.lastSync).toBeNull();
    });
  });
});
