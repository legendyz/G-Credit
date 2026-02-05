/**
 * Badge Template Factory (Story 8.8 - AC2)
 * TD-001: Test Data Factory Pattern for isolated test data
 *
 * Creates badge templates with unique identifiers to prevent
 * data collisions in parallel tests.
 */

import { PrismaClient, BadgeTemplate } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export type BadgeTemplateStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface CreateBadgeTemplateOptions {
  name?: string;
  description?: string;
  imageUrl?: string;
  status?: BadgeTemplateStatus;
  category?: string;
  issuanceCriteria?: Record<string, unknown>;
  validityPeriod?: number;
  createdById: string; // Required: creator user ID
  skillIds?: string[]; // Changed from 'skills' to match Prisma schema
}

/**
 * Badge Template Factory for creating test templates
 */
export class BadgeTemplateFactory {
  private prisma: PrismaClient;
  private testPrefix: string;

  constructor(prisma: PrismaClient, testPrefix?: string) {
    this.prisma = prisma;
    this.testPrefix = testPrefix || uuidv4().substring(0, 8);
  }

  /**
   * Creates an active badge template
   */
  async createActive(
    options: CreateBadgeTemplateOptions,
  ): Promise<BadgeTemplate> {
    return this.createTemplate({ status: 'ACTIVE', ...options });
  }

  /**
   * Creates a draft badge template
   */
  async createDraft(
    options: CreateBadgeTemplateOptions,
  ): Promise<BadgeTemplate> {
    return this.createTemplate({ status: 'DRAFT', ...options });
  }

  /**
   * Creates an archived badge template
   */
  async createArchived(
    options: CreateBadgeTemplateOptions,
  ): Promise<BadgeTemplate> {
    return this.createTemplate({ status: 'ARCHIVED', ...options });
  }

  /**
   * Creates a badge template with specified options
   */
  async createTemplate(
    options: CreateBadgeTemplateOptions,
  ): Promise<BadgeTemplate> {
    const uniqueId = uuidv4().substring(0, 8);
    const status = options.status || 'ACTIVE';

    const name = options.name || `Test Badge ${this.testPrefix}-${uniqueId}`;
    const category = options.category || 'achievement';

    return this.prisma.badgeTemplate.create({
      data: {
        name,
        description:
          options.description ||
          `Test badge template for E2E testing (${uniqueId})`,
        imageUrl:
          options.imageUrl || `https://example.com/badges/${uniqueId}.png`,
        status,
        category,
        issuanceCriteria: options.issuanceCriteria || {
          description: 'Complete test requirements',
          requiredActions: ['Test action 1', 'Test action 2'],
        },
        validityPeriod: options.validityPeriod ?? 365,
        createdBy: options.createdById,
        skillIds: options.skillIds || [], // Changed from 'skills' to 'skillIds'
      },
    });
  }

  /**
   * Creates multiple templates at once
   */
  async createMany(
    count: number,
    options: CreateBadgeTemplateOptions,
  ): Promise<BadgeTemplate[]> {
    const templates: BadgeTemplate[] = [];
    for (let i = 0; i < count; i++) {
      templates.push(await this.createTemplate(options));
    }
    return templates;
  }

  /**
   * Creates templates for each category
   */
  async createCategorySet(createdById: string): Promise<BadgeTemplate[]> {
    const categories = [
      'achievement',
      'certification',
      'skill',
      'participation',
      'leadership',
    ];

    const templates: BadgeTemplate[] = [];
    for (const category of categories) {
      templates.push(
        await this.createTemplate({ createdById, category, status: 'ACTIVE' }),
      );
    }
    return templates;
  }
}

export default BadgeTemplateFactory;
