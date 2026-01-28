export const BadgeStatus = {
  PENDING: 'PENDING',
  CLAIMED: 'CLAIMED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

export type BadgeStatus = typeof BadgeStatus[keyof typeof BadgeStatus];

export interface BadgeDetail {
  id: string;
  status: BadgeStatus;
  issuedAt: string;
  claimedAt: string | null;
  expiresAt: string | null;
  issuerMessage: string | null;
  template: {
    name: string;
    description: string;
    imageUrl: string | null;
    category: string;
    skillIds: string[];
    issuanceCriteria: any;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  issuer: {
    firstName: string;
    lastName: string;
  };
  assertionUrl: string;
}

