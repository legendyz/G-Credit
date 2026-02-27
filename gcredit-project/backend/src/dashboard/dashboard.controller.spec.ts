/**
 * Dashboard Controller Unit Tests - Story 8.1
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  EmployeeDashboardDto,
  IssuerDashboardDto,
  ManagerDashboardDto,
  AdminDashboardDto,
} from './dto';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;

  const mockEmployeeDashboard: EmployeeDashboardDto = {
    badgeSummary: {
      total: 10,
      claimedThisMonth: 3,
      pendingCount: 2,
      latestBadge: {
        id: 'badge-1',
        templateName: 'Test Badge',
        imageUrl: 'https://example.com/badge.png',
        status: 'CLAIMED',
        issuedAt: new Date('2024-01-15'),
        claimedAt: new Date('2024-01-16'),
      },
    },
    currentMilestone: {
      title: 'Badge Collector Level 2',
      progress: 3,
      target: 5,
      percentage: 60,
      icon: '🏆',
    },
    achievedMilestones: [
      {
        id: 'ach-1',
        title: 'First Badge',
        description: 'Earned your first badge',
        icon: '🏆',
        achievedAt: new Date('2026-01-15'),
      },
    ],
    recentBadges: [
      {
        id: 'badge-1',
        templateName: 'Test Badge',
        imageUrl: 'https://example.com/badge.png',
        status: 'CLAIMED',
        issuedAt: new Date('2024-01-15'),
        claimedAt: new Date('2024-01-16'),
      },
    ],
  };

  const mockIssuerDashboard: IssuerDashboardDto = {
    issuanceSummary: {
      issuedThisMonth: 15,
      pendingClaims: 5,
      totalRecipients: 30,
      claimRate: 0.85,
    },
    recentActivity: [
      {
        badgeId: 'badge-1',
        recipientName: 'Test User',
        recipientEmail: 'test@example.com',
        templateName: 'Test Badge',
        status: 'CLAIMED',
        issuedAt: new Date('2024-01-15'),
      },
    ],
  };

  const mockManagerDashboard: ManagerDashboardDto = {
    teamInsights: {
      teamMembersCount: 10,
      teamBadgesThisMonth: 25,
      topPerformers: [
        {
          userId: 'user-1',
          name: 'Top Performer',
          email: 'top@example.com',
          badgeCount: 8,
        },
      ],
    },
    revocationAlerts: [
      {
        badgeId: 'badge-2',
        recipientName: 'Revoked User',
        templateName: 'Test Badge',
        reason: 'Policy violation',
        revokedAt: new Date('2024-01-20'),
      },
    ],
  };

  const mockAdminDashboard: AdminDashboardDto = {
    systemOverview: {
      totalUsers: 100,
      totalBadgesIssued: 500,
      activeBadgeTemplates: 20,
      systemHealth: 'healthy',
      activeUsersThisMonth: 80,
      newUsersThisMonth: 10,
    },
    recentActivity: [
      {
        id: 'log-1',
        type: 'ISSUED',
        description: 'Badge issued',
        actorName: 'Admin User',
        timestamp: new Date('2024-01-15'),
      },
    ],
  };

  beforeEach(async () => {
    const mockDashboardService = {
      getEmployeeDashboard: jest.fn(),
      getIssuerDashboard: jest.fn(),
      getManagerDashboard: jest.fn(),
      getAdminDashboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get(DashboardService);
  });

  describe('getEmployeeDashboard', () => {
    it('should return employee dashboard data', async () => {
      // Arrange
      dashboardService.getEmployeeDashboard.mockResolvedValue(
        mockEmployeeDashboard,
      );
      const req: RequestWithUser = {
        user: {
          userId: 'user-1',
          email: 'test@example.com',
          role: UserRole.EMPLOYEE,
        },
      };

      // Act
      const result = await controller.getEmployeeDashboard(req);

      // Assert
      expect(result).toEqual(mockEmployeeDashboard);
      expect(dashboardService.getEmployeeDashboard).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should pass user id from JWT token', async () => {
      // Arrange
      dashboardService.getEmployeeDashboard.mockResolvedValue(
        mockEmployeeDashboard,
      );
      const req: RequestWithUser = {
        user: {
          userId: 'different-user',
          email: 'other@example.com',
          role: UserRole.EMPLOYEE,
        },
      };

      // Act
      await controller.getEmployeeDashboard(req);

      // Assert
      expect(dashboardService.getEmployeeDashboard).toHaveBeenCalledWith(
        'different-user',
      );
    });
  });

  describe('getIssuerDashboard', () => {
    it('should return issuer dashboard data', async () => {
      // Arrange
      dashboardService.getIssuerDashboard.mockResolvedValue(
        mockIssuerDashboard,
      );
      const req: RequestWithUser = {
        user: {
          userId: 'issuer-1',
          email: 'issuer@example.com',
          role: UserRole.ISSUER,
        },
      };

      // Act
      const result = await controller.getIssuerDashboard(req);

      // Assert
      expect(result).toEqual(mockIssuerDashboard);
      expect(dashboardService.getIssuerDashboard).toHaveBeenCalledWith(
        'issuer-1',
      );
    });

    it('should work for admin users accessing issuer dashboard', async () => {
      // Arrange
      dashboardService.getIssuerDashboard.mockResolvedValue(
        mockIssuerDashboard,
      );
      const req: RequestWithUser = {
        user: {
          userId: 'admin-1',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
      };

      // Act
      const result = await controller.getIssuerDashboard(req);

      // Assert
      expect(result).toEqual(mockIssuerDashboard);
      expect(dashboardService.getIssuerDashboard).toHaveBeenCalledWith(
        'admin-1',
      );
    });
  });

  describe('getManagerDashboard', () => {
    it('should return manager dashboard data', async () => {
      // Arrange
      dashboardService.getManagerDashboard.mockResolvedValue(
        mockManagerDashboard,
      );
      const req: RequestWithUser = {
        user: {
          userId: 'manager-1',
          email: 'manager@example.com',
          role: UserRole.EMPLOYEE, // ADR-017: managers now have EMPLOYEE role
        },
      };

      // Act
      const result = await controller.getManagerDashboard(req);

      // Assert
      expect(result).toEqual(mockManagerDashboard);
      expect(dashboardService.getManagerDashboard).toHaveBeenCalledWith(
        'manager-1',
      );
    });

    it('should work for admin users accessing manager dashboard', async () => {
      // Arrange
      dashboardService.getManagerDashboard.mockResolvedValue(
        mockManagerDashboard,
      );
      const req: RequestWithUser = {
        user: {
          userId: 'admin-1',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
      };

      // Act
      const result = await controller.getManagerDashboard(req);

      // Assert
      expect(result).toEqual(mockManagerDashboard);
      expect(dashboardService.getManagerDashboard).toHaveBeenCalledWith(
        'admin-1',
      );
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard data', async () => {
      // Arrange
      dashboardService.getAdminDashboard.mockResolvedValue(mockAdminDashboard);

      // Act
      const result = await controller.getAdminDashboard();

      // Assert
      expect(result).toEqual(mockAdminDashboard);
      expect(dashboardService.getAdminDashboard).toHaveBeenCalled();
    });

    it('should not require user id for admin dashboard', async () => {
      // Arrange
      dashboardService.getAdminDashboard.mockResolvedValue(mockAdminDashboard);

      // Act
      await controller.getAdminDashboard();

      // Assert
      expect(dashboardService.getAdminDashboard).toHaveBeenCalledWith();
    });
  });
});
