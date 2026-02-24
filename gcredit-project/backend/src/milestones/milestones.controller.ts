import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
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
import { MilestonesService } from './milestones.service';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  MilestoneMetric,
  MilestoneScope,
} from './dto/milestone.dto';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Milestones')
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MilestonesController {
  private readonly logger = new Logger(MilestonesController.name);
  constructor(private readonly milestonesService: MilestonesService) {}

  // ========== Admin Endpoints ==========

  @Post('admin/milestones')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create milestone configuration (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Milestone config created successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createMilestone(
    @Body() dto: CreateMilestoneDto,
    @Request() req: RequestWithUser,
  ) {
    // Cross-field validation: category_count + category scope is invalid
    if (
      dto.trigger.metric === MilestoneMetric.CATEGORY_COUNT &&
      dto.trigger.scope === MilestoneScope.CATEGORY
    ) {
      throw new BadRequestException(
        'category_count metric only supports global scope',
      );
    }
    // Require categoryId when scope=category
    if (
      dto.trigger.scope === MilestoneScope.CATEGORY &&
      !dto.trigger.categoryId
    ) {
      throw new BadRequestException(
        'categoryId is required when scope is category',
      );
    }
    return this.milestonesService.createMilestone(dto, req.user.userId);
  }

  @Get('admin/milestones')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all milestone configurations (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Milestone configs retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllMilestones() {
    return this.milestonesService.getAllMilestones();
  }

  @Patch('admin/milestones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update milestone configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Milestone config updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Milestone config not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateMilestone(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    // Cross-field validation parity with create (B1 fix)
    if (dto.trigger) {
      if (
        dto.trigger.metric === MilestoneMetric.CATEGORY_COUNT &&
        dto.trigger.scope === MilestoneScope.CATEGORY
      ) {
        throw new BadRequestException(
          'category_count metric only supports global scope',
        );
      }
      if (
        dto.trigger.scope === MilestoneScope.CATEGORY &&
        !dto.trigger.categoryId
      ) {
        throw new BadRequestException(
          'categoryId is required when scope is category',
        );
      }
    }
    return this.milestonesService.updateMilestone(id, dto);
  }

  @Delete('admin/milestones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Delete milestone (hard delete if no achievements, soft delete otherwise)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Milestone removed (hard delete) or deactivated (soft delete if achievements exist)',
  })
  @ApiResponse({ status: 404, description: 'Milestone config not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteMilestone(@Param('id') id: string) {
    return this.milestonesService.deleteMilestone(id);
  }

  // ========== Employee Endpoints ==========

  @Get('milestones/achievements')
  @ApiOperation({ summary: 'Get my milestone achievements' })
  @ApiResponse({
    status: 200,
    description: 'Milestone achievements retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          milestone: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              icon: { type: 'string' },
            },
          },
          achievedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getMyAchievements(@Request() req: RequestWithUser) {
    return this.milestonesService.getUserAchievements(req.user.userId);
  }
}
