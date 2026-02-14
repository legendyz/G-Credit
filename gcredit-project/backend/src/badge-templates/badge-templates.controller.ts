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
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MultipartJsonInterceptor } from '../common/interceptors/multipart-json.interceptor';
import { BadgeTemplatesService } from './badge-templates.service';
import {
  CreateBadgeTemplateDto,
  UpdateBadgeTemplateDto,
  BadgeTemplateResponseDto,
} from './dto/badge-template.dto';
import {
  QueryBadgeTemplatesDto,
  PaginatedBadgeTemplatesResponseDto,
} from './dto/query-badge-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('Badge Templates')
@Controller('api/badge-templates')
export class BadgeTemplatesController {
  private readonly logger = new Logger(BadgeTemplatesController.name);
  constructor(private readonly badgeTemplatesService: BadgeTemplatesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all badge templates with filters and pagination',
    description:
      'Public endpoint for listing badge templates. Returns only ACTIVE templates by default.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated badge templates list',
    type: PaginatedBadgeTemplatesResponseDto,
  })
  async findAll(@Query() query: QueryBadgeTemplatesDto) {
    // Public endpoint: only show ACTIVE templates
    return this.badgeTemplatesService.findAll(query, true);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all badge templates including drafts (Admin/Issuer only)',
    description:
      'Admin endpoint for managing templates. Returns templates in all statuses.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated badge templates list',
    type: PaginatedBadgeTemplatesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Issuer only' })
  async findAllAdmin(@Query() query: QueryBadgeTemplatesDto) {
    // Admin endpoint: show all statuses
    return this.badgeTemplatesService.findAll(query, false);
  }

  @Public()
  @Get('criteria-templates')
  @ApiOperation({
    summary: 'Get issuance criteria templates',
    description:
      'Returns predefined templates for common issuance criteria scenarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all available criteria templates',
  })
  getCriteriaTemplates() {
    return this.badgeTemplatesService.getCriteriaTemplates();
  }

  @Public()
  @Get('criteria-templates/:key')
  @ApiOperation({
    summary: 'Get a specific issuance criteria template by key',
    description: 'Returns a predefined template for the specified key',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the requested criteria template',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  getCriteriaTemplate(@Param('key') key: string) {
    return this.badgeTemplatesService.getCriteriaTemplate(key);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single badge template by ID',
    description:
      'Returns badge template details. Non-ACTIVE templates (DRAFT, ARCHIVED) are only visible to ADMIN/ISSUER.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns badge template details',
    type: BadgeTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Badge template not found' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    // ARCH-P0-002: Pass user role for access control (may be undefined for public access)
    const userRole = req.user?.role;
    return this.badgeTemplatesService.findOne(id, userRole);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException(
              'Only image files (JPG, PNG, GIF, WebP) are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
    MultipartJsonInterceptor,
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new badge template with image upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'TypeScript Advanced Certification' },
        description: {
          type: 'string',
          example: 'Complete the advanced TypeScript course',
        },
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
      required: ['name', 'category'],
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
    @Body() body: CreateBadgeTemplateDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    // JSON fields (skillIds, issuanceCriteria) are automatically parsed by MultipartJsonInterceptor
    const createDto: CreateBadgeTemplateDto = body;

    return this.badgeTemplatesService.create(createDto, req.user.userId, image);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException(
              'Only image files (JPG, PNG, GIF, WebP) are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
    MultipartJsonInterceptor,
  )
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot modify templates created by others',
  })
  @ApiResponse({ status: 404, description: 'Badge template not found' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBadgeTemplateDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Request() req: RequestWithUser,
  ) {
    // ARCH-P1-004: Ownership check - ISSUER can only update own templates
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === UserRole.ISSUER) {
      const template = await this.badgeTemplatesService.findOneRaw(id);
      if (template.createdBy !== userId) {
        throw new ForbiddenException(
          'You can only update your own badge templates',
        );
      }
    }
    // ADMIN can update any template (no ownership check)

    // JSON fields are automatically parsed by MultipartJsonInterceptor
    const updateDto: UpdateBadgeTemplateDto = body;

    return this.badgeTemplatesService.update(id, updateDto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a badge template' })
  @ApiResponse({ status: 200, description: 'Badge template deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot delete templates created by others',
  })
  @ApiResponse({ status: 404, description: 'Badge template not found' })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    // ARCH-P1-004: Ownership check - ISSUER can only delete own templates
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === UserRole.ISSUER) {
      const template = await this.badgeTemplatesService.findOneRaw(id);
      if (template.createdBy !== userId) {
        throw new ForbiddenException(
          'You can only delete your own badge templates',
        );
      }
    }
    // ADMIN can delete any template (no ownership check)

    return this.badgeTemplatesService.remove(id);
  }
}
