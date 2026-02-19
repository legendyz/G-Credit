/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SkillCategoriesService } from './skill-categories.service';
import { PrismaService } from '../common/prisma.service';
import {
  CreateSkillCategoryDto,
  UpdateSkillCategoryDto,
} from './dto/skill-category.dto';

describe('SkillCategoriesService', () => {
  let service: SkillCategoriesService;
  let prisma: {
    skillCategory: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
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
        count: jest.fn().mockResolvedValue(0),
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

  describe('update', () => {
    it('should update a non-system category successfully', async () => {
      const existingCategory = {
        id: 'cat-1',
        name: 'Old Name',
        level: 1,
        isSystemDefined: false,
        isEditable: true,
      };
      const updatedCategory = {
        ...existingCategory,
        name: 'New Name',
        parent: null,
        children: [],
      };
      const updateDto: UpdateSkillCategoryDto = { name: 'New Name' };

      prisma.skillCategory.findUnique.mockResolvedValue(existingCategory);
      prisma.skillCategory.update.mockResolvedValue(updatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(updatedCategory);
      expect(prisma.skillCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: updateDto,
        include: { parent: true, children: true },
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for system-defined L1 categories', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'sys-1',
        name: 'System',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
      });

      await expect(
        service.update('sys-1', { name: 'Renamed' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for non-editable categories', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'ne-1',
        name: 'Non-Editable',
        level: 2,
        isSystemDefined: false,
        isEditable: false,
      });

      await expect(service.update('ne-1', { name: 'Changed' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an empty, non-system category', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Empty Category',
        isSystemDefined: false,
        children: [],
        skills: [],
      });
      prisma.skillCategory.delete.mockResolvedValue({});

      const result = await service.remove('cat-1');

      expect(result).toEqual({
        message: 'Category deleted successfully',
        id: 'cat-1',
      });
      expect(prisma.skillCategory.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for system-defined categories', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'sys-1',
        name: 'System Cat',
        isSystemDefined: true,
        children: [],
        skills: [],
      });

      await expect(service.remove('sys-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when category has children', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'parent-1',
        name: 'Has Children',
        isSystemDefined: false,
        children: [{ id: 'child-1' }],
        skills: [],
      });

      await expect(service.remove('parent-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when category has skills', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'skilled-1',
        name: 'Has Skills',
        isSystemDefined: false,
        children: [],
        skills: [{ id: 'skill-1' }],
      });

      await expect(service.remove('skilled-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
