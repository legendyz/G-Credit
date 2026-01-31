/**
 * Badge Notification Adaptive Card Builder
 * 
 * Story 7.4 - Microsoft Teams Notifications
 * Generates Adaptive Cards for badge issuance notifications in Microsoft Teams
 * 
 * Design Spec: docs/sprints/sprint-6/adaptive-card-specs.md
 * Adaptive Cards: https://adaptivecards.io/
 */

export interface BadgeNotificationCardData {
  badgeImageUrl: string;
  badgeName: string;
  issuerName: string;
  recipientName: string;
  issueDate: string; // Pre-formatted date string (e.g., "January 30, 2026")
  badgeId: string;
  badgeDescription: string;
  badgeWalletUrl: string;
  claimUrl?: string; // Optional - only for badges requiring claiming
}

export interface AdaptiveCardJson {
  $schema: string;
  type: string;
  version: string;
  body: unknown[];
  actions: unknown[];
}

export class BadgeNotificationCardBuilder {
  /**
   * Build Adaptive Card JSON for badge notification
   * 
   * @param data - Badge notification data
   * @returns Adaptive Card JSON object (Adaptive Cards 1.4 schema)
   */
  static build(data: BadgeNotificationCardData): AdaptiveCardJson {
    const actions: unknown[] = [
      {
        type: 'Action.OpenUrl',
        title: '🔍 View Badge',
        url: data.badgeWalletUrl,
        style: 'default',
      },
    ];

    // Add "Claim Now" button only if claimUrl is provided
    if (data.claimUrl) {
      actions.push({
        type: 'Action.OpenUrl',
        title: '✨ Claim Now',
        url: data.claimUrl,
        style: 'positive',
      });
    }

    const card: AdaptiveCardJson = {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        // Header section with emphasis style
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'Image',
                      url: data.badgeImageUrl,
                      size: 'Large',
                      style: 'Person', // Circular crop
                      altText: `Badge image for ${data.badgeName}`,
                    },
                  ],
                },
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '🎉 New Badge Earned!',
                      weight: 'Bolder',
                      size: 'Large',
                      color: 'Accent',
                    },
                    {
                      type: 'TextBlock',
                      text: data.badgeName,
                      weight: 'Bolder',
                      size: 'ExtraLarge',
                      wrap: true,
                    },
                    {
                      type: 'TextBlock',
                      text: `Issued by ${data.issuerName}`,
                      size: 'Medium',
                      weight: 'Lighter',
                      spacing: 'None',
                      isSubtle: true,
                    },
                  ],
                },
              ],
            },
          ],
        },

        // Details section (FactSet)
        {
          type: 'Container',
          spacing: 'Medium',
          items: [
            {
              type: 'FactSet',
              facts: [
                {
                  title: 'Recipient:',
                  value: data.recipientName,
                },
                {
                  title: 'Issued On:',
                  value: data.issueDate,
                },
                {
                  title: 'Badge ID:',
                  value: data.badgeId,
                },
              ],
            },
          ],
        },

        // Description section
        {
          type: 'Container',
          spacing: 'Medium',
          items: [
            {
              type: 'TextBlock',
              text: data.badgeDescription,
              wrap: true,
              maxLines: 3,
              size: 'Default',
            },
          ],
        },
      ],
      actions,
    };

    return card;
  }

  /**
   * Validate that required data fields are present
   * 
   * @param data - Badge notification data to validate
   * @throws Error if required fields are missing
   */
  static validate(data: Partial<BadgeNotificationCardData>): void {
    const requiredFields: (keyof BadgeNotificationCardData)[] = [
      'badgeImageUrl',
      'badgeName',
      'issuerName',
      'recipientName',
      'issueDate',
      'badgeId',
      'badgeDescription',
      'badgeWalletUrl',
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields for Adaptive Card: ${missingFields.join(', ')}`,
      );
    }
  }

  /**
   * Format date for Adaptive Card display
   * 
   * @param date - Date object to format
   * @returns Formatted date string (e.g., "January 30, 2026")
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
