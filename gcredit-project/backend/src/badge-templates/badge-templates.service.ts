import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlobStorageService } from '../common/services/blob-storage.service';
import {
  CreateBadgeTemplateDto,
  UpdateBadgeTemplateDto,
} from './dto/badge-template.dto';
import { BadgeStatus } from '@prisma/client';

@Injectable()
export class BadgeTemplatesService {
  constructor(
    private prisma: PrismaService,
    private blobStorage: BlobStorageService,
  ) {}

  /**
   * Create a new badge template with image upload
   */
  async create(
    createDto: CreateBadgeTemplateDto,
    userId: string,
    imageFile?: Express.Multer.File,
  ) {
    // Verify all skillIds exist
    await this.validateSkillIds(createDto.skillIds);

    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageFile) {
      imageUrl = await this.blobStorage.uploadImage(imageFile, 'templates');
    }

    // Create badge template
    const badgeTemplate = await this.prisma.badgeTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        imageUrl,
        category: createDto.category,
        skillIds: createDto.skillIds,
        issuanceCriteria: createDto.issuanceCriteria,
        validityPeriod: createDto.validityPeriod,
        status: BadgeStatus.DRAFT,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return badgeTemplate;
  }

  /**
   * Get all badge templates with filters
   */
  async findAll(status?: BadgeStatus, category?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.badgeTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single badge template by ID
   */
  async findOne(id: string) {
    const badgeTemplate = await this.prisma.badgeTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!badgeTemplate) {
      throw new NotFoundException(`Badge template with ID ${id} not found`);
    }

    return badgeTemplate;
  }

  /**
   * Update a badge template
   */
  async update(
    id: string,
    updateDto: UpdateBadgeTemplateDto,
    imageFile?: Express.Multer.File,
  ) {
    // Check if template exists
    const existing = await this.prisma.badgeTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Badge template with ID ${id} not found`);
    }

    // Verify skillIds if provided
    if (updateDto.skillIds) {
      await this.validateSkillIds(updateDto.skillIds);
    }

    let imageUrl = existing.imageUrl;

    // Handle image upload
    if (imageFile) {
      // Delete old image if exists
      if (existing.imageUrl) {
        try {
          await this.blobStorage.deleteImage(existing.imageUrl);
        } catch (error) {
          // Log error but don't fail the update
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      imageUrl = await this.blobStorage.uploadImage(imageFile, 'templates');
    }

    // Update template
    const updated = await this.prisma.badgeTemplate.update({
      where: { id },
      data: {
        ...updateDto,
        imageUrl,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a badge template
   */
  async remove(id: string) {
    // Check if template exists
    const template = await this.prisma.badgeTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Badge template with ID ${id} not found`);
    }

    // Delete image if exists
    if (template.imageUrl) {
      try {
        await this.blobStorage.deleteImage(template.imageUrl);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }

    // Delete template
    await this.prisma.badgeTemplate.delete({
      where: { id },
    });

    return { message: 'Badge template deleted successfully', id };
  }

  /**
   * Validate that all skill IDs exist
   */
  private async validateSkillIds(skillIds: string[]): Promise<void> {
    if (!skillIds || skillIds.length === 0) {
      return;
    }

    const skills = await this.prisma.skill.findMany({
      where: {
        id: { in: skillIds },
      },
      select: { id: true },
    });

    if (skills.length !== skillIds.length) {
      const foundIds = skills.map((s) => s.id);
      const missingIds = skillIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Invalid skill IDs: ${missingIds.join(', ')}`,
      );
    }
  }
}
