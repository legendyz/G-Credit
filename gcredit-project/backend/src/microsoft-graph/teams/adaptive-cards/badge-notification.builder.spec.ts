/**
 * Unit tests for BadgeNotificationCardBuilder
 * Story 7.4 - Microsoft Teams Notifications
 */

import {
  BadgeNotificationCardBuilder,
  BadgeNotificationCardData,
} from './badge-notification.builder';

/** Typed Adaptive Card element for test assertions */
interface ACElement {
  type?: string;
  text?: string;
  url?: string;
  size?: string;
  style?: string;
  weight?: string;
  wrap?: boolean;
  maxLines?: number;
  altText?: string;
  title?: string;
  items?: ACElement[];
  columns?: ACElement[];
  facts?: Array<{ title: string; value: string }>;
  [key: string]: unknown;
}

describe('BadgeNotificationCardBuilder - Story 7.4', () => {
  const mockCardData: BadgeNotificationCardData = {
    badgeImageUrl: 'https://storage.azure.com/badges/test-badge.png',
    badgeName: 'Full-Stack Developer Certification',
    issuerName: 'Acme Tech University',
    recipientName: 'John Smith',
    issueDate: 'January 30, 2026',
    badgeId: 'badge-123',
    badgeDescription:
      'This badge recognizes proficiency in full-stack development with React and Node.js.',
    badgeWalletUrl: 'https://g-credit.com/wallet',
    claimUrl: 'https://g-credit.com/claim?token=abc123',
  };

  describe('build', () => {
    it('should generate valid Adaptive Card JSON structure', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      expect(card).toHaveProperty('$schema');
      expect(card).toHaveProperty('type', 'AdaptiveCard');
      expect(card).toHaveProperty('version', '1.4');
      expect(card).toHaveProperty('body');
      expect(card).toHaveProperty('actions');
      expect(Array.isArray(card.body)).toBe(true);
      expect(Array.isArray(card.actions)).toBe(true);
    });

    it('should include badge image with correct URL and style', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const headerContainer = card.body[0] as ACElement;
      const columnSet = headerContainer.items[0];
      const imageColumn = columnSet.columns[0];
      const image = imageColumn.items[0];

      expect(image.type).toBe('Image');
      expect(image.url).toBe(mockCardData.badgeImageUrl);
      expect(image.size).toBe('Large');
      expect(image.style).toBe('Person'); // Circular crop
      expect(image.altText).toContain(mockCardData.badgeName);
    });

    it('should include celebration message and badge name', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const headerContainer = card.body[0] as ACElement;
      const columnSet = headerContainer.items[0];
      const textColumn = columnSet.columns[1];
      const items = textColumn.items;

      // Celebration message
      expect(items[0].text).toContain('🎉');
      expect(items[0].text).toContain('New Badge Earned');

      // Badge name
      expect(items[1].text).toBe(mockCardData.badgeName);
      expect(items[1].weight).toBe('Bolder');
      expect(items[1].size).toBe('ExtraLarge');

      // Issuer attribution
      expect(items[2].text).toContain('Issued by');
      expect(items[2].text).toContain(mockCardData.issuerName);
    });

    it('should include FactSet with recipient, date, and badge ID', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const detailsContainer = card.body[1] as ACElement;
      const factSet = detailsContainer.items[0];

      expect(factSet.type).toBe('FactSet');
      expect(factSet.facts).toHaveLength(3);
      expect(factSet.facts[0]).toEqual({
        title: 'Recipient:',
        value: mockCardData.recipientName,
      });
      expect(factSet.facts[1]).toEqual({
        title: 'Issued On:',
        value: mockCardData.issueDate,
      });
      expect(factSet.facts[2]).toEqual({
        title: 'Badge ID:',
        value: mockCardData.badgeId,
      });
    });

    it('should include badge description with max 3 lines', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const descriptionContainer = card.body[2] as ACElement;
      const textBlock = descriptionContainer.items[0];

      expect(textBlock.type).toBe('TextBlock');
      expect(textBlock.text).toBe(mockCardData.badgeDescription);
      expect(textBlock.wrap).toBe(true);
      expect(textBlock.maxLines).toBe(3);
    });

    it('should include "View Badge" action button', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const viewBadgeAction = card.actions.find((action: ACElement) =>
        action.title.includes('View Badge'),
      ) as ACElement;

      expect(viewBadgeAction).toBeDefined();
      expect(viewBadgeAction.type).toBe('Action.OpenUrl');
      expect(viewBadgeAction.url).toBe(mockCardData.badgeWalletUrl);
      expect(viewBadgeAction.style).toBe('default');
    });

    it('should include "Claim Now" action button when claimUrl provided', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const claimAction = card.actions.find((action: ACElement) =>
        action.title.includes('Claim Now'),
      ) as ACElement;

      expect(claimAction).toBeDefined();
      expect(claimAction.type).toBe('Action.OpenUrl');
      expect(claimAction.url).toBe(mockCardData.claimUrl);
      expect(claimAction.style).toBe('positive');
    });

    it('should omit "Claim Now" button when claimUrl is not provided', () => {
      const dataWithoutClaim: BadgeNotificationCardData = {
        ...mockCardData,
        claimUrl: undefined,
      };

      const card = BadgeNotificationCardBuilder.build(dataWithoutClaim);

      expect(card.actions).toHaveLength(1);
      expect(card.actions[0]).toMatchObject({
        title: '🔍 View Badge',
      });
    });

    it('should handle long badge names with text wrapping', () => {
      const dataWithLongName: BadgeNotificationCardData = {
        ...mockCardData,
        badgeName:
          'Advanced Full-Stack Enterprise JavaScript and TypeScript Developer Certification with Cloud Architecture Specialization',
      };

      const card = BadgeNotificationCardBuilder.build(dataWithLongName);

      const headerContainer = card.body[0] as ACElement;
      const columnSet = headerContainer.items[0];
      const textColumn = columnSet.columns[1];
      const badgeNameText = textColumn.items[1];

      expect(badgeNameText.text).toBe(dataWithLongName.badgeName);
      expect(badgeNameText.wrap).toBe(true);
    });

    it('should handle long descriptions with truncation', () => {
      const dataWithLongDescription: BadgeNotificationCardData = {
        ...mockCardData,
        badgeDescription:
          'This comprehensive badge recognizes exceptional proficiency and mastery in modern full-stack development practices, including but not limited to React, Angular, Vue.js for frontend, Node.js, Express, NestJS for backend, PostgreSQL, MongoDB for databases, Docker, Kubernetes for DevOps, AWS, Azure for cloud platforms, and advanced software engineering principles.',
      };

      const card = BadgeNotificationCardBuilder.build(dataWithLongDescription);

      const descriptionContainer = card.body[2] as ACElement;
      const textBlock = descriptionContainer.items[0];

      expect(textBlock.maxLines).toBe(3); // Will truncate after 3 lines
    });
  });

  describe('validate', () => {
    it('should not throw error for complete data', () => {
      expect(() => {
        BadgeNotificationCardBuilder.validate(mockCardData);
      }).not.toThrow();
    });

    it('should throw error if badgeImageUrl is missing', () => {
      const { badgeImageUrl: _badgeImageUrl, ...incomplete } = mockCardData;

      expect(() => {
        BadgeNotificationCardBuilder.validate(incomplete);
      }).toThrow('Missing required fields');
      expect(() => {
        BadgeNotificationCardBuilder.validate(incomplete);
      }).toThrow('badgeImageUrl');
    });

    it('should throw error if multiple required fields are missing', () => {
      const incomplete: Partial<BadgeNotificationCardData> = {
        badgeImageUrl: mockCardData.badgeImageUrl,
        badgeName: mockCardData.badgeName,
        // Missing: issuerName, recipientName, issueDate, badgeId, badgeDescription, badgeWalletUrl
      };

      expect(() => {
        BadgeNotificationCardBuilder.validate(incomplete);
      }).toThrow('Missing required fields');
    });

    it('should allow missing claimUrl (optional field)', () => {
      const dataWithoutClaim = { ...mockCardData };
      delete dataWithoutClaim.claimUrl;

      expect(() => {
        BadgeNotificationCardBuilder.validate(dataWithoutClaim);
      }).not.toThrow();
    });
  });

  describe('formatDate', () => {
    it('should format date in "Month Day, Year" format', () => {
      const date = new Date('2026-01-30T12:00:00Z');
      const formatted = BadgeNotificationCardBuilder.formatDate(date);

      expect(formatted).toBe('January 30, 2026');
    });

    it('should format different dates correctly', () => {
      const date = new Date('2025-12-25T00:00:00Z');
      const formatted = BadgeNotificationCardBuilder.formatDate(date);

      expect(formatted).toBe('December 25, 2025');
    });

    it('should handle single-digit days', () => {
      const date = new Date('2026-03-05T00:00:00Z');
      const formatted = BadgeNotificationCardBuilder.formatDate(date);

      expect(formatted).toBe('March 5, 2026');
    });
  });

  describe('Adaptive Card schema compliance', () => {
    it('should produce card structure compatible with Adaptive Cards 1.4', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      // Schema validation
      expect(card.$schema).toBe(
        'http://adaptivecards.io/schemas/adaptive-card.json',
      );
      expect(card.version).toBe('1.4');

      // Required top-level properties
      expect(card).toHaveProperty('body');
      expect(card).toHaveProperty('actions');

      // Body should contain Containers
      card.body.forEach((item: ACElement) => {
        expect(item.type).toBe('Container');
        expect(item).toHaveProperty('items');
      });

      // Actions should be valid action types
      card.actions.forEach((action: ACElement) => {
        expect(action.type).toBe('Action.OpenUrl');
        expect(action).toHaveProperty('title');
        expect(action).toHaveProperty('url');
      });
    });

    it('should use valid style values', () => {
      const card = BadgeNotificationCardBuilder.build(mockCardData);

      const headerContainer = card.body[0] as ACElement;
      expect(headerContainer.style).toBe('emphasis'); // Valid style

      const viewBadgeAction = card.actions[0] as ACElement;
      expect(viewBadgeAction.style).toBe('default'); // Valid action style

      if (card.actions.length > 1) {
        const claimAction = card.actions[1] as ACElement;
        expect(claimAction.style).toBe('positive'); // Valid action style
      }
    });
  });
});
