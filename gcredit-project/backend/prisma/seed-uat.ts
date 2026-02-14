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
  // Skill Categories Level 1 (type=0006)
  scatTech: '00000000-0000-4000-a000-000600000001',
  scatSoft: '00000000-0000-4000-a000-000600000002',
  scatDomain: '00000000-0000-4000-a000-000600000003',
  scatCompany: '00000000-0000-4000-a000-000600000004',
  scatProfessional: '00000000-0000-4000-a000-000600000005',
  // Skill Categories Level 2 — sub-categories (type=0006, seq=1x/2x)
  scatProgramming: '00000000-0000-4000-a000-000600000011',
  scatCloud: '00000000-0000-4000-a000-000600000012',
  scatCommunication: '00000000-0000-4000-a000-000600000021',
  scatLeadership: '00000000-0000-4000-a000-000600000022',
  // Skills (must be valid UUID v4 — DTO validates @IsUUID('4'))
  skillTypescript: 'a0a00001-0001-4001-a001-000000000001',
  skillAzure: 'a0a00002-0002-4002-a002-000000000002',
  skillDocker: 'a0a00003-0003-4003-a003-000000000003',
  skillPublicSpeaking: 'a0a00004-0004-4004-a004-000000000004',
  skillTeamLeadership: 'a0a00005-0005-4005-a005-000000000005',
  skillProjectMgmt: 'a0a00006-0006-4006-a006-000000000006',
  skillAI: 'a0a00007-0007-4007-a007-000000000007',
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

