import { ApiProperty } from '@nestjs/swagger';

export class TopSkillDto {
  @ApiProperty({ example: 'uuid' })
  skillId: string;

  @ApiProperty({ example: 'Python' })
  skillName: string;

  @ApiProperty({ example: 120 })
  badgeCount: number;

  @ApiProperty({ example: 85 })
  employeeCount: number;
}

export class SkillsByCategoryDto {
  @ApiProperty({ example: 180 })
  Technical: number;

  @ApiProperty({ example: 95 })
  'Soft Skills': number;

  @ApiProperty({ example: 60 })
  Leadership: number;

  [key: string]: number;
}

export class SkillsDistributionDto {
  @ApiProperty({ example: 45, description: 'Total unique skills' })
  totalSkills: number;

  @ApiProperty({
    type: [TopSkillDto],
    description: 'Top 20 skills by badge count',
  })
  topSkills: TopSkillDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Skills count by category',
    example: { Technical: 180, 'Soft Skills': 95, Leadership: 60 },
  })
  skillsByCategory: Record<string, number>;
}
