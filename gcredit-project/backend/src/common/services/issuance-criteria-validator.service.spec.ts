import { BadRequestException } from '@nestjs/common';
import { IssuanceCriteriaValidatorService } from './issuance-criteria-validator.service';
import {
  IssuanceCriteriaType,
  ConditionOperator,
  IssuanceCriteriaDto,
  ISSUANCE_CRITERIA_TEMPLATES,
} from '../../badge-templates/dto/issuance-criteria.dto';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
// Test data intentionally uses partial/invalid objects — safe in test context

describe('IssuanceCriteriaValidatorService', () => {
  let service: IssuanceCriteriaValidatorService;

  beforeEach(() => {
    service = new IssuanceCriteriaValidatorService();
  });

  // ─── Helper builders ───────────────────────────────────────
  const condition = (
    field: string,
    operator: ConditionOperator,
    value: string | number | boolean | string[],
  ) => ({ field, operator, value });

  const criteria = (
    type: IssuanceCriteriaType,
    conditions?: any[],
    logicOperator?: 'all' | 'any',
  ): IssuanceCriteriaDto => ({
    type,
    ...(conditions !== undefined && { conditions }),
    ...(logicOperator !== undefined && { logicOperator }),
  });

  // ═══════════════════════════════════════════════════════════
  //  validate()
  // ═══════════════════════════════════════════════════════════
  describe('validate', () => {
    // ── Basic validation ────────────────────────────────────
    describe('basic input validation', () => {
      it('should throw for null criteria', () => {
        expect(() => service.validate(null as any)).toThrow(
          BadRequestException,
        );
      });

      it('should throw for undefined criteria', () => {
        expect(() => service.validate(undefined as any)).toThrow(
          BadRequestException,
        );
      });

      it('should throw for non-object criteria', () => {
        expect(() => service.validate('not-object' as any)).toThrow(
          BadRequestException,
        );
      });

      it('should throw for invalid type', () => {
        expect(() => service.validate({ type: 'invalid_type' } as any)).toThrow(
          BadRequestException,
        );
        expect(() => service.validate({ type: 'invalid_type' } as any)).toThrow(
          /Invalid issuance criteria type/,
        );
      });
    });

    // ── MANUAL type ─────────────────────────────────────────
    describe('MANUAL type', () => {
      it('should pass without conditions', () => {
        expect(() =>
          service.validate(criteria(IssuanceCriteriaType.MANUAL)),
        ).not.toThrow();
      });

      it('should pass with conditions present (ignored for MANUAL)', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.MANUAL, [
              condition('taskId', ConditionOperator.EQUALS, 'task-1'),
            ]),
          ),
        ).not.toThrow();
      });
    });

    // ── Conditions array validation ─────────────────────────
    describe('conditions array validation', () => {
      it('should throw when non-MANUAL type has no conditions', () => {
        expect(() =>
          service.validate(criteria(IssuanceCriteriaType.AUTO_TASK)),
        ).toThrow(BadRequestException);
        expect(() =>
          service.validate(criteria(IssuanceCriteriaType.AUTO_TASK)),
        ).toThrow(/must have conditions array/);
      });

      it('should throw when conditions is not an array', () => {
        expect(() =>
          service.validate({
            type: IssuanceCriteriaType.AUTO_TASK,
            conditions: 'not-array' as any,
          }),
        ).toThrow(BadRequestException);
      });

      it('should throw when conditions array is empty', () => {
        expect(() =>
          service.validate(criteria(IssuanceCriteriaType.AUTO_TASK, [])),
        ).toThrow(/must have at least one condition/);
      });
    });

    // ── Condition field validation (validateCondition) ──────
    describe('condition field validation', () => {
      it('should throw when condition is not an object', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [null as any]),
          ),
        ).toThrow(/Condition at index 0 must be a valid object/);
      });

      it('should throw when condition.field is missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              { operator: ConditionOperator.EQUALS, value: 'v' },
            ]),
          ),
        ).toThrow(/field.*must be a non-empty string/);
      });

      it('should throw when condition.field is empty string', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              { field: '', operator: ConditionOperator.EQUALS, value: 'v' },
            ]),
          ),
        ).toThrow(/field.*must be a non-empty string/);
      });

      it('should throw for invalid operator', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              { field: 'taskId', operator: 'INVALID' as any, value: 'v' },
            ]),
          ),
        ).toThrow(/Invalid operator/);
      });

      it('should throw when value is undefined', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              {
                field: 'taskId',
                operator: ConditionOperator.EQUALS,
                value: undefined,
              },
            ]),
          ),
        ).toThrow(/value.*is required/);
      });

      it('should throw when value is null', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              {
                field: 'taskId',
                operator: ConditionOperator.EQUALS,
                value: null as any,
              },
            ]),
          ),
        ).toThrow(/value.*is required/);
      });
    });

    // ── Value type validation (validateValueType) ───────────
    describe('value type validation', () => {
      it('should throw when IN operator has non-array value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('field1', ConditionOperator.IN, 'not-array' as any),
                condition('field2', ConditionOperator.EQUALS, 'val'),
              ],
              'all',
            ),
          ),
        ).toThrow(/requires value to be an array/);
      });

      it('should throw when NOT_IN operator has non-array value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('field1', ConditionOperator.NOT_IN, 123 as any),
                condition('field2', ConditionOperator.EQUALS, 'val'),
              ],
              'all',
            ),
          ),
        ).toThrow(/requires value to be an array/);
      });

      it('should throw when IN operator has empty array', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('field1', ConditionOperator.IN, [] as any),
                condition('field2', ConditionOperator.EQUALS, 'val'),
              ],
              'all',
            ),
          ),
        ).toThrow(/requires non-empty array/);
      });

      it('should throw when > operator has non-number value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_TASK,
              [
                condition('taskId', ConditionOperator.EQUALS, 'task-1'),
                condition(
                  'score',
                  ConditionOperator.GREATER_THAN,
                  'not-a-number' as any,
                ),
              ],
              'all',
            ),
          ),
        ).toThrow(/typically requires a number value/);
      });

      it('should throw when >= operator has non-number value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_TASK,
              [
                condition('taskId', ConditionOperator.EQUALS, 'task-1'),
                condition(
                  'count',
                  ConditionOperator.GREATER_THAN_OR_EQUAL,
                  'x' as any,
                ),
              ],
              'all',
            ),
          ),
        ).toThrow(/typically requires a number value/);
      });

      it('should throw when < operator has non-number value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_TASK,
              [
                condition('taskId', ConditionOperator.EQUALS, 'task-1'),
                condition('count', ConditionOperator.LESS_THAN, true as any),
              ],
              'all',
            ),
          ),
        ).toThrow(/typically requires a number value/);
      });

      it('should throw when <= operator has non-number value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_TASK,
              [
                condition('taskId', ConditionOperator.EQUALS, 'task-1'),
                condition(
                  'count',
                  ConditionOperator.LESS_THAN_OR_EQUAL,
                  [] as any,
                ),
              ],
              'all',
            ),
          ),
        ).toThrow(/typically requires a number value/);
      });

      it('should throw when CONTAINS operator has non-string value', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('name', ConditionOperator.CONTAINS, 123 as any),
                condition('field2', ConditionOperator.EQUALS, 'val'),
              ],
              'all',
            ),
          ),
        ).toThrow(/requires string value/);
      });

      it('should accept number value for EQUALS operator', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              condition('taskId', ConditionOperator.EQUALS, 42),
            ]),
          ),
        ).not.toThrow();
      });

      it('should accept boolean value for NOT_EQUALS operator', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              condition('taskId', ConditionOperator.NOT_EQUALS, false),
            ]),
          ),
        ).not.toThrow();
      });
    });

    // ── Logic operator validation ───────────────────────────
    describe('logic operator validation', () => {
      it('should throw when multiple conditions lack logicOperator', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.COMBINED, [
              condition('f1', ConditionOperator.EQUALS, 'a'),
              condition('f2', ConditionOperator.EQUALS, 'b'),
            ]),
          ),
        ).toThrow(/logicOperator/);
      });

      it('should throw when logicOperator is invalid', () => {
        expect(() =>
          service.validate({
            type: IssuanceCriteriaType.COMBINED,
            conditions: [
              condition('f1', ConditionOperator.EQUALS, 'a'),
              condition('f2', ConditionOperator.EQUALS, 'b'),
            ],
            logicOperator: 'xor' as any,
          }),
        ).toThrow(/logicOperator/);
      });

      it('should not require logicOperator for single condition', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              condition('taskId', ConditionOperator.EQUALS, 'task-1'),
            ]),
          ),
        ).not.toThrow();
      });

      it('should accept logicOperator=all for multiple conditions', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('f1', ConditionOperator.EQUALS, 'a'),
                condition('f2', ConditionOperator.EQUALS, 'b'),
              ],
              'all',
            ),
          ),
        ).not.toThrow();
      });

      it('should accept logicOperator=any for multiple conditions', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('f1', ConditionOperator.EQUALS, 'a'),
                condition('f2', ConditionOperator.EQUALS, 'b'),
              ],
              'any',
            ),
          ),
        ).not.toThrow();
      });
    });

    // ── Type-specific rules (validateTypeSpecificRules) ─────
    describe('type-specific rules', () => {
      it('AUTO_TASK: should throw when taskId field missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              condition('status', ConditionOperator.EQUALS, 'done'),
            ]),
          ),
        ).toThrow(/must include a condition for field 'taskId'/);
      });

      it('AUTO_TASK: should pass with taskId field present', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_TASK, [
              condition('taskId', ConditionOperator.EQUALS, 'task-1'),
            ]),
          ),
        ).not.toThrow();
      });

      it('AUTO_LEARNING_TIME: should throw when courseId missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_LEARNING_TIME, [
              condition('hours', ConditionOperator.GREATER_THAN_OR_EQUAL, 10),
            ]),
          ),
        ).toThrow(/must include a condition for field 'courseId'/);
      });

      it('AUTO_LEARNING_TIME: should throw when hours missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_LEARNING_TIME, [
              condition('courseId', ConditionOperator.EQUALS, 'course-1'),
            ]),
          ),
        ).toThrow(/must include a condition for field 'hours'/);
      });

      it('AUTO_LEARNING_TIME: should pass with both courseId and hours', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_LEARNING_TIME,
              [
                condition('courseId', ConditionOperator.EQUALS, 'course-1'),
                condition('hours', ConditionOperator.GREATER_THAN_OR_EQUAL, 10),
              ],
              'all',
            ),
          ),
        ).not.toThrow();
      });

      it('AUTO_EXAM_SCORE: should throw when examId missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_EXAM_SCORE, [
              condition('score', ConditionOperator.GREATER_THAN_OR_EQUAL, 80),
            ]),
          ),
        ).toThrow(/must include a condition for field 'examId'/);
      });

      it('AUTO_EXAM_SCORE: should throw when score missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_EXAM_SCORE, [
              condition('examId', ConditionOperator.EQUALS, 'exam-1'),
            ]),
          ),
        ).toThrow(/must include a condition for field 'score'/);
      });

      it('AUTO_EXAM_SCORE: should pass with examId and score', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_EXAM_SCORE,
              [
                condition('examId', ConditionOperator.EQUALS, 'exam-1'),
                condition('score', ConditionOperator.GREATER_THAN_OR_EQUAL, 80),
              ],
              'all',
            ),
          ),
        ).not.toThrow();
      });

      it('AUTO_SKILL_LEVEL: should throw when skillId missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_SKILL_LEVEL, [
              condition('level', ConditionOperator.IN, ['ADVANCED', 'EXPERT']),
            ]),
          ),
        ).toThrow(/must include a condition for field 'skillId'/);
      });

      it('AUTO_SKILL_LEVEL: should throw when level missing', () => {
        expect(() =>
          service.validate(
            criteria(IssuanceCriteriaType.AUTO_SKILL_LEVEL, [
              condition('skillId', ConditionOperator.EQUALS, 'skill-1'),
            ]),
          ),
        ).toThrow(/must include a condition for field 'level'/);
      });

      it('AUTO_SKILL_LEVEL: should pass with skillId and level', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_SKILL_LEVEL,
              [
                condition('skillId', ConditionOperator.EQUALS, 'skill-1'),
                condition('level', ConditionOperator.IN, [
                  'ADVANCED',
                  'EXPERT',
                ]),
              ],
              'all',
            ),
          ),
        ).not.toThrow();
      });

      it('COMBINED: should accept any fields without restriction', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('anyField', ConditionOperator.EQUALS, 'val'),
                condition('other', ConditionOperator.GREATER_THAN, 5),
              ],
              'all',
            ),
          ),
        ).not.toThrow();
      });
    });

    // ── Happy path complete criteria ────────────────────────
    describe('happy path — full valid criteria', () => {
      it('should accept valid AUTO_TASK with multiple conditions', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.AUTO_TASK,
              [
                condition('taskId', ConditionOperator.EQUALS, 'task-abc'),
                condition('status', ConditionOperator.EQUALS, 'completed'),
              ],
              'all',
            ),
          ),
        ).not.toThrow();
      });

      it('should accept valid COMBINED with logicOperator=any', () => {
        expect(() =>
          service.validate(
            criteria(
              IssuanceCriteriaType.COMBINED,
              [
                condition('courseId', ConditionOperator.EQUALS, 'course-1'),
                condition('hours', ConditionOperator.GREATER_THAN_OR_EQUAL, 20),
                condition(
                  'examScore',
                  ConditionOperator.GREATER_THAN_OR_EQUAL,
                  85,
                ),
              ],
              'any',
            ),
          ),
        ).not.toThrow();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  getTemplates()
  // ═══════════════════════════════════════════════════════════
  describe('getTemplates', () => {
    it('should return non-empty object', () => {
      const result = service.getTemplates();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should return the ISSUANCE_CRITERIA_TEMPLATES constant', () => {
      expect(service.getTemplates()).toBe(ISSUANCE_CRITERIA_TEMPLATES);
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  getTemplate()
  // ═══════════════════════════════════════════════════════════
  describe('getTemplate', () => {
    it('should return manual template', () => {
      const result = service.getTemplate('manual');
      expect(result).toBeDefined();
      expect(result!.type).toBe(IssuanceCriteriaType.MANUAL);
    });

    it('should return task_completion template', () => {
      const result = service.getTemplate('task_completion');
      expect(result).toBeDefined();
      expect(result!.type).toBe(IssuanceCriteriaType.AUTO_TASK);
      expect(result!.conditions).toBeDefined();
    });

    it('should return exam_score template', () => {
      const result = service.getTemplate('exam_score');
      expect(result).toBeDefined();
      expect(result!.type).toBe(IssuanceCriteriaType.AUTO_EXAM_SCORE);
    });

    it('should return null for nonexistent key', () => {
      expect(service.getTemplate('nonexistent')).toBeNull();
    });

    it('should return null for empty string key', () => {
      expect(service.getTemplate('')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  getTemplateKeys()
  // ═══════════════════════════════════════════════════════════
  describe('getTemplateKeys', () => {
    it('should return string array', () => {
      const keys = service.getTemplateKeys();
      expect(Array.isArray(keys)).toBe(true);
      keys.forEach((key) => expect(typeof key).toBe('string'));
    });

    it('should include manual key', () => {
      expect(service.getTemplateKeys()).toContain('manual');
    });

    it('should include all expected template keys', () => {
      const keys = service.getTemplateKeys();
      expect(keys).toContain('manual');
      expect(keys).toContain('task_completion');
      expect(keys).toContain('learning_hours');
      expect(keys).toContain('exam_score');
      expect(keys).toContain('skill_level');
      expect(keys).toContain('combined_criteria');
    });

    it('should match getTemplates keys', () => {
      const keys = service.getTemplateKeys();
      const templateKeys = Object.keys(service.getTemplates());
      expect(keys).toEqual(templateKeys);
    });
  });
});
