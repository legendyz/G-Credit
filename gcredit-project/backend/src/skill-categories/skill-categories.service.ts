import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

      // Inherit parent color when not explicitly provided
      if (!data.color && parent.color) {
        data.color = parent.color;
      }
    }

    // Auto-assign color for L1 categories (round-robin from palette)
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
   * All categories (including system-defined) can be edited for name/color/etc.
   * ADR-012: isSystemDefined retained as label only, not for access control.
   *
   * When `parentId` is provided, performs a reparent operation:
   * - Validates no self-reference or cycle
   * - Validates resulting depth ≤ 3
   * - isSystemDefined categories cannot be moved (403)
   * - Recalculates level for the category and all descendants
   * - Sets displayOrder to append at end of new parent's children
   */
  async update(id: string, updateDto: UpdateSkillCategoryDto) {
    // Check if category exists (include children for subtree depth calc)
    const category = await this.prisma.skillCategory.findUnique({
      where: { id },
      include: { children: { include: { children: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Skill category with ID ${id} not found`);
    }

    // Separate parentId from other fields — reparent requires special handling
    const { parentId, ...otherFields } = updateDto;

    // Check if this is a reparent operation (parentId explicitly provided and different)
    const isReparent = parentId !== undefined && parentId !== category.parentId;

    if (!isReparent) {
      // Simple update — no reparent logic needed
      const data = parentId !== undefined ? otherFields : updateDto;
      const updated = await this.prisma.skillCategory.update({
        where: { id },
        data,
        include: { parent: true, children: true },
      });
      return updated;
    }

    // --- Reparent operation ---

    // isSystemDefined categories cannot be moved
    if (category.isSystemDefined) {
      throw new ForbiddenException('System-defined categories cannot be moved');
    }

    // Cannot move to self
    if (parentId === id) {
      throw new BadRequestException('Cannot move a category to itself');
    }

    // Determine new level
    let newLevel = 1; // default: root

    if (parentId !== null) {
      // Validate target parent exists
      const targetParent = await this.prisma.skillCategory.findUnique({
        where: { id: parentId },
      });
      if (!targetParent) {
        throw new NotFoundException(
          `Target parent category with ID ${parentId} not found`,
        );
      }

      newLevel = targetParent.level + 1;

      // Cycle detection: target parent must not be a descendant
      const descendantIds = this.getDescendantIds(category);
      if (descendantIds.has(parentId)) {
        throw new BadRequestException(
          'Cannot move a category to one of its own descendants (cycle detected)',
        );
      }
    }

    // Depth validation: new level + max subtree depth must be ≤ 3
    const maxSubtreeDepth = this.getMaxSubtreeDepth(category);
    if (newLevel + maxSubtreeDepth > 3) {
      throw new BadRequestException(
        `Cannot move: resulting depth would exceed maximum (3). Category subtree depth is ${maxSubtreeDepth}, target level is ${newLevel}.`,
      );
    }

    // Calculate displayOrder: append at end of new parent's children
    const siblingsCount = await this.prisma.skillCategory.count({
      where: { parentId: parentId },
    });

    // Build batch updates for level recalculation
    const levelUpdates = this.buildLevelUpdates(category, newLevel);

    // Execute reparent in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update the main category: parentId, level, displayOrder, plus any other fields
      const mainUpdate = await tx.skillCategory.update({
        where: { id },
        data: {
          ...otherFields,
          parentId: parentId,
          level: newLevel,
          displayOrder: siblingsCount,
        },
        include: { parent: true, children: true },
      });

      // Update descendant levels
      for (const update of levelUpdates) {
        await tx.skillCategory.update({
          where: { id: update.id },
          data: { level: update.level },
        });
      }

      return mainUpdate;
    });

    return updated;
  }

  /**
   * Get all descendant IDs of a category (for cycle detection).
   * Works on the already-loaded children tree (up to 2 levels deep from schema include).
   */
  private getDescendantIds(category: {
    children?: Array<{ id: string; children?: Array<{ id: string }> }>;
  }): Set<string> {
    const ids = new Set<string>();
    const walk = (
      children:
        | Array<{ id: string; children?: Array<{ id: string }> }>
        | undefined,
    ) => {
      if (!children) return;
      for (const child of children) {
        ids.add(child.id);
        if (child.children) {
          walk(child.children);
        }
      }
    };
    walk(category.children);
    return ids;
  }

  /**
   * Get the maximum depth of descendants below this category (0 = leaf, 1 = has children, 2 = has grandchildren).
   */
  private getMaxSubtreeDepth(category: {
    children?: Array<{ children?: Array<Record<string, unknown>> }>;
  }): number {
    if (!category.children || category.children.length === 0) return 0;
    let maxDepth = 1;
    for (const child of category.children) {
      if (child.children && child.children.length > 0) {
        maxDepth = 2; // grandchildren exist
      }
    }
    return maxDepth;
  }

  /**
   * Build level update instructions for all descendants when reparenting.
   * Returns array of { id, level } for children/grandchildren.
   */
  private buildLevelUpdates(
    category: {
      children?: Array<{ id: string; children?: Array<{ id: string }> }>;
    },
    newParentLevel: number,
  ): Array<{ id: string; level: number }> {
    const updates: Array<{ id: string; level: number }> = [];
    if (!category.children) return updates;
    for (const child of category.children) {
      updates.push({ id: child.id, level: newParentLevel + 1 });
      if (child.children) {
        for (const grandchild of child.children) {
          updates.push({ id: grandchild.id, level: newParentLevel + 2 });
        }
      }
    }
    return updates;
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
