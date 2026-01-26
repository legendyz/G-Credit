import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all skills with optional category filter
   */
  async findAll(categoryId?: string) {
    const where: Prisma.SkillWhereInput = categoryId
      ? { categoryId }
      : {};

    return this.prisma.skill.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
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
        `Skill "${name}" already exists in this category`
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

    // If updating name, check for duplicates in the same category
    if (updateDto.name && updateDto.name !== skill.name) {
      const existing = await this.prisma.skill.findFirst({
        where: {
          name: updateDto.name,
          categoryId: skill.categoryId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Skill "${updateDto.name}" already exists in this category`
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

    // TODO: In future sprints, check if skill is referenced in badge templates
    // For now, we allow deletion

    await this.prisma.skill.delete({
      where: { id },
    });

    return { message: 'Skill deleted successfully', id };
  }

  /**
   * Search skills by name
   */
  async search(query: string) {
    return this.prisma.skill.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        category: true,
      },
      take: 20, // Limit results
    });
  }
}
