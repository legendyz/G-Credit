import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../common/prisma.service';

describe('RecommendationsService - Story 4.5', () => {
  let service: RecommendationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    badgeTemplate: {
      findMany: jest.fn(),
    },
  };

  const mockBadge = {
    id: 'badge-123',
    templateId: 'template-1',
    recipientId: 'user-1',
    template: {
      id: 'template-1',
      skillIds: ['skill-1', 'skill-2', 'skill-3'],
      category: 'Technical Skills',
      createdBy: 'issuer-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getSimilarBadges', () => {
    it('should throw NotFoundException if badge not found (AC 5.5)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.getSimilarBadges('invalid-badge', 'user-1', 6),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getSimilarBadges('invalid-badge', 'user-1', 6),
      ).rejects.toThrow('Badge invalid-badge not found');
    });

    it('should exclude user-owned badges (AC 5.2)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([
        { templateId: 'template-owned-1' },
        { templateId: 'template-owned-2' },
      ]);
      mockPrismaService.badgeTemplate.findMany.mockResolvedValue([]);

      await service.getSimilarBadges('badge-123', 'user-1', 6);

      expect(mockPrismaService.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: {
              notIn: ['template-1', 'template-owned-1', 'template-owned-2'],
            },
          }),
        }),
      );
    });

    it('should only consider ACTIVE templates (AC 5.3)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([]);
      mockPrismaService.badgeTemplate.findMany.mockResolvedValue([]);

      await service.getSimilarBadges('badge-123', 'user-1', 6);

      expect(mockPrismaService.badgeTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should return top N badges sorted by score (AC 5.4)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      // Create 10 templates with different similarity scores
      const candidateTemplates = Array.from({ length: 10 }, (_, i) => ({
        id: `template-${i}`,
        name: `Badge ${i}`,
        description: `Description ${i}`,
        imageUrl: `https://example.com/badge-${i}.png`,
        category: i % 2 === 0 ? 'Technical Skills' : 'Other Category', // 5 same category (+15)
        skillIds: i < 3 ? ['skill-1', 'skill-2'] : [], // 3 with matching skills (+40)
        createdBy: i === 0 ? 'issuer-1' : 'other-issuer', // 1 same issuer (+10)
        status: 'ACTIVE',
        validityPeriod: null,
        issuanceCriteria: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { badges: i * 50 }, // Varying popularity
        creator: {
          firstName: 'John',
          lastName: 'Doe',
        },
      }));

      mockPrismaService.badgeTemplate.findMany.mockResolvedValue(
        candidateTemplates,
      );

      const result = await service.getSimilarBadges('badge-123', 'user-1', 6);

      // Should return exactly 6 results
      expect(result).toHaveLength(6);

      // Should be sorted by score descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].similarityScore).toBeGreaterThanOrEqual(
          result[i + 1].similarityScore,
        );
      }

      // Top result should have highest scores (matches skills + category + issuer)
      expect(result[0].id).toBe('template-0');
      // Template-0: 2 skills (+40) + category (+15) + issuer (+10) + popularity (0) = 65
    });

    it('should calculate similarity score correctly (AC 5.1)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const perfectMatch = {
        id: 'template-perfect',
        name: 'Perfect Match',
        description: 'Perfect match badge',
        imageUrl: 'https://example.com/perfect.png',
        category: 'Technical Skills', // +15
        skillIds: ['skill-1', 'skill-2', 'skill-3'], // +60 (3 matches * 20)
        createdBy: 'issuer-1', // +10
        status: 'ACTIVE',
        validityPeriod: null,
        issuanceCriteria: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { badges: 100 }, // +10 (100 / 10)
        creator: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.badgeTemplate.findMany.mockResolvedValue([
        perfectMatch,
      ]);

      const result = await service.getSimilarBadges('badge-123', 'user-1', 6);

      expect(result).toHaveLength(1);
      // Score: 60 (skills) + 15 (category) + 10 (issuer) + 10 (popularity) = 95
      expect(result[0].similarityScore).toBe(95);
    });

    it('should handle no matching skills (AC 5.1)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const noMatchingSkills = {
        id: 'template-no-match',
        name: 'No Match',
        description: 'No matching skills',
        imageUrl: 'https://example.com/no-match.png',
        category: 'Different Category', // 0
        skillIds: ['skill-x', 'skill-y'], // 0 matches
        createdBy: 'other-issuer', // 0
        status: 'ACTIVE',
        validityPeriod: null,
        issuanceCriteria: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { badges: 5 }, // 0 (< 10)
        creator: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      };

      mockPrismaService.badgeTemplate.findMany.mockResolvedValue([
        noMatchingSkills,
      ]);

      const result = await service.getSimilarBadges('badge-123', 'user-1', 6);

      expect(result).toHaveLength(1);
      expect(result[0].similarityScore).toBe(0);
    });

    it('should return empty array if no candidates available (AC 5.4)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([]);
      mockPrismaService.badgeTemplate.findMany.mockResolvedValue([]);

      const result = await service.getSimilarBadges('badge-123', 'user-1', 6);

      expect(result).toEqual([]);
    });

    it('should respect limit parameter (AC 5.5)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const candidateTemplates = Array.from({ length: 20 }, (_, i) => ({
        id: `template-${i}`,
        name: `Badge ${i}`,
        description: null,
        imageUrl: null,
        category: 'Technical Skills',
        skillIds: [],
        createdBy: 'issuer-1',
        status: 'ACTIVE',
        validityPeriod: null,
        issuanceCriteria: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { badges: 0 },
        creator: {
          firstName: 'Test',
          lastName: 'User',
        },
      }));

      mockPrismaService.badgeTemplate.findMany.mockResolvedValue(
        candidateTemplates,
      );

      const result = await service.getSimilarBadges('badge-123', 'user-1', 3);

      expect(result).toHaveLength(3);
    });
  });
});
