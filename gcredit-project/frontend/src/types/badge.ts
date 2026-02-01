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

// Sprint 5 Story 6.2 + Sprint 7 Story 9.2: Public verification response type
export interface VerificationResponse {
  id: string;
  verificationId: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  badge: {
    name: string;
    description: string;
    imageUrl: string | null;
    criteria: string;
    category: string;
    skills: string[];
  };
  recipient: {
    name: string;
    email: string; // Partially masked
  };
  issuer: {
    name: string;
    email: string;
  };
  issuedAt: string;
  expiresAt: string | null;
  claimedAt: string | null;
  // Story 9.2: Revocation details
  isValid?: boolean;
  revokedAt?: string;
  revocationReason?: string;
  revocationNotes?: string;
  isPublicReason?: boolean;
  revokedBy?: {
    name: string;
    role: string;
  };
  evidenceFiles: Array<{
    filename: string;
    blobUrl: string;
    uploadedAt: string;
  }>;
  assertionJson: any; // Open Badges 2.0 JSON-LD
}

