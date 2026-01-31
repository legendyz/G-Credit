import { Test, TestingModule } from '@nestjs/testing';
import { BadgeSharingController } from './badge-sharing.controller';
import { BadgeSharingService } from './badge-sharing.service';
import { ShareBadgeEmailDto } from './dto/share-badge-email.dto';

describe('BadgeSharingController', () => {
  let controller: BadgeSharingController;
  let service: BadgeSharingService;

  const mockBadgeSharingService = {
    shareBadgeViaEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgeSharingController],
      providers: [
        { provide: BadgeSharingService, useValue: mockBadgeSharingService },
      ],
    }).compile();

    controller = module.get<BadgeSharingController>(BadgeSharingController);
    service = module.get<BadgeSharingService>(BadgeSharingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('shareBadgeViaEmail', () => {
    const shareDto: ShareBadgeEmailDto = {
      badgeId: 'badge-123',
      recipientEmail: 'colleague@example.com',
      personalMessage: 'Check out my achievement!',
    };

    const userId = 'user-123';
    const mockUser = { userId };

    const expectedResponse = {
      success: true,
      message: 'Badge shared successfully via email',
      recipientEmail: 'colleague@example.com',
      badgeId: 'badge-123',
    };

    it('should call service and return success response', async () => {
      mockBadgeSharingService.shareBadgeViaEmail.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.shareBadgeViaEmail(shareDto, mockUser);

      expect(result).toEqual(expectedResponse);
      expect(mockBadgeSharingService.shareBadgeViaEmail).toHaveBeenCalledWith(
        shareDto,
        userId,
      );
      expect(mockBadgeSharingService.shareBadgeViaEmail).toHaveBeenCalledTimes(1);
    });

    it('should pass userId from JWT token', async () => {
      mockBadgeSharingService.shareBadgeViaEmail.mockResolvedValue(
        expectedResponse,
      );

      await controller.shareBadgeViaEmail(shareDto, { userId: 'different-user-id' });

      expect(mockBadgeSharingService.shareBadgeViaEmail).toHaveBeenCalledWith(
        shareDto,
        'different-user-id',
      );
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Service error');
      mockBadgeSharingService.shareBadgeViaEmail.mockRejectedValue(error);

      await expect(
        controller.shareBadgeViaEmail(shareDto, mockUser),
      ).rejects.toThrow('Service error');
    });
  });
});
