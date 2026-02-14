import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  IssuanceCriteriaDto,
  IssuanceCriteriaType,
  IssuanceConditionDto,
  ConditionOperator,
  ISSUANCE_CRITERIA_TEMPLATES,
} from '../../badge-templates/dto/issuance-criteria.dto';

/**
 * Service for validating issuance criteria structure and logic
 */
@Injectable()
export class IssuanceCriteriaValidatorService {
  private readonly logger = new Logger(IssuanceCriteriaValidatorService.name);
  /**
   * Validate issuance criteria structure
   * @param criteria - The criteria to validate
   * @throws BadRequestException if validation fails
   */
  validate(criteria: IssuanceCriteriaDto): void {
    if (!criteria || typeof criteria !== 'object') {
      throw new BadRequestException('Issuance criteria must be a valid object');
    }

    // Validate type
    if (!Object.values(IssuanceCriteriaType).includes(criteria.type)) {
      throw new BadRequestException(
        `Invalid issuance criteria type: ${criteria.type}. ` +
          `Allowed types: ${Object.values(IssuanceCriteriaType).join(', ')}`,
      );
    }

    // MANUAL type doesn't require conditions
    if (criteria.type === IssuanceCriteriaType.MANUAL) {
      return;
    }

    // All other types require conditions
    if (!criteria.conditions || !Array.isArray(criteria.conditions)) {
      throw new BadRequestException(
        `Issuance criteria of type '${criteria.type}' must have conditions array`,
      );
    }

    if (criteria.conditions.length === 0) {
      throw new BadRequestException(
        `Issuance criteria of type '${criteria.type}' must have at least one condition`,
      );
    }

    // Validate logic operator if multiple conditions
    if (criteria.conditions.length > 1) {
      if (
        !criteria.logicOperator ||
        !['all', 'any'].includes(criteria.logicOperator)
      ) {
        throw new BadRequestException(
          'Multiple conditions require logicOperator to be either "all" (AND) or "any" (OR)',
        );
      }
    }

    // Validate each condition
    criteria.conditions.forEach((condition, index) => {
      this.validateCondition(condition, index);
    });

    // Type-specific validation
    this.validateTypeSpecificRules(criteria);
  }

  /**
   * Validate a single condition
   */
  private validateCondition(
    condition: IssuanceConditionDto,
    index: number,
  ): void {
    if (!condition || typeof condition !== 'object') {
      throw new BadRequestException(
        `Condition at index ${index} must be a valid object`,
      );
    }

    // Validate field
    if (!condition.field || typeof condition.field !== 'string') {
      throw new BadRequestException(
        `Condition at index ${index}: 'field' must be a non-empty string`,
      );
    }

    // Validate operator
    if (!Object.values(ConditionOperator).includes(condition.operator)) {
      throw new BadRequestException(
        `Condition at index ${index}: Invalid operator '${condition.operator}'. ` +
          `Allowed operators: ${Object.values(ConditionOperator).join(', ')}`,
      );
    }

    // Validate value
    if (condition.value === undefined || condition.value === null) {
      throw new BadRequestException(
        `Condition at index ${index}: 'value' is required`,
      );
    }

    // Validate value type based on operator
    this.validateValueType(condition, index);
  }

  /**
   * Validate value type matches operator requirements
   */
  private validateValueType(
    condition: IssuanceConditionDto,
    index: number,
  ): void {
    const { operator, value } = condition;

    // Array operators require array values
    if ([ConditionOperator.IN, ConditionOperator.NOT_IN].includes(operator)) {
      if (!Array.isArray(value)) {
        throw new BadRequestException(
          `Condition at index ${index}: Operator '${operator}' requires value to be an array`,
        );
      }
      if (value.length === 0) {
        throw new BadRequestException(
          `Condition at index ${index}: Operator '${operator}' requires non-empty array`,
        );
      }
    }

    // Comparison operators should work with numbers
    if (
      [
        ConditionOperator.GREATER_THAN,
        ConditionOperator.GREATER_THAN_OR_EQUAL,
        ConditionOperator.LESS_THAN,
        ConditionOperator.LESS_THAN_OR_EQUAL,
      ].includes(operator)
    ) {
      if (typeof value !== 'number') {
        throw new BadRequestException(
          `Condition at index ${index}: Operator '${operator}' typically requires a number value. ` +
            `Received: ${typeof value}`,
        );
      }
    }

    // CONTAINS operator requires string value
    if (operator === ConditionOperator.CONTAINS) {
      if (typeof value !== 'string') {
        throw new BadRequestException(
          `Condition at index ${index}: Operator 'contains' requires string value`,
        );
      }
    }
  }

  /**
   * Validate type-specific business rules
   */
  private validateTypeSpecificRules(criteria: IssuanceCriteriaDto): void {
    const { type, conditions } = criteria;

    // Skip validation for MANUAL type (no conditions required)
    if (type === IssuanceCriteriaType.MANUAL || !conditions) {
      return;
    }

    switch (type) {
      case IssuanceCriteriaType.AUTO_TASK:
        this.validateFieldExists(conditions, 'taskId', type);
        break;

      case IssuanceCriteriaType.AUTO_LEARNING_TIME:
        this.validateFieldExists(conditions, 'courseId', type);
        this.validateFieldExists(conditions, 'hours', type);
        break;

      case IssuanceCriteriaType.AUTO_EXAM_SCORE:
        this.validateFieldExists(conditions, 'examId', type);
        this.validateFieldExists(conditions, 'score', type);
        break;

      case IssuanceCriteriaType.AUTO_SKILL_LEVEL:
        this.validateFieldExists(conditions, 'skillId', type);
        this.validateFieldExists(conditions, 'level', type);
        break;

      // COMBINED type has no specific field requirements
      case IssuanceCriteriaType.COMBINED:
        break;
    }
  }

  /**
   * Validate that a required field exists in conditions
   */
  private validateFieldExists(
    conditions: IssuanceConditionDto[],
    requiredField: string,
    type: IssuanceCriteriaType,
  ): void {
    const hasField = conditions.some((c) => c.field === requiredField);
    if (!hasField) {
      throw new BadRequestException(
        `Issuance criteria of type '${type}' must include a condition for field '${requiredField}'`,
      );
    }
  }

  /**
   * Get all available templates
   */
  getTemplates(): typeof ISSUANCE_CRITERIA_TEMPLATES {
    return ISSUANCE_CRITERIA_TEMPLATES;
  }

  /**
   * Get a specific template by key
   */
  getTemplate(key: string): IssuanceCriteriaDto | null {
    const template =
      ISSUANCE_CRITERIA_TEMPLATES[
        key as keyof typeof ISSUANCE_CRITERIA_TEMPLATES
      ];
    return template || null;
  }

  /**
   * Get template keys
   */
  getTemplateKeys(): string[] {
    return Object.keys(ISSUANCE_CRITERIA_TEMPLATES);
  }
}
