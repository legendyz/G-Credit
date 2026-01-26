import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
} from './dto/skill-category.dto';

@Injectable()
export class SkillCategoriesService {
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
   * - Must have a parentId (cannot create top-level categories)
   * - Max 3 levels of nesting
   */
  async create(createDto: CreateSkillCategoryDto) {
    const { parentId, ...data } = createDto;

    // Verify parent exists
    const parent = await this.prisma.skillCategory.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException(`Parent category with ID ${parentId} not found`);
    }

    // Check nesting level (max 3 levels)
    if (parent.level >= 3) {
      throw new BadRequestException(
        'Cannot create subcategory: maximum nesting level (3) reached'
      );
    }

    // Create category
    const category = await this.prisma.skillCategory.create({
      data: {
        ...data,
        parentId,
        level: parent.level + 1,
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
   * - Cannot update system-defined top-level categories
   */
  async update(id: string, updateDto: UpdateSkillCategoryDto) {
    // Check if category exists
    const category = await this.prisma.skillCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Skill category with ID ${id} not found`);
    }

    // Cannot edit system-defined top-level categories
    if (category.isSystemDefined && category.level === 1) {
      throw new ForbiddenException(
        'Cannot edit system-defined top-level categories'
      );
    }

    // Cannot edit if not editable
    if (!category.isEditable) {
      throw new ForbiddenException(
        'This category is marked as non-editable'
      );
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
   * Delete a custom category
   * - Cannot delete system-defined categories
   * - Cannot delete if has children
   * - Cannot delete if has skills (must reassign first)
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

    // Cannot delete system-defined categories
    if (category.isSystemDefined) {
      throw new ForbiddenException(
        'Cannot delete system-defined categories'
      );
    }

    // Cannot delete if has children
    if (category.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete category: it has ${category.children.length} subcategories. Delete them first.`
      );
    }

    // Cannot delete if has skills
    if (category.skills.length > 0) {
      throw new BadRequestException(
        `Cannot delete category: it has ${category.skills.length} skills. Reassign or delete them first.`
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
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
      ],
    });
  }
}
