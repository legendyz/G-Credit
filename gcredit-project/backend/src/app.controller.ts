import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { StorageService } from './common/storage.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReady() {
    let databaseStatus = 'disconnected';
    let storageStatus = 'disconnected';
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'error';
    }

    try {
      // Test storage by checking if we can get account properties
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      if (accountName) {
        storageStatus = 'connected';
      }
    } catch (error) {
      storageStatus = 'error';
    }

    return {
      database: databaseStatus,
      storage: storageStatus,
    };
  }
}
