import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { MicrosoftGraphModule } from '../microsoft-graph/microsoft-graph.module';

/**
 * Email Module (TD-014)
 *
 * Imports MicrosoftGraphModule to provide GraphEmailService
 * for the unified EmailService wrapper.
 */
@Module({
  imports: [ConfigModule, MicrosoftGraphModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
