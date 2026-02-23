import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Get all skills with optional category filter.
   * Includes badgeCount — number of badge templates referencing each skill.
   */
  async findAll(categoryId?: string) {
    const where: Prisma.SkillWhereInput = categoryId ? { categoryId } : {};

    const skills = await this.prisma.skill.findMany({
      where,
      include: {
        category: {
          include: {
            parent: {
              include: { parent: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Compute badge template references for each skill (skillIds is String[])
    const skillIds = skills.map((s) => s.id);
    const templateRefs = await this.computeTemplateRefs(skillIds);

    return skills.map((s) => {
      const ref = templateRefs.get(s.id);
      return {
        ...s,
        badgeCount: ref?.count ?? 0,
        templateNames: ref?.names ?? [],
      };
    });
  }

  /**
   * Find badge templates referencing each skill ID.
   * Returns count and template names per skill.
   */
  private async computeTemplateRefs(
    skillIds: string[],
  ): Promise<Map<string, { count: number; names: string[] }>> {
    if (skillIds.length === 0) return new Map();

    const templates = await this.prisma.badgeTemplate.findMany({
      where: { skillIds: { hasSome: skillIds } },
      select: { skillIds: true, name: true },
    });

    const refs = new Map<string, { count: number; names: string[] }>();
    for (const t of templates) {
      for (const sid of t.skillIds) {
        if (skillIds.includes(sid)) {
          const entry = refs.get(sid) ?? { count: 0, names: [] };
          entry.count += 1;
          entry.names.push(t.name);
          refs.set(sid, entry);
        }
      }
    }
    return refs;
  }

  /**
   * Get a single skill by ID
   */
  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    return skill;
  }

  /**
   * Create a new skill
   */
  async create(createDto: CreateSkillDto) {
    const { categoryId, name, ...data } = createDto;

    // Verify category exists
    const category = await this.prisma.skillCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Check for duplicate skill name in the same category
    const existing = await this.prisma.skill.findFirst({
      where: {
        name,
        categoryId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Skill "${name}" already exists in this category`,
      );
    }

    // Create skill
    const skill = await this.prisma.skill.create({
      data: {
        name,
        ...data,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return skill;
  }

  /**
   * Update an existing skill
   */
  async update(id: string, updateDto: UpdateSkillDto) {
    // Check if skill exists
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    // If reassigning category, verify target category exists
    const targetCategoryId = updateDto.categoryId ?? skill.categoryId;
    if (updateDto.categoryId && updateDto.categoryId !== skill.categoryId) {
      const category = await this.prisma.skillCategory.findUnique({
        where: { id: updateDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateDto.categoryId} not found`,
        );
      }
    }

    // If updating name or category, check for duplicates in the target category
    const nameToCheck = updateDto.name ?? skill.name;
    if (updateDto.name || updateDto.categoryId) {
      const existing = await this.prisma.skill.findFirst({
        where: {
          name: nameToCheck,
          categoryId: targetCategoryId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Skill "${nameToCheck}" already exists in this category`,
        );
      }
    }

    // Update skill
    const updated = await this.prisma.skill.update({
      where: { id },
      data: updateDto,
      include: {
        category: true,
      },
    });

    return updated;
  }

  /**
   * Delete a skill
   */
  async remove(id: string) {
    // Check if skill exists
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    const referencingTemplates = await this.prisma.badgeTemplate.findMany({
      where: {
        skillIds: { has: id },
      },
      select: { id: true, name: true },
    });
    if (referencingTemplates.length > 0) {
      const names = referencingTemplates.map((t) => t.name).join(', ');
      throw new BadRequestException(
        `Cannot delete skill: referenced by ${referencingTemplates.length} badge template(s): ${names}`,
      );
    }

    await this.prisma.skill.delete({
      where: { id },
    });

    return { message: 'Skill deleted successfully', id };
  }

  /**
   * Search skills by name.
   * Includes badgeCount for each result.
   */
  async search(query: string) {
    const skills = await this.prisma.skill.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        category: {
          include: {
            parent: {
              include: { parent: true },
            },
          },
        },
      },
      take: 20, // Limit results
    });

    const skillIds = skills.map((s) => s.id);
    const templateRefs = await this.computeTemplateRefs(skillIds);

    return skills.map((s) => {
      const ref = templateRefs.get(s.id);
      return {
        ...s,
        badgeCount: ref?.count ?? 0,
        templateNames: ref?.names ?? [],
      };
    });
  }
}