async function main() {
  console.log('🌱 Starting UAT seed data...\n');

  // ========================================
  // 1. USERS (4 roles, upsert)
  // ========================================
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: 'admin@gcredit.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      department: 'IT',
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
    },
    create: {
      email: 'issuer@gcredit.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Issuer',
      role: UserRole.ISSUER,
      department: 'HR',
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
    },
    create: {
      email: 'manager@gcredit.com',
      passwordHash,
      firstName: 'Team',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      department: 'Engineering',
      isActive: true,
      emailVerified: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'M365DevAdmin@2wjh85.onmicrosoft.com' },
    update: {
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: 'M365DevAdmin@2wjh85.onmicrosoft.com',
      passwordHash,
      firstName: 'M365Dev',
      lastName: 'Admin',
      role: UserRole.EMPLOYEE,
      department: 'Development',
      isActive: true,
      emailVerified: true,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'employee@gcredit.com' },
    update: {
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: 'employee@gcredit.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ 5 users created/updated');

  // ========================================
  // CLEANUP: Delete existing UAT data in FK-safe order
  // Handles both old (uat-*) and new (00000000-*) ID formats
  // ========================================
  // Evidence files: by ID (new) or badge claimToken (old+new)
  await prisma.evidenceFile.deleteMany({
    where: {
      OR: [
        { id: { in: [IDS.evidence1, IDS.evidence2] } },
        { badge: { claimToken: { startsWith: 'uat-claim-token-' } } },
      ],
    },
  });
  // Badges: by claimToken pattern (covers both old and new ID schemes)
  await prisma.badge.deleteMany({
    where: { claimToken: { startsWith: 'uat-claim-token-' } },
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
      id: { in: Object.values(IDS).filter((id) => id.startsWith('a0a0000')) },
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

  // 2a. Create 5 top-level skill categories
  const skillCategories = await Promise.all([
    prisma.skillCategory.create({
      data: {
        id: IDS.scatTech,
        name: '技术技能',
        nameEn: 'Technical Skills',
        description: '编程、开发工具、云平台等技术相关能力',
        level: 1,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatSoft,
        name: '软技能',
        nameEn: 'Soft Skills',
        description: '沟通、领导力、团队协作等人际交往能力',
        level: 1,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 2,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatDomain,
        name: '行业知识',
        nameEn: 'Domain Knowledge',
        description: '特定行业的专业知识与经验',
        level: 1,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 3,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatCompany,
        name: '公司特定能力',
        nameEn: 'Company-Specific Competencies',
        description: '企业文化、内部流程、专有工具等公司特有的能力要求',
        level: 1,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 4,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatProfessional,
        name: '通用职业技能',
        nameEn: 'Professional Skills',
        description: '项目管理、数据分析等跨行业的通用职业技能',
        level: 1,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 5,
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
        name: '编程语言',
        nameEn: 'Programming Languages',
        level: 2,
        parentId: IDS.scatTech,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatCloud,
        name: '云平台',
        nameEn: 'Cloud Platforms',
        level: 2,
        parentId: IDS.scatTech,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 3,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatCommunication,
        name: '沟通能力',
        nameEn: 'Communication',
        level: 2,
        parentId: IDS.scatSoft,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: IDS.scatLeadership,
        name: '领导力',
        nameEn: 'Leadership',
        level: 2,
        parentId: IDS.scatSoft,
        isSystemDefined: true,
        isEditable: false,
        displayOrder: 2,
      },
    }),
  ]);
  console.log(`✅ ${subCategories.length} sub-categories created`);

  // 2c. Create 6 skills across different categories and levels
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
        id: IDS.skillAzure,
        name: 'Azure Cloud',
        description: 'Microsoft Azure cloud platform services and architecture',
        categoryId: IDS.scatCloud,
        level: SkillLevel.ADVANCED,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillDocker,
        name: 'Docker',
        description:
          'Container technology for application packaging and deployment',
        categoryId: IDS.scatCloud,
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
        categoryId: IDS.scatProfessional,
        level: SkillLevel.ADVANCED,
      },
    }),
    prisma.skill.create({
      data: {
        id: IDS.skillAI,
        name: 'AI',
        description:
          'Artificial intelligence, machine learning, and generative AI technologies',
        categoryId: IDS.scatProgramming,
        level: SkillLevel.INTERMEDIATE,
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
        category: 'Technical',
        skillIds: [
          IDS.skillTypescript,
          IDS.skillAzure,
          IDS.skillDocker,
          IDS.skillAI,
        ],
        issuanceCriteria: {
          requirements: [
            'Complete cloud architecture certification',
            'Deploy 3+ production workloads',
            'Pass security audit review',
          ],
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
        category: 'Leadership',
        skillIds: [IDS.skillTeamLeadership, IDS.skillPublicSpeaking],
        issuanceCriteria: {
          requirements: [
            'Lead a cross-functional project',
            'Mentor 2+ junior team members',
            'Positive 360-degree feedback',
          ],
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
        category: 'Innovation',
        skillIds: [],
        issuanceCriteria: {
          requirements: [
            'Submit approved innovation proposal',
            'Implement cost-saving improvement',
            'Present at internal tech talk',
          ],
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
        category: 'Security',
        skillIds: [],
        issuanceCriteria: {
          requirements: [
            'Complete security certification (CISSP/CEH)',
            'Conduct vulnerability assessment',
            'Author security policy document',
          ],
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
        category: 'Teamwork',
        skillIds: [IDS.skillProjectMgmt],
        issuanceCriteria: {
          requirements: [
            'Consistently supports team goals',
            'Positive peer feedback',
            'Cross-team collaboration on 2+ projects',
          ],
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
        category: 'Technical',
        skillIds: [IDS.skillAzure, IDS.skillDocker, IDS.skillTypescript],
        issuanceCriteria: {
          requirements: [
            'Implement CI/CD pipeline for a production service',
            'Manage Kubernetes clusters',
            'Achieve 99.9% uptime SLA',
          ],
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
        category: 'Technical',
        skillIds: [IDS.skillAI, IDS.skillTypescript],
        issuanceCriteria: {
          requirements: [
            'Train and deploy an ML model to production',
            'Complete internal AI ethics course',
            'Author a technical blog post on applied ML',
          ],
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
        category: 'Leadership',
        skillIds: [IDS.skillTeamLeadership, IDS.skillPublicSpeaking, IDS.skillProjectMgmt],
        issuanceCriteria: {
          requirements: [
            'Mentor 3+ colleagues for at least 6 months',
            'Conduct 2+ internal workshops',
            'Receive outstanding mentor feedback',
          ],
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
        category: 'Teamwork',
        skillIds: [IDS.skillPublicSpeaking, IDS.skillProjectMgmt],
        issuanceCriteria: {
          requirements: [
            'Achieve 95%+ customer satisfaction score',
            'Resolve 50+ customer escalations',
            'Document 3+ customer success case studies',
          ],
        },
        validityPeriod: 365,
        status: TemplateStatus.ACTIVE,
        createdBy: admin.id,
      },
    }),
  ]);

  console.log(`✅ ${templates.length + extraTemplates.length} badge templates created (${templates.length} core + ${extraTemplates.length} for recommendations)`);

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
      claimToken: 'uat-claim-token-001',
      verificationId: IDS.verify1,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge1-meta')
        .digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
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
      claimToken: 'uat-claim-token-002',
      verificationId: IDS.verify2,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge2-meta')
        .digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
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
      claimToken: 'uat-claim-token-003',
      verificationId: IDS.verify3,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge3-meta')
        .digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
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
      claimToken: 'uat-claim-token-004',
      verificationId: IDS.verify4,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge4-meta')
        .digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
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
      claimToken: 'uat-claim-token-005-pending',
      verificationId: IDS.verify5,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge5-meta')
        .digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
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
      claimToken: 'uat-claim-token-006',
      verificationId: IDS.verify6,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge6-meta')
        .digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
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
      claimToken: 'uat-claim-token-007',
      verificationId: IDS.verify7,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge7-meta')
        .digest('hex'),
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
      claimToken: 'uat-claim-token-008',
      verificationId: IDS.verify8,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge8-meta')
        .digest('hex'),
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
      claimToken: 'uat-claim-token-009',
      verificationId: IDS.verify9,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge9-meta')
        .digest('hex'),
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
      claimToken: 'uat-claim-token-010',
      verificationId: IDS.verify10,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge10-meta')
        .digest('hex'),
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
      claimToken: 'uat-claim-token-011-pending',
      verificationId: IDS.verify11,
      metadataHash: crypto
        .createHash('sha256')
        .update('badge11-meta')
        .digest('hex'),
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

  console.log('✅ 2 evidence files created');

  // ========================================
  // 5. MILESTONE CONFIGS (2 milestones)
  // ========================================

  await prisma.milestoneConfig.deleteMany({
    where: {
      id: {
        in: [
          IDS.milestone1,
          IDS.milestone2,
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
      trigger: { type: 'BADGE_COUNT', threshold: 1 },
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
      trigger: { type: 'BADGE_COUNT', threshold: 5 },
      icon: '⭐',
      isActive: true,
      createdBy: admin.id,
    },
  });

  console.log('✅ 2 milestone configs created');

  // ========================================
  // 6. AUDIT LOGS (3 entries for revocation)
  // ========================================

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: 'Badge',
        entityId: IDS.badge6,
        action: 'ISSUED',
        actorId: issuer.id,
        actorEmail: 'issuer@gcredit.com',
        timestamp: twoMonthsAgo,
        metadata: {
          templateName: 'Cloud Expert Certification',
          recipientEmail: 'M365DevAdmin@2wjh85.onmicrosoft.com',
        },
      },
      {
        entityType: 'Badge',
        entityId: IDS.badge6,
        action: 'CLAIMED',
        actorId: employee.id,
        actorEmail: 'M365DevAdmin@2wjh85.onmicrosoft.com',
        timestamp: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
        metadata: { oldStatus: 'PENDING', newStatus: 'CLAIMED' },
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
          reason:
            'Certification expired - employee did not renew within grace period',
          notes: 'UAT test data: revoked badge for verification page testing',
        },
      },
    ],
  });

  console.log('✅ 3 audit log entries created');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n🎉 UAT seed data complete!');
  console.log('\n📋 Quick Reference:');
  console.log('   Admin:    admin@gcredit.com / password123');
  console.log('   Issuer:   issuer@gcredit.com / password123');
  console.log('   Manager:  manager@gcredit.com / password123');
  console.log('   Employee: employee@gcredit.com / password123');
  console.log('   Employee: M365DevAdmin@2wjh85.onmicrosoft.com / password123');
  console.log('\n📊 Data Summary:');
  console.log('   5 users, 5 templates, 11 badges, 2 evidence files');
  console.log('   2 milestone configs, 3 audit logs');
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
