/**
 * Dashboard Module - Story 8.1
 *
 * Provides role-specific dashboard functionality.
 */

import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../common/prisma.module';
import { MilestonesModule } from '../milestones/milestones.module';

@Module({
  imports: [PrismaModule, MilestonesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
