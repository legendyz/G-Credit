/**
 * Admin Users Controller - Story 8.10
 *
 * Admin-only endpoints for user management:
 * - GET /api/admin/users - List all users with pagination/filtering
 * - GET /api/admin/users/:id - Get single user details
 * - PATCH /api/admin/users/:id/role - Update user role
 * - PATCH /api/admin/users/:id/status - Activate/deactivate user
 *
 * All endpoints require ADMIN role.
 */

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  AdminUsersService,
  UserListResponse,
  UserListItem,
  RoleUpdateResponse,
  StatusUpdateResponse,
  DepartmentUpdateResponse,
} from './admin-users.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDepartmentDto } from './dto/update-user-department.dto';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin/users')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * AC1: List all users with pagination, filtering, and sorting
   * GET /api/admin/users
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all users with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 25, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'roleFilter',
    required: false,
    enum: UserRole,
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'statusFilter',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'email', 'role', 'lastLogin', 'createdAt'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor for pagination (large datasets)',
  })
  @ApiResponse({
    status: 200,
    description: 'User list retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAll(
    @Query() query: AdminUsersQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<UserListResponse> {
    this.logger.log(
      `Admin ${req.user.email} listing users with filters: ${JSON.stringify(query)}`,
    );
    return this.adminUsersService.findAll(query);
  }

  /**
   * Get single user details
   * GET /api/admin/users/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single user details' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ): Promise<UserListItem> {
    this.logger.log(`Admin ${req.user.email} retrieving user ${id}`);
    return this.adminUsersService.findOne(id);
  }

  /**
   * AC2: Update user role with optimistic locking
   * PATCH /api/admin/users/:id/role
   */
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot change own role or invalid role',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Role was modified by another process',
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: RequestWithUser,
  ): Promise<RoleUpdateResponse> {
    this.logger.log(
      `Admin ${req.user.email} updating role for user ${id} to ${dto.role}`,
    );
    return this.adminUsersService.updateRole(id, dto, req.user.userId);
  }

  /**
   * AC3: Activate/deactivate user
   * PATCH /api/admin/users/:id/status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot deactivate own account',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: RequestWithUser,
  ): Promise<StatusUpdateResponse> {
    const action = dto.isActive ? 'activating' : 'deactivating';
    this.logger.log(`Admin ${req.user.email} ${action} user ${id}`);
    return this.adminUsersService.updateStatus(id, dto, req.user.userId);
  }

  /**
   * Update user department
   * PATCH /api/admin/users/:id/department
   */
  @Patch(':id/department')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user department' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'User department updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDepartmentDto,
    @Request() req: RequestWithUser,
  ): Promise<DepartmentUpdateResponse> {
    this.logger.log(
      `Admin ${req.user.email} updating department for user ${id} to "${dto.department}"`,
    );
    return this.adminUsersService.updateDepartment(id, dto, req.user.userId);
  }
}
