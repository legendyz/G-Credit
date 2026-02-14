import { Test, TestingModule } from '@nestjs/testing';
import { BadgeTemplatesService } from './badge-templates.service';
import { PrismaService } from '../common/prisma.service';
import { BlobStorageService } from '../common/services/blob-storage.service';
import { IssuanceCriteriaValidatorService } from '../common/services/issuance-criteria-validator.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TemplateStatus } from '@prisma/client';

// Mock external dependencies required by BlobStorageService
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: { fromConnectionString: jest.fn() },
}));
jest.mock('sharp', () => jest.fn());
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mock-uuid-v4') }));
jest.mock('../common/utils/magic-byte-validator', () => ({
  validateMagicBytes: jest.fn(),
}));

describe('BadgeTemplatesService', () => {
  let service: BadgeTemplatesService;
  let prisma: {
    badgeTemplate: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    skill: { findMany: jest.Mock };
  };
  let blobStorage: {
    uploadImage: jest.Mock;
    deleteImage: jest.Mock;
    isAvailable: jest.Mock;
  };
  let criteriaValidator: {
    validate: jest.Mock;
    getTemplates: jest.Mock;
    getTemplate: jest.Mock;
    getTemplateKeys: jest.Mock;
  };

  const mockTemplate = {
    id: 'tmpl-1',
    name: 'Test Template',
    description: 'A test template',
    imageUrl: null,
    category: 'technical',
    skillIds: ['skill-1'],
    issuanceCriteria: null,
    validityPeriod: null,
    status: TemplateStatus.DRAFT,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: {
      id: 'user-1',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeTemplatesService,
        {
          provide: PrismaService,
          useValue: {
            badgeTemplate: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            skill: { findMany: jest.fn() },
          },
        },
        {
          provide: BlobStorageService,
          useValue: {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
            isAvailable: jest.fn(),
          },
        },
        {
          provide: IssuanceCriteriaValidatorService,
          useValue: {
            validate: jest.fn(),
            getTemplates: jest.fn(),
            getTemplate: jest.fn(),
            getTemplateKeys: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BadgeTemplatesService>(BadgeTemplatesService);
    prisma = module.get(PrismaService);
    blobStorage = module.get(BlobStorageService);
    criteriaValidator = module.get(IssuanceCriteriaValidatorService);
  });

  // ==================== create ====================
  describe('create', () => {
    const createDto = {
      name: 'New Badge',
      description: 'Test badge template',
      category: 'technical',
      skillIds: ['skill-1'],
      issuanceCriteria: undefined as any,
      validityPeriod: undefined as any,
    };

    it('should create a template without image', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);
      prisma.badgeTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.create(createDto, 'user-1');

      expect(result).toEqual(mockTemplate);
      expect(prisma.badgeTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Badge',
            status: TemplateStatus.DRAFT,
            createdBy: 'user-1',
          }),
        }),
      );
      expect(blobStorage.uploadImage).not.toHaveBeenCalled();
    });

    it('should create a template with image upload', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);
      blobStorage.uploadImage.mockResolvedValue({
        url: 'https://blob.test/img.png',
        metadata: {},
      });
      prisma.badgeTemplate.create.mockResolvedValue({
        ...mockTemplate,
        imageUrl: 'https://blob.test/img.png',
      });

      const file = {
        buffer: Buffer.from('fake'),
        mimetype: 'image/png',
        originalname: 'badge.png',
        size: 1024,
      } as Express.Multer.File;

      const result = await service.create(createDto, 'user-1', file);

      expect(blobStorage.uploadImage).toHaveBeenCalledWith(
        file,
        'templates',
        false,
      );
      expect(result.imageUrl).toBe('https://blob.test/img.png');
    });

    it('should log image optimization suggestions', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);
      blobStorage.uploadImage.mockResolvedValue({
        url: 'https://blob.test/img.png',
        metadata: { suggestions: ['Use 512x512 for optimal display'] },
      });
      prisma.badgeTemplate.create.mockResolvedValue(mockTemplate);

      const file = {
        buffer: Buffer.from('fake'),
        mimetype: 'image/png',
        originalname: 'badge.png',
        size: 1024,
      } as Express.Multer.File;

      await service.create(createDto, 'user-1', file);
      // Just verifying no error; logger.log is private
    });

    it('should validate skillIds during creation', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);
      prisma.badgeTemplate.create.mockResolvedValue(mockTemplate);

      await service.create(createDto, 'user-1');

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['skill-1'] } },
        select: { id: true },
      });
    });

    it('should throw BadRequestException for invalid skillIds', async () => {
      prisma.skill.findMany.mockResolvedValue([]); // No skills found

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate issuanceCriteria when provided', async () => {
      const dtoWithCriteria = {
        ...createDto,
        issuanceCriteria: { type: 'manual', conditions: [] },
      } as any;
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);
      prisma.badgeTemplate.create.mockResolvedValue(mockTemplate);

      await service.create(dtoWithCriteria, 'user-1');

      expect(criteriaValidator.validate).toHaveBeenCalledWith({
        type: 'manual',
        conditions: [],
      });
    });

    it('should propagate criteriaValidator errors', async () => {
      const dtoWithCriteria = {
        ...createDto,
        issuanceCriteria: { type: 'invalid' },
      } as any;
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);
      criteriaValidator.validate.mockImplementation(() => {
        throw new BadRequestException('Invalid criteria type');
      });

      await expect(
        service.create(dtoWithCriteria, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip skillIds validation for empty array', async () => {
      const dtoNoSkills = { ...createDto, skillIds: [] };
      prisma.badgeTemplate.create.mockResolvedValue(mockTemplate);

      await service.create(dtoNoSkills, 'user-1');

      expect(prisma.skill.findMany).not.toHaveBeenCalled();
    });
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    it('should return paginated results with default params', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([mockTemplate]);
      prisma.badgeTemplate.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should apply search filter with OR conditions', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'test' });

      expect(prisma.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should apply category filter', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 10,
        category: 'technical',
      });

      expect(prisma.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'technical' }),
        }),
      );
    });

    it('should apply status filter', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 10,
        status: TemplateStatus.ACTIVE,
      });

      expect(prisma.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TemplateStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should override status with onlyActive=true', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 10, status: TemplateStatus.DRAFT },
        true,
      );

      expect(prisma.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TemplateStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should filter by skillId', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, skillId: 'skill-1' });

      expect(prisma.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skillIds: { has: 'skill-1' },
          }),
        }),
      );
    });

    it('should calculate pagination meta correctly', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue(
        Array(10).fill(mockTemplate),
      );
      prisma.badgeTemplate.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should return empty array with total=0', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should apply sort order', async () => {
      prisma.badgeTemplate.findMany.mockResolvedValue([]);
      prisma.badgeTemplate.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  // ==================== findOne ====================
  describe('findOne', () => {
    it('should return template with skills populated', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        status: TemplateStatus.ACTIVE,
      });
      prisma.skill.findMany.mockResolvedValue([
        {
          id: 'skill-1',
          name: 'TypeScript',
          category: { id: 'cat-1', name: 'Dev', nameEn: 'Dev' },
        },
      ]);

      const result = await service.findOne('tmpl-1');

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('TypeScript');
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for DRAFT template without admin role', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        status: TemplateStatus.DRAFT,
      });

      await expect(
        service.findOne('tmpl-1', 'EMPLOYEE'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN to see DRAFT template', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        status: TemplateStatus.DRAFT,
      });
      prisma.skill.findMany.mockResolvedValue([]);

      const result = await service.findOne('tmpl-1', 'ADMIN');

      expect(result.id).toBe('tmpl-1');
    });

    it('should allow ISSUER to see DRAFT template', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        status: TemplateStatus.DRAFT,
      });
      prisma.skill.findMany.mockResolvedValue([]);

      const result = await service.findOne('tmpl-1', 'ISSUER');

      expect(result.id).toBe('tmpl-1');
    });

    it('should skip skill fetch when skillIds is empty', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        skillIds: [],
        status: TemplateStatus.ACTIVE,
      });

      const result = await service.findOne('tmpl-1');

      expect(prisma.skill.findMany).not.toHaveBeenCalled();
      expect(result.skills).toEqual([]);
    });
  });

  // ==================== findOneRaw ====================
  describe('findOneRaw', () => {
    it('should return raw template with select fields', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue({
        id: 'tmpl-1',
        createdBy: 'user-1',
        status: TemplateStatus.DRAFT,
      });

      const result = await service.findOneRaw('tmpl-1');

      expect(result).toEqual({
        id: 'tmpl-1',
        createdBy: 'user-1',
        status: TemplateStatus.DRAFT,
      });
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOneRaw('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== update ====================
  describe('update', () => {
    const updateDto = {
      name: 'Updated Badge',
    };

    it('should update basic fields', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prisma.badgeTemplate.update.mockResolvedValue({
        ...mockTemplate,
        name: 'Updated Badge',
      });

      const result = await service.update('tmpl-1', updateDto);

      expect(result.name).toBe('Updated Badge');
      expect(prisma.badgeTemplate.update).toHaveBeenCalled();
    });

    it('should upload new image and delete old one', async () => {
      const existingWithImage = {
        ...mockTemplate,
        imageUrl: 'https://blob.test/old.png',
      };
      prisma.badgeTemplate.findUnique.mockResolvedValue(existingWithImage);
      blobStorage.deleteImage.mockResolvedValue(undefined);
      blobStorage.uploadImage.mockResolvedValue({
        url: 'https://blob.test/new.png',
        metadata: {},
      });
      prisma.badgeTemplate.update.mockResolvedValue({
        ...existingWithImage,
        imageUrl: 'https://blob.test/new.png',
      });

      const file = {
        buffer: Buffer.from('newimg'),
        mimetype: 'image/png',
        originalname: 'new.png',
        size: 512,
      } as Express.Multer.File;

      await service.update('tmpl-1', updateDto, file);

      expect(blobStorage.deleteImage).toHaveBeenCalledWith(
        'https://blob.test/old.png',
      );
      expect(blobStorage.uploadImage).toHaveBeenCalledWith(
        file,
        'templates',
        false,
      );
    });

    it('should handle old image deletion failure gracefully', async () => {
      const existingWithImage = {
        ...mockTemplate,
        imageUrl: 'https://blob.test/old.png',
      };
      prisma.badgeTemplate.findUnique.mockResolvedValue(existingWithImage);
      blobStorage.deleteImage.mockRejectedValue(new Error('Delete failed'));
      blobStorage.uploadImage.mockResolvedValue({
        url: 'https://blob.test/new.png',
        metadata: {},
      });
      prisma.badgeTemplate.update.mockResolvedValue({
        ...existingWithImage,
        imageUrl: 'https://blob.test/new.png',
      });

      const file = {
        buffer: Buffer.from('newimg'),
        mimetype: 'image/png',
        originalname: 'new.png',
        size: 512,
      } as Express.Multer.File;

      // Should not throw despite delete failure
      await expect(
        service.update('tmpl-1', updateDto, file),
      ).resolves.toBeDefined();
    });

    it('should validate skillIds on update', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-2' }]);
      prisma.badgeTemplate.update.mockResolvedValue(mockTemplate);

      await service.update('tmpl-1', { skillIds: ['skill-2'] });

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['skill-2'] } },
        select: { id: true },
      });
    });

    it('should validate issuanceCriteria on update', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prisma.badgeTemplate.update.mockResolvedValue(mockTemplate);

      await service.update('tmpl-1', {
        issuanceCriteria: { type: 'manual', conditions: [] },
      } as any);

      expect(criteriaValidator.validate).toHaveBeenCalledWith({
        type: 'manual',
        conditions: [],
      });
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== remove ====================
  describe('remove', () => {
    it('should delete a template without image', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(mockTemplate);
      prisma.badgeTemplate.delete.mockResolvedValue(mockTemplate);

      const result = await service.remove('tmpl-1');

      expect(result.message).toBe('Badge template deleted successfully');
      expect(result.id).toBe('tmpl-1');
      expect(blobStorage.deleteImage).not.toHaveBeenCalled();
    });

    it('should delete template and its image', async () => {
      const withImage = {
        ...mockTemplate,
        imageUrl: 'https://blob.test/img.png',
      };
      prisma.badgeTemplate.findUnique.mockResolvedValue(withImage);
      blobStorage.deleteImage.mockResolvedValue(undefined);
      prisma.badgeTemplate.delete.mockResolvedValue(withImage);

      await service.remove('tmpl-1');

      expect(blobStorage.deleteImage).toHaveBeenCalledWith(
        'https://blob.test/img.png',
      );
    });

    it('should handle image deletion failure gracefully', async () => {
      const withImage = {
        ...mockTemplate,
        imageUrl: 'https://blob.test/img.png',
      };
      prisma.badgeTemplate.findUnique.mockResolvedValue(withImage);
      blobStorage.deleteImage.mockRejectedValue(new Error('Delete failed'));
      prisma.badgeTemplate.delete.mockResolvedValue(withImage);

      // Should not throw
      await expect(service.remove('tmpl-1')).resolves.toBeDefined();
    });

    it('should throw NotFoundException when template not found', async () => {
      prisma.badgeTemplate.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== getCriteriaTemplates ====================
  describe('getCriteriaTemplates', () => {
    it('should delegate to criteriaValidator', () => {
      const mockTemplates = { manual: { type: 'manual' } };
      const mockKeys = ['manual', 'auto_task'];
      criteriaValidator.getTemplates.mockReturnValue(mockTemplates);
      criteriaValidator.getTemplateKeys.mockReturnValue(mockKeys);

      const result = service.getCriteriaTemplates();

      expect(result.templates).toEqual(mockTemplates);
      expect(result.keys).toEqual(mockKeys);
    });
  });

  // ==================== getCriteriaTemplate ====================
  describe('getCriteriaTemplate', () => {
    it('should return template when found', () => {
      const mockCriteria = { type: 'manual', conditions: [] };
      criteriaValidator.getTemplate.mockReturnValue(mockCriteria);

      const result = service.getCriteriaTemplate('manual');

      expect(result).toEqual(mockCriteria);
    });

    it('should throw NotFoundException when template not found', () => {
      criteriaValidator.getTemplate.mockReturnValue(null);

      expect(() => service.getCriteriaTemplate('nonexistent')).toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== validateSkillIds (via create/update) ====================
  describe('validateSkillIds (indirect)', () => {
    it('should pass when all skillIds exist', async () => {
      prisma.skill.findMany.mockResolvedValue([
        { id: 'skill-1' },
        { id: 'skill-2' },
      ]);
      prisma.badgeTemplate.create.mockResolvedValue(mockTemplate);

      await expect(
        service.create(
          {
            name: 'Test',
            description: 'Test',
            category: 'technical',
            skillIds: ['skill-1', 'skill-2'],
            issuanceCriteria: undefined as any,
            validityPeriod: undefined as any,
          },
          'user-1',
        ),
      ).resolves.toBeDefined();
    });

    it('should throw with specific missing IDs', async () => {
      prisma.skill.findMany.mockResolvedValue([{ id: 'skill-1' }]);

      await expect(
        service.create(
          {
            name: 'Test',
            description: 'Test',
            category: 'technical',
            skillIds: ['skill-1', 'skill-missing'],
            issuanceCriteria: undefined as any,
            validityPeriod: undefined as any,
          },
          'user-1',
        ),
      ).rejects.toThrow(/skill-missing/);
    });
  });
});
