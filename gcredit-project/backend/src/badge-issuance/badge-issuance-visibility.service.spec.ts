import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceService } from './badge-issuance.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { BadgeNotificationService } from './services/badge-notification.service';
import { CSVParserService } from './services/csv-parser.service';
import { MilestonesService } from '../milestones/milestones.service';
import { TeamsBadgeNotificationService } from '../microsoft-graph/teams/teams-badge-notification.service';
import { GraphEmailService } from '../microsoft-graph/services/graph-email.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BadgeIssuanceService - updateVisibility', () => {
  let service: BadgeIssuanceService;

  const badgeMock = {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const mockPrismaService = {
    badge: badgeMock,
    badgeTemplate: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb({
        badge: {
          create: badgeMock.create,
          update: badgeMock.update,
        },
      });
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeIssuanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: AssertionGeneratorService,
          useValue: {
            generateClaimToken: jest.fn(),
            generateAssertion: jest.fn(),
            hashEmail: jest.fn(),
            getAssertionUrl: jest.fn(),
            getClaimUrl: jest.fn(),
            computeAssertionHash: jest.fn(),
          },
        },
        {
          provide: BadgeNotificationService,
          useValue: { sendBadgeNotification: jest.fn() },
        },
        { provide: CSVParserService, useValue: {} },
        {
          provide: MilestonesService,
          useValue: { getUserAchievements: jest.fn().mockResolvedValue([]) },
        },
        { provide: StorageService, useValue: {} },
        {
          provide: TeamsBadgeNotificationService,
          useValue: { sendBadgeNotification: jest.fn() },
        },
        { provide: GraphEmailService, useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') },
        },
      ],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
    jest.clearAllMocks();
  });

  it('should toggle visibility from PUBLIC to PRIVATE', async () => {
    const badge = {
      id: 'badge-1',
      recipientId: 'user-1',
      visibility: 'PUBLIC',
    };

    mockPrismaService.badge.findUnique.mockResolvedValue(badge);
    mockPrismaService.badge.update.mockResolvedValue({
      ...badge,
      visibility: 'PRIVATE',
    });

    const result = await service.updateVisibility(
      'badge-1',
      'PRIVATE' as any,
      'user-1',
    );

    expect(result.visibility).toBe('PRIVATE');
    expect(mockPrismaService.badge.update).toHaveBeenCalledWith({
      where: { id: 'badge-1' },
      data: { visibility: 'PRIVATE' },
    });
  });

  it('should toggle visibility from PRIVATE to PUBLIC', async () => {
    const badge = {
      id: 'badge-1',
      recipientId: 'user-1',
      visibility: 'PRIVATE',
    };

    mockPrismaService.badge.findUnique.mockResolvedValue(badge);
    mockPrismaService.badge.update.mockResolvedValue({
      ...badge,
      visibility: 'PUBLIC',
    });

    const result = await service.updateVisibility(
      'badge-1',
      'PUBLIC' as any,
      'user-1',
    );

    expect(result.visibility).toBe('PUBLIC');
  });

  it('should throw NotFoundException when badge does not exist', async () => {
    mockPrismaService.badge.findUnique.mockResolvedValue(null);

    await expect(
      service.updateVisibility('nonexistent', 'PRIVATE' as any, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user is not the badge recipient', async () => {
    const badge = {
      id: 'badge-1',
      recipientId: 'user-1',
      visibility: 'PUBLIC',
    };

    mockPrismaService.badge.findUnique.mockResolvedValue(badge);

    await expect(
      service.updateVisibility('badge-1', 'PRIVATE' as any, 'user-other'),
    ).rejects.toThrow(ForbiddenException);
  });
});
