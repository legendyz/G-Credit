import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceController } from './badge-issuance.controller';

describe('BadgeIssuanceController', () => {
  let controller: BadgeIssuanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeIssuanceController],
    }).compile();

    controller = module.get<BadgeIssuanceController>(BadgeIssuanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
