import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';
import { RecommendationsService } from '../badge-templates/recommendations.service';

describe('BadgeIssuanceController', () => {
  let controller: BadgeIssuanceController;

  const mockBadgeIssuanceService = {
    issueBadge: jest.fn(),
    bulkIssueBadges: jest.fn(),
    claimBadge: jest.fn(),
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
});
