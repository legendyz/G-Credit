import {
  PrismaClient,
  UserRole,
  TemplateStatus,
  BadgeStatus,
  MilestoneType,
  SkillLevel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Production safety guard
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot run UAT seed in production environment!');
  process.exit(1);
}

const prisma = new PrismaClient();

// Fixed UUIDs for easy reference during UAT
// Format: valid UUID v4 (8-4-4-4-12 hex, version=4, variant=a)
// Scheme: 00000000-0000-4000-a000-TTTTNNNNNNNN (T=type, N=sequence)
const IDS = {
  // Templates (type=0001)
  tmpl1: '00000000-0000-4000-a000-000100000001',
  tmpl2: '00000000-0000-4000-a000-000100000002',
  tmpl3: '00000000-0000-4000-a000-000100000003',
  tmpl4: '00000000-0000-4000-a000-000100000004',
  tmpl5: '00000000-0000-4000-a000-000100000005',
  tmpl6: '00000000-0000-4000-a000-000100000006',
  tmpl7: '00000000-0000-4000-a000-000100000007',
  tmpl8: '00000000-0000-4000-a000-000100000008',
  tmpl9: '00000000-0000-4000-a000-000100000009',
  // Badges (type=0002)
  badge1: '00000000-0000-4000-a000-000200000001',
  badge2: '00000000-0000-4000-a000-000200000002',
  badge3: '00000000-0000-4000-a000-000200000003',
  badge4: '00000000-0000-4000-a000-000200000004',
  badge5: '00000000-0000-4000-a000-000200000005',
  badge6: '00000000-0000-4000-a000-000200000006',
  badge7: '00000000-0000-4000-a000-000200000007',
  badge8: '00000000-0000-4000-a000-000200000008',
  badge9: '00000000-0000-4000-a000-000200000009',
  badge10: '00000000-0000-4000-a000-000200000010',
  badge11: '00000000-0000-4000-a000-000200000011',
  // Verification IDs (type=0003)
  verify1: '00000000-0000-4000-a000-000300000001',
  verify2: '00000000-0000-4000-a000-000300000002',
  verify3: '00000000-0000-4000-a000-000300000003',
  verify4: '00000000-0000-4000-a000-000300000004',
  verify5: '00000000-0000-4000-a000-000300000005',
  verify6: '00000000-0000-4000-a000-000300000006',
  verify7: '00000000-0000-4000-a000-000300000007',
  verify8: '00000000-0000-4000-a000-000300000008',
  verify9: '00000000-0000-4000-a000-000300000009',
  verify10: '00000000-0000-4000-a000-000300000010',
  verify11: '00000000-0000-4000-a000-000300000011',
  // Evidence (type=0004)
  evidence1: '00000000-0000-4000-a000-000400000001',
  evidence2: '00000000-0000-4000-a000-000400000002',
  // Milestones (type=0005)
  milestone1: '00000000-0000-4000-a000-000500000001',
  milestone2: '00000000-0000-4000-a000-000500000002',
  milestone3: '00000000-0000-4000-a000-000500000003',
  // Skill Categories Level 1 (type=0006)
  scatTech: '00000000-0000-4000-a000-000600000001',         // Technology
  scatSoft: '00000000-0000-4000-a000-000600000002',         // Interpersonal Skills
  scatDomain: '00000000-0000-4000-a000-000600000003',       // Business & Industry
  scatCompany: '00000000-0000-4000-a000-000600000004',      // Leadership & Management
  // Skill Categories Level 2 — sub-categories (type=0006, seq=1x/2x)
  scatProgramming: '00000000-0000-4000-a000-000600000011',
  scatCloud: '00000000-0000-4000-a000-000600000012',
  scatCommunication: '00000000-0000-4000-a000-000600000021',
  scatLeadership: '00000000-0000-4000-a000-000600000022',
  // Skill Categories Level 3 — sub-sub-categories (type=0006, seq=1xx)
  scatAzure: '00000000-0000-4000-a000-000600000121',
  // User-defined (non-system) categories for edit/delete UAT tests
  scatInnovation: '00000000-0000-4000-a000-000600000032', // empty (deletable)
  // Skills (must be valid UUID v4 — DTO validates @IsUUID('4'))
  skillTypescript: 'a0a00001-0001-4001-a001-000000000001',
  skillDocker: 'a0a00003-0003-4003-a003-000000000003',
  skillPublicSpeaking: 'a0a00004-0004-4004-a004-000000000004',
  skillTeamLeadership: 'a0a00005-0005-4005-a005-000000000005',
  skillProjectMgmt: 'a0a00006-0006-4006-a006-000000000006',
  skillAI: 'a0a00007-0007-4007-a007-000000000007',
  // Unreferenced skill (no template uses it) — for UAT delete test
  skillNegotiation: 'a0a00008-0008-4008-a008-000000000008',
  // Evidence URL type
  evidence3: '00000000-0000-4000-a000-000400000003',
  // Extra milestones
  milestone4: '00000000-0000-4000-a000-000500000004',
  milestone5: '00000000-0000-4000-a000-000500000005',
  // Milestone Achievements (type=0005, seq=1x)
  mAchieve1: '00000000-0000-4000-a000-000500000011', // Employee × First Badge
  mAchieve2: '00000000-0000-4000-a000-000500000012', // Employee × Well-Rounded
  mAchieve3: '00000000-0000-4000-a000-000500000013', // Manager  × First Badge
  mAchieve4: '00000000-0000-4000-a000-000500000014', // Admin    × First Badge
  // Extra templates (type=0001, seq=1x) — DRAFT + ARCHIVED
  tmplDraft: '00000000-0000-4000-a000-000100000010',
  tmplArchived: '00000000-0000-4000-a000-000100000011',
  // Employee2 badges (type=0002, seq=2x)
  badge12: '00000000-0000-4000-a000-000200000012',
  badge13: '00000000-0000-4000-a000-000200000013',
  verify12: '00000000-0000-4000-a000-000300000012',
  verify13: '00000000-0000-4000-a000-000300000013',
  // Employee2 milestone achievement
  mAchieve5: '00000000-0000-4000-a000-000500000015', // Employee2 × First Badge
  // Badge shares (type=0007)
  share1: '00000000-0000-4000-a000-000700000001',
  share2: '00000000-0000-4000-a000-000700000002',
  share3: '00000000-0000-4000-a000-000700000003',
};

