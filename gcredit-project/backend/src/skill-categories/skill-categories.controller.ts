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
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SkillCategoriesService } from './skill-categories.service';
import {
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
  SkillCategoryResponseDto,
} from './dto/skill-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Skill Categories')
@Controller('api/skill-categories')
export class SkillCategoriesController {
  private readonly logger = new Logger(SkillCategoriesController.name);
  constructor(
    private readonly skillCategoriesService: SkillCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all skill categories (tree structure)' })
  @ApiQuery({ name: 'includeSkills', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Returns category tree',
    type: [SkillCategoryResponseDto],
  })
  async findAll(@Query('includeSkills') includeSkills?: string) {
    const include = includeSkills === 'true';
    return this.skillCategoriesService.findAll(include);
  }

  @Get('flat')
  @ApiOperation({ summary: 'Get flat list of all categories (for dropdowns)' })
  @ApiResponse({
    status: 200,
    description: 'Returns flat category list',
    type: [SkillCategoryResponseDto],
  })
  async findAllFlat() {
    return this.skillCategoriesService.findAllFlat();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns category details',
    type: SkillCategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.skillCategoriesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new custom skill category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: SkillCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or max nesting level reached',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Issuer only' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  async create(@Body() createDto: CreateSkillCategoryDto) {
    return this.skillCategoriesService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: SkillCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Cannot edit system-defined categories',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSkillCategoryDto,
  ) {
    return this.skillCategoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Category has children or skills' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Cannot delete system-defined categories or Admin role required',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string) {
    return this.skillCategoriesService.remove(id);
  }
}
