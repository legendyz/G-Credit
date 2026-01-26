import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Supported issuance criteria types
 */
export enum IssuanceCriteriaType {
  MANUAL = 'manual', // Manual approval by admin
  AUTO_TASK = 'auto_task', // Task completion
  AUTO_LEARNING_TIME = 'auto_learning_time', // Learning hours
  AUTO_EXAM_SCORE = 'auto_exam_score', // Exam score threshold
  AUTO_SKILL_LEVEL = 'auto_skill_level', // Skill level requirement
  COMBINED = 'combined', // Multiple conditions
}

/**
 * Condition operators
 */
export enum ConditionOperator {
  EQUALS = '==',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
}

/**
 * Single condition within issuance criteria
 */
export class IssuanceConditionDto {
  @ApiProperty({
    example: 'taskId',
    description: 'Field name to check (e.g., taskId, score, hours)',
  })
  @IsString()
  field: string;

  @ApiProperty({
    enum: ConditionOperator,
    example: ConditionOperator.EQUALS,
    description: 'Comparison operator',
  })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({
    example: 'task-123',
    description:
      'Value to compare against (can be string, number, boolean, or array)',
  })
  @IsNotEmpty()
  value: string | number | boolean | string[];
}

/**
 * Base issuance criteria structure
 */
export class IssuanceCriteriaDto {
  @ApiProperty({
    enum: IssuanceCriteriaType,
    example: IssuanceCriteriaType.MANUAL,
    description: 'Type of issuance criteria',
  })
  @IsEnum(IssuanceCriteriaType)
  type: IssuanceCriteriaType;

  @ApiPropertyOptional({
    type: [IssuanceConditionDto],
    description:
      'Conditions to meet for badge issuance (required for auto types)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssuanceConditionDto)
  conditions?: IssuanceConditionDto[];

  @ApiPropertyOptional({
    example: 'all',
    description:
      'Logic operator for multiple conditions: all (AND) or any (OR)',
    enum: ['all', 'any'],
  })
  @IsOptional()
  @IsString()
  logicOperator?: 'all' | 'any';

  @ApiPropertyOptional({
    example: 'Complete TypeScript advanced course with 90% score',
    description: 'Human-readable description of the criteria',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Predefined templates for common issuance criteria scenarios
 */
export const ISSUANCE_CRITERIA_TEMPLATES = {
  manual: {
    type: IssuanceCriteriaType.MANUAL,
    description: 'Manual approval by administrator',
  },

  task_completion: {
    type: IssuanceCriteriaType.AUTO_TASK,
    conditions: [
      {
        field: 'taskId',
        operator: ConditionOperator.EQUALS,
        value: 'TASK_ID_PLACEHOLDER',
      },
      {
        field: 'status',
        operator: ConditionOperator.EQUALS,
        value: 'completed',
      },
    ],
    logicOperator: 'all' as const,
    description: 'Complete a specific task',
  },

  learning_hours: {
    type: IssuanceCriteriaType.AUTO_LEARNING_TIME,
    conditions: [
      {
        field: 'courseId',
        operator: ConditionOperator.EQUALS,
        value: 'COURSE_ID_PLACEHOLDER',
      },
      {
        field: 'hours',
        operator: ConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 10,
      },
    ],
    logicOperator: 'all' as const,
    description: 'Complete 10+ hours of learning in a course',
  },

  exam_score: {
    type: IssuanceCriteriaType.AUTO_EXAM_SCORE,
    conditions: [
      {
        field: 'examId',
        operator: ConditionOperator.EQUALS,
        value: 'EXAM_ID_PLACEHOLDER',
      },
      {
        field: 'score',
        operator: ConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 80,
      },
    ],
    logicOperator: 'all' as const,
    description: 'Score 80% or higher on an exam',
  },

  skill_level: {
    type: IssuanceCriteriaType.AUTO_SKILL_LEVEL,
    conditions: [
      {
        field: 'skillId',
        operator: ConditionOperator.EQUALS,
        value: 'SKILL_ID_PLACEHOLDER',
      },
      {
        field: 'level',
        operator: ConditionOperator.IN,
        value: ['ADVANCED', 'EXPERT'],
      },
    ],
    logicOperator: 'all' as const,
    description: 'Achieve Advanced or Expert level in a skill',
  },

  combined_criteria: {
    type: IssuanceCriteriaType.COMBINED,
    conditions: [
      {
        field: 'courseId',
        operator: ConditionOperator.EQUALS,
        value: 'COURSE_ID_PLACEHOLDER',
      },
      {
        field: 'hours',
        operator: ConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 20,
      },
      {
        field: 'examScore',
        operator: ConditionOperator.GREATER_THAN_OR_EQUAL,
        value: 85,
      },
    ],
    logicOperator: 'all' as const,
    description: 'Complete 20+ hours AND score 85%+ on exam',
  },
};
