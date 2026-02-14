import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type { BadgeTemplate } from '@prisma/client';

export interface SimilarBadgeResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  issuerName: string;
  badgeCount: number;
  similarityScore: number;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Get similar badge recommendations for a given badge
   * AC 5.1-5.4: Similarity scoring algorithm
   * AC 5.5: API endpoint implementation
   */
  async getSimilarBadges(
    badgeId: string,
    userId: string,
    limit: number = 6,
  ): Promise<SimilarBadgeResponse[]> {
    // Verify badge exists and get its template
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        template: {
          select: {
            id: true,
            skillIds: true,
            category: true,
            createdBy: true,
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // AC 5.2: Get user's owned badges (to exclude)
    const userBadges = await this.prisma.badge.findMany({
      where: {
        recipientId: userId,
        status: { in: ['CLAIMED', 'PENDING'] },
      },
      select: { templateId: true },
    });

    const ownedTemplateIds = new Set(userBadges.map((b) => b.templateId));

    // AC 5.3: Get all ACTIVE templates with badge counts
    const candidateTemplates = await this.prisma.badgeTemplate.findMany({
      where: {
        status: 'ACTIVE',
        id: { notIn: [badge.templateId, ...Array.from(ownedTemplateIds)] },
      },
      include: {
        _count: {
          select: { badges: true },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate similarity scores
    const scoredTemplates = candidateTemplates.map((template) => {
      const score = this.calculateSimilarity(badge.template, template);
      return {
        template,
        score,
      };
    });

    // AC 5.4: Sort by score DESC and take top N
    const topTemplates = scoredTemplates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Format response
    return topTemplates.map(({ template, score }) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      imageUrl: template.imageUrl,
      category: template.category,
      issuerName:
        `${template.creator.firstName || ''} ${template.creator.lastName || ''}`.trim() ||
        'Unknown',
      badgeCount: template._count.badges,
      similarityScore: score,
    }));
  }

  /**
   * AC 5.1: Calculate similarity score between two badge templates
   *
   * Scoring rules:
   * - Same skills: +20 points per match
   * - Same category: +15 points
   * - Same issuer: +10 points
   * - Popularity: +1 point per 10 badges issued
   */
  private calculateSimilarity(
    currentTemplate: {
      skillIds: string[];
      category: string;
      createdBy: string;
    },
    candidateTemplate: BadgeTemplate & { _count: { badges: number } },
  ): number {
    let score = 0;

    // Same skills: +20 points per match
    const currentSkillsSet = new Set(currentTemplate.skillIds);
    const candidateSkillsSet = new Set(candidateTemplate.skillIds);
    const skillMatches = [...currentSkillsSet].filter((skillId) =>
      candidateSkillsSet.has(skillId),
    ).length;
    score += skillMatches * 20;

    // Same category: +15 points
    if (currentTemplate.category === candidateTemplate.category) {
      score += 15;
    }

    // Same issuer: +10 points
    if (currentTemplate.createdBy === candidateTemplate.createdBy) {
      score += 10;
    }

    // Popularity: +1 point per 10 badges issued
    score += Math.floor(candidateTemplate._count.badges / 10);

    return score;
  }
}
