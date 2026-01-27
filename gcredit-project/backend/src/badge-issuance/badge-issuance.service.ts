import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { IssueBadgeDto } from './dto/issue-badge.dto';
import { BadgeStatus } from '@prisma/client';

@Injectable()
export class BadgeIssuanceService {
  constructor(
    private prisma: PrismaService,
    private assertionGenerator: AssertionGeneratorService,
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

    // 10. Return badge response
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
}
