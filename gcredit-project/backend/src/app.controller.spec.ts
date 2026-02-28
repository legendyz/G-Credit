import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { StorageService } from './common/storage.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: { user: { count: jest.Mock } };

  beforeEach(async () => {
    prismaService = {
      user: { count: jest.fn() },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: StorageService,
          useValue: {},
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('managerRoute', () => {
    it('should allow EMPLOYEE with directReports (manager)', async () => {
      prismaService.user.count.mockResolvedValue(3);
      const user = { userId: 'mgr-1', email: 'mgr@test.com', role: 'EMPLOYEE' };

      const result = await appController.managerRoute(user);

      expect(result.message).toBe('Manager access granted');
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { managerId: 'mgr-1' },
      });
    });

    it('should throw ForbiddenException for EMPLOYEE without directReports', async () => {
      prismaService.user.count.mockResolvedValue(0);
      const user = { userId: 'emp-1', email: 'emp@test.com', role: 'EMPLOYEE' };

      await expect(appController.managerRoute(user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow ADMIN without directReports check', async () => {
      const user = { userId: 'adm-1', email: 'admin@test.com', role: 'ADMIN' };

      const result = await appController.managerRoute(user);

      expect(result.message).toBe('Manager access granted');
      expect(prismaService.user.count).not.toHaveBeenCalled();
    });
  });
});
