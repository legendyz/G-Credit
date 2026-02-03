import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      groupBy: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    badge: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    badgeTemplate: {
      groupBy: jest.fn(),
    },
    skill: {
      findMany: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getSystemOverview (AC1)', () => {
    it('should return system overview with all statistics', async () => {
      // Mock user counts by role
      mockPrismaService.user.groupBy.mockResolvedValue([
        { role: 'ADMIN', _count: 5 },
        { role: 'ISSUER', _count: 20 },
        { role: 'MANAGER', _count: 45 },
        { role: 'EMPLOYEE', _count: 380 },
      ]);

      // Mock active users this month
      mockPrismaService.user.count
        .mockResolvedValueOnce(320) // activeThisMonth
        .mockResolvedValueOnce(25); // newThisMonth

      // Mock badge counts by status
      mockPrismaService.badge.groupBy.mockResolvedValue([
        { status: 'CLAIMED', _count: 1015 },
        { status: 'PENDING', _count: 189 },
        { status: 'REVOKED', _count: 30 },
      ]);

      // Mock template counts by status
      mockPrismaService.badgeTemplate.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: 18 },
        { status: 'DRAFT', _count: 3 },
        { status: 'ARCHIVED', _count: 2 },
      ]);

      const result = await service.getSystemOverview();

      expect(result.users.total).toBe(450);
      expect(result.users.byRole.ADMIN).toBe(5);
      expect(result.users.byRole.EMPLOYEE).toBe(380);
      expect(result.users.activeThisMonth).toBe(320);
      expect(result.users.newThisMonth).toBe(25);

      expect(result.badges.totalIssued).toBe(1234);
      expect(result.badges.claimedCount).toBe(1015);
      expect(result.badges.pendingCount).toBe(189);
      expect(result.badges.revokedCount).toBe(30);
      expect(result.badges.claimRate).toBe(0.82);

      expect(result.badgeTemplates.total).toBe(23);
      expect(result.badgeTemplates.active).toBe(18);

      expect(result.systemHealth.status).toBe('healthy');
    });

    it('should handle empty data gracefully', async () => {
      mockPrismaService.user.groupBy.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.badge.groupBy.mockResolvedValue([]);
      mockPrismaService.badgeTemplate.groupBy.mockResolvedValue([]);

      const result = await service.getSystemOverview();

      expect(result.users.total).toBe(0);
      expect(result.badges.totalIssued).toBe(0);
      expect(result.badges.claimRate).toBe(0);
      expect(result.badgeTemplates.total).toBe(0);
    });

    it('should calculate correct claim rate', async () => {
      mockPrismaService.user.groupBy.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.badge.groupBy.mockResolvedValue([
        { status: 'CLAIMED', _count: 80 },
        { status: 'PENDING', _count: 20 },
      ]);
      mockPrismaService.badgeTemplate.groupBy.mockResolvedValue([]);

      const result = await service.getSystemOverview();

      expect(result.badges.claimRate).toBe(0.8); // 80/100 = 0.8
    });

    it('should use parallel queries for performance', async () => {
      mockPrismaService.user.groupBy.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.badge.groupBy.mockResolvedValue([]);
      mockPrismaService.badgeTemplate.groupBy.mockResolvedValue([]);

      await service.getSystemOverview();

      // Verify all queries were called
      expect(mockPrismaService.user.groupBy).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.badge.groupBy).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.badgeTemplate.groupBy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getIssuanceTrends (AC2)', () => {
    it('should return badge issuance trends for given period', async () => {
      const mockBadges = [
        { issuedAt: new Date('2026-01-15'), status: 'CLAIMED', claimedAt: new Date('2026-01-16'), revokedAt: null },
        { issuedAt: new Date('2026-01-15'), status: 'PENDING', claimedAt: null, revokedAt: null },
        { issuedAt: new Date('2026-01-16'), status: 'CLAIMED', claimedAt: new Date('2026-01-17'), revokedAt: null },
      ];

      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getIssuanceTrends(30);

      expect(result.period).toBe('last30days');
      expect(result.dataPoints.length).toBeGreaterThan(0);
      expect(result.totals.issued).toBe(3);
      expect(result.totals.claimed).toBe(2);
    });

    it('should filter by issuerId for admin', async () => {
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      await service.getIssuanceTrends(7, 'issuer-123', 'admin-1', 'ADMIN');

      expect(mockPrismaService.badge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issuerId: 'issuer-123',
          }),
        }),
      );
    });

    it('should force issuerId filter for ISSUER role', async () => {
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      await service.getIssuanceTrends(7, 'other-issuer', 'my-issuer-id', 'ISSUER');

      // ISSUER should only see their own data, not the requested issuerId
      expect(mockPrismaService.badge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issuerId: 'my-issuer-id',
          }),
        }),
      );
    });

    it('should support different period values', async () => {
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result7 = await service.getIssuanceTrends(7);
      expect(result7.period).toBe('last7days');

      const result90 = await service.getIssuanceTrends(90);
      expect(result90.period).toBe('last90days');

      const result365 = await service.getIssuanceTrends(365);
      expect(result365.period).toBe('last365days');
    });

    it('should calculate correct totals', async () => {
      const mockBadges = [
        { issuedAt: new Date(), status: 'CLAIMED', claimedAt: new Date(), revokedAt: null },
        { issuedAt: new Date(), status: 'CLAIMED', claimedAt: new Date(), revokedAt: null },
        { issuedAt: new Date(), status: 'REVOKED', claimedAt: null, revokedAt: new Date() },
        { issuedAt: new Date(), status: 'PENDING', claimedAt: null, revokedAt: null },
      ];

      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getIssuanceTrends(7);

      expect(result.totals.issued).toBe(4);
      expect(result.totals.claimed).toBe(2);
      expect(result.totals.revoked).toBe(1);
      expect(result.totals.claimRate).toBe(0.5); // 2/4
    });
  });

  describe('getTopPerformers (AC3)', () => {
    it('should return top performers sorted by badge count', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          department: 'Engineering',
          badgesReceived: [
            { id: 'b1', claimedAt: new Date('2026-02-01'), template: { name: 'Python Expert' } },
            { id: 'b2', claimedAt: new Date('2026-01-15'), template: { name: 'AWS Certified' } },
          ],
        },
        {
          id: 'user-2',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          department: 'Engineering',
          badgesReceived: [
            { id: 'b3', claimedAt: new Date('2026-01-20'), template: { name: 'Leadership' } },
          ],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getTopPerformers(undefined, 10, 'admin-1', 'ADMIN');

      expect(result.topPerformers.length).toBe(2);
      expect(result.topPerformers[0].name).toBe('Jane Smith');
      expect(result.topPerformers[0].badgeCount).toBe(2);
      expect(result.topPerformers[0].latestBadge?.templateName).toBe('Python Expert');
      expect(result.topPerformers[1].badgeCount).toBe(1);
    });

    it('should limit results correctly', async () => {
      const mockUsers = Array.from({ length: 20 }, (_, i) => ({
        id: `user-${i}`,
        firstName: `User`,
        lastName: `${i}`,
        email: `user${i}@test.com`,
        department: 'Eng',
        badgesReceived: [],
      }));

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getTopPerformers(undefined, 5, 'admin-1', 'ADMIN');

      expect(result.topPerformers.length).toBe(5);
    });

    it('should filter by department for MANAGER role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ department: 'Engineering' });
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getTopPerformers(undefined, 10, 'manager-1', 'MANAGER');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            department: 'Engineering',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if MANAGER requests different team', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ department: 'Engineering' });

      await expect(
        service.getTopPerformers('Sales', 10, 'manager-1', 'MANAGER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if MANAGER has no department', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ department: null });

      await expect(
        service.getTopPerformers(undefined, 10, 'manager-1', 'MANAGER'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSkillsDistribution (AC4)', () => {
    it('should return skills with badge counts', async () => {
      const mockSkills = [
        { id: 'skill-1', name: 'Python', category: { name: 'Technical' } },
        { id: 'skill-2', name: 'Leadership', category: { name: 'Soft Skills' } },
      ];

      const mockBadges = [
        { recipientId: 'user-1', template: { skillIds: ['skill-1'] } },
        { recipientId: 'user-2', template: { skillIds: ['skill-1'] } },
        { recipientId: 'user-1', template: { skillIds: ['skill-2'] } },
      ];

      mockPrismaService.skill.findMany.mockResolvedValue(mockSkills);
      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getSkillsDistribution();

      expect(result.totalSkills).toBe(2);
      expect(result.topSkills[0].skillName).toBe('Python');
      expect(result.topSkills[0].badgeCount).toBe(2);
      expect(result.topSkills[0].employeeCount).toBe(2);
      expect(result.skillsByCategory['Technical']).toBe(2);
      expect(result.skillsByCategory['Soft Skills']).toBe(1);
    });

    it('should handle empty skills', async () => {
      mockPrismaService.skill.findMany.mockResolvedValue([]);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result = await service.getSkillsDistribution();

      expect(result.totalSkills).toBe(0);
      expect(result.topSkills).toEqual([]);
    });

    it('should limit top skills to 20', async () => {
      const mockSkills = Array.from({ length: 30 }, (_, i) => ({
        id: `skill-${i}`,
        name: `Skill ${i}`,
        category: { name: 'Technical' },
      }));

      mockPrismaService.skill.findMany.mockResolvedValue(mockSkills);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result = await service.getSkillsDistribution();

      expect(result.topSkills.length).toBeLessThanOrEqual(20);
    });

    it('should count unique employees per skill', async () => {
      const mockSkills = [{ id: 'skill-1', name: 'Python', category: { name: 'Tech' } }];

      // Same user gets 3 badges with same skill - should count as 1 employee
      const mockBadges = [
        { recipientId: 'user-1', template: { skillIds: ['skill-1'] } },
        { recipientId: 'user-1', template: { skillIds: ['skill-1'] } },
        { recipientId: 'user-1', template: { skillIds: ['skill-1'] } },
      ];

      mockPrismaService.skill.findMany.mockResolvedValue(mockSkills);
      mockPrismaService.badge.findMany.mockResolvedValue(mockBadges);

      const result = await service.getSkillsDistribution();

      expect(result.topSkills[0].badgeCount).toBe(3);
      expect(result.topSkills[0].employeeCount).toBe(1);
    });
  });

  describe('getRecentActivity (AC5)', () => {
    it('should return paginated activity feed', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          entityType: 'Badge',
          entityId: 'badge-1',
          action: 'ISSUED',
          actorId: 'issuer-1',
          actorEmail: 'issuer@test.com',
          timestamp: new Date('2026-02-02T09:30:00Z'),
          metadata: { recipientName: 'Jane', templateName: 'Python Expert' },
        },
        {
          id: 'log-2',
          entityType: 'Badge',
          entityId: 'badge-2',
          action: 'CLAIMED',
          actorId: 'user-1',
          actorEmail: 'user@test.com',
          timestamp: new Date('2026-02-02T09:00:00Z'),
          metadata: null,
        },
      ];

      mockPrismaService.auditLog.count.mockResolvedValue(100);
      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecentActivity(20, 0);

      expect(result.activities.length).toBe(2);
      expect(result.activities[0].type).toBe('BADGE_ISSUED');
      expect(result.activities[0].actor.name).toBe('issuer@test.com');
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.offset).toBe(0);
    });

    it('should handle pagination offset', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(100);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await service.getRecentActivity(20, 40);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
    });

    it('should map action types correctly', async () => {
      const mockLogs = [
        { id: '1', entityType: 'Badge', action: 'ISSUED', actorId: 'a', actorEmail: 'a@t.com', timestamp: new Date(), metadata: null },
        { id: '2', entityType: 'Badge', action: 'CLAIMED', actorId: 'b', actorEmail: 'b@t.com', timestamp: new Date(), metadata: null },
        { id: '3', entityType: 'Badge', action: 'REVOKED', actorId: 'c', actorEmail: 'c@t.com', timestamp: new Date(), metadata: null },
        { id: '4', entityType: 'Template', action: 'CREATED', actorId: 'd', actorEmail: 'd@t.com', timestamp: new Date(), metadata: null },
      ];

      mockPrismaService.auditLog.count.mockResolvedValue(4);
      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecentActivity(20, 0);

      expect(result.activities[0].type).toBe('BADGE_ISSUED');
      expect(result.activities[1].type).toBe('BADGE_CLAIMED');
      expect(result.activities[2].type).toBe('BADGE_REVOKED');
      expect(result.activities[3].type).toBe('TEMPLATE_CREATED');
    });

    it('should handle empty audit log', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(0);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      const result = await service.getRecentActivity(20, 0);

      expect(result.activities).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});
