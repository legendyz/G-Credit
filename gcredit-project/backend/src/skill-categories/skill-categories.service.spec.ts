/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SkillCategoriesService } from './skill-categories.service';
import { PrismaService } from '../common/prisma.service';
import { CreateSkillCategoryDto } from './dto/skill-category.dto';

describe('SkillCategoriesService', () => {
  let service: SkillCategoriesService;
  let prisma: {
    skillCategory: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      skillCategory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillCategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SkillCategoriesService>(SkillCategoriesService);
  });

  describe('create', () => {
    it('should create a Level 1 category without parentId', async () => {
      const createDto: CreateSkillCategoryDto = { name: 'New Top Category' };
      const createdCategory = {
        id: 'new-id',
        name: 'New Top Category',
        parentId: null,
        level: 1,
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 0,
        parent: null,
      };

      prisma.skillCategory.create.mockResolvedValue(createdCategory);

      const result = await service.create(createDto);

      expect(result).toEqual(createdCategory);
      expect(prisma.skillCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Top Category',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
        }),
        include: { parent: true },
      });
      // Should NOT call findUnique since no parentId
      expect(prisma.skillCategory.findUnique).not.toHaveBeenCalled();
    });

    it('should create a subcategory with valid parentId (level = parent.level + 1)', async () => {
      const parentCategory = {
        id: 'parent-id',
        name: 'Parent',
        level: 1,
        isSystemDefined: false,
      };
      const createDto: CreateSkillCategoryDto = {
        name: 'Child Category',
        parentId: 'parent-id',
      };
      const createdCategory = {
        id: 'child-id',
        name: 'Child Category',
        parentId: 'parent-id',
        level: 2,
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 0,
        parent: parentCategory,
      };

      prisma.skillCategory.findUnique.mockResolvedValue(parentCategory);
      prisma.skillCategory.create.mockResolvedValue(createdCategory);

      const result = await service.create(createDto);

      expect(result).toEqual(createdCategory);
      expect(prisma.skillCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-id' },
      });
      expect(prisma.skillCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Child Category',
          parentId: 'parent-id',
          level: 2,
        }),
        include: { parent: true },
      });
    });

    it('should throw BadRequestException when parent is at level 3', async () => {
      const parentCategory = {
        id: 'parent-id',
        name: 'Level 3 Parent',
        level: 3,
      };

      prisma.skillCategory.findUnique.mockResolvedValue(parentCategory);

      const deepDto: CreateSkillCategoryDto = {
        name: 'Too Deep',
        parentId: 'parent-id',
      };
      await expect(service.create(deepDto)).rejects.toThrow(
        BadRequestException,
      );

      prisma.skillCategory.findUnique.mockResolvedValue(parentCategory);
      await expect(service.create(deepDto)).rejects.toThrow(
        'Cannot create subcategory: maximum nesting level (3) reached',
      );
    });

    it('should throw NotFoundException when parentId does not exist', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(null);

      const orphanDto: CreateSkillCategoryDto = {
        name: 'Orphan',
        parentId: 'non-existent-id',
      };
      await expect(service.create(orphanDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
