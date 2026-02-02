import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { StorageModule } from './common/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkillCategoriesModule } from './skill-categories/skill-categories.module';
import { SkillsModule } from './skills/skills.module';
import { BadgeTemplatesModule } from './badge-templates/badge-templates.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { BadgeIssuanceModule } from './badge-issuance/badge-issuance.module';
import { EvidenceModule } from './evidence/evidence.module';
import { MilestonesModule } from './milestones/milestones.module';
import { BadgeVerificationModule } from './badge-verification/badge-verification.module';
import { MicrosoftGraphModule } from './microsoft-graph/microsoft-graph.module';
import { BadgeSharingModule } from './badge-sharing/badge-sharing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate Limiting (SEC-P1-004, Story 8.6, AC3)
    // v6.5.0 uses array format with milliseconds
    // AC3 specifies: 10 requests per minute globally
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default', // AC3: Global rate limit - 10 req/min
          ttl: config.get<number>('RATE_LIMIT_TTL', 60000), // 1 minute in ms
          limit: config.get<number>('RATE_LIMIT_MAX', 10), // AC3: 10 requests per minute
        },
        {
          name: 'medium', // Medium-term rate limit
          ttl: 600000, // 10 minutes in ms
          limit: 50, // 50 requests per 10 minutes
        },
        {
          name: 'long', // Long-term rate limit (prevents sustained abuse)
          ttl: 3600000, // 1 hour in ms
          limit: 200, // 200 requests per hour
        },
      ],
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    SkillCategoriesModule,
    SkillsModule,
    BadgeTemplatesModule,
    BadgeIssuanceModule,
    EvidenceModule,
    MilestonesModule,
    BadgeVerificationModule,
    MicrosoftGraphModule,
    BadgeSharingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply JWT validation to all routes by default
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Apply role-based access control
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally (Story 8.6)
    },
  ],
})
export class AppModule {}
