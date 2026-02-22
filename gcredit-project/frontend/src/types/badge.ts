export const BadgeStatus = {
  PENDING: 'PENDING',
  CLAIMED: 'CLAIMED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

export type BadgeStatus = (typeof BadgeStatus)[keyof typeof BadgeStatus];

// Story 12.6: Re-export canonical EvidenceItem from evidenceApi to avoid duplication
import type { EvidenceItem } from '../lib/evidenceApi';
export type { EvidenceItem } from '../lib/evidenceApi';

export interface BadgeDetail {
  id: string;
  status: BadgeStatus;
  visibility: 'PUBLIC' | 'PRIVATE';
  issuedAt: string;
  claimedAt: string | null;
  expiresAt: string | null;
  verificationId: string;
  // Story 12.6: Unified evidence list
  evidence?: EvidenceItem[];
  // Story 9.3: Revocation fields (only present when status = REVOKED)
  revokedAt?: string;
  revocationReason?: string;
  revocationNotes?: string;
  isPublicReason?: boolean;
  revokedBy?: {
    name: string;
    role: string;
  };
  template: {
    name: string;
    description: string;
    imageUrl: string | null;
    category: string;
    skillIds: string[];
    issuanceCriteria: Record<string, unknown> | string | null;
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
}

// Sprint 5 Story 6.2 + Sprint 7 Story 9.2: Public verification response type
export interface VerificationResponse {
  id: string;
  verificationId: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING';
  badge: {
    name: string;
    description: string;
    imageUrl: string | null;
    criteria: string;
    category: string;
    skills: Array<{ id: string; name: string }>;
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
    id: string;
    filename: string;
    originalName: string;
    blobUrl: string;
    uploadedAt: string;
    type: 'FILE' | 'URL';
    sourceUrl?: string | null;
    fileSize: number;
    mimeType: string;
  }>;
  assertionJson: Record<string, unknown>; // Open Badges 2.0 JSON-LD
}