const UAT_SALT = 'gcredit-uat-salt';

function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email + UAT_SALT)
    .digest('hex');
}

function makeAssertion(verificationId: string) {
  return {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'Assertion',
    id: `http://localhost:3000/api/verification/${verificationId}/assertion`,
  };
}

/** Canonical JSON with recursively sorted keys — matches AssertionGeneratorService */
function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value)
          .sort()
          .reduce(
            (sorted, k) => {
              sorted[k] = (value as Record<string, unknown>)[k];
              return sorted;
            },
            {} as Record<string, unknown>,
          )
      : value,
  );
}

function hashAssertion(assertion: object): string {
  return crypto.createHash('sha256').update(canonicalJson(assertion)).digest('hex');
}

async function main() {
  console.log('🌱 Starting UAT seed data...\n');

  // ========================================
  // 1. USERS (5 local + 1 SSO-only = 6 users, upsert)
  // ========================================
  const passwordHash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      jobTitle: 'IT Director',
    },
    create: {
      email: 'admin@gcredit.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      department: 'IT',
      jobTitle: 'IT Director',
      isActive: true,
      emailVerified: true,
    },
  });

  const issuer = await prisma.user.upsert({
    where: { email: 'issuer@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.ISSUER,
      isActive: true,
      emailVerified: true,
      jobTitle: 'HR Specialist',
    },
    create: {
      email: 'issuer@gcredit.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Issuer',
      role: UserRole.ISSUER,
      department: 'HR',
      jobTitle: 'HR Specialist',
      isActive: true,
      emailVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.MANAGER,
      isActive: true,
      emailVerified: true,
      jobTitle: 'Engineering Manager',
    },
    create: {
      email: 'manager@gcredit.com',
      passwordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      department: 'Engineering',
      jobTitle: 'Engineering Manager',
      isActive: true,
      emailVerified: true,
    },
  });

  // employee2 — second local employee for subordinate/multi-user testing
  const employee2 = await prisma.user.upsert({
    where: { email: 'employee2@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      emailVerified: true,
      jobTitle: 'Full-Stack Developer',
    },
    create: {
      email: 'employee2@gcredit.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Employee2',
      role: UserRole.EMPLOYEE,
      department: 'Development',
      jobTitle: 'Full-Stack Developer',
      isActive: true,
      emailVerified: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      emailVerified: true,
      jobTitle: 'Software Engineer',
    },
    create: {
      email: 'employee@gcredit.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      isActive: true,
      emailVerified: true,
    },
  });

  // NOTE: SSO-only user (AdeleV@2wjh85.onmicrosoft.com) is NOT seeded.
  // Story 13.2 JIT provisioning auto-creates the user on first Azure AD login.
  // Seeding with a fake azureId would conflict with the real oid and break SSO flow.

  console.log('✅ 5 users created/updated (all local, SSO user via JIT on first login)');

  // ========================================
  // 1b. LINK MANAGER HIERARCHY (Story 12.3a)
  // ========================================
  // Link employee → manager via managerId
  await prisma.user.update({
    where: { id: employee.id },
    data: { managerId: manager.id },
  });
  // Link employee2 → manager too (2 subordinates for delete-manager warning test)
  await prisma.user.update({
    where: { id: employee2.id },
    data: { managerId: manager.id },
  });
  console.log('✅ Employee + Employee2 linked to Manager via managerId');

  // ========================================
  // CLEANUP: Delete existing UAT data in FK-safe order
  // Handles both old (uat-*) and new (00000000-*) ID formats
  // ========================================
  // Badge shares: by ID (new) — must come before badges
  await prisma.badgeShare.deleteMany({
    where: {
      id: { in: [IDS.share1, IDS.share2, IDS.share3] },
    },
  });
  // Evidence files: by ID (new) or badge claimToken (old+new) or badge templateId
  await prisma.evidenceFile.deleteMany({
    where: {
      OR: [
        { id: { in: [IDS.evidence1, IDS.evidence2, IDS.evidence3] } },
        { badge: { claimToken: { startsWith: 'uat-claim-token-' } } },
        {
          badge: {
            templateId: {
              in: [
                IDS.tmpl1, IDS.tmpl2, IDS.tmpl3, IDS.tmpl4, IDS.tmpl5,
                IDS.tmpl6, IDS.tmpl7, IDS.tmpl8, IDS.tmpl9,
                IDS.tmplDraft, IDS.tmplArchived,
              ],
            },
          },
        },
      ],
    },
  });
  // Badges: by claimToken pattern (covers both old and new ID schemes)
  await prisma.badge.deleteMany({
    where: { claimToken: { startsWith: 'uat-claim-token-' } },
  });
  // Also delete any badges referencing our template IDs (e.g. manually issued during UAT)
  await prisma.badge.deleteMany({
    where: {
      templateId: {
        in: [
          IDS.tmpl1, IDS.tmpl2, IDS.tmpl3, IDS.tmpl4, IDS.tmpl5,
          IDS.tmpl6, IDS.tmpl7, IDS.tmpl8, IDS.tmpl9,
          IDS.tmplDraft, IDS.tmplArchived,
        ],
      },
    },
  });
  // Templates: by new IDs and old uat-tmpl-* IDs
  await prisma.badgeTemplate.deleteMany({
    where: {
      id: {
        in: [
          IDS.tmpl1,
          IDS.tmpl2,
          IDS.tmpl3,
          IDS.tmpl4,
          IDS.tmpl5,
          IDS.tmpl6,
          IDS.tmpl7,
          IDS.tmpl8,
          IDS.tmpl9,
          IDS.tmplDraft,
          IDS.tmplArchived,
          // Old format IDs for migration cleanup
          'uat-tmpl-0001-0001-0001-000000000001',
          'uat-tmpl-0001-0001-0001-000000000002',
          'uat-tmpl-0001-0001-0001-000000000003',
          'uat-tmpl-0001-0001-0001-000000000004',
          'uat-tmpl-0001-0001-0001-000000000005',
        ],
      },
    },
  });
  // Clean skill data (skills before categories due to FK)
  await prisma.skill.deleteMany({
    where: {
      id: {
        in: [
          ...Object.values(IDS).filter((id) => id.startsWith('a0a0000')),
        ],
      },
    },
  });
  // Skill categories: by new IDs and old uat-scat-* IDs
  await prisma.skillCategory.deleteMany({
    where: {
      id: {
        in: [
          ...Object.values(IDS).filter((id) =>
            id.startsWith('00000000-0000-4000-a000-0006'),
          ),
          // Old format IDs for migration cleanup
          'uat-scat-0001-0001-0001-000000000001',
          'uat-scat-0001-0001-0001-000000000002',
          'uat-scat-0001-0001-0001-000000000003',
          'uat-scat-0001-0001-0001-000000000004',
          'uat-scat-0001-0001-0001-000000000005',
          'uat-scat-0001-0001-0001-000000000011',
          'uat-scat-0001-0001-0001-000000000012',
          'uat-scat-0001-0001-0001-000000000021',
          'uat-scat-0001-0001-0001-000000000022',
        ],
      },
    },
  });
  console.log(
    '🧹 Cleaned existing UAT data (evidence → badges → templates → skills → categories)',
  );

  // ========================================
  // 2. SKILL CATEGORIES + SKILLS (Story 10.8b)
  // ========================================

  // 2a. Create 4 top-level skill categories
  const skillCategories = await Promise.all([
    prisma.skillCategory.create({
      data: {
        id: IDS.scatTech,
        name: 'Technology',
        nameEn: 'Technology',
        description: 'Programming, development tools, cloud platforms, data and other technical competencies',
        color: 'blue',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatSoft,
        name: 'Interpersonal Skills',
        nameEn: 'Interpersonal Skills',
        description: 'Communication, teamwork, collaboration and other people-oriented competencies',
        color: 'amber',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 2,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatDomain,
        name: 'Business & Industry',
        nameEn: 'Business & Industry',
        description: 'Industry-specific knowledge, compliance, finance and other domain expertise',
        color: 'emerald',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 3,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatCompany,
        name: 'Leadership & Management',
        nameEn: 'Leadership & Management',
        description: 'People management, strategy, mentoring, project management and other leadership competencies',
        color: 'violet',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 4,
      },
    }),
  ]);
  console.log(
    `✅ ${skillCategories.length} top-level skill categories created`,
  );

  // 2b. Create 4 sub-categories (level 2)
  const subCategories = await Promise.all([
    prisma.skillCategory.create({
      data: {
        id: IDS.scatProgramming,
        name: 'Programming Languages',
        nameEn: 'Programming Languages',
        color: 'blue',
        level: 2,
        parentId: IDS.scatTech,
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatCloud,
        name: 'Cloud Platforms',
        nameEn: 'Cloud Platforms',
        color: 'blue',
        level: 2,
        parentId: IDS.scatTech,
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 2,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatCommunication,
        name: 'Communication',
        nameEn: 'Communication',
        color: 'amber',
        level: 2,
        parentId: IDS.scatSoft,
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatLeadership,
        name: 'Leadership',
        nameEn: 'Leadership',
        color: 'violet',
        level: 2,
        parentId: IDS.scatCompany, // Under "Leadership & Management" L1
        isSystemDefined: false,
        isEditable: true,
        displayOrder: 1,
      },
    }),
  ]);
  console.log(`✅ ${subCategories.length} sub-categories created`);

  // 2b2. Create 1 Level 3 sub-sub-category (for UAT-S12-001: 3-level tree)
  await prisma.skillCategory.create({
    data: {
      id: IDS.scatAzure,
      name: 'Azure',
      nameEn: 'Microsoft Azure',
      color: 'blue',
      level: 3,
      parentId: IDS.scatCloud, // Cloud Platforms → Azure
      isSystemDefined: false,
      isEditable: true,
      displayOrder: 1,
    },
  });
  console.log('✅ 1 Level 3 sub-sub-category created (Cloud → Azure)');

  // 2b3. Create 1 user-defined category (non-system, for edit/delete UAT tests)
  await prisma.skillCategory.create({
    data: {
      id: IDS.scatInnovation,
      name: 'Innovation',
      nameEn: 'Innovation',
      description: 'Empty category for UAT delete testing',
      color: 'lime',
      level: 1,
      isSystemDefined: false,
      isEditable: true,
      displayOrder: 5,
    },
  });
  console.log('✅ 1 user-defined category created (Innovation, empty — deletable)');

  // 2c. Create skills across different categories and levels
  const skills = await Promise.all([
    prisma.skill.create({
      data: {
        id: IDS.skillTypescript,
        name: 'TypeScript',
        description:
          'Static typing for JavaScript, used in enterprise web development',
        categoryId: IDS.scatProgramming,
        level: SkillLevel.INTERMEDIATE,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillDocker,
        name: 'Docker',
        description:
          'Container technology for application packaging and deployment',
        categoryId: IDS.scatAzure, // Under Azure (L3) → Cloud Platforms → Technology
        level: SkillLevel.INTERMEDIATE,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillPublicSpeaking,
        name: 'Public Speaking',
        description: 'Presenting ideas clearly and persuasively to audiences',
        categoryId: IDS.scatCommunication,
        level: SkillLevel.BEGINNER,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillTeamLeadership,
        name: 'Team Leadership',
        description: 'Leading and motivating teams to achieve objectives',
        categoryId: IDS.scatLeadership,
        level: SkillLevel.EXPERT,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillProjectMgmt,
        name: 'Project Management',
        description: 'Planning, executing, and closing projects effectively',
        categoryId: IDS.scatLeadership, // Under Leadership → Leadership & Management
        level: SkillLevel.ADVANCED,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillAI,
        name: 'Vibe Coding',
        description:
          'AI-assisted development using natural language prompts, LLM-driven code generation, and human-AI pair programming',
        categoryId: IDS.scatProgramming,
        level: SkillLevel.INTERMEDIATE,
      },
    }),
    // Unreferenced skill (no template uses it) — for UAT-S12-010 delete test
    prisma.skill.create({
      data: {
        id: IDS.skillNegotiation,
        name: 'Negotiation',
        description: 'Business negotiation and conflict resolution skills',
        categoryId: IDS.scatCommunication,
        level: SkillLevel.ADVANCED,
      },
    }),
  ]);
  console.log(`✅ ${skills.length} skills created`);

  // ========================================
  // 3. BADGE TEMPLATES (5 templates, all ACTIVE)
  // ========================================

  const templates = await Promise.all([
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl1,
        name: 'Cloud Expert Certification',
        description:
          'Awarded for demonstrating advanced cloud computing skills including architecture, deployment, and security best practices.',
        imageUrl: 'https://picsum.photos/400/400?random=1',
        category: 'certification',
        skillIds: [
          IDS.skillTypescript,
          IDS.skillDocker,
          IDS.skillAI,
        ],
        issuanceCriteria: {
          type: 'manual',
          description: 'Complete cloud architecture certification; Deploy 3+ production workloads; Pass security audit review',
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: issuer.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl2,
        name: 'Leadership Excellence',
        description:
          'Recognizes outstanding leadership qualities, mentorship, and team development capabilities.',
        imageUrl: 'https://picsum.photos/400/400?random=2',
        category: 'achievement',
        skillIds: [IDS.skillTeamLeadership, IDS.skillPublicSpeaking],
        issuanceCriteria: {
          type: 'manual',
          description: 'Lead a cross-functional project; Mentor 2+ junior team members; Positive 360-degree feedback',
        },
        validityPeriod: 730,
        status: TemplateStatus.ACTIVE,
        createdBy: issuer.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl3,
        name: 'Innovation Champion',
        description:
          'Awarded for innovative thinking, creative problem-solving, and driving process improvements.',
        imageUrl: 'https://picsum.photos/400/400?random=3',
        category: 'achievement',
        skillIds: [],
        issuanceCriteria: {
          type: 'manual',
          description: 'Submit approved innovation proposal; Implement cost-saving improvement; Present at internal tech talk',
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: admin.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl4,
        name: 'Security Specialist',
        description:
          'Validates expertise in cybersecurity practices, threat analysis, and compliance frameworks.',
        imageUrl: 'https://picsum.photos/400/400?random=4',
        category: 'certification',
        skillIds: [],
        issuanceCriteria: {
          type: 'manual',
          description: 'Complete security certification (CISSP/CEH); Conduct vulnerability assessment; Author security policy document',
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: admin.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl5,
        name: 'Team Player Award',
        description:
          'Recognizes exceptional collaboration, positive team culture contribution, and cross-team cooperation.',
        imageUrl: 'https://picsum.photos/400/400?random=5',
        category: 'participation',
        skillIds: [IDS.skillProjectMgmt],
        issuanceCriteria: {
          type: 'manual',
          description: 'Consistently supports team goals; Positive peer feedback; Cross-team collaboration on 2+ projects',
        },
        validityPeriod: null,
        status: TemplateStatus.ACTIVE,
        createdBy: issuer.id,
      },
    }),
  ]);

  // ========================================
  // 3b. EXTRA TEMPLATES (for Similar Badges recommendations)
  //     Employee does NOT have badges for these templates,
  //     so they appear as recommendations in Badge Detail.
  // ========================================

  const extraTemplates = await Promise.all([
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl6,
        name: 'DevOps Engineer Certification',
        description:
          'Validates proficiency in CI/CD pipelines, infrastructure as code, container orchestration, and monitoring.',
        imageUrl: 'https://picsum.photos/400/400?random=6',
        category: 'skill',
        skillIds: [IDS.skillDocker, IDS.skillTypescript],
        issuanceCriteria: {
          type: 'manual',
          description: 'Implement CI/CD pipeline for a production service; Manage Kubernetes clusters; Achieve 99.9% uptime SLA',
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: issuer.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl7,
        name: 'AI & Machine Learning Pioneer',
        description:
          'Recognizes hands-on expertise in building, training, and deploying machine learning models in production.',
        imageUrl: 'https://picsum.photos/400/400?random=7',
        category: 'skill',
        skillIds: [IDS.skillAI, IDS.skillTypescript],
        issuanceCriteria: {
          type: 'manual',
          description: 'Train and deploy an ML model to production; Complete internal AI ethics course; Author a technical blog post on applied ML',
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: admin.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl8,
        name: 'Mentor of the Year',
        description:
          'Awarded for exceptional mentorship, knowledge sharing, and fostering growth in junior team members.',
        imageUrl: 'https://picsum.photos/400/400?random=8',
        category: 'achievement',
        skillIds: [IDS.skillTeamLeadership, IDS.skillPublicSpeaking, IDS.skillProjectMgmt],
        issuanceCriteria: {
          type: 'manual',
          description: 'Mentor 3+ colleagues for at least 6 months; Conduct 2+ internal workshops; Receive outstanding mentor feedback',
        },
        validityPeriod: null,
        status: TemplateStatus.ACTIVE,
        createdBy: issuer.id,
      },
    }),
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl9,
        name: 'Customer Success Champion',
        description:
          'Recognizes outstanding contributions to customer satisfaction, support excellence, and relationship management.',
        imageUrl: 'https://picsum.photos/400/400?random=9',
        category: 'participation',
        skillIds: [IDS.skillPublicSpeaking, IDS.skillProjectMgmt],
        issuanceCriteria: {
          type: 'manual',
          description: 'Achieve 95%+ customer satisfaction score; Resolve 50+ customer escalations; Document 3+ customer success case studies',
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: admin.id,
      },
    }),
  ]);

  console.log(`✅ ${templates.length + extraTemplates.length} badge templates created (${templates.length} core + ${extraTemplates.length} for recommendations)`);

  // ========================================
  // 3c. DRAFT + ARCHIVED TEMPLATES (lifecycle testing)
  // ========================================

  const draftTemplate = await prisma.badgeTemplate.create({
    data: {
      id: IDS.tmplDraft,
      name: 'Data Analytics Fundamentals (DRAFT)',
      description:
        'Work-in-progress template for data analytics skills. Not yet published for issuance.',
      imageUrl: 'https://picsum.photos/400/400?random=10',
      category: 'skill',
      skillIds: [IDS.skillAI],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete data analytics course; Pass internal assessment',
      },
      validityPeriod: 365,
      status: TemplateStatus.DRAFT,
      createdBy: issuer.id,
    },
  });

  const archivedTemplate = await prisma.badgeTemplate.create({
    data: {
      id: IDS.tmplArchived,
      name: 'Legacy Compliance Training (ARCHIVED)',
      description:
        'Previously used for compliance training. Archived after policy update — no new badges can be issued.',
      imageUrl: 'https://picsum.photos/400/400?random=11',
      category: 'certification',
      skillIds: [],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete annual compliance training and pass exam',
      },
      validityPeriod: 365,
      status: TemplateStatus.ARCHIVED,
      createdBy: admin.id,
    },
  });

  console.log('✅ 2 lifecycle templates created (1 DRAFT + 1 ARCHIVED)');

  // ========================================
  // 4. BADGES (11 total, various states)
  // ========================================

  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const pastExpiry = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  // --- Employee badges (4 CLAIMED, 1 PENDING, 1 REVOKED) ---

  // Badge 1: CLAIMED - Cloud Expert (Employee)
  await prisma.badge.create({
    data: {
      id: IDS.badge1,
      templateId: IDS.tmpl1,
      recipientId: employee.id,
      issuerId: issuer.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-001-000000000000',
      verificationId: IDS.verify1,
      metadataHash: hashAssertion(makeAssertion(IDS.verify1)),
      recipientHash: hashEmail('employee@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify1),
      issuedAt: twoMonthsAgo,
      claimedAt: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
    },
  });

  // Badge 2: CLAIMED - Leadership (Employee)
  await prisma.badge.create({
    data: {
      id: IDS.badge2,
      templateId: IDS.tmpl2,
      recipientId: employee.id,
      issuerId: issuer.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-002-000000000000',
      verificationId: IDS.verify2,
      metadataHash: hashAssertion(makeAssertion(IDS.verify2)),
      recipientHash: hashEmail('employee@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify2),
      issuedAt: oneMonthAgo,
      claimedAt: new Date(oneMonthAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
    },
  });

  // Badge 3: CLAIMED - Innovation (Employee)
  await prisma.badge.create({
    data: {
      id: IDS.badge3,
      templateId: IDS.tmpl3,
      recipientId: employee.id,
      issuerId: admin.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-003-000000000000',
      verificationId: IDS.verify3,
      metadataHash: hashAssertion(makeAssertion(IDS.verify3)),
      recipientHash: hashEmail('employee@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify3),
      issuedAt: oneWeekAgo,
      claimedAt: new Date(oneWeekAgo.getTime() + 12 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
    },
  });

  // Badge 4: CLAIMED - Team Player (Employee, no expiry)
  await prisma.badge.create({
    data: {
      id: IDS.badge4,
      templateId: IDS.tmpl5,
      recipientId: employee.id,
      issuerId: issuer.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-004-000000000000',
      verificationId: IDS.verify4,
      metadataHash: hashAssertion(makeAssertion(IDS.verify4)),
      recipientHash: hashEmail('employee@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify4),
      issuedAt: threeDaysAgo,
      claimedAt: new Date(threeDaysAgo.getTime() + 6 * 60 * 60 * 1000),
      expiresAt: null,
    },
  });

  // Badge 5: PENDING - Security Specialist (Employee, awaiting claim)
  await prisma.badge.create({
    data: {
      id: IDS.badge5,
      templateId: IDS.tmpl4,
      recipientId: employee.id,
      issuerId: admin.id,
      status: BadgeStatus.PENDING,
      claimToken: 'uat-claim-token-005-pending00000',
      verificationId: IDS.verify5,
      metadataHash: hashAssertion(makeAssertion(IDS.verify5)),
      recipientHash: hashEmail('employee@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify5),
      issuedAt: now,
      claimedAt: null,
      expiresAt: oneYearLater,
    },
  });

  // Badge 6: REVOKED - Cloud Expert (Employee, revoked by manager)
  await prisma.badge.create({
    data: {
      id: IDS.badge6,
      templateId: IDS.tmpl1,
      recipientId: employee.id,
      issuerId: issuer.id,
      status: BadgeStatus.REVOKED,
      claimToken: 'uat-claim-token-006-000000000000',
      verificationId: IDS.verify6,
      metadataHash: hashAssertion(makeAssertion(IDS.verify6)),
      recipientHash: hashEmail('employee@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify6),
      issuedAt: twoMonthsAgo,
      claimedAt: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
      revokedAt: oneWeekAgo,
      revokedBy: manager.id,
      revocationReason:
        'Certification expired - employee did not renew within grace period',
      revocationNotes:
        'UAT test data: revoked badge for verification page testing',
    },
  });

  // --- Manager badges (2 CLAIMED, 1 expired) ---

  // Badge 7: CLAIMED - Leadership (Manager)
  await prisma.badge.create({
    data: {
      id: IDS.badge7,
      templateId: IDS.tmpl2,
      recipientId: manager.id,
      issuerId: admin.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-007-000000000000',
      verificationId: IDS.verify7,
      metadataHash: hashAssertion(makeAssertion(IDS.verify7)),
      recipientHash: hashEmail('manager@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify7),
      issuedAt: oneMonthAgo,
      claimedAt: new Date(oneMonthAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
    },
  });

  // Badge 8: CLAIMED - Innovation (Manager)
  await prisma.badge.create({
    data: {
      id: IDS.badge8,
      templateId: IDS.tmpl3,
      recipientId: manager.id,
      issuerId: issuer.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-008-000000000000',
      verificationId: IDS.verify8,
      metadataHash: hashAssertion(makeAssertion(IDS.verify8)),
      recipientHash: hashEmail('manager@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify8),
      issuedAt: twoMonthsAgo,
      claimedAt: new Date(twoMonthsAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
    },
  });

  // Badge 9: CLAIMED but EXPIRED (Manager, expiresAt in the past)
  await prisma.badge.create({
    data: {
      id: IDS.badge9,
      templateId: IDS.tmpl4,
      recipientId: manager.id,
      issuerId: admin.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-009-000000000000',
      verificationId: IDS.verify9,
      metadataHash: hashAssertion(makeAssertion(IDS.verify9)),
      recipientHash: hashEmail('manager@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify9),
      issuedAt: twoMonthsAgo,
      claimedAt: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      expiresAt: pastExpiry,
    },
  });

  // --- Admin badge (1 CLAIMED) ---

  // Badge 10: CLAIMED - Team Player (Admin)
  await prisma.badge.create({
    data: {
      id: IDS.badge10,
      templateId: IDS.tmpl5,
      recipientId: admin.id,
      issuerId: issuer.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-010-000000000000',
      verificationId: IDS.verify10,
      metadataHash: hashAssertion(makeAssertion(IDS.verify10)),
      recipientHash: hashEmail('admin@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify10),
      issuedAt: oneWeekAgo,
      claimedAt: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000),
      expiresAt: null,
    },
  });

  // Badge 11: PENDING - Cloud Expert (Admin, for claim testing)
  await prisma.badge.create({
    data: {
      id: IDS.badge11,
      templateId: IDS.tmpl1,
      recipientId: admin.id,
      issuerId: issuer.id,
      status: BadgeStatus.PENDING,
      claimToken: 'uat-claim-token-011-pending00000',
      verificationId: IDS.verify11,
      metadataHash: hashAssertion(makeAssertion(IDS.verify11)),
      recipientHash: hashEmail('admin@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify11),
      issuedAt: now,
      claimedAt: null,
      expiresAt: oneYearLater,
    },
  });

  console.log(
    '✅ 11 badges created (7 CLAIMED, 2 PENDING, 1 REVOKED, 1 expired)',
  );

  // --- Employee2 badges (2 CLAIMED) ---

  // Badge 12: CLAIMED - Cloud Expert (Employee2, hybrid user)
  await prisma.badge.create({
    data: {
      id: IDS.badge12,
      templateId: IDS.tmpl1,
      recipientId: employee2.id,
      issuerId: issuer.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-012-000000000000',
      verificationId: IDS.verify12,
      metadataHash: hashAssertion(makeAssertion(IDS.verify12)),
      recipientHash: hashEmail('employee2@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify12),
      issuedAt: oneMonthAgo,
      claimedAt: new Date(oneMonthAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
    },
  });

  // Badge 13: CLAIMED - Team Player (Employee2)
  await prisma.badge.create({
    data: {
      id: IDS.badge13,
      templateId: IDS.tmpl5,
      recipientId: employee2.id,
      issuerId: admin.id,
      status: BadgeStatus.CLAIMED,
      claimToken: 'uat-claim-token-013-000000000000',
      verificationId: IDS.verify13,
      metadataHash: hashAssertion(makeAssertion(IDS.verify13)),
      recipientHash: hashEmail('employee2@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify13),
      issuedAt: oneWeekAgo,
      claimedAt: new Date(oneWeekAgo.getTime() + 8 * 60 * 60 * 1000),
      expiresAt: null,
    },
  });

  console.log('✅ 2 employee2 badges created (2 CLAIMED)');

  // ========================================
  // 4. EVIDENCE FILES (2 records)
  // ========================================

  await prisma.evidenceFile.create({
    data: {
      id: IDS.evidence1,
      badgeId: IDS.badge1,
      fileName: 'cloud-cert-2026.pdf',
      originalName: 'cloud-certification-exam-results.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      blobUrl:
        'https://placeholder.blob.core.windows.net/evidence/cloud-cert-2026.pdf',
      uploadedBy: employee.id,
    },
  });

  await prisma.evidenceFile.create({
    data: {
      id: IDS.evidence2,
      badgeId: IDS.badge3,
      fileName: 'innovation-proposal-q1.pdf',
      originalName: 'innovation-proposal-q1-2026.pdf',
      fileSize: 512000,
      mimeType: 'application/pdf',
      blobUrl:
        'https://placeholder.blob.core.windows.net/evidence/innovation-proposal-q1.pdf',
      uploadedBy: employee.id,
    },
  });

  // URL-type evidence (Story 12.5) — for UAT-S12-021 unified display testing
  await prisma.evidenceFile.create({
    data: {
      id: IDS.evidence3,
      badgeId: IDS.badge2,
      fileName: 'leadership-course-completion',
      originalName: 'https://learn.microsoft.com/certifications/leadership',
      fileSize: 0,
      mimeType: '',
      blobUrl: '',
      type: 'URL',
      sourceUrl: 'https://learn.microsoft.com/certifications/leadership',
      uploadedBy: employee.id,
    },
  });

  console.log('✅ 3 evidence files created (2 FILE + 1 URL)');

  // ========================================
  // 4b. BADGE SHARES (3 records for share flow testing)
  // ========================================

  await prisma.badgeShare.create({
    data: {
      id: IDS.share1,
      badgeId: IDS.badge1,
      platform: 'email',
      sharedAt: new Date(twoMonthsAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      sharedBy: employee.id,
      recipientEmail: 'colleague@example.com',
      metadata: { note: 'Sharing my Cloud Expert certification' },
    },
  });

  await prisma.badgeShare.create({
    data: {
      id: IDS.share2,
      badgeId: IDS.badge1,
      platform: 'teams',
      sharedAt: new Date(oneMonthAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      sharedBy: employee.id,
      recipientEmail: 'team-channel@gcredit.com',
      metadata: { channel: 'Engineering' },
    },
  });

  await prisma.badgeShare.create({
    data: {
      id: IDS.share3,
      badgeId: IDS.badge7,
      platform: 'email',
      sharedAt: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      sharedBy: manager.id,
      recipientEmail: 'hr@gcredit.com',
      metadata: { note: 'Manager shared Leadership badge with HR' },
    },
  });

  console.log('✅ 3 badge shares created (2 email + 1 teams)');

  // ========================================
  // 5. MILESTONE CONFIGS (2 milestones)
  // ========================================

  // Clean up achievements first (cascade should handle it, but explicit is safer for re-runs)
  await prisma.milestoneAchievement.deleteMany({
    where: {
      id: {
        in: [IDS.mAchieve1, IDS.mAchieve2, IDS.mAchieve3, IDS.mAchieve4, IDS.mAchieve5],
      },
    },
  });

  await prisma.milestoneConfig.deleteMany({
    where: {
      id: {
        in: [
          IDS.milestone1,
          IDS.milestone2,
          IDS.milestone3,
          IDS.milestone4,
          IDS.milestone5,
          // Old format IDs for migration cleanup
          'uat-mile-0001-0001-0001-000000000001',
          'uat-mile-0001-0001-0001-000000000002',
        ],
      },
    },
  });

  await prisma.milestoneConfig.create({
    data: {
      id: IDS.milestone1,
      type: MilestoneType.BADGE_COUNT,
      title: 'First Badge',
      description:
        'Earned your very first badge! Welcome to the G-Credit community.',
      trigger: { metric: 'badge_count', scope: 'global', threshold: 1 },
      icon: '🏆',
      isActive: true,
      createdBy: admin.id,
    },
  });

  await prisma.milestoneConfig.create({
    data: {
      id: IDS.milestone2,
      type: MilestoneType.BADGE_COUNT,
      title: 'Badge Collector',
      description: 'Earned 5 badges! You are a dedicated learner.',
      trigger: { metric: 'badge_count', scope: 'global', threshold: 5 },
      icon: '⭐',
      isActive: true,
      createdBy: admin.id,
    },
  });

  await prisma.milestoneConfig.create({
    data: {
      id: IDS.milestone3,
      type: MilestoneType.CATEGORY_COUNT,
      title: 'Well-Rounded Learner',
      description: 'Earned badges across 3 different skill categories.',
      trigger: { metric: 'category_count', scope: 'global', threshold: 3 },
      icon: '🌟',
      isActive: true,
      createdBy: admin.id,
    },
  });

  // Category-scoped milestone (badge_count × category) — for UAT-S12-017
  await prisma.milestoneConfig.create({
    data: {
      id: IDS.milestone4,
      type: MilestoneType.BADGE_COUNT,
      title: 'Cloud Specialist',
      description: 'Earned 3 badges in the Technical Skills category.',
      trigger: {
        metric: 'badge_count',
        scope: 'category',
        threshold: 3,
        categoryId: IDS.scatTech,
        includeSubCategories: true,
      },
      icon: '☁️',
      isActive: true,
      createdBy: admin.id,
    },
  });

  // Inactive milestone — for UAT-S12-018 toggle test
  await prisma.milestoneConfig.create({
    data: {
      id: IDS.milestone5,
      type: MilestoneType.BADGE_COUNT,
      title: 'Badge Master',
      description: 'Earned 10 badges — a true badge master!',
      trigger: { metric: 'badge_count', scope: 'global', threshold: 10 },
      icon: '👑',
      isActive: false,
      createdBy: admin.id,
    },
  });

  console.log('✅ 5 milestone configs created (3 active global, 1 active category, 1 inactive)');

  // 5b. MILESTONE ACHIEVEMENTS
  // Seed data bypasses badge issuance flow (checkMilestones),
  // so we manually create achievement records for qualifying users.
  //
  // First Badge (badge_count ≥ 1, global):
  //   Employee (4 CLAIMED) ✅, Manager (3 CLAIMED) ✅, Admin (1 CLAIMED) ✅
  // Badge Collector (badge_count ≥ 5): nobody qualifies
  // Well-Rounded Learner (category_count ≥ 3):
  //   Employee → 5 distinct skill categories (Programming, Cloud, Leadership, Communication, Professional) ✅
  // Cloud Specialist (badge_count ≥ 3 in Technical Skills): nobody qualifies (Employee has 1 matching badge)
  // Badge Master (inactive): skipped

  await Promise.all([
    // Employee × First Badge
    prisma.milestoneAchievement.create({
      data: {
        id: IDS.mAchieve1,
        milestoneId: IDS.milestone1,
        userId: employee.id,
        achievedAt: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000), // when first badge was claimed
      },
    }),
    // Employee × Well-Rounded Learner
    prisma.milestoneAchievement.create({
      data: {
        id: IDS.mAchieve2,
        milestoneId: IDS.milestone3,
        userId: employee.id,
        achievedAt: new Date(threeDaysAgo.getTime() + 6 * 60 * 60 * 1000), // when 4th badge (Team Player) was claimed, crossing 3-category threshold
      },
    }),
    // Manager × First Badge
    prisma.milestoneAchievement.create({
      data: {
        id: IDS.mAchieve3,
        milestoneId: IDS.milestone1,
        userId: manager.id,
        achievedAt: new Date(oneMonthAgo.getTime() + 2 * 24 * 60 * 60 * 1000), // when first badge (Leadership) was claimed
      },
    }),
    // Admin × First Badge
    prisma.milestoneAchievement.create({
      data: {
        id: IDS.mAchieve4,
        milestoneId: IDS.milestone1,
        userId: admin.id,
        achievedAt: new Date(oneWeekAgo.getTime() + 4 * 60 * 60 * 1000), // when Team Player badge was claimed
      },
    }),
    // Employee2 × First Badge
    prisma.milestoneAchievement.create({
      data: {
        id: IDS.mAchieve5,
        milestoneId: IDS.milestone1,
        userId: employee2.id,
        achievedAt: new Date(oneMonthAgo.getTime() + 3 * 24 * 60 * 60 * 1000), // when first badge (Cloud Expert) was claimed
      },
    }),
  ]);

  console.log('✅ 5 milestone achievements created (4 First Badge + 1 Well-Rounded)');  

  // ========================================
  // 6. AUDIT LOGS (9 entries covering all action types)
  // ========================================

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: 'Badge',
        entityId: IDS.badge1,
        action: 'ISSUED',
        actorId: issuer.id,
        actorEmail: 'issuer@gcredit.com',
        timestamp: twoMonthsAgo,
        metadata: {
          badgeName: 'Cloud Expert Certification',
          templateName: 'Cloud Expert Certification',
          recipientEmail: 'employee@gcredit.com',
          recipientName: 'Demo Employee',
          templateId: IDS.tmpl1,
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge1,
        action: 'CLAIMED',
        actorId: employee.id,
        actorEmail: 'employee@gcredit.com',
        timestamp: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
        metadata: {
          oldStatus: 'PENDING',
          newStatus: 'CLAIMED',
          badgeName: 'Cloud Expert Certification',
          templateName: 'Cloud Expert Certification',
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge2,
        action: 'ISSUED',
        actorId: issuer.id,
        actorEmail: 'issuer@gcredit.com',
        timestamp: oneMonthAgo,
        metadata: {
          badgeName: 'Leadership Excellence',
          templateName: 'Leadership Excellence',
          recipientEmail: 'employee@gcredit.com',
          recipientName: 'Demo Employee',
          templateId: IDS.tmpl2,
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge2,
        action: 'CLAIMED',
        actorId: employee.id,
        actorEmail: 'employee@gcredit.com',
        timestamp: new Date(oneMonthAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
        metadata: {
          oldStatus: 'PENDING',
          newStatus: 'CLAIMED',
          badgeName: 'Leadership Excellence',
          templateName: 'Leadership Excellence',
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge6,
        action: 'ISSUED',
        actorId: issuer.id,
        actorEmail: 'issuer@gcredit.com',
        timestamp: twoMonthsAgo,
        metadata: {
          badgeName: 'Cloud Expert Certification',
          templateName: 'Cloud Expert Certification',
          recipientEmail: 'employee@gcredit.com',
          recipientName: 'Demo Employee',
          templateId: IDS.tmpl1,
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge6,
        action: 'CLAIMED',
        actorId: employee.id,
        actorEmail: 'employee@gcredit.com',
        timestamp: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
        metadata: {
          oldStatus: 'PENDING',
          newStatus: 'CLAIMED',
          badgeName: 'Cloud Expert Certification',
          templateName: 'Cloud Expert Certification',
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge6,
        action: 'REVOKED',
        actorId: manager.id,
        actorEmail: 'manager@gcredit.com',
        timestamp: oneWeekAgo,
        metadata: {
          oldStatus: 'CLAIMED',
          newStatus: 'REVOKED',
          badgeName: 'Cloud Expert Certification',
          templateName: 'Cloud Expert Certification',
          recipientName: 'Demo Employee',
          recipientEmail: 'employee@gcredit.com',
          reason:
            'Certification expired - employee did not renew within grace period',
          notes: 'UAT test data: revoked badge for verification page testing',
        },
      },
      {
        entityType: 'BadgeTemplate',
        entityId: IDS.tmpl1,
        action: 'CREATED',
        actorId: issuer.id,
        actorEmail: 'issuer@gcredit.com',
        timestamp: new Date(twoMonthsAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
        metadata: { templateName: 'Cloud Expert Certification' },
      },
      {
        entityType: 'User',
        entityId: employee.id,
        action: 'UPDATED',
        actorId: admin.id,
        actorEmail: 'admin@gcredit.com',
        timestamp: oneWeekAgo,
        metadata: { field: 'role', oldValue: 'EMPLOYEE', newValue: 'EMPLOYEE' },
      },
    ],
  });

  console.log('✅ 9 audit log entries created (ISSUED, CLAIMED, REVOKED, CREATED, UPDATED)');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n🎉 UAT seed data complete!');
  console.log('\n📋 Quick Reference:');
  console.log('   Admin:     admin@gcredit.com / Password123');
  console.log('   Issuer:    issuer@gcredit.com / Password123');
  console.log('   Manager:   manager@gcredit.com / Password123');
  console.log('   Employee:  employee@gcredit.com / Password123');
  console.log('   Employee2: employee2@gcredit.com / Password123');
  console.log('   SSO:       AdeleV@2wjh85.onmicrosoft.com (not seeded — JIT provisioned on first SSO login)');
  console.log('\n📊 Data Summary:');
  console.log('   5 users (2 linked to manager) + SSO user created by JIT on first login');
  console.log('   11 templates (9 ACTIVE + 1 DRAFT + 1 ARCHIVED)');
  console.log('   13 badges (9 CLAIMED, 2 PENDING, 1 REVOKED, 1 expired)');
  console.log('   3 evidence files (2 FILE + 1 URL), 3 badge shares');
  console.log('   10 skill categories (4 L1 + 4 L2 + 1 L3 + 1 custom), 7 skills');
  console.log('   5 milestone configs (3 global + 1 category + 1 inactive), 5 achievements, 9 audit logs');
  console.log('\n🔗 Verification URLs:');
  console.log(`   CLAIMED:  http://localhost:5173/verify/${IDS.verify1}`);
  console.log(`   PENDING:  http://localhost:5173/verify/${IDS.verify5}`);
  console.log(`   REVOKED:  http://localhost:5173/verify/${IDS.verify6}`);
  console.log(`   EXPIRED:  http://localhost:5173/verify/${IDS.verify9}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding UAT data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
