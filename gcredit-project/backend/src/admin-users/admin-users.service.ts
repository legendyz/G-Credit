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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDepartmentDto } from './dto/update-user-department.dto';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  // 12.3b additions
  source: 'M365' | 'LOCAL';
  sourceLabel: string;
  badgeCount: number;
  lastSyncAt: Date | null;
  managerId: string | null;
  managerName: string | null;
  managerEmail: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  directReportsCount?: number;
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

export interface CreateUserResponse extends UserListItem {
  managerAutoUpgraded?: {
    managerId: string;
    managerEmail: string;
    managerName: string;
    previousRole: UserRole;
  };
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

    // Collect AND conditions to compose safely with search + status filters
    const andConditions: Prisma.UserWhereInput[] = [];

    // Search filter: name, email, department, or role (case-insensitive)
    if (search) {
      const orConditions: Prisma.UserWhereInput[] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];

      // Match search term against role enum values (e.g. "employee" matches EMPLOYEE)
      const matchingRoles = Object.values(UserRole).filter((role) =>
        role.toLowerCase().includes(search.toLowerCase()),
      );
      if (matchingRoles.length > 0) {
        orConditions.push({ role: { in: matchingRoles } });
      }

      andConditions.push({ OR: orConditions });
    }

    // Role filter
    if (roleFilter) {
      where.role = roleFilter;
    }

    // Status filter (12.3b: enum-based: ACTIVE/LOCKED/INACTIVE)
    if (statusFilter === 'ACTIVE') {
      where.isActive = true;
      andConditions.push({
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
      });
      andConditions.push({ failedLoginAttempts: { lt: 5 } });
    } else if (statusFilter === 'LOCKED') {
      where.isActive = true;
      andConditions.push({
        OR: [
          { lockedUntil: { gt: new Date() } },
          { failedLoginAttempts: { gte: 5 } },
        ],
      });
    } else if (statusFilter === 'INACTIVE') {
      where.isActive = false;
    }

    // Apply composed AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Source filter (12.3b AC #5)
    if (query.sourceFilter === 'M365') {
      where.azureId = { not: null };
    } else if (query.sourceFilter === 'LOCAL') {
      where.azureId = null;
    }

    // Build orderBy clause
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Determine pagination strategy
    const useCursorPagination =
      total >= this.CURSOR_PAGINATION_THRESHOLD && cursor;

    let users: Record<string, unknown>[];

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
          this.getSortValue(
            lastUser as unknown as UserListItem,
            sortBy || 'name',
          ),
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

    const mappedUsers = users.map((u) => this.mapUserToResponse(u));
    return createPaginatedResponse(mappedUsers, total, page!, limit!);
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

    return this.mapUserToResponse(user as unknown as Record<string, unknown>);
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
      select: {
        id: true,
        email: true,
        role: true,
        roleVersion: true,
        azureId: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 12.3b AC #6: M365 users' roles are managed via Security Group
    if (currentUser.azureId) {
      throw new BadRequestException(
        'M365 user roles are managed via Security Group membership. ' +
          "To change this user's role, update their Security Group in Azure AD.",
      );
    }

    // MANAGER and EMPLOYEE are auto-managed via managerId relationships.
    // Only ADMIN and ISSUER can be manually assigned.
    if (dto.role === UserRole.MANAGER || dto.role === UserRole.EMPLOYEE) {
      throw new BadRequestException(
        `Cannot manually assign ${dto.role} role. ` +
          'MANAGER/EMPLOYEE roles are automatically managed based on subordinate assignments.',
      );
    }

    // Strong constraint: block role change from MANAGER if user has subordinates
    // (ADMIN promotion is allowed — ADMIN supersedes MANAGER)
    if (currentUser.role === UserRole.MANAGER && dto.role !== UserRole.ADMIN) {
      const subordinateCount = await this.prisma.user.count({
        where: { managerId: userId },
      });
      if (subordinateCount > 0) {
        throw new BadRequestException(
          `Cannot change role from MANAGER: this user has ${subordinateCount} subordinate(s). ` +
            'Please reassign their subordinates first.',
        );
      }
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

  /**
   * 12.3b AC #15, #16, #17, #18, #33: Create a local user
   */
  async createUser(dto: CreateUserDto, adminId: string): Promise<UserListItem> {
    // AC #33: Validate ADMIN role blocked for manual creation
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Cannot create users with ADMIN role directly. Use Security Group assignment.',
      );
    }

    // MANAGER is auto-managed — cannot be directly assigned
    if (dto.role === UserRole.MANAGER) {
      throw new BadRequestException(
        'Cannot create users with MANAGER role directly. ' +
          'Assign subordinates to automatically promote to MANAGER.',
      );
    }

    // AC #17: Email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    // Validate managerId if provided
    let managerNeedsUpgrade = false;
    let managerBeforeUpgrade: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: UserRole;
    } | null = null;

    if (dto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: dto.managerId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          managerId: true,
        },
      });
      if (!manager) {
        throw new BadRequestException('Selected manager does not exist');
      }

      // Circular hierarchy detection: walk up the manager chain from the
      // selected manager. If we ever encounter dto.managerId again, it's a
      // cycle. For createUser the new user doesn't exist yet, so cycles are
      // unlikely, but this guard future-proofs for updateManager scenarios.
      // Max depth = 50 to prevent infinite loops on corrupt data.
      await this.detectManagerCycle(dto.managerId, null);

      // Strong constraint: auto-upgrade to MANAGER if currently EMPLOYEE
      if (manager.role === UserRole.EMPLOYEE) {
        managerNeedsUpgrade = true;
        managerBeforeUpgrade = manager;
      }
    }

    // Hash default password
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // AC #16: Create with azureId=null, roleSetManually=true
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          department: dto.department || null,
          role: dto.role,
          managerId: dto.managerId || null,
          azureId: null,
          roleSetManually: true,
          isActive: true,
        },
        select: this.getUserSelect(),
      });

      await tx.userRoleAuditLog.create({
        data: {
          userId: created.id,
          performedBy: adminId,
          action: 'USER_CREATED',
          newValue: dto.role,
          note: `Created local user ${dto.email.toLowerCase()} (department: ${dto.department || 'none'})`,
        },
      });

      // Auto-upgrade manager to MANAGER role if needed
      if (managerNeedsUpgrade && managerBeforeUpgrade) {
        await tx.user.update({
          where: { id: managerBeforeUpgrade.id },
          data: {
            role: UserRole.MANAGER,
            roleSetManually: true,
            roleUpdatedAt: new Date(),
            roleUpdatedBy: adminId,
            roleVersion: { increment: 1 },
          },
        });

        await tx.userRoleAuditLog.create({
          data: {
            userId: managerBeforeUpgrade.id,
            performedBy: adminId,
            action: 'ROLE_CHANGED',
            oldValue: managerBeforeUpgrade.role,
            newValue: UserRole.MANAGER,
            note: `Auto-upgraded to MANAGER: assigned as manager of new user ${dto.email.toLowerCase()}`,
          },
        });

        this.logger.log(
          `Auto-upgraded ${managerBeforeUpgrade.email} from ${managerBeforeUpgrade.role} to MANAGER (assigned as manager of ${dto.email.toLowerCase()})`,
        );
      }

      return created;
    });

    this.logger.log(
      `Local user created: ${dto.email.toLowerCase()} (role: ${dto.role}) by admin ${adminId}`,
    );

    const response: CreateUserResponse = this.mapUserToResponse(
      user as unknown as Record<string, unknown>,
    ) as CreateUserResponse;

    if (managerNeedsUpgrade && managerBeforeUpgrade) {
      response.managerAutoUpgraded = {
        managerId: managerBeforeUpgrade.id,
        managerEmail: managerBeforeUpgrade.email,
        managerName:
          `${managerBeforeUpgrade.firstName || ''} ${managerBeforeUpgrade.lastName || ''}`.trim() ||
          managerBeforeUpgrade.email,
        previousRole: managerBeforeUpgrade.role,
      };
    }

    return response;
  }

  /**
   * 12.3b AC #34: Delete a local user (with subordinate guard)
   */
  async deleteUser(
    userId: string,
    adminId: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        azureId: true,
        email: true,
        managerId: true,
        _count: { select: { directReports: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Cannot delete M365 users
    if (user.azureId) {
      throw new BadRequestException(
        'Cannot delete M365 users. Deactivate them instead, or remove from Azure AD.',
      );
    }

    // Cannot delete self
    if (userId === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.prisma.$transaction(async (tx) => {
      // Audit log
      await tx.userRoleAuditLog.create({
        data: {
          userId,
          performedBy: adminId,
          action: 'USER_DELETED',
          oldValue: user.email.slice(0, 50),
          newValue: 'DELETED',
          note:
            user._count.directReports > 0
              ? `Had ${user._count.directReports} subordinate(s) — their managerId cleared`
              : undefined,
        },
      });

      // onDelete: SetNull in schema handles subordinate managerId clearing
      await tx.user.delete({ where: { id: userId } });

      // Auto-downgrade: if this user's manager is a MANAGER and now has 0
      // remaining subordinates (after this deletion), downgrade to EMPLOYEE.
      if (user.managerId) {
        const mgr = await tx.user.findUnique({
          where: { id: user.managerId },
          select: {
            id: true,
            email: true,
            role: true,
            _count: { select: { directReports: true } },
          },
        });

        if (
          mgr &&
          mgr.role === UserRole.MANAGER &&
          mgr._count.directReports === 0
        ) {
          await tx.user.update({
            where: { id: mgr.id },
            data: {
              role: UserRole.EMPLOYEE,
              roleSetManually: true,
              roleUpdatedAt: new Date(),
              roleUpdatedBy: adminId,
              roleVersion: { increment: 1 },
            },
          });

          await tx.userRoleAuditLog.create({
            data: {
              userId: mgr.id,
              performedBy: adminId,
              action: 'ROLE_CHANGED',
              oldValue: UserRole.MANAGER,
              newValue: UserRole.EMPLOYEE,
              note: `Auto-downgraded: last subordinate ${user.email} was deleted`,
            },
          });

          this.logger.log(
            `Auto-downgraded ${mgr.email} from MANAGER to EMPLOYEE (last subordinate deleted)`,
          );
        }
      }
    });

    this.logger.log(`User ${user.email} deleted by admin ${adminId}`);

    return { message: 'User deleted successfully' };
  }

  // Helper methods

  /**
   * Detect circular manager hierarchy.
   * Walks up the manager chain from `managerId`. If `userId` is encountered
   * in the chain, it means assigning this manager would create a cycle.
   * For createUser, `userId` is null (new user doesn't exist yet, no cycle possible).
   * For future updateManager, `userId` is the user being reassigned.
   * Max depth = 50 to guard against corrupt data causing infinite loops.
   */
  private async detectManagerCycle(
    managerId: string,
    userId: string | null,
  ): Promise<void> {
    const MAX_DEPTH = 50;
    let currentId: string | null = managerId;
    const visited = new Set<string>();

    for (let depth = 0; depth < MAX_DEPTH && currentId; depth++) {
      if (userId && currentId === userId) {
        throw new BadRequestException(
          'Circular manager hierarchy detected. This assignment would create a cycle.',
        );
      }
      if (visited.has(currentId)) {
        // Existing cycle in data — log warning but don't block
        this.logger.warn(
          `Existing circular manager chain detected at user ${currentId}`,
        );
        break;
      }
      visited.add(currentId);

      const user: { managerId: string | null } | null =
        await this.prisma.user.findUnique({
          where: { id: currentId },
          select: { managerId: true },
        });
      currentId = user?.managerId ?? null;
    }
  }

  /**
   * 12.3b: Map raw DB user to API response — strips azureId, computes source field
   */
  private mapUserToResponse(user: Record<string, unknown>): UserListItem {
    const { azureId, _count, manager, ...rest } = user;
    const mgr = manager as {
      firstName?: string;
      lastName?: string;
      email?: string;
    } | null;
    return {
      ...rest,
      source: azureId ? 'M365' : 'LOCAL',
      sourceLabel: azureId ? 'Microsoft 365' : 'Local Account',
      badgeCount: (_count as { badgesReceived?: number })?.badgesReceived ?? 0,
      directReportsCount:
        (_count as { directReports?: number })?.directReports ?? 0,
      managerName: mgr
        ? [mgr.firstName, mgr.lastName].filter(Boolean).join(' ') || null
        : null,
      managerEmail: mgr?.email ?? null,
    } as UserListItem;
  }

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
      // 12.3b additions
      azureId: true,
      lastSyncAt: true,
      managerId: true,
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      failedLoginAttempts: true,
      lockedUntil: true,
      _count: {
        select: {
          badgesReceived: true,
          directReports: true,
        },
      },
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
      case 'department':
        return [{ department: order }];
      case 'status':
        return [{ isActive: order }];
      case 'lastLogin':
        return [{ lastLoginAt: order }];
      case 'createdAt':
        return [{ createdAt: order }];
      case 'source':
        // source is computed from azureId: null = LOCAL, non-null = M365
        return [
          {
            azureId: { sort: order, nulls: order === 'asc' ? 'last' : 'first' },
          },
        ];
      case 'badgeCount':
        return [{ badgesReceived: { _count: order } }];
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
