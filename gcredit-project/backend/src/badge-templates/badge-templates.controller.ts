import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { BadgeTemplatesService } from './badge-templates.service';
import {
  CreateBadgeTemplateDto,
  UpdateBadgeTemplateDto,
  BadgeTemplateResponseDto,
} from './dto/badge-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, BadgeStatus } from '@prisma/client';

@ApiTags('Badge Templates')
@Controller('badge-templates')
export class BadgeTemplatesController {
  constructor(
    private readonly badgeTemplatesService: BadgeTemplatesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all badge templates with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: BadgeStatus })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns badge templates list',
    type: [BadgeTemplateResponseDto],
  })
  async findAll(
    @Query('status') status?: BadgeStatus,
    @Query('category') category?: string,
  ) {
    return this.badgeTemplatesService.findAll(status, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single badge template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns badge template details',
    type: BadgeTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Badge template not found' })
  async findOne(@Param('id') id: string) {
    return this.badgeTemplatesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new badge template with image upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'TypeScript高级认证' },
        description: { type: 'string', example: '完成TypeScript高级课程' },
        category: {
          type: 'string',
          enum: ['achievement', 'skill', 'certification', 'participation'],
        },
        skillIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['uuid-1', 'uuid-2'],
        },
        issuanceCriteria: {
          type: 'object',
          example: { type: 'exam_score', conditions: [] },
        },
        validityPeriod: { type: 'number', example: 365 },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Badge template image (PNG/JPG, max 2MB)',
        },
      },
      required: ['name', 'category', 'skillIds', 'issuanceCriteria'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Badge template created successfully',
    type: BadgeTemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Issuer only' })
  async create(
    @Body() createDto: CreateBadgeTemplateDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.badgeTemplatesService.create(
      createDto,
      req.user.userId,
      image,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a badge template' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        skillIds: { type: 'array', items: { type: 'string' } },
        issuanceCriteria: { type: 'object' },
        validityPeriod: { type: 'number' },
        status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
        image: {
          type: 'string',
          format: 'binary',
          description: 'New badge image (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Badge template updated successfully',
    type: BadgeTemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Badge template not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBadgeTemplateDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.badgeTemplatesService.update(id, updateDto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a badge template' })
  @ApiResponse({ status: 200, description: 'Badge template deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Badge template not found' })
  async remove(@Param('id') id: string) {
    return this.badgeTemplatesService.remove(id);
  }
}
