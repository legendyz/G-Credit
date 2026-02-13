import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';
import { RecommendationsService } from '../badge-templates/recommendations.service';

describe('BadgeIssuanceController', () => {
  let controller: BadgeIssuanceController;

  const mockBadgeIssuanceService = {
    issueBadge: jest.fn(),
    bulkIssueBadges: jest.fn(),
    claimBadge: jest.fn(),
    claimBadgeById: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    revokeBadge: jest.fn(),
    getWalletBadges: jest.fn(),
  };

  const mockRecommendationsService = {
    getSimilarBadges: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeIssuanceController],
      providers: [
        {
          provide: BadgeIssuanceService,
          useValue: mockBadgeIssuanceService,
        },
        {
          provide: RecommendationsService,
          useValue: mockRecommendationsService,
        },
      ],
    }).compile();

    controller = module.get<BadgeIssuanceController>(BadgeIssuanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('claimBadgeByToken()', () => {
    it('should claim badge with valid claimToken', async () => {
      const mockResult = {
        id: 'badge-uuid',
        status: 'CLAIMED',
        claimedAt: new Date().toISOString(),
      };
      mockBadgeIssuanceService.claimBadge.mockResolvedValue(mockResult);

      const result = await controller.claimBadgeByToken({
        claimToken: 'valid-token-123',
      });

      expect(result).toEqual(mockResult);
      expect(mockBadgeIssuanceService.claimBadge).toHaveBeenCalledWith(
        'valid-token-123',
      );
    });

    it('should throw BadRequestException when claimToken is missing', async () => {
      await expect(controller.claimBadgeByToken({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
