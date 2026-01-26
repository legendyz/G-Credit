import { Module } from '@nestjs/common';
import { SkillCategoriesController } from './skill-categories.controller';
import { SkillCategoriesService } from './skill-categories.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SkillCategoriesController],
  providers: [SkillCategoriesService],
  exports: [SkillCategoriesService],
})
export class SkillCategoriesModule {}
