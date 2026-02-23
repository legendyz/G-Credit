import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
} from './dto/skill-category.dto';

@Injectable()
export class SkillCategoriesService {
  private readonly logger = new Logger(SkillCategoriesService.name);

  /** Color palette for auto-assigning to new categories */
  private static readonly CATEGORY_COLORS = [
    'slate',
    'blue',
    'emerald',
    'amber',
    'rose',
    'violet',
    'cyan',
    'orange',
    'pink',
    'lime',
  ] as const;

  constructor(private prisma: PrismaService) {}

  /**
   * Get all skill categories (tree structure)
   */
  async findAll(includeSkills: boolean = false) {
    const categories = await this.prisma.skillCategory.findMany({
      where: { level: 1 }, // Only top-level
      include: {
        children: {
          include: {
            children: {
              include: {
                skills: includeSkills,
              },
            },
            skills: includeSkills,
          },
        },
        skills: includeSkills,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories;
  }

  /**
   * Get a single category by ID with full details
   */
  async findOne(id: string) {
    const category = await this.prisma.skillCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            skills: true,
          },
        },
        skills: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Skill category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Create a new custom skill category
   * - parentId optional: omit to create top-level (Level 1) category
   * - Max 3 levels of nesting
   */
  async create(createDto: CreateSkillCategoryDto) {
    const { parentId, ...data } = createDto;

    let level = 1;

    if (parentId) {
      // Verify parent exists
      const parent = await this.prisma.skillCategory.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }

      // Check nesting level (max 3 levels)
      if (parent.level >= 3) {
        throw new BadRequestException(
          'Cannot create subcategory: maximum nesting level (3) reached',
        );
      }

      level = parent.level + 1;
    }

    // Auto-assign color if not provided
    if (!data.color) {
      const existingCount = await this.prisma.skillCategory.count();
      data.color =
        SkillCategoriesService.CATEGORY_COLORS[
          existingCount % SkillCategoriesService.CATEGORY_COLORS.length
        ];
    }

    // Create category
    const category = await this.prisma.skillCategory.create({
      data: {
        ...data,
        parentId: parentId || null,
        level,
        isSystemDefined: false,
        isEditable: true,
      },
      include: {
        parent: true,
      },
    });

    return category;
  }

  /**
   * Update an existing category
   * All categories (including system-defined) can be edited.
   * ADR-012: isSystemDefined retained as label only, not for access control.
   */
  async update(id: string, updateDto: UpdateSkillCategoryDto) {
    // Check if category exists
    const category = await this.prisma.skillCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Skill category with ID ${id} not found`);
    }

    // Update category
    const updated = await this.prisma.skillCategory.update({
      where: { id },
      data: updateDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return updated;
  }

  /**
   * Delete a category (system-defined or user-created)
   * - Cannot delete if has children (must delete/move them first)
   * - Cannot delete if has skills (must reassign first)
   * ADR-012: isSystemDefined retained as label only, not for access control.
   */
  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.skillCategory.findUnique({
      where: { id },
      include: {
        children: true,
        skills: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Skill category with ID ${id} not found`);
    }

    // Cannot delete if has children
    if (category.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete category: it has ${category.children.length} subcategories. Delete them first.`,
      );
    }

    // Cannot delete if has skills
    if (category.skills.length > 0) {
      throw new BadRequestException(
        `Cannot delete category: it has ${category.skills.length} skills. Reassign or delete them first.`,
      );
    }

    // Delete category
    await this.prisma.skillCategory.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully', id };
  }

  /**
   * Get flat list of all categories (for dropdowns)
   */
  async findAllFlat() {
    return this.prisma.skillCategory.findMany({
      orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }],
    });
  }
}
