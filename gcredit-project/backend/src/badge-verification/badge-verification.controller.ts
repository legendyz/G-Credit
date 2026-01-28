import { Controller, Get, Param, NotFoundException, GoneException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BadgeVerificationService } from './badge-verification.service';
import { BadgeStatus } from '@prisma/client';

@ApiTags('Badge Verification (Public)')
@Controller('api/verify')
export class BadgeVerificationController {
  constructor(private readonly verificationService: BadgeVerificationService) {}

  /**
   * Story 6.2: Public badge verification endpoint
   * No authentication required - accessible via QR code or direct URL
   */
  @Get(':verificationId')
  @Public()
  @ApiOperation({ 
    summary: 'Verify badge authenticity (PUBLIC endpoint - no auth required)',
    description: 'Returns badge details for public verification. Accessible via QR code scan or direct URL sharing.'
  })
  @ApiParam({ 
    name: 'verificationId', 
    description: 'Unique verification ID (UUID) from badge',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Badge verified successfully',
    schema: {
      example: {
        id: 'badge-uuid',
        verificationId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'ACTIVE',
        badge: {
          name: 'Excellence Badge',
          description: 'Awarded for outstanding performance',
          imageUrl: 'https://cdn.g-credit.com/badges/badge-123.png',
          criteria: 'Complete advanced project with 95%+ score',
          skills: ['Leadership', 'Problem Solving'],
        },
        recipient: {
          name: 'John Doe',
          email: 'j***@example.com', // Partially masked for privacy
        },
        issuer: {
          name: 'G-Credit Learning & Development',
          logo: 'https://cdn.g-credit.com/logo.png',
          url: 'https://g-credit.com',
        },
        issuedAt: '2026-01-28T10:30:00Z',
        expiresAt: '2027-01-28T10:30:00Z',
        evidenceFiles: [
          {
            filename: 'project-report.pdf',
            blobUrl: 'https://blob.azure.com/...',
          }
        ],
        assertionJson: {
          '@context': 'https://w3id.org/openbadges/v2',
          'type': 'Assertion',
          // ...full Open Badges 2.0 assertion
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Badge not found (invalid verificationId)'
  })
  @ApiResponse({ 
    status: 410, 
    description: 'Badge has been revoked',
    schema: {
      example: {
        statusCode: 410,
        message: 'This badge has been revoked and is no longer valid',
        badge: {
          id: 'badge-uuid',
          status: 'REVOKED',
          revokedAt: '2026-01-20T15:45:00Z',
          revocationReason: 'Credential requirements no longer met'
        }
      }
    }
  })
  async verifyBadge(@Param('verificationId') verificationId: string) {
    const badge = await this.verificationService.verifyBadge(verificationId);

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    if (badge.status === BadgeStatus.REVOKED) {
      throw new GoneException({
        statusCode: 410,
        message: 'This badge has been revoked and is no longer valid',
        badge: {
          id: badge.id,
          status: badge.status,
          revokedAt: badge.revokedAt,
          revocationReason: badge.revocationReason,
          badge: {
            name: badge.badge.name,
            imageUrl: badge.badge.imageUrl,
          }
        }
      });
    }

    return badge;
  }
}
