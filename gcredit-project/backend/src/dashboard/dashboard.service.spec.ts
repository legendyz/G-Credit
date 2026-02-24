/**
 * Dashboard Service Unit Tests - Story 8.1
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../common/prisma.service';
import { MilestonesService } from '../milestones/milestones.service';
import { formatAuditDescription } from '../common/utils/audit-log.utils';
import { BadgeStatus } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: jest.Mocked<PrismaService>;
  let milestonesService: jest.Mocked<MilestonesService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    department: 'Engineering',
    role: 'EMPLOYEE',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
  };

  const mockBadge = {
    id: 'badge-1',
    recipientId: 'user-1',
    issuerId: 'issuer-1',
    templateId: 'template-1',
    status: BadgeStatus.CLAIMED,
    issuedAt: new Date(),
    claimedAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    expiresAt: null,
    template: {
      id: 'template-1',
      name: 'Test Badge',
      imageUrl: 'https://example.com/badge.png',
    },
    recipient: {
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    },
  };

  const mockAuditLog = {
    id: 'log-1',
    entityType: 'Badge',
    entityId: 'badge-1',
    action: 'ISSUED',
    actorId: 'issuer-1',
    actorEmail: 'issuer@example.com',
    timestamp: new Date(),
    metadata: { notes: 'Test issuance' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      badge: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      badgeTemplate: {
        count: jest.fn(),
      },
      auditLog: {
        findMany: jest.fn(),
      },
      $queryRaw: jest.fn().mockResolvedValue([1]),
    };

    const mockMilestonesService = {
      getNextMilestone: jest.fn().mockResolvedValue({
        title: 'Badge Collector',
        progress: 3,
        target: 5,
        percentage: 60,
        icon: '🏆',
      }),
      getUserAchievements: jest.fn().mockResolvedValue([
        {
          id: 'ach-1',
          achievedAt: new Date('2026-01-15'),
          milestone: {
            id: 'ms-1',
            type: 'BADGE_COUNT',
            title: 'First Badge',
            description: 'Earned your first badge',
            icon: '🏆',
          },
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: MilestonesService,
          useValue: mockMilestonesService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get(PrismaService);
    milestonesService = module.get(MilestonesService);
  });

  describe('getEmployeeDashboard', () => {
    it('should return employee dashboard with badge summary', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalBadges
        .mockResolvedValueOnce(3) // claimedThisMonth
        .mockResolvedValueOnce(2); // pendingBadges
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge]);

      // Act
      const result = await service.getEmployeeDashboard('user-1');

      // Assert
      expect(result.badgeSummary).toBeDefined();
      expect(result.badgeSummary.total).toBe(10);
      expect(result.badgeSummary.claimedThisMonth).toBe(3);
      expect(result.badgeSummary.pendingCount).toBe(2);
    });

    it('should return milestone progress from MilestonesService', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock)
        .mockResolvedValueOnce(7) // totalBadges
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getEmployeeDashboard('user-1');

      // Assert
      expect(milestonesService.getNextMilestone).toHaveBeenCalledWith('user-1');
      expect(result.currentMilestone).toBeDefined();
      expect(result.currentMilestone?.title).toContain('Badge Collector');
      expect(result.currentMilestone?.progress).toBe(3);
      expect(result.currentMilestone?.target).toBe(5);
    });

    it('should return recent badges', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock).mockResolvedValue(5);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge]);

      // Act
      const result = await service.getEmployeeDashboard('user-1');

      // Assert
      expect(result.recentBadges).toHaveLength(1);
      expect(result.recentBadges[0].templateName).toBe('Test Badge');
    });

    it('should handle employee with no badges', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock).mockResolvedValue(0);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getEmployeeDashboard('user-1');

      // Assert
      expect(result.badgeSummary.total).toBe(0);
      expect(result.recentBadges).toHaveLength(0);
      expect(result.currentMilestone?.percentage).toBe(60);
    });

    it('should show all-achieved fallback when no next milestone', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock).mockResolvedValue(10);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);
      milestonesService.getNextMilestone.mockResolvedValueOnce(null);

      // Act
      const result = await service.getEmployeeDashboard('user-1');

      // Assert
      expect(result.currentMilestone?.title).toBe('All milestones achieved!');
      expect(result.currentMilestone?.percentage).toBe(100);
    });
  });

  describe('getIssuerDashboard', () => {
    it('should return issuer dashboard with issuance summary', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock)
        .mockResolvedValueOnce(15) // issuedThisMonth
        .mockResolvedValueOnce(5) // pendingClaims
        .mockResolvedValueOnce(50) // totalIssued
        .mockResolvedValueOnce(40); // claimedCount
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([
        { recipientId: 'user-1' },
        { recipientId: 'user-2' },
      ]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge]);

      // Act
      const result = await service.getIssuerDashboard('issuer-1');

      // Assert
      expect(result.issuanceSummary).toBeDefined();
      expect(result.issuanceSummary.issuedThisMonth).toBe(15);
      expect(result.issuanceSummary.pendingClaims).toBe(5);
      expect(result.issuanceSummary.claimRate).toBe(0.8);
    });

    it('should return recent issuance activity', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock).mockResolvedValue(10);
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge]);

      // Act
      const result = await service.getIssuerDashboard('issuer-1');

      // Assert
      expect(result.recentActivity).toHaveLength(1);
      expect(result.recentActivity[0].recipientName).toBe('Test User');
    });

    it('should handle issuer with no badges issued', async () => {
      // Arrange
      (prisma.badge.count as jest.Mock).mockResolvedValue(0);
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getIssuerDashboard('issuer-1');

      // Assert
      expect(result.issuanceSummary.totalRecipients).toBe(0);
      expect(result.issuanceSummary.claimRate).toBe(0);
      expect(result.recentActivity).toHaveLength(0);
    });
  });

  describe('getManagerDashboard', () => {
    it('should return manager dashboard with team insights', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prisma.badge.count as jest.Mock).mockResolvedValue(5);
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([
        { recipientId: 'user-1', _count: 5 },
      ]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getManagerDashboard('manager-1');

      // Assert
      expect(result.teamInsights).toBeDefined();
      expect(result.teamInsights.teamMembersCount).toBe(1);
      expect(result.teamInsights.teamBadgesThisMonth).toBe(5);
    });

    it('should return top performers', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prisma.badge.count as jest.Mock).mockResolvedValue(10);
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([
        { recipientId: 'user-1', _count: 5 },
      ]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getManagerDashboard('manager-1');

      // Assert
      expect(result.teamInsights.topPerformers).toHaveLength(1);
      expect(result.teamInsights.topPerformers[0].badgeCount).toBe(5);
    });

    it('should return revocation alerts', async () => {
      // Arrange
      const revokedBadge = {
        ...mockBadge,
        status: BadgeStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: 'Policy violation',
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prisma.badge.count as jest.Mock).mockResolvedValue(5);
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([revokedBadge]);

      // Act
      const result = await service.getManagerDashboard('manager-1');

      // Assert
      expect(result.revocationAlerts).toHaveLength(1);
      expect(result.revocationAlerts[0].reason).toBe('Policy violation');
    });

    it('should return empty team when manager has no direct reports (Story 12.3a)', async () => {
      // Arrange — no findUnique needed; managerId-based scoping
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getManagerDashboard('manager-1');

      // Assert
      expect(result.teamInsights.teamMembersCount).toBe(0);
      expect(result.revocationAlerts).toHaveLength(0);
    });

    it('should query by managerId for direct reports (Story 12.3a)', async () => {
      // Arrange
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);
      (prisma.badge.count as jest.Mock).mockResolvedValue(3);
      (prisma.badge.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await service.getManagerDashboard('manager-1');

      // Assert — verify managerId-based query
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            managerId: 'manager-1',
            isActive: true,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard with system overview', async () => {
      // Arrange
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80) // activeUsersThisMonth
        .mockResolvedValueOnce(10); // newUsersThisMonth
      (prisma.badge.count as jest.Mock).mockResolvedValue(500);
      (prisma.badgeTemplate.count as jest.Mock).mockResolvedValue(20);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      // Act
      const result = await service.getAdminDashboard();

      // Assert
      expect(result.systemOverview).toBeDefined();
      expect(result.systemOverview.totalUsers).toBe(100);
      expect(result.systemOverview.totalBadgesIssued).toBe(500);
      expect(result.systemOverview.activeBadgeTemplates).toBe(20);
    });

    it('should return recent activity with actor names', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(50);
      (prisma.badge.count as jest.Mock).mockResolvedValue(200);
      (prisma.badgeTemplate.count as jest.Mock).mockResolvedValue(10);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          ...mockUser,
          id: 'issuer-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
        },
      ]);

      // Act
      const result = await service.getAdminDashboard();

      // Assert
      expect(result.recentActivity).toHaveLength(1);
      expect(result.recentActivity[0].actorName).toBe('Admin User');
      expect(result.recentActivity[0].type).toBe('BADGE_ISSUED');
    });

    it('should handle empty audit logs', async () => {
      // Arrange
      (prisma.user.count as jest.Mock).mockResolvedValue(50);
      (prisma.badge.count as jest.Mock).mockResolvedValue(200);
      (prisma.badgeTemplate.count as jest.Mock).mockResolvedValue(10);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getAdminDashboard();

      // Assert
      expect(result.recentActivity).toHaveLength(0);
      expect(result.systemOverview.systemHealth).toBe('healthy');
    });

    it('should show new users this month', async () => {
      // Arrange
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(75)
        .mockResolvedValueOnce(15);
      (prisma.badge.count as jest.Mock).mockResolvedValue(300);
      (prisma.badgeTemplate.count as jest.Mock).mockResolvedValue(25);
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getAdminDashboard();

      // Assert
      expect(result.systemOverview.activeUsersThisMonth).toBe(75);
      expect(result.systemOverview.newUsersThisMonth).toBe(15);
    });
  });

  // Story 11.24 AC-C1: formatAuditDescription tests (shared utility)
  describe('formatAuditDescription', () => {
    it('should format ISSUED action with badge name and recipient', () => {
      const result = formatAuditDescription('ISSUED', {
        badgeName: 'Cloud Expert',
        recipientEmail: 'user@test.com',
      });
      expect(result).toBe('Badge "Cloud Expert" issued to user@test.com');
    });

    it('should format CLAIMED action with template name', () => {
      const result = formatAuditDescription('CLAIMED', {
        badgeName: 'Cloud Expert',
        oldStatus: 'ISSUED',
        newStatus: 'CLAIMED',
      });
      expect(result).toBe('Badge "Cloud Expert" claimed');
    });

    it('should format CLAIMED action with status change when no name', () => {
      const result = formatAuditDescription('CLAIMED', {
        oldStatus: 'ISSUED',
        newStatus: 'CLAIMED',
      });
      expect(result).toBe('Badge status changed: ISSUED → CLAIMED');
    });

    it('should format REVOKED action with reason', () => {
      const result = formatAuditDescription('REVOKED', {
        badgeName: 'Cloud Expert',
        reason: 'Employee left',
      });
      expect(result).toBe('Revoked "Cloud Expert" — Employee left');
    });

    it('should format NOTIFICATION_SENT action', () => {
      const result = formatAuditDescription('NOTIFICATION_SENT', {
        notificationType: 'Email',
        recipientEmail: 'user@test.com',
      });
      expect(result).toBe('Email notification sent to user@test.com');
    });

    it('should format CREATED action with template name', () => {
      const result = formatAuditDescription('CREATED', {
        templateName: 'New Template',
      });
      expect(result).toBe('Template "New Template" created');
    });

    it('should format UPDATED action with template name', () => {
      const result = formatAuditDescription('UPDATED', {
        templateName: 'Updated Template',
      });
      expect(result).toBe('Template "Updated Template" updated');
    });

    it('should return action string for unknown action types', () => {
      const result = formatAuditDescription('CUSTOM_ACTION', { foo: 'bar' });
      expect(result).toBe('CUSTOM_ACTION');
    });

    it('should return action string when metadata is null', () => {
      const result = formatAuditDescription('ISSUED', null);
      expect(result).toBe('ISSUED');
    });

    it('should fall back to raw action when critical metadata fields are empty', () => {
      const result = formatAuditDescription('ISSUED', {});
      expect(result).toBe('ISSUED');
    });

    it('should fall back to raw action when only some ISSUED fields present', () => {
      const result = formatAuditDescription('ISSUED', {
        badgeName: 'Cloud Expert',
      });
      expect(result).toBe('Badge "Cloud Expert" issued');
    });

    it('should fall back to raw action when REVOKED has no badgeName', () => {
      const result = formatAuditDescription('REVOKED', {
        reason: 'Policy violation',
      });
      expect(result).toBe('REVOKED');
    });

    it('should show placeholder for missing CLAIMED statuses', () => {
      const result = formatAuditDescription('CLAIMED', {});
      expect(result).toBe('Badge status changed: ? → ?');
    });

    it('should show fallback reason when REVOKED has name but no reason', () => {
      const result = formatAuditDescription('REVOKED', {
        badgeName: 'Cloud Expert',
      });
      expect(result).toBe('Revoked "Cloud Expert" — no reason given');
    });
  });
});
