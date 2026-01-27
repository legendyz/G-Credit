import { Injectable, NotFoundException, BadRequestException, GoneException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { BadgeNotificationService } from './services/badge-notification.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';
import { QueryBadgeDto } from './dto/query-badge.dto';
import { BadgeStatus, UserRole } from '@prisma/client';

@Injectable()
export class BadgeIssuanceService {
  private readonly logger = new Logger(BadgeIssuanceService.name);

  constructor(
    private prisma: PrismaService,
    private assertionGenerator: AssertionGeneratorService,
    private notificationService: BadgeNotificationService,
  ) {}

  /**
   * Issue a single badge
   */
  async issueBadge(dto: IssueBadgeDto, issuerId: string) {
    // 1. Validate template exists and is ACTIVE
    const template = await this.prisma.badgeTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Badge template ${dto.templateId} not found`);
    }

    if (template.status !== 'ACTIVE') {
      throw new BadRequestException(`Badge template ${template.name} is not active`);
    }

    // 2. Validate recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient ${dto.recipientId} not found`);
    }

    // 3. Get issuer info
    const issuer = await this.prisma.user.findUnique({
      where: { id: issuerId },
    });

    // 4. Calculate expiration date
    const issuedAt = new Date();
    const expiresAt = dto.expiresIn
      ? new Date(issuedAt.getTime() + dto.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    // 5. Generate claim token
    const claimToken = this.assertionGenerator.generateClaimToken();

    // 6. Generate Open Badges 2.0 assertion (with temp ID)
    const assertion = this.assertionGenerator.generateAssertion({
      badgeId: 'temp-id',
      template,
      recipient,
      issuer: issuer!,
      issuedAt,
      expiresAt: expiresAt || undefined,
      evidenceUrl: dto.evidenceUrl,
    });

    // 7. Hash recipient email
    const recipientHash = this.assertionGenerator.hashEmail(recipient.email);

    // 8. Create badge in database
    const badge = await this.prisma.badge.create({
      data: {
        templateId: dto.templateId,
        recipientId: dto.recipientId,
        issuerId,
        evidenceUrl: dto.evidenceUrl,
        issuedAt,
        expiresAt,
        status: BadgeStatus.PENDING,
        claimToken,
        recipientHash,
        // IMPORTANT: Convert to plain object (Lesson 13 - Prisma JSON type conversion)
        assertionJson: JSON.parse(JSON.stringify(assertion)),
      },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });

    // 9. Update assertion with actual badge ID
    const finalAssertion = {
      ...assertion,
      id: this.assertionGenerator.getAssertionUrl(badge.id),
      badge: {
        ...assertion.badge,
        id: `${this.assertionGenerator['baseUrl']}/api/badge-templates/${template.id}`,
      },
      verification: {
        type: 'hosted',
        url: this.assertionGenerator.getAssertionUrl(badge.id),
      },
    };

    await this.prisma.badge.update({
      where: { id: badge.id },
      data: {
        assertionJson: JSON.parse(JSON.stringify(finalAssertion)),
      },
    });

    // 10. Send email notification to recipient
    await this.notificationService.sendBadgeClaimNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.firstName && recipient.lastName
        ? `${recipient.firstName} ${recipient.lastName}`
        : recipient.email,
      badgeName: template.name,
      badgeDescription: template.description || 'No description available',
      badgeImageUrl: template.imageUrl || '',
      claimUrl: this.assertionGenerator.getClaimUrl(badge.claimToken!),
    });

    // 11. Return badge response
    return {
      id: badge.id,
      status: badge.status,
      issuedAt: badge.issuedAt,
      expiresAt: badge.expiresAt,
      claimToken: badge.claimToken,
      claimUrl: this.assertionGenerator.getClaimUrl(badge.claimToken!),
      assertionUrl: this.assertionGenerator.getAssertionUrl(badge.id),
      template: {
        id: badge.template.id,
        name: badge.template.name,
        imageUrl: badge.template.imageUrl,
      },
      recipient: {
        id: badge.recipient.id,
        name: badge.recipient.firstName && badge.recipient.lastName 
          ? `${badge.recipient.firstName} ${badge.recipient.lastName}` 
          : badge.recipient.email,
        email: badge.recipient.email,
      },
    };
  }

  /**
   * Claim a badge using claim token
   */
  async claimBadge(claimToken: string) {
    // 1. Find badge by claim token
    const badge = await this.prisma.badge.findUnique({
      where: { claimToken },
      include: {
        template: true,
        recipient: true,
      },
    });

    if (!badge) {
      throw new NotFoundException('Invalid claim token');
    }

    // 2. Check if already claimed
    if (badge.status === BadgeStatus.CLAIMED) {
      throw new BadRequestException('Badge has already been claimed');
    }

    // 3. Check if revoked
    if (badge.status === BadgeStatus.REVOKED) {
      throw new GoneException('Badge has been revoked');
    }

    // 4. Check if badge has expiration and is expired
    if (badge.expiresAt && badge.expiresAt < new Date()) {
      // Update status to EXPIRED
      await this.prisma.badge.update({
        where: { id: badge.id },
        data: { status: BadgeStatus.EXPIRED },
      });
      throw new GoneException('Badge has expired');
    }

    // 5. Check if claim token expired (7 days from issuance)
    const tokenExpirationDate = new Date(badge.issuedAt);
    tokenExpirationDate.setDate(tokenExpirationDate.getDate() + 7);
    if (tokenExpirationDate < new Date()) {
      throw new GoneException('Claim token has expired. Tokens must be claimed within 7 days of issuance.');
    }

    // 6. Claim the badge
    const claimedBadge = await this.prisma.badge.update({
      where: { id: badge.id },
      data: {
        status: BadgeStatus.CLAIMED,
        claimedAt: new Date(),
        claimToken: null, // Clear token (one-time use)
      },
      include: {
        template: true,
        recipient: true,
      },
    });

    // 7. Return badge details
    return {
      id: claimedBadge.id,
      status: claimedBadge.status,
      claimedAt: claimedBadge.claimedAt,
      badge: {
        name: claimedBadge.template.name,
        description: claimedBadge.template.description,
        imageUrl: claimedBadge.template.imageUrl,
      },
      assertionUrl: this.assertionGenerator.getAssertionUrl(claimedBadge.id),
      message: 'Badge claimed successfully! You can now view it in your wallet.',
    };
  }

  /**
   * Get badges received by a user
   */
  async getMyBadges(userId: string, query: QueryBadgeDto) {
    // Build where clause
    const where: any = {
      recipientId: userId,
    };

    // Add optional filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    // Get total count
    const totalCount = await this.prisma.badge.count({ where });

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    // Build orderBy
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    };

    // Get badges
    const badges = await this.prisma.badge.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: true,
          },
        },
        issuer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Format response
    return {
      data: badges.map((badge) => ({
        id: badge.id,
        status: badge.status,
        issuedAt: badge.issuedAt,
        claimedAt: badge.claimedAt,
        expiresAt: badge.expiresAt,
        evidenceUrl: badge.evidenceUrl,
        template: badge.template,
        issuer: {
          id: badge.issuer.id,
          name: badge.issuer.firstName && badge.issuer.lastName
            ? `${badge.issuer.firstName} ${badge.issuer.lastName}`
            : badge.issuer.email,
        },
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
        hasMore: skip + take < totalCount,
      },
    };
  }

  /**
   * Get badges issued by user (ISSUER sees own, ADMIN sees all)
   */
  async getIssuedBadges(userId: string, userRole: UserRole, query: QueryBadgeDto) {
    // Build where clause based on role
    const where: any = {};

    // ISSUER can only see badges they issued
    if (userRole === UserRole.ISSUER) {
      where.issuerId = userId;
    }
    // ADMIN can see all badges (no filter)

    // Add optional filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    // Get total count
    const totalCount = await this.prisma.badge.count({ where });

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    // Build orderBy
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    };

    // Get badges
    const badges = await this.prisma.badge.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Format response
    return {
      data: badges.map((badge) => ({
        id: badge.id,
        status: badge.status,
        issuedAt: badge.issuedAt,
        claimedAt: badge.claimedAt,
        expiresAt: badge.expiresAt,
        evidenceUrl: badge.evidenceUrl,
        template: badge.template,
        recipient: {
          id: badge.recipient.id,
          name: badge.recipient.firstName && badge.recipient.lastName
            ? `${badge.recipient.firstName} ${badge.recipient.lastName}`
            : badge.recipient.email,
          email: badge.recipient.email,
        },
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
        hasMore: skip + take < totalCount,
      },
    };
  }

  /**
   * Find badge by ID (helper method)
   */
  async findOne(id: string) {
    return this.prisma.badge.findUnique({
      where: { id },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });
  }

  /**
   * Revoke a badge (ADMIN only)
   */
  async revokeBadge(badgeId: string, reason: string, adminId: string) {
    // 1. Find badge
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: true,
        recipient: true,
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // 2. Check if already revoked
    if (badge.status === BadgeStatus.REVOKED) {
      throw new BadRequestException('Badge is already revoked');
    }

    // 3. Revoke badge
    const revokedBadge = await this.prisma.badge.update({
      where: { id: badgeId },
      data: {
        status: BadgeStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: reason,
        claimToken: null, // Clear token
      },
    });

    // 4. Send revocation notification email
    await this.notificationService.sendBadgeRevocationNotification({
      recipientEmail: badge.recipient.email,
      recipientName: badge.recipient.firstName && badge.recipient.lastName
        ? `${badge.recipient.firstName} ${badge.recipient.lastName}`
        : badge.recipient.email,
      badgeName: badge.template.name,
      revocationReason: reason,
    });

    // 5. Log revocation (audit trail)
    this.logger.log(`Badge ${badgeId} revoked by admin ${adminId}: ${reason}`);

    return {
      id: revokedBadge.id,
      status: revokedBadge.status,
      revokedAt: revokedBadge.revokedAt,
      revocationReason: revokedBadge.revocationReason,
      message: 'Badge revoked successfully',
    };
  }
}
