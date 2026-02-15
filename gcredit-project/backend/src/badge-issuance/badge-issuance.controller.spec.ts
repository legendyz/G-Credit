import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';
import { ClaimBadgeDto } from './dto/claim-badge.dto';
import { RecommendationsService } from '../badge-templates/recommendations.service';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

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
      const dto = new ClaimBadgeDto();
      await expect(controller.claimBadgeByToken(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Decorator Metadata Guard Tests ───────────────────────────────
  // These verify that security-critical decorators (@Public, @Roles) stay
  // correctly applied. Catches accidental removal during refactoring.
  // Pure metadata reflection — no DB, no HTTP, runs in milliseconds.

  describe('Decorator metadata guards', () => {
    const proto = BadgeIssuanceController.prototype;

    describe('@Public() decorators', () => {
      it('POST /claim (claimBadgeByToken) should be @Public()', () => {
        const isPublic = Reflect.getMetadata(
          IS_PUBLIC_KEY,
          proto.claimBadgeByToken,
        ) as boolean | undefined;
        expect(isPublic).toBe(true);
      });

      it('POST /:id/claim (claimBadge) should NOT be @Public()', () => {
        const isPublic = Reflect.getMetadata(
          IS_PUBLIC_KEY,
          proto.claimBadge,
        ) as boolean | undefined;
        expect(isPublic).toBeUndefined();
      });

      it('GET /:id/assertion (getAssertion) should be @Public()', () => {
        const isPublic = Reflect.getMetadata(
          IS_PUBLIC_KEY,
          proto.getAssertion,
        ) as boolean | undefined;
        expect(isPublic).toBe(true);
      });

      it('GET /:id/integrity (verifyIntegrity) should be @Public()', () => {
        const isPublic = Reflect.getMetadata(
          IS_PUBLIC_KEY,
          proto.verifyIntegrity,
        ) as boolean | undefined;
        expect(isPublic).toBe(true);
      });

      it('GET /my-badges should NOT be @Public()', () => {
        const isPublic = Reflect.getMetadata(
          IS_PUBLIC_KEY,
          proto.getMyBadges,
        ) as boolean | undefined;
        expect(isPublic).toBeUndefined();
      });

      it('GET /wallet should NOT be @Public()', () => {
        const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, proto.getWallet) as
          | boolean
          | undefined;
        expect(isPublic).toBeUndefined();
      });
    });

    describe('@Roles() decorators', () => {
      it('POST / (issueBadge) should require ADMIN or ISSUER', () => {
        const roles = Reflect.getMetadata(
          ROLES_KEY,
          proto.issueBadge,
        ) as string[];
        expect(roles).toEqual(
          expect.arrayContaining([UserRole.ADMIN, UserRole.ISSUER]),
        );
        expect(roles).toHaveLength(2);
      });

      it('GET /recipients should require ADMIN or ISSUER', () => {
        const roles = Reflect.getMetadata(
          ROLES_KEY,
          proto.getRecipients,
        ) as string[];
        expect(roles).toEqual(
          expect.arrayContaining([UserRole.ADMIN, UserRole.ISSUER]),
        );
        expect(roles).toHaveLength(2);
      });

      it('POST /bulk should require ADMIN or ISSUER', () => {
        const roles = Reflect.getMetadata(
          ROLES_KEY,
          proto.bulkIssueBadges,
        ) as string[];
        expect(roles).toEqual(
          expect.arrayContaining([UserRole.ADMIN, UserRole.ISSUER]),
        );
        expect(roles).toHaveLength(2);
      });

      it('POST /:id/revoke should require ADMIN, ISSUER, or MANAGER', () => {
        const roles = Reflect.getMetadata(
          ROLES_KEY,
          proto.revokeBadge,
        ) as string[];
        expect(roles).toEqual(
          expect.arrayContaining([
            UserRole.ADMIN,
            UserRole.ISSUER,
            UserRole.MANAGER,
          ]),
        );
        expect(roles).toHaveLength(3);
      });

      it('GET /issued should require ADMIN, ISSUER, or MANAGER', () => {
        const roles = Reflect.getMetadata(
          ROLES_KEY,
          proto.getIssuedBadges,
        ) as string[];
        expect(roles).toEqual(
          expect.arrayContaining([
            UserRole.ADMIN,
            UserRole.ISSUER,
            UserRole.MANAGER,
          ]),
        );
        expect(roles).toHaveLength(3);
      });
    });
  });
});
