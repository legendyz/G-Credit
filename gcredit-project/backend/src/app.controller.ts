import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { StorageService } from './common/storage.service';
import { Public } from './common/decorators/public.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { CurrentUser } from './common/decorators/current-user.decorator';

interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  async getReady() {
    let databaseStatus = 'disconnected';
    let storageStatus = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'error';
    }

    try {
      // Test storage by checking if we can get account properties
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      if (accountName) {
        storageStatus = 'connected';
      }
    } catch {
      storageStatus = 'error';
    }

    return {
      database: databaseStatus,
      storage: storageStatus,
    };
  }

  // RBAC Test Endpoints

  /**
   * Profile endpoint - Accessible by all authenticated users
   */
  @Get('profile')
  @Roles('EMPLOYEE', 'MANAGER', 'ISSUER', 'ADMIN')
  getProfile(@CurrentUser() user: JwtUser) {
    return {
      message: 'Profile access granted',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Admin-only endpoint - Accessible by ADMIN role only
   */
  @Get('admin-only')
  @Roles('ADMIN')
  adminRoute(@CurrentUser() user: JwtUser) {
    return {
      message: 'Admin access granted',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Issuer endpoint - Accessible by ISSUER and ADMIN roles
   */
  @Get('issuer-only')
  @Roles('ISSUER', 'ADMIN')
  issuerRoute(@CurrentUser() user: JwtUser) {
    return {
      message: 'Issuer access granted',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Manager endpoint - Accessible by MANAGER and ADMIN roles
   */
  @Get('manager-only')
  @Roles('MANAGER', 'ADMIN')
  managerRoute(@CurrentUser() user: JwtUser) {
    return {
      message: 'Manager access granted',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
