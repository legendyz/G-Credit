import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { StorageService } from './common/storage.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {},
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
    it('should return manager access granted', () => {
      const user = { userId: 'mgr-1', email: 'mgr@test.com', role: 'EMPLOYEE' };

      const result = appController.managerRoute(user);

      expect(result.message).toBe('Manager access granted');
      expect(result.user.userId).toBe('mgr-1');
    });

    // Guard behavior (ADMIN bypass, isManager check) tested in manager.guard.spec.ts
  });
});
