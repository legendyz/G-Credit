/**
 * Test Factories Index (Story 8.8 - AC2)
 * TD-001: Central export for all test factories
 *
 * Usage:
 * ```typescript
 * import { UserFactory, BadgeTemplateFactory, BadgeFactory } from '../factories';
 *
 * const userFactory = new UserFactory(prisma);
 * const admin = await userFactory.createAdmin();
 * ```
 */

export { UserFactory } from './user.factory';
export type { CreateUserOptions } from './user.factory';

export { BadgeTemplateFactory } from './badge-template.factory';
export type {
  CreateBadgeTemplateOptions,
  BadgeTemplateStatus,
} from './badge-template.factory';

export { BadgeFactory } from './badge.factory';
export type { CreateBadgeOptions } from './badge.factory';
