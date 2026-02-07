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
import { CreateMilestoneDto, UpdateMilestoneDto } from './dto/milestone.dto';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Milestones')
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MilestonesController {
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
    return this.milestonesService.updateMilestone(id, dto);
  }

  @Delete('admin/milestones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete milestone configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Milestone config deleted (soft delete)',
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
