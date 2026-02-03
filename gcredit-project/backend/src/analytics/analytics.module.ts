import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    // Cache module configuration
    // ⚠️ CRITICAL: cache-manager v3 uses MILLISECONDS, not seconds!
    // 15 minutes = 900000 ms (not 900 seconds)
    CacheModule.register({
      ttl: 900000, // 15 minutes in milliseconds
      max: 100, // Maximum 100 items in cache
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
