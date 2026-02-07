/**
 * Dashboard Controller - Story 8.1
 *
 * Provides role-specific dashboard endpoints for Employee, Issuer, Manager, and Admin.
 */

import {
  Controller,
  Get,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import {
  EmployeeDashboardDto,
  IssuerDashboardDto,
  ManagerDashboardDto,
  AdminDashboardDto,
} from './dto';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * AC1: Employee Dashboard
   * GET /api/dashboard/employee
   */
  @Get('employee')
  @Roles(UserRole.EMPLOYEE, UserRole.ISSUER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Employee Dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Employee dashboard data retrieved successfully',
    type: EmployeeDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEmployeeDashboard(
    @Request() req: RequestWithUser,
  ): Promise<EmployeeDashboardDto> {
    this.logger.log(`Getting employee dashboard for user ${req.user.userId}`);
    return this.dashboardService.getEmployeeDashboard(req.user.userId);
  }

  /**
   * AC2: Issuer Dashboard
   * GET /api/dashboard/issuer
   */
  @Get('issuer')
  @Roles(UserRole.ISSUER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Issuer Dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Issuer dashboard data retrieved successfully',
    type: IssuerDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Issuer role required' })
  async getIssuerDashboard(
    @Request() req: RequestWithUser,
  ): Promise<IssuerDashboardDto> {
    this.logger.log(`Getting issuer dashboard for user ${req.user.userId}`);
    return this.dashboardService.getIssuerDashboard(req.user.userId);
  }

  /**
   * AC3: Manager Dashboard
   * GET /api/dashboard/manager
   */
  @Get('manager')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Manager Dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Manager dashboard data retrieved successfully',
    type: ManagerDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager role required',
  })
  async getManagerDashboard(
    @Request() req: RequestWithUser,
  ): Promise<ManagerDashboardDto> {
    this.logger.log(`Getting manager dashboard for user ${req.user.userId}`);
    return this.dashboardService.getManagerDashboard(req.user.userId);
  }

  /**
   * AC4: Admin Dashboard
   * GET /api/dashboard/admin
   */
  @Get('admin')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Admin Dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard data retrieved successfully',
    type: AdminDashboardDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAdminDashboard(): Promise<AdminDashboardDto> {
    this.logger.log('Getting admin dashboard');
    return this.dashboardService.getAdminDashboard();
  }
}
