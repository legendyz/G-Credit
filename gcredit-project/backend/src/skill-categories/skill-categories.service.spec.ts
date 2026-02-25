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
    $transaction: jest.Mock;
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
      $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
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
        color: 'blue',
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
        color: 'blue',
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
          color: 'blue', // inherited from parent
        }),
        include: { parent: true },
      });
      // Should NOT call count — color inherited, no round-robin needed
      expect(prisma.skillCategory.count).not.toHaveBeenCalled();
    });

    it('should auto-assign color via round-robin for L1 category without color', async () => {
      prisma.skillCategory.count.mockResolvedValue(3);
      const createDto: CreateSkillCategoryDto = { name: 'New L1' };
      const createdCategory = {
        id: 'new-id',
        name: 'New L1',
        parentId: null,
        level: 1,
        color: 'amber',
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 0,
        parent: null,
      };

      prisma.skillCategory.create.mockResolvedValue(createdCategory);

      await service.create(createDto);

      expect(prisma.skillCategory.count).toHaveBeenCalled();
      expect(prisma.skillCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          color: 'amber', // index 3 in CATEGORY_COLORS
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
        parentId: null,
        level: 1,
        isSystemDefined: false,
        isEditable: true,
        children: [],
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

    it('should allow updating system-defined categories (ADR-012)', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'sys-1',
        name: 'System',
        parentId: null,
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        children: [],
      });
      prisma.skillCategory.update.mockResolvedValue({
        id: 'sys-1',
        name: 'Renamed',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
      });

      const result = await service.update('sys-1', { name: 'Renamed' });
      expect(result.name).toBe('Renamed');
    });

    // D-3: Reparent tests
    describe('reparent (parentId in updateDto)', () => {
      it('should move L2 → L1 (to root) successfully', async () => {
        const category = {
          id: 'child-1',
          name: 'Frontend',
          parentId: 'parent-1',
          level: 2,
          isSystemDefined: false,
          isEditable: true,
          children: [],
        };
        prisma.skillCategory.findUnique.mockResolvedValueOnce(category);
        prisma.skillCategory.count.mockResolvedValue(5); // 5 existing root categories
        prisma.skillCategory.update.mockResolvedValue({
          ...category,
          parentId: null,
          level: 1,
          displayOrder: 5,
          parent: null,
          children: [],
        });

        const result = await service.update('child-1', { parentId: null });

        expect(result.parentId).toBeNull();
        expect(result.level).toBe(1);
        expect(result.displayOrder).toBe(5);
        expect(prisma.$transaction).toHaveBeenCalled();
      });

      it('should move L1 → L2 under another parent successfully', async () => {
        const category = {
          id: 'cat-a',
          name: 'Category A',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
          children: [],
        };
        const targetParent = {
          id: 'cat-b',
          name: 'Category B',
          level: 1,
        };
        prisma.skillCategory.findUnique
          .mockResolvedValueOnce(category) // find the category
          .mockResolvedValueOnce(targetParent); // find the target parent
        prisma.skillCategory.count.mockResolvedValue(2); // 2 existing children
        prisma.skillCategory.update.mockResolvedValue({
          ...category,
          parentId: 'cat-b',
          level: 2,
          displayOrder: 2,
          parent: targetParent,
          children: [],
        });

        const result = await service.update('cat-a', { parentId: 'cat-b' });

        expect(result.parentId).toBe('cat-b');
        expect(result.level).toBe(2);
        expect(prisma.$transaction).toHaveBeenCalled();
      });

      it('should throw BadRequestException when moving to self', async () => {
        const category = {
          id: 'cat-1',
          name: 'Self',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
          children: [],
        };
        prisma.skillCategory.findUnique.mockResolvedValue(category);

        await expect(
          service.update('cat-1', { parentId: 'cat-1' }),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.update('cat-1', { parentId: 'cat-1' }),
        ).rejects.toThrow('Cannot move a category to itself');
      });

      it('should throw BadRequestException when moving to descendant (cycle)', async () => {
        const category = {
          id: 'parent-1',
          name: 'Parent',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
          children: [{ id: 'child-1', children: [{ id: 'grandchild-1' }] }],
        };
        const descendant = {
          id: 'grandchild-1',
          name: 'Grandchild',
          level: 3,
        };
        prisma.skillCategory.findUnique
          .mockResolvedValueOnce(category)
          .mockResolvedValueOnce(descendant); // target parent lookup

        await expect(
          service.update('parent-1', { parentId: 'grandchild-1' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when depth would exceed 3', async () => {
        // A L1 category with L2 children tries to move under a L2 parent
        // Result: category at L3, children at L4 → exceeds max depth 3
        const category = {
          id: 'cat-a',
          name: 'Category A',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
          children: [{ id: 'child-a', children: [] }],
        };
        const targetParent = {
          id: 'cat-b',
          name: 'Category B',
          level: 2,
        };
        prisma.skillCategory.findUnique
          .mockResolvedValueOnce(category)
          .mockResolvedValueOnce(targetParent);

        await expect(
          service.update('cat-a', { parentId: 'cat-b' }),
        ).rejects.toThrow(BadRequestException);
        // Reset mocks for second assertion
        prisma.skillCategory.findUnique
          .mockResolvedValueOnce(category)
          .mockResolvedValueOnce(targetParent);
        await expect(
          service.update('cat-a', { parentId: 'cat-b' }),
        ).rejects.toThrow(/depth/i);
      });

      it('should throw ForbiddenException when moving isSystemDefined category', async () => {
        const sysCategory = {
          id: 'sys-1',
          name: 'System',
          parentId: null,
          level: 1,
          isSystemDefined: true,
          isEditable: true,
          children: [],
        };
        prisma.skillCategory.findUnique.mockResolvedValue(sysCategory);

        await expect(
          service.update('sys-1', { parentId: 'other-id' }),
        ).rejects.toThrow(ForbiddenException);
        await expect(
          service.update('sys-1', { parentId: 'other-id' }),
        ).rejects.toThrow('System-defined categories cannot be moved');
      });

      it('should throw NotFoundException when target parent does not exist', async () => {
        const category = {
          id: 'cat-1',
          name: 'Cat',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
          children: [],
        };
        prisma.skillCategory.findUnique
          .mockResolvedValueOnce(category)
          .mockResolvedValueOnce(null); // target parent not found

        await expect(
          service.update('cat-1', { parentId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should recalculate descendant levels when reparenting', async () => {
        const category = {
          id: 'cat-a',
          name: 'Category A',
          parentId: null,
          level: 1,
          isSystemDefined: false,
          isEditable: true,
          children: [{ id: 'child-a', children: [] }],
        };
        prisma.skillCategory.findUnique
          .mockResolvedValueOnce(category) // find the category
          .mockResolvedValueOnce(null); // not used: parentId is null (root)
        prisma.skillCategory.count.mockResolvedValue(3);
        // Track update calls inside transaction
        const updateCalls: Array<{ where: unknown; data: unknown }> = [];
        prisma.skillCategory.update.mockImplementation(
          (args: { where: unknown; data: unknown }) => {
            updateCalls.push(args);
            return Promise.resolve({
              ...category,
              parentId: null,
              level: 1,
              parent: null,
              children: [],
            });
          },
        );

        // Move to root (parentId: null) — already root but children should still be updated
        // Actually let's test move to a new parent
        const targetParent = { id: 'cat-b', name: 'B', level: 1 };
        prisma.skillCategory.findUnique
          .mockReset()
          .mockResolvedValueOnce(category)
          .mockResolvedValueOnce(targetParent);
        prisma.skillCategory.count.mockResolvedValue(0);

        await service.update('cat-a', { parentId: 'cat-b' });

        // Transaction should have been called
        expect(prisma.$transaction).toHaveBeenCalled();
        // Main update + 1 descendant update = 2 update calls
        expect(updateCalls.length).toBe(2);
        // Descendant should be updated to level 3 (parent at L2, child at L3)
        const descendantUpdate = updateCalls[1];
        expect(descendantUpdate).toEqual(
          expect.objectContaining({
            where: { id: 'child-a' },
            data: { level: 3 },
          }),
        );
      });
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

    it('should allow deleting system-defined categories when empty (ADR-012)', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue({
        id: 'sys-1',
        name: 'System Cat',
        isSystemDefined: true,
        children: [],
        skills: [],
      });
      prisma.skillCategory.delete.mockResolvedValue({});

      const result = await service.remove('sys-1');

      expect(result).toEqual({
        message: 'Category deleted successfully',
        id: 'sys-1',
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
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
