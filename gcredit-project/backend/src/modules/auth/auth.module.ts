import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AzureAdConfigService } from './config/azure-ad.config';
import { AzureAdSsoService } from './services/azure-ad-sso.service';
import { PrismaModule } from '../../common/prisma.module';
import type { StringValue } from 'ms';
import { EmailModule } from '../../common/email.module';
import { M365SyncModule } from '../../m365-sync/m365-sync.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    EmailModule,
    M365SyncModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') ||
            '15m') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AzureAdConfigService,
    AzureAdSsoService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
