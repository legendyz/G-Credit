/**
 * Admin Users Service - Story 8.10
 *
 * Core business logic for Admin User Management:
 * - List users with pagination, filtering, sorting
 * - Update user roles with optimistic locking and audit logging
 * - Activate/deactivate users with audit logging
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDepartmentDto } from './dto/update-user-department.dto';
import { UserRole, Prisma } from '@prisma/client';

// Response types
export interface UserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  roleSetManually: boolean;
  roleUpdatedAt: Date | null;
  roleUpdatedBy: string | null;
  roleVersion: number;
  createdAt: Date;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserListResponse {
  data: UserListItem[];
  meta: PaginationInfo;
}

export interface RoleUpdateResponse {
  id: string;
  email: string;
  role: UserRole;
  roleSetManually: boolean;
  roleUpdatedAt: Date;
  roleUpdatedBy: string;
  roleVersion: number;
}

export interface StatusUpdateResponse {
  id: string;
  email: string;
  isActive: boolean;
}

export interface DepartmentUpdateResponse {
  id: string;
  email: string;
  department: string;
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  // Threshold for switching to cursor-based pagination
  private readonly CURSOR_PAGINATION_THRESHOLD = 1000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all users with pagination, filtering, and sorting
   * AC1: User List Page
   *
   * Implements hybrid pagination:
   * - <1000 users: offset-based pagination
   * - ≥1000 users: cursor-based pagination
   */
  async findAll(query: AdminUsersQueryDto): Promise<UserListResponse> {
    const {
      page,
      limit,
      search,
      roleFilter,
      statusFilter,
      sortBy,
      sortOrder,
      cursor,
    } = query;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Search filter: name or email (case-insensitive)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (roleFilter) {
      where.role = roleFilter;
    }

    // Status filter
    if (statusFilter !== undefined) {
      where.isActive = statusFilter;
    }

    // Build orderBy clause
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Determine pagination strategy
    const useCursorPagination =
      total >= this.CURSOR_PAGINATION_THRESHOLD && cursor;

    let users: UserListItem[];

    if (useCursorPagination && cursor) {
      // Cursor-based pagination for large datasets
      const { id: cursorId } = this.decodeCursor(cursor);

      const rawUsers = await this.prisma.user.findMany({
        where,
        orderBy,
        take: limit! + 1, // Fetch one extra to check if there's more
        cursor: { id: cursorId },
        skip: 1, // Skip the cursor itself
        select: this.getUserSelect(),
      });

      // Check if there are more results
      const hasMore = rawUsers.length > limit!;
      if (hasMore) {
        rawUsers.pop(); // Remove the extra item
      }

      users = rawUsers;

      if (hasMore && rawUsers.length > 0) {
        const lastUser = rawUsers[rawUsers.length - 1];
        // nextCursor computed but reserved for future cursor-based API
        this.encodeCursor(
          lastUser.id,
          sortBy || 'name',
          this.getSortValue(lastUser, sortBy || 'name'),
        );
      }
    } else {
      // Offset-based pagination for small datasets
      const skip = (page! - 1) * limit!;

      users = await this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: this.getUserSelect(),
      });
    }

    return createPaginatedResponse(users, total, page!, limit!);
  }

  /**
   * Get a single user by ID
   */
  async findOne(userId: string): Promise<UserListItem> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.getUserSelect(),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Update user role with optimistic locking and audit logging
   * AC2: Edit User Role
   * AC4: Role Change Audit Trail
   * AC5: Optimistic Locking
   *
   * @throws BadRequestException if trying to change own role
   * @throws ConflictException if role version mismatch (409)
   */
  async updateRole(
    userId: string,
    dto: UpdateUserRoleDto,
    adminId: string,
  ): Promise<RoleUpdateResponse> {
    // AC2: Cannot change own role
    if (userId === adminId) {
      throw new BadRequestException('Cannot change your own role');
    }

    // Get current user state
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, roleVersion: true },
    });

    if (!currentUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // AC5: Optimistic locking - check version match
    if (currentUser.roleVersion !== dto.roleVersion) {
      throw new ConflictException(
        'User role was modified by another process. Please refresh and try again.',
      );
    }

    // No change needed if same role - return actual persisted values
    if (currentUser.role === dto.role) {
      // Fetch full user data to return actual persisted state
      const fullUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          roleSetManually: true,
          roleUpdatedAt: true,
          roleUpdatedBy: true,
          roleVersion: true,
        },
      });

      // Should never be null since we just found currentUser, but TypeScript needs this
      if (!fullUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return {
        id: fullUser.id,
        email: fullUser.email,
        role: fullUser.role,
        roleSetManually: fullUser.roleSetManually,
        roleUpdatedAt: fullUser.roleUpdatedAt ?? new Date(),
        roleUpdatedBy: fullUser.roleUpdatedBy ?? '',
        roleVersion: fullUser.roleVersion,
      };
    }

    // Execute update with audit log in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // AC5: Update with optimistic locking
      // Use updateMany with version check to detect conflicts
      const updateResult = await tx.user.updateMany({
        where: {
          id: userId,
          roleVersion: dto.roleVersion, // Optimistic lock condition
        },
        data: {
          role: dto.role,
          roleSetManually: true,
          roleUpdatedAt: new Date(),
          roleUpdatedBy: adminId,
          roleVersion: { increment: 1 },
        },
      });

      // If no rows updated, someone else changed it
      if (updateResult.count === 0) {
        throw new ConflictException(
          'User role was modified by another process. Please refresh and try again.',
        );
      }

      // AC4: Create audit log entry
      await tx.userRoleAuditLog.create({
        data: {
          userId,
          performedBy: adminId,
          action: 'ROLE_CHANGED',
          oldValue: currentUser.role,
          newValue: dto.role,
          note: dto.auditNote,
        },
      });

      // Fetch updated user
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          roleSetManually: true,
          roleUpdatedAt: true,
          roleUpdatedBy: true,
          roleVersion: true,
        },
      });

      return updatedUser!;
    });

    this.logger.log(
      `Role updated for user ${result.email}: ${currentUser.role} → ${dto.role} by admin ${adminId}`,
    );

    return result as RoleUpdateResponse;
  }

  /**
   * Update user status (activate/deactivate) with audit logging
   * AC3: User Deactivation
   * AC4: Status Change Audit Trail
   */
  async updateStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    adminId: string,
  ): Promise<StatusUpdateResponse> {
    // Cannot deactivate yourself
    if (userId === adminId && !dto.isActive) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!currentUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // No change needed if same status
    if (currentUser.isActive === dto.isActive) {
      return {
        id: currentUser.id,
        email: currentUser.email,
        isActive: currentUser.isActive,
      };
    }

    // Execute update with audit log in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isActive: dto.isActive },
        select: { id: true, email: true, isActive: true },
      });

      // Create audit log entry
      await tx.userRoleAuditLog.create({
        data: {
          userId,
          performedBy: adminId,
          action: 'STATUS_CHANGED',
          oldValue: currentUser.isActive ? 'ACTIVE' : 'INACTIVE',
          newValue: dto.isActive ? 'ACTIVE' : 'INACTIVE',
          note: dto.auditNote,
        },
      });

      return updatedUser;
    });

    const action = dto.isActive ? 'activated' : 'deactivated';
    this.logger.log(`User ${result.id} ${action} by admin ${adminId}`);

    return result;
  }

  /**
   * Update user department
   */
  async updateDepartment(
    userId: string,
    dto: UpdateUserDepartmentDto,
    adminId: string,
  ): Promise<DepartmentUpdateResponse> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, department: true },
    });

    if (!currentUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { department: dto.department },
        select: { id: true, email: true, department: true },
      });

      await tx.userRoleAuditLog.create({
        data: {
          userId,
          performedBy: adminId,
          action: 'DEPARTMENT_CHANGED',
          oldValue: currentUser.department || '(none)',
          newValue: dto.department,
          note: dto.auditNote,
        },
      });

      return updatedUser;
    });

    this.logger.log(
      `User ${result.email} department changed to "${dto.department}" by admin ${adminId}`,
    );

    return {
      id: result.id,
      email: result.email,
      department: result.department!,
    };
  }

  // Helper methods

  private getUserSelect() {
    return {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      isActive: true,
      lastLoginAt: true,
      roleSetManually: true,
      roleUpdatedAt: true,
      roleUpdatedBy: true,
      roleVersion: true,
      createdAt: true,
    };
  }

  private buildOrderBy(
    sortBy: string | undefined,
    sortOrder: 'asc' | 'desc' | undefined,
  ): Prisma.UserOrderByWithRelationInput[] {
    const order = sortOrder || 'asc';

    switch (sortBy) {
      case 'email':
        return [{ email: order }];
      case 'role':
        return [{ role: order }];
      case 'lastLogin':
        return [{ lastLoginAt: order }];
      case 'createdAt':
        return [{ createdAt: order }];
      case 'name':
      default:
        // Sort by lastName, then firstName
        return [{ lastName: order }, { firstName: order }];
    }
  }

  private encodeCursor(
    id: string,
    sortField: string,
    sortValue: string,
  ): string {
    const data = `${id}_${sortField}_${sortValue}`;
    return Buffer.from(data).toString('base64');
  }

  private decodeCursor(cursor: string): {
    id: string;
    sortField: string;
    sortValue: string;
  } {
    const data = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, sortField, sortValue] = data.split('_');
    return { id, sortField, sortValue };
  }

  private getSortValue(user: UserListItem, sortBy: string): string {
    switch (sortBy) {
      case 'email':
        return user.email;
      case 'role':
        return user.role;
      case 'lastLogin':
        return user.lastLoginAt?.toISOString() || '';
      case 'createdAt':
        return user.createdAt.toISOString();
      case 'name':
      default:
        return `${user.lastName || ''}_${user.firstName || ''}`;
    }
  }
}
