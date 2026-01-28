export const BadgeStatus = {
  PENDING: 'PENDING',
  CLAIMED: 'CLAIMED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

export type BadgeStatus = typeof BadgeStatus[keyof typeof BadgeStatus];
