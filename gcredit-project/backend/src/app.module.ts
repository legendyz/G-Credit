import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { StorageModule } from './common/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { SkillCategoriesModule } from './skill-categories/skill-categories.module';
import { SkillsModule } from './skills/skills.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    StorageModule,
    AuthModule,
    SkillCategoriesModule,
    SkillsModule,
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
  ],
})
export class AppModule {}
