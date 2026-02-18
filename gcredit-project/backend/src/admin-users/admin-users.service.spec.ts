/**
 * Admin Users Service Tests - Story 8.10
 *
 * Unit tests for AdminUsersService:
 * - findAll() with pagination, filtering, sorting
 * - updateRole() with optimistic locking and audit logging
 * - updateStatus() with audit logging
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../common/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  containing,
  arrayContaining,
} from '../../test/helpers/jest-typed-matchers';

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  // Mock PrismaService at describe scope — jest.fn() gives us jest.Mock type
  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userRoleAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  // Alias preserves jest.Mock types so .mockResolvedValue() is available
  const prisma = mockPrismaService;

  // Mock user data
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
  };

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      const users = [mockUser];
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({ page: 1, limit: 25 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term (name/email)', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll({ page: 1, limit: 25, search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: containing({
            OR: arrayContaining([
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by role', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll({ page: 1, limit: 25, roleFilter: UserRole.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: containing({
            role: UserRole.ADMIN,
          }),
        }),
      );
    });

    it('should filter by active status', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll({ page: 1, limit: 25, statusFilter: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: containing({
            isActive: true,
          }),
        }),
      );
    });

    it('should sort by email descending', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      await service.findAll({
        page: 1,
        limit: 25,
        sortBy: 'email',
        sortOrder: 'desc',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ email: 'desc' }],
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.user.count.mockResolvedValue(100);
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll({ page: 2, limit: 25 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        }),
      );
      expect(result.meta.totalPages).toBe(4);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('should return empty list when no users found', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 25 });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return user by ID', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const updatedUser = {
        ...mockUser,
        role: UserRole.ISSUER,
        roleSetManually: true,
        roleUpdatedAt: new Date(),
        roleUpdatedBy: mockAdmin.id,
        roleVersion: 1,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          return callback({
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUnique: jest.fn().mockResolvedValue(updatedUser),
            },
            userRoleAuditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        },
      );

      const result = await service.updateRole(
        'user-123',
        { role: UserRole.ISSUER, roleVersion: 0 },
        mockAdmin.id,
      );

      expect(result.role).toBe(UserRole.ISSUER);
      expect(result.roleSetManually).toBe(true);
    });

    it('should throw BadRequestException when trying to change own role', async () => {
      await expect(
        service.updateRole(
          mockAdmin.id,
          { role: UserRole.EMPLOYEE, roleVersion: 0 },
          mockAdmin.id,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole(
          'invalid-id',
          { role: UserRole.ISSUER, roleVersion: 0 },
          mockAdmin.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on version mismatch (optimistic lock)', async () => {
      const userWithDifferentVersion = { ...mockUser, roleVersion: 5 };
      prisma.user.findUnique.mockResolvedValue(userWithDifferentVersion);

      await expect(
        service.updateRole(
          'user-123',
          { role: UserRole.ISSUER, roleVersion: 0 }, // Wrong version
          mockAdmin.id,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when concurrent update detected', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          return callback({
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 0 }), // No rows updated
              findUnique: jest.fn(),
            },
            userRoleAuditLog: {
              create: jest.fn(),
            },
          });
        },
      );

      await expect(
        service.updateRole(
          'user-123',
          { role: UserRole.ISSUER, roleVersion: 0 },
          mockAdmin.id,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create audit log entry on role change', async () => {
      const mockAuditCreate = jest.fn().mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          return callback({
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUnique: jest
                .fn()
                .mockResolvedValue({ ...mockUser, role: UserRole.ISSUER }),
            },
            userRoleAuditLog: {
              create: mockAuditCreate,
            },
          });
        },
      );

      await service.updateRole(
        'user-123',
        {
          role: UserRole.ISSUER,
          roleVersion: 0,
          auditNote: 'Promoted to issuer',
        },
        mockAdmin.id,
      );

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: containing({
          userId: 'user-123',
          performedBy: mockAdmin.id,
          action: 'ROLE_CHANGED',
          oldValue: UserRole.EMPLOYEE,
          newValue: UserRole.ISSUER,
          note: 'Promoted to issuer',
        }),
      });
    });
  });

  describe('updateStatus', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          return callback({
            user: {
              update: jest.fn().mockResolvedValue(deactivatedUser),
            },
            userRoleAuditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        },
      );

      const result = await service.updateStatus(
        'user-123',
        { isActive: false, auditNote: 'User left organization' },
        mockAdmin.id,
      );

      expect(result.isActive).toBe(false);
    });

    it('should activate user successfully', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const activatedUser = { ...mockUser, isActive: true };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          return callback({
            user: {
              update: jest.fn().mockResolvedValue(activatedUser),
            },
            userRoleAuditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        },
      );

      const result = await service.updateStatus(
        'user-123',
        { isActive: true },
        mockAdmin.id,
      );

      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestException when trying to deactivate own account', async () => {
      await expect(
        service.updateStatus(mockAdmin.id, { isActive: false }, mockAdmin.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', { isActive: false }, mockAdmin.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create audit log entry on status change', async () => {
      const mockAuditCreate = jest.fn().mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          return callback({
            user: {
              update: jest
                .fn()
                .mockResolvedValue({ ...mockUser, isActive: false }),
            },
            userRoleAuditLog: {
              create: mockAuditCreate,
            },
          });
        },
      );

      await service.updateStatus(
        'user-123',
        { isActive: false, auditNote: 'User resigned' },
        mockAdmin.id,
      );

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: containing({
          userId: 'user-123',
          performedBy: mockAdmin.id,
          action: 'STATUS_CHANGED',
          oldValue: 'ACTIVE',
          newValue: 'INACTIVE',
          note: 'User resigned',
        }),
      });
    });
  });
});
