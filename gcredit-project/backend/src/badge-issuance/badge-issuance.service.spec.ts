import { Test, TestingModule } from '@nestjs/testing';
import { BadgeIssuanceService } from './badge-issuance.service';

describe('BadgeIssuanceService', () => {
  let service: BadgeIssuanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgeIssuanceService],
    }).compile();

    service = module.get<BadgeIssuanceService>(BadgeIssuanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
