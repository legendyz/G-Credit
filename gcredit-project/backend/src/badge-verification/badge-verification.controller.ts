import {
  Controller,
  Get,
  Param,
  NotFoundException,
  InternalServerErrorException,
  Res,
  Header,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { BadgeVerificationService } from './badge-verification.service';
import { BadgeStatus } from '@prisma/client';

@ApiTags('Badge Verification (Public)')
@Controller('api/verify')
export class BadgeVerificationController {
  private readonly logger = new Logger(BadgeVerificationController.name);
  constructor(private readonly verificationService: BadgeVerificationService) {}

  /**
   * Story 6.2 & 6.3: Public badge verification endpoint
   * No authentication required - accessible via QR code or direct URL
   * Story 6.3: Enhanced with verification status, caching, CORS
   */
  @Get(':verificationId')
  @Public()
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  @ApiOperation({
    summary: 'Verify badge authenticity (PUBLIC API - third-party integration)',
    description:
      'Returns Open Badges 2.0 compliant JSON-LD assertion with verification status. Supports CORS for cross-origin requests. Used by third-party platforms (HR systems, verification services) to programmatically verify badges.',
  })
  @ApiParam({
    name: 'verificationId',
    description: 'Unique verification ID (UUID) from badge',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description:
      'Badge verified successfully (includes valid, expired, and revoked badges)',
    headers: {
      'Cache-Control': {
        description:
          'Caching policy: public, max-age=3600 for valid badges; no-cache for revoked',
        schema: { type: 'string' },
      },
      'X-Verification-Status': {
        description: 'Verification result: valid, expired, or revoked',
        schema: { type: 'string', enum: ['valid', 'expired', 'revoked'] },
      },
    },
    schema: {
      example: {
        // Open Badges 2.0 assertion
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'https://g-credit.com/api/badges/uuid/assertion',
        badge: 'https://g-credit.com/api/badge-templates/uuid',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'random-salt',
          identity: 'sha256$hash',
        },
        issuedOn: '2026-01-28T10:30:00Z',
        expires: '2027-01-28T10:30:00Z',
        verification: {
          type: 'hosted',
          verificationUrl: 'https://g-credit.com/verify/uuid',
        },
        evidence: ['https://blob.azure.com/evidence.pdf'],

        // Story 6.3: Additional verification metadata
        verificationStatus: 'valid', // or 'expired', 'revoked'
        verifiedAt: '2026-01-28T12:00:00Z',
        revoked: false,
        revokedAt: null,
        revocationReason: null,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Badge not found (invalid verificationId)',
  })
  async verifyBadge(
    @Param('verificationId') verificationId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const badge = await this.verificationService.verifyBadge(verificationId);

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    // Story 6.3: Calculate verification status
    const now = new Date();
    const isExpired = badge.expiresAt && new Date(badge.expiresAt) < now;
    const isRevoked = badge.status === BadgeStatus.REVOKED;
    const isPending = badge.status === BadgeStatus.PENDING;

    let verificationStatus: 'valid' | 'expired' | 'revoked' | 'pending';
    if (isRevoked) {
      verificationStatus = 'revoked';
    } else if (isPending) {
      verificationStatus = 'pending';
    } else if (isExpired) {
      verificationStatus = 'expired';
    } else {
      verificationStatus = 'valid';
    }

    // Story 6.3: Set Cache-Control headers based on status
    if (isRevoked) {
      // Revoked badges should not be cached (always revalidate)
      response.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate',
      );
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
    } else {
      // Valid badges: short cache to respect visibility changes promptly
      response.setHeader('Cache-Control', 'public, max-age=60');
    }

    // Story 6.3: Custom verification status header
    response.setHeader('X-Verification-Status', verificationStatus);

    // Story 6.3: Return Open Badges 2.0 assertion + verification metadata
    if (
      typeof badge.assertionJson !== 'object' ||
      badge.assertionJson === null ||
      Array.isArray(badge.assertionJson)
    ) {
      throw new InternalServerErrorException(
        'Badge assertion data is missing or malformed',
      );
    }
    const assertionData: Record<string, unknown> = badge.assertionJson;

    return {
      // Open Badges 2.0 assertion (from Story 6.1)
      ...assertionData,

      // Story 11.24 AC-M4/M5/L6: Explicit fields for frontend mapping
      expiresAt: badge.expiresAt,
      claimedAt: badge.claimedAt,
      badgeId: badge.id,

      // Story 6.3: Additional verification metadata
      verificationStatus,
      verifiedAt: now.toISOString(),
      revoked: isRevoked,

      // Story 9.2: Revocation details with categorization
      isValid: badge.isValid,
      ...(isRevoked && {
        revokedAt: badge.revokedAt,
        revocationReason: badge.revocationReason,
        revocationNotes: badge.revocationNotes,
        isPublicReason: badge.isPublicReason,
        revokedBy: badge.revokedBy,
      }),

      // Story 6.2: Detailed badge info for web UI
      _meta: {
        badge: badge.badge,
        recipient: badge.recipient,
        issuer: badge.issuer,
        evidenceFiles: badge.evidenceFiles,
        // Story 6.5: Integrity verification status
        ...(badge.integrity && {
          integrity: badge.integrity,
        }),
      },
    };
  }
}
