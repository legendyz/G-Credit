/**
 * Admin Users Controller Tests - Story 8.10
 *
 * Unit tests for AdminUsersController:
 * - Authorization (Admin-only access)
 * - Request handling and response formatting
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: jest.Mocked<AdminUsersService>;

  const mockUser = {
    id: 'user-123',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    isActive: true,
    lastLoginAt: new Date('2026-02-01'),
    roleSetManually: false,
    roleUpdatedAt: null,
    roleUpdatedBy: null,
    roleVersion: 0,
    createdAt: new Date('2026-01-01'),
    // 12.3b fields
    source: 'LOCAL' as const,
    sourceLabel: 'Local Account',
    badgeCount: 0,
    lastSyncAt: null,
    managerId: null,
    managerName: null,
    managerEmail: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  const mockAdmin = {
    userId: 'admin-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    isManager: false,
  };

  const mockReq: RequestWithUser = { user: mockAdmin };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateRole: jest.fn(),
      updateStatus: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: AdminUsersService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get(AdminUsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      const mockResponse = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 25,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      service.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({ page: 1, limit: 25 }, mockReq);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 25 });
    });

    it('should pass query parameters to service', async () => {
      service.findAll.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      await controller.findAll(
        { page: 2, limit: 50, search: 'john', roleFilter: UserRole.ISSUER },
        mockReq,
      );

      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 50,
        search: 'john',
        roleFilter: UserRole.ISSUER,
      });
    });
  });

  describe('findOne', () => {
    it('should return single user', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-123', mockReq);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const updatedUser = {
        id: 'user-123',
        email: 'john@example.com',
        role: UserRole.ISSUER,
        roleSetManually: true,
        roleUpdatedAt: new Date(),
        roleUpdatedBy: mockAdmin.userId,
        roleVersion: 1,
      };
      service.updateRole.mockResolvedValue(updatedUser);

      const result = await controller.updateRole(
        'user-123',
        { role: UserRole.ISSUER, roleVersion: 0 },
        mockReq,
      );

      expect(result.role).toBe(UserRole.ISSUER);
      expect(service.updateRole).toHaveBeenCalledWith(
        'user-123',
        { role: UserRole.ISSUER, roleVersion: 0 },
        mockAdmin.userId,
      );
    });

    it('should include audit note when provided', async () => {
      service.updateRole.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
        role: UserRole.ADMIN,
        roleSetManually: true,
        roleUpdatedAt: new Date(),
        roleUpdatedBy: mockAdmin.userId,
        roleVersion: 1,
      });

      await controller.updateRole(
        'user-123',
        {
          role: UserRole.ADMIN,
          roleVersion: 0,
          auditNote: 'Promoted to admin',
        },
        mockReq,
      );

      expect(service.updateRole).toHaveBeenCalledWith(
        'user-123',
        {
          role: UserRole.ADMIN,
          roleVersion: 0,
          auditNote: 'Promoted to admin',
        },
        mockAdmin.userId,
      );
    });
  });

  describe('updateStatus', () => {
    it('should deactivate user', async () => {
      service.updateStatus.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
        isActive: false,
      });

      const result = await controller.updateStatus(
        'user-123',
        { isActive: false },
        mockReq,
      );

      expect(result.isActive).toBe(false);
      expect(service.updateStatus).toHaveBeenCalledWith(
        'user-123',
        { isActive: false },
        mockAdmin.userId,
      );
    });

    it('should activate user', async () => {
      service.updateStatus.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
        isActive: true,
      });

      const result = await controller.updateStatus(
        'user-123',
        { isActive: true },
        mockReq,
      );

      expect(result.isActive).toBe(true);
    });

    it('should include audit note when provided', async () => {
      service.updateStatus.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
        isActive: false,
      });

      await controller.updateStatus(
        'user-123',
        { isActive: false, auditNote: 'User resigned' },
        mockReq,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        'user-123',
        { isActive: false, auditNote: 'User resigned' },
        mockAdmin.userId,
      );
    });
  });

  describe('Authorization', () => {
    it('should have ADMIN role requirement via decorator', () => {
      // The @Roles(UserRole.ADMIN) decorator is applied at controller level
      // This test verifies the controller class has the correct metadata
      const roles: unknown = Reflect.getMetadata('roles', AdminUsersController);
      expect(roles).toContain(UserRole.ADMIN);
    });
  });
});
