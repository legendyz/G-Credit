import {
  PrismaClient,
  UserRole,
  TemplateStatus,
  BadgeStatus,
  SkillLevel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Production safety guard
if (process.env.NODE_ENV === 'production') {
  console.error('❌ PILOT SEED: Cannot run in production environment!');
  process.exit(1);
}

const prisma = new PrismaClient();

// ============================================================
// Fixed UUIDs for pilot data — `b000` prefix to avoid UAT collision
// Scheme: 00000000-0000-4000-b000-TTTTNNNNNNNN
//   T = entity type, N = sequence
// ============================================================
const PILOT = {
  // ── Users (type=0000) ──
  admin:    '00000000-0000-4000-b000-000000000001',
  issuerA:  '00000000-0000-4000-b000-000000000010',
  issuerB:  '00000000-0000-4000-b000-000000000011',
  issuerC:  '00000000-0000-4000-b000-000000000012',
  emp1:     '00000000-0000-4000-b000-000000000020',
  emp2:     '00000000-0000-4000-b000-000000000021',
  emp3:     '00000000-0000-4000-b000-000000000022',
  emp4:     '00000000-0000-4000-b000-000000000023',
  emp5:     '00000000-0000-4000-b000-000000000024',
  emp6:     '00000000-0000-4000-b000-000000000025',
  emp7:     '00000000-0000-4000-b000-000000000026',
  emp8:     '00000000-0000-4000-b000-000000000027',
  emp9:     '00000000-0000-4000-b000-000000000028',
  emp10:    '00000000-0000-4000-b000-000000000029',

  // ── Skill Categories (type=0006) ──
  scatTech:       '00000000-0000-4000-b000-000600000001',
  scatLeadership: '00000000-0000-4000-b000-000600000002',
  scatCompliance: '00000000-0000-4000-b000-000600000003',

  // ── Skills (type=0060, valid UUID v4) ──
  skillCloud:       'b0b00001-0001-4001-b001-000000000001',
  skillAgile:       'b0b00002-0002-4002-b002-000000000002',
  skillPython:      'b0b00003-0003-4003-b003-000000000003',
  skillDataPrivacy: 'b0b00004-0004-4004-b004-000000000004',
  skillGDPR:        'b0b00005-0005-4005-b005-000000000005',
  skillPresentation:'b0b00006-0006-4006-b006-000000000006',
  skillMentoring:   'b0b00007-0007-4007-b007-000000000007',
  skillConflict:    'b0b00008-0008-4008-b008-000000000008',

  // ── Badge Templates (type=0001) ──
  tmplCloud:      '00000000-0000-4000-b000-000100000001',  // Issuer-A
  tmplAgile:      '00000000-0000-4000-b000-000100000002',  // Issuer-A
  tmplPrivacy:    '00000000-0000-4000-b000-000100000003',  // Issuer-B
  tmplLeadership: '00000000-0000-4000-b000-000100000004',  // Issuer-B
  tmplPython:     '00000000-0000-4000-b000-000100000005',  // Issuer-C

  // ── Badges (type=0002) ──
  badge1:  '00000000-0000-4000-b000-000200000001',
  badge2:  '00000000-0000-4000-b000-000200000002',
  badge3:  '00000000-0000-4000-b000-000200000003',
  badge4:  '00000000-0000-4000-b000-000200000004',
  badge5:  '00000000-0000-4000-b000-000200000005',
  badge6:  '00000000-0000-4000-b000-000200000006',
  badge7:  '00000000-0000-4000-b000-000200000007',
  badge8:  '00000000-0000-4000-b000-000200000008',
  badge9:  '00000000-0000-4000-b000-000200000009',
  badge10: '00000000-0000-4000-b000-000200000010',
  badge11: '00000000-0000-4000-b000-000200000011',
  badge12: '00000000-0000-4000-b000-000200000012',
  badge13: '00000000-0000-4000-b000-000200000013',
  badge14: '00000000-0000-4000-b000-000200000014',
  badge15: '00000000-0000-4000-b000-000200000015',
  badge16: '00000000-0000-4000-b000-000200000016',

  // ── Verification IDs (type=0003) ──
  verify1:  '00000000-0000-4000-b000-000300000001',
  verify2:  '00000000-0000-4000-b000-000300000002',
  verify3:  '00000000-0000-4000-b000-000300000003',
  verify4:  '00000000-0000-4000-b000-000300000004',
  verify5:  '00000000-0000-4000-b000-000300000005',
  verify6:  '00000000-0000-4000-b000-000300000006',
  verify7:  '00000000-0000-4000-b000-000300000007',
  verify8:  '00000000-0000-4000-b000-000300000008',
  verify9:  '00000000-0000-4000-b000-000300000009',
  verify10: '00000000-0000-4000-b000-000300000010',
  verify11: '00000000-0000-4000-b000-000300000011',
  verify12: '00000000-0000-4000-b000-000300000012',
  verify13: '00000000-0000-4000-b000-000300000013',
  verify14: '00000000-0000-4000-b000-000300000014',
  verify15: '00000000-0000-4000-b000-000300000015',
  verify16: '00000000-0000-4000-b000-000300000016',

  // ── Evidence (type=0004) ──
  evidence1: '00000000-0000-4000-b000-000400000001',
  evidence2: '00000000-0000-4000-b000-000400000002',
  evidence3: '00000000-0000-4000-b000-000400000003',

  // ── Badge Shares (type=0007) ──
  share1: '00000000-0000-4000-b000-000700000001',
  share2: '00000000-0000-4000-b000-000700000002',
  share3: '00000000-0000-4000-b000-000700000003',
};

const PILOT_SALT = 'gcredit-pilot-salt';

// ── Helper functions (same as seed-uat.ts) ──

function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email + PILOT_SALT)
    .digest('hex');
}

function makeAssertion(verificationId: string) {
  return {
    '@context': 'https://w3id.org/openbadges/v2',
    type: 'Assertion',
    id: `http://localhost:3000/api/verification/${verificationId}/assertion`,
  };
}

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

// ── All pilot user IDs (for cleanup filtering) ──
const ALL_USER_IDS = [
  PILOT.admin, PILOT.issuerA, PILOT.issuerB, PILOT.issuerC,
  PILOT.emp1, PILOT.emp2, PILOT.emp3, PILOT.emp4, PILOT.emp5,
  PILOT.emp6, PILOT.emp7, PILOT.emp8, PILOT.emp9, PILOT.emp10,
];

const ALL_TEMPLATE_IDS = [
  PILOT.tmplCloud, PILOT.tmplAgile, PILOT.tmplPrivacy,
  PILOT.tmplLeadership, PILOT.tmplPython,
];

const ALL_BADGE_IDS = [
  PILOT.badge1, PILOT.badge2, PILOT.badge3, PILOT.badge4, PILOT.badge5,
  PILOT.badge6, PILOT.badge7, PILOT.badge8, PILOT.badge9, PILOT.badge10,
  PILOT.badge11, PILOT.badge12, PILOT.badge13, PILOT.badge14, PILOT.badge15,
  PILOT.badge16,
];

const ALL_SCAT_IDS = [PILOT.scatTech, PILOT.scatLeadership, PILOT.scatCompliance];
const ALL_SKILL_IDS = [
  PILOT.skillCloud, PILOT.skillAgile, PILOT.skillPython,
  PILOT.skillDataPrivacy, PILOT.skillGDPR, PILOT.skillPresentation,
  PILOT.skillMentoring, PILOT.skillConflict,
];
const ALL_EVIDENCE_IDS = [PILOT.evidence1, PILOT.evidence2, PILOT.evidence3];
const ALL_SHARE_IDS = [PILOT.share1, PILOT.share2, PILOT.share3];

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('🌱 Starting Pilot seed data...\n');

  // ========================================
  // 0. CLEANUP — FK-safe order, pilot IDs only
  // ========================================
  await prisma.badgeShare.deleteMany({ where: { id: { in: ALL_SHARE_IDS } } });
  await prisma.evidenceFile.deleteMany({ where: { id: { in: ALL_EVIDENCE_IDS } } });
  // Also catch any evidence on pilot badges
  await prisma.evidenceFile.deleteMany({
    where: { badge: { claimToken: { startsWith: 'pilot-claim-' } } },
  });
  // Badges by ID + by claimToken pattern
  await prisma.badge.deleteMany({ where: { id: { in: ALL_BADGE_IDS } } });
  await prisma.badge.deleteMany({ where: { claimToken: { startsWith: 'pilot-claim-' } } });
  // Also delete badges referencing pilot templates (e.g. manually issued during pilot)
  await prisma.badge.deleteMany({ where: { templateId: { in: ALL_TEMPLATE_IDS } } });
  // Templates
  await prisma.badgeTemplate.deleteMany({ where: { id: { in: ALL_TEMPLATE_IDS } } });
  // Skills before categories (FK)
  await prisma.skill.deleteMany({ where: { id: { in: ALL_SKILL_IDS } } });
  await prisma.skillCategory.deleteMany({ where: { id: { in: ALL_SCAT_IDS } } });
  // Users — clear managerId first so self-referencing FK doesn't block
  await prisma.user.updateMany({
    where: { id: { in: ALL_USER_IDS } },
    data: { managerId: null },
  });
  await prisma.user.deleteMany({ where: { id: { in: ALL_USER_IDS } } });

  console.log('🧹 Cleaned existing pilot data');

  // ========================================
  // 1. USERS — 1 Admin + 3 Issuers + 10 Employees
  // ========================================
  const passwordHash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.create({
    data: {
      id: PILOT.admin,
      email: 'pilot-admin@gcredit.com',
      passwordHash,
      firstName: 'Pilot',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      department: 'IT',
      jobTitle: 'IT Director',
      isActive: true,
      emailVerified: true,
    },
  });

  const issuerA = await prisma.user.create({
    data: {
      id: PILOT.issuerA,
      email: 'issuer-a@pilot.gcredit.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Trainer',
      role: UserRole.ISSUER,
      department: 'L&D - Technical',
      jobTitle: 'Technical Training Lead',
      isActive: true,
      emailVerified: true,
    },
  });

  const issuerB = await prisma.user.create({
    data: {
      id: PILOT.issuerB,
      email: 'issuer-b@pilot.gcredit.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Facilitator',
      role: UserRole.ISSUER,
      department: 'L&D - Leadership',
      jobTitle: 'Leadership Development Manager',
      isActive: true,
      emailVerified: true,
    },
  });

  const issuerC = await prisma.user.create({
    data: {
      id: PILOT.issuerC,
      email: 'issuer-c@pilot.gcredit.com',
      passwordHash,
      firstName: 'Carol',
      lastName: 'Instructor',
      role: UserRole.ISSUER,
      department: 'L&D - Data Science',
      jobTitle: 'Data Science Instructor',
      isActive: true,
      emailVerified: true,
    },
  });

  // Employees across Engineering, Marketing, Finance
  const employeeData = [
    { id: PILOT.emp1, email: 'emp01@pilot.gcredit.com', firstName: 'David',   lastName: 'Chen',     dept: 'Engineering', title: 'Senior Developer' },
    { id: PILOT.emp2, email: 'emp02@pilot.gcredit.com', firstName: 'Emily',   lastName: 'Johnson',  dept: 'Engineering', title: 'Full-Stack Developer' },
    { id: PILOT.emp3, email: 'emp03@pilot.gcredit.com', firstName: 'Frank',   lastName: 'Williams', dept: 'Engineering', title: 'DevOps Engineer' },
    { id: PILOT.emp4, email: 'emp04@pilot.gcredit.com', firstName: 'Grace',   lastName: 'Lee',      dept: 'Marketing',   title: 'Marketing Manager' },
    { id: PILOT.emp5, email: 'emp05@pilot.gcredit.com', firstName: 'Henry',   lastName: 'Kim',      dept: 'Marketing',   title: 'Digital Marketing Specialist' },
    { id: PILOT.emp6, email: 'emp06@pilot.gcredit.com', firstName: 'Isabel',  lastName: 'Martinez', dept: 'Finance',     title: 'Financial Analyst' },
    { id: PILOT.emp7, email: 'emp07@pilot.gcredit.com', firstName: 'James',   lastName: 'Brown',    dept: 'Finance',     title: 'Compliance Officer' },
    { id: PILOT.emp8, email: 'emp08@pilot.gcredit.com', firstName: 'Karen',   lastName: 'Davis',    dept: 'Engineering', title: 'QA Engineer' },
    { id: PILOT.emp9, email: 'emp09@pilot.gcredit.com', firstName: 'Leo',     lastName: 'Wilson',   dept: 'Marketing',   title: 'Content Strategist' },
    { id: PILOT.emp10, email: 'emp10@pilot.gcredit.com', firstName: 'Mia',    lastName: 'Taylor',   dept: 'Finance',     title: 'Budget Coordinator' },
  ];

  const employees: Record<string, { id: string; email: string }> = {};
  for (const emp of employeeData) {
    const user = await prisma.user.create({
      data: {
        id: emp.id,
        email: emp.email,
        passwordHash,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: UserRole.EMPLOYEE,
        department: emp.dept,
        jobTitle: emp.title,
        isActive: true,
        emailVerified: true,
      },
    });
    employees[emp.id] = { id: user.id, email: emp.email };
  }

  console.log('✅ 14 users created (1 Admin, 3 Issuers, 10 Employees)');

  // Manager hierarchy: emp1 (Senior Dev) manages emp2, emp3, emp8
  await prisma.user.updateMany({
    where: { id: { in: [PILOT.emp2, PILOT.emp3, PILOT.emp8] } },
    data: { managerId: PILOT.emp1 },
  });
  // emp4 (Marketing Manager) manages emp5, emp9
  await prisma.user.updateMany({
    where: { id: { in: [PILOT.emp5, PILOT.emp9] } },
    data: { managerId: PILOT.emp4 },
  });

  console.log('✅ Manager hierarchy linked (emp1 → 3 reports, emp4 → 2 reports)');

  // ========================================
  // 2. SKILL CATEGORIES + SKILLS
  // ========================================

  await Promise.all([
    prisma.skillCategory.create({
      data: {
        id: PILOT.scatTech,
        name: 'Technical Skills',
        nameEn: 'Technical Skills',
        description: 'Cloud computing, programming, DevOps, and other technical competencies',
        color: 'blue',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 1,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: PILOT.scatLeadership,
        name: 'Leadership & Soft Skills',
        nameEn: 'Leadership & Soft Skills',
        description: 'People management, mentoring, communication, and interpersonal skills',
        color: 'violet',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 2,
      },
    }),
    prisma.skillCategory.create({
      data: {
        id: PILOT.scatCompliance,
        name: 'Compliance & Governance',
        nameEn: 'Compliance & Governance',
        description: 'Data privacy, GDPR, regulatory compliance, and governance frameworks',
        color: 'emerald',
        level: 1,
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 3,
      },
    }),
  ]);

  console.log('✅ 3 skill categories created');

  await Promise.all([
    prisma.skill.create({ data: { id: PILOT.skillCloud, name: 'Cloud Architecture', description: 'Designing and deploying scalable cloud infrastructure on Azure/AWS', categoryId: PILOT.scatTech, level: SkillLevel.ADVANCED } }),
    prisma.skill.create({ data: { id: PILOT.skillAgile, name: 'Agile & Scrum', description: 'Agile methodology, Sprint planning, retrospectives, and Scrum ceremonies', categoryId: PILOT.scatTech, level: SkillLevel.INTERMEDIATE } }),
    prisma.skill.create({ data: { id: PILOT.skillPython, name: 'Python Programming', description: 'Python for data science, automation, and backend development', categoryId: PILOT.scatTech, level: SkillLevel.INTERMEDIATE } }),
    prisma.skill.create({ data: { id: PILOT.skillDataPrivacy, name: 'Data Privacy', description: 'Handling PII, data classification, and privacy-by-design principles', categoryId: PILOT.scatCompliance, level: SkillLevel.ADVANCED } }),
    prisma.skill.create({ data: { id: PILOT.skillGDPR, name: 'GDPR Compliance', description: 'EU General Data Protection Regulation requirements and implementation', categoryId: PILOT.scatCompliance, level: SkillLevel.INTERMEDIATE } }),
    prisma.skill.create({ data: { id: PILOT.skillPresentation, name: 'Presentation Skills', description: 'Delivering impactful presentations to stakeholders and large audiences', categoryId: PILOT.scatLeadership, level: SkillLevel.BEGINNER } }),
    prisma.skill.create({ data: { id: PILOT.skillMentoring, name: 'Mentoring & Coaching', description: 'Guiding junior team members, providing feedback, and fostering growth', categoryId: PILOT.scatLeadership, level: SkillLevel.EXPERT } }),
    prisma.skill.create({ data: { id: PILOT.skillConflict, name: 'Conflict Resolution', description: 'Managing disagreements, mediating team conflicts, and finding win-win solutions', categoryId: PILOT.scatLeadership, level: SkillLevel.ADVANCED } }),
  ]);

  console.log('✅ 8 skills created');

  // ========================================
  // 3. BADGE TEMPLATES — 5 templates, 3 Issuers
  //    Critical: createdBy determines ownership (Sprint 16 F-1)
  // ========================================

  // Issuer-A owns: Cloud Architecture Fundamentals, Agile Scrum Master
  await prisma.badgeTemplate.create({
    data: {
      id: PILOT.tmplCloud,
      name: 'Cloud Architecture Fundamentals',
      description: 'Validates knowledge of cloud infrastructure design, deployment patterns, and security best practices on Azure and AWS.',
      imageUrl: 'https://picsum.photos/400/400?random=101',
      category: 'certification',
      skillIds: [PILOT.skillCloud],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete Azure Fundamentals or AWS Cloud Practitioner certification; Deploy a production workload; Pass architecture review',
      },
      validityPeriod: 365,
      status: TemplateStatus.ACTIVE,
      createdBy: issuerA.id,
    },
  });

  await prisma.badgeTemplate.create({
    data: {
      id: PILOT.tmplAgile,
      name: 'Agile Scrum Master',
      description: 'Recognizes proficiency in Agile methodology, Sprint facilitation, backlog management, and continuous improvement practices.',
      imageUrl: 'https://picsum.photos/400/400?random=102',
      category: 'certification',
      skillIds: [PILOT.skillAgile],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete CSM or PSM certification; Facilitate 10+ Sprints; Demonstrate measurable team velocity improvement',
      },
      validityPeriod: 730,
      status: TemplateStatus.ACTIVE,
      createdBy: issuerA.id,
    },
  });

  // Issuer-B owns: Data Privacy Compliance, Leadership Essentials
  await prisma.badgeTemplate.create({
    data: {
      id: PILOT.tmplPrivacy,
      name: 'Data Privacy Compliance',
      description: 'Awarded for demonstrating thorough understanding of data protection regulations, GDPR requirements, and privacy-by-design principles.',
      imageUrl: 'https://picsum.photos/400/400?random=103',
      category: 'skill',
      skillIds: [PILOT.skillDataPrivacy, PILOT.skillGDPR],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete data privacy training; Pass GDPR assessment with 85%+; Complete a privacy impact assessment for a real project',
      },
      validityPeriod: 365,
      status: TemplateStatus.ACTIVE,
      createdBy: issuerB.id,
    },
  });

  await prisma.badgeTemplate.create({
    data: {
      id: PILOT.tmplLeadership,
      name: 'Leadership Essentials',
      description: 'Recognizes demonstrated leadership capabilities including team mentoring, conflict resolution, and strategic thinking.',
      imageUrl: 'https://picsum.photos/400/400?random=104',
      category: 'participation',
      skillIds: [PILOT.skillPresentation, PILOT.skillMentoring, PILOT.skillConflict],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete leadership development program; Mentor 2+ junior team members for 3+ months; Receive positive 360-degree feedback',
      },
      validityPeriod: null,
      status: TemplateStatus.ACTIVE,
      createdBy: issuerB.id,
    },
  });

  // Issuer-C owns: Python for Data Science
  await prisma.badgeTemplate.create({
    data: {
      id: PILOT.tmplPython,
      name: 'Python for Data Science',
      description: 'Validates hands-on proficiency in Python for data analysis, visualization, machine learning, and statistical modeling.',
      imageUrl: 'https://picsum.photos/400/400?random=105',
      category: 'skill',
      skillIds: [PILOT.skillPython],
      issuanceCriteria: {
        type: 'manual',
        description: 'Complete Python data science curriculum; Build and present a data analysis project; Score 80%+ on practical assessment',
      },
      validityPeriod: 365,
      status: TemplateStatus.ACTIVE,
      createdBy: issuerC.id,
    },
  });

  console.log('✅ 5 badge templates created (Issuer-A: 2, Issuer-B: 2, Issuer-C: 1)');

  // ========================================
  // 4. BADGES — 16 total
  //    Rule: issuerId === template.createdBy (ownership)
  // ========================================

  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const pastExpiry = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  // Template → Issuer mapping for ownership correctness
  const templateOwner: Record<string, string> = {
    [PILOT.tmplCloud]: issuerA.id,
    [PILOT.tmplAgile]: issuerA.id,
    [PILOT.tmplPrivacy]: issuerB.id,
    [PILOT.tmplLeadership]: issuerB.id,
    [PILOT.tmplPython]: issuerC.id,
  };

  // Badge definitions: 10 CLAIMED, 3 PENDING, 1 REVOKED, 1 EXPIRED, 1 CLAIMED (recent)
  const badgeDefs = [
    // ── CLAIMED badges ──
    { id: PILOT.badge1, tmpl: PILOT.tmplCloud, recip: PILOT.emp1, email: 'emp01@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: twoMonthsAgo, claimed: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify1 },
    { id: PILOT.badge2, tmpl: PILOT.tmplAgile, recip: PILOT.emp1, email: 'emp01@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: oneMonthAgo, claimed: new Date(oneMonthAgo.getTime() + 1 * 24 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify2 },
    { id: PILOT.badge3, tmpl: PILOT.tmplPrivacy, recip: PILOT.emp2, email: 'emp02@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: oneMonthAgo, claimed: new Date(oneMonthAgo.getTime() + 3 * 24 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify3 },
    { id: PILOT.badge4, tmpl: PILOT.tmplLeadership, recip: PILOT.emp4, email: 'emp04@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: twoWeeksAgo, claimed: new Date(twoWeeksAgo.getTime() + 1 * 24 * 60 * 60 * 1000), expires: null, verify: PILOT.verify4 },
    { id: PILOT.badge5, tmpl: PILOT.tmplPython, recip: PILOT.emp6, email: 'emp06@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: oneWeekAgo, claimed: new Date(oneWeekAgo.getTime() + 6 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify5 },
    { id: PILOT.badge6, tmpl: PILOT.tmplCloud, recip: PILOT.emp3, email: 'emp03@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: oneMonthAgo, claimed: new Date(oneMonthAgo.getTime() + 2 * 24 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify6 },
    { id: PILOT.badge7, tmpl: PILOT.tmplPrivacy, recip: PILOT.emp7, email: 'emp07@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: twoWeeksAgo, claimed: new Date(twoWeeksAgo.getTime() + 4 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify7 },
    { id: PILOT.badge8, tmpl: PILOT.tmplAgile, recip: PILOT.emp5, email: 'emp05@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: oneWeekAgo, claimed: new Date(oneWeekAgo.getTime() + 12 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify8 },
    { id: PILOT.badge9, tmpl: PILOT.tmplLeadership, recip: PILOT.emp1, email: 'emp01@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: threeDaysAgo, claimed: new Date(threeDaysAgo.getTime() + 2 * 60 * 60 * 1000), expires: null, verify: PILOT.verify9 },
    { id: PILOT.badge10, tmpl: PILOT.tmplPython, recip: PILOT.emp8, email: 'emp08@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: threeDaysAgo, claimed: new Date(threeDaysAgo.getTime() + 8 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify10 },

    // ── PENDING badges (awaiting claim) ──
    { id: PILOT.badge11, tmpl: PILOT.tmplCloud, recip: PILOT.emp9, email: 'emp09@pilot.gcredit.com', status: BadgeStatus.PENDING, issued: now, claimed: null, expires: oneYearLater, verify: PILOT.verify11 },
    { id: PILOT.badge12, tmpl: PILOT.tmplPrivacy, recip: PILOT.emp10, email: 'emp10@pilot.gcredit.com', status: BadgeStatus.PENDING, issued: now, claimed: null, expires: oneYearLater, verify: PILOT.verify12 },
    { id: PILOT.badge13, tmpl: PILOT.tmplPython, recip: PILOT.emp4, email: 'emp04@pilot.gcredit.com', status: BadgeStatus.PENDING, issued: now, claimed: null, expires: oneYearLater, verify: PILOT.verify13 },

    // ── REVOKED badge ──
    { id: PILOT.badge14, tmpl: PILOT.tmplCloud, recip: PILOT.emp2, email: 'emp02@pilot.gcredit.com', status: BadgeStatus.REVOKED, issued: twoMonthsAgo, claimed: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000), expires: oneYearLater, verify: PILOT.verify14 },

    // ── EXPIRED badge (CLAIMED but expiresAt in the past) ──
    { id: PILOT.badge15, tmpl: PILOT.tmplAgile, recip: PILOT.emp3, email: 'emp03@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: twoMonthsAgo, claimed: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000), expires: pastExpiry, verify: PILOT.verify15 },

    // ── Recent CLAIMED badge (Leadership for emp6) ──
    { id: PILOT.badge16, tmpl: PILOT.tmplLeadership, recip: PILOT.emp6, email: 'emp06@pilot.gcredit.com', status: BadgeStatus.CLAIMED, issued: threeDaysAgo, claimed: new Date(threeDaysAgo.getTime() + 3 * 60 * 60 * 1000), expires: null, verify: PILOT.verify16 },
  ];

  for (const b of badgeDefs) {
    const assertion = makeAssertion(b.verify);
    const badgeData: Record<string, unknown> = {
      id: b.id,
      templateId: b.tmpl,
      recipientId: b.recip,
      issuerId: templateOwner[b.tmpl], // ← OWNERSHIP: issuer = template creator
      status: b.status,
      claimToken: `pilot-claim-${b.id.slice(-3)}`,
      verificationId: b.verify,
      metadataHash: hashAssertion(assertion),
      recipientHash: hashEmail(b.email),
      assertionJson: assertion,
      issuedAt: b.issued,
      claimedAt: b.claimed,
      expiresAt: b.expires,
    };

    // Add revocation fields for REVOKED badge
    if (b.status === BadgeStatus.REVOKED) {
      badgeData.revokedAt = oneWeekAgo;
      badgeData.revokedBy = admin.id;
      badgeData.revocationReason = 'Certificate expired — employee did not complete renewal within the grace period';
      badgeData.revocationNotes = 'Pilot seed data: revoked badge for testing verification page status display';
    }

    await prisma.badge.create({ data: badgeData as any });
  }

  console.log('✅ 16 badges created (10 CLAIMED, 3 PENDING, 1 REVOKED, 1 expired, 1 recent)');

  // ========================================
  // 5. EVIDENCE — 3 records (2 FILE + 1 URL)
  // ========================================

  await prisma.evidenceFile.create({
    data: {
      id: PILOT.evidence1,
      badgeId: PILOT.badge1,
      fileName: 'azure-fundamentals-cert.pdf',
      originalName: 'AZ-900-Certification-Results.pdf',
      fileSize: 184320,
      mimeType: 'application/pdf',
      blobUrl: 'https://placeholder.blob.core.windows.net/pilot-evidence/azure-fundamentals-cert.pdf',
      uploadedBy: PILOT.emp1,
    },
  });

  await prisma.evidenceFile.create({
    data: {
      id: PILOT.evidence2,
      badgeId: PILOT.badge3,
      fileName: 'gdpr-assessment-results.pdf',
      originalName: 'GDPR-Privacy-Assessment-Q1-2026.pdf',
      fileSize: 327680,
      mimeType: 'application/pdf',
      blobUrl: 'https://placeholder.blob.core.windows.net/pilot-evidence/gdpr-assessment-results.pdf',
      uploadedBy: PILOT.emp2,
    },
  });

  // URL-type evidence
  await prisma.evidenceFile.create({
    data: {
      id: PILOT.evidence3,
      badgeId: PILOT.badge5,
      fileName: 'python-data-science-course',
      originalName: 'https://learn.microsoft.com/en-us/training/paths/python-data-science/',
      fileSize: 0,
      mimeType: '',
      blobUrl: '',
      type: 'URL',
      sourceUrl: 'https://learn.microsoft.com/en-us/training/paths/python-data-science/',
      uploadedBy: PILOT.emp6,
    },
  });

  console.log('✅ 3 evidence files created (2 FILE + 1 URL)');

  // ========================================
  // 6. BADGE SHARES — 3 records
  // ========================================

  await prisma.badgeShare.create({
    data: {
      id: PILOT.share1,
      badgeId: PILOT.badge1,
      platform: 'email',
      sharedAt: new Date(twoMonthsAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      sharedBy: PILOT.emp1,
      recipientEmail: 'team-lead@example.com',
      metadata: { note: 'Sharing my Azure certification with the team' },
    },
  });

  await prisma.badgeShare.create({
    data: {
      id: PILOT.share2,
      badgeId: PILOT.badge4,
      platform: 'teams',
      sharedAt: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      sharedBy: PILOT.emp4,
      recipientEmail: 'marketing-channel@gcredit.com',
      metadata: { channel: 'Marketing Leadership' },
    },
  });

  await prisma.badgeShare.create({
    data: {
      id: PILOT.share3,
      badgeId: PILOT.badge5,
      platform: 'email',
      sharedAt: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      sharedBy: PILOT.emp6,
      recipientEmail: 'data-team@gcredit.com',
      metadata: { note: 'Python for Data Science badge — excited!' },
    },
  });

  console.log('✅ 3 badge shares created (2 email + 1 teams)');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n🎉 Pilot seed data complete!');
  console.log('\n📋 Quick Reference:');
  console.log('   Admin:     pilot-admin@gcredit.com / Password123');
  console.log('   Issuer-A:  issuer-a@pilot.gcredit.com / Password123  (owns: Cloud Architecture, Agile Scrum)');
  console.log('   Issuer-B:  issuer-b@pilot.gcredit.com / Password123  (owns: Data Privacy, Leadership)');
  console.log('   Issuer-C:  issuer-c@pilot.gcredit.com / Password123  (owns: Python for Data Science)');
  console.log('   Employees: emp01..emp10@pilot.gcredit.com / Password123');
  console.log('\n📊 Data Summary:');
  console.log('   14 users (1 Admin, 3 Issuers, 10 Employees)');
  console.log('   5 templates (Issuer-A: 2, Issuer-B: 2, Issuer-C: 1) — all ACTIVE');
  console.log('   16 badges (10 CLAIMED, 3 PENDING, 1 REVOKED, 1 expired, 1 recent)');
  console.log('   3 evidence files (2 FILE + 1 URL), 3 badge shares');
  console.log('   3 skill categories, 8 skills');
  console.log('\n🔐 Ownership Isolation (Sprint 16 F-1):');
  console.log('   Issuer-A templates: Cloud Architecture Fundamentals, Agile Scrum Master');
  console.log('   Issuer-B templates: Data Privacy Compliance, Leadership Essentials');
  console.log('   Issuer-C templates: Python for Data Science');
  console.log('   → Each badge.issuerId === template.createdBy ✅');
  console.log('\n🔗 Verification URLs:');
  console.log(`   CLAIMED:  http://localhost:5173/verify/${PILOT.verify1}`);
  console.log(`   PENDING:  http://localhost:5173/verify/${PILOT.verify11}`);
  console.log(`   REVOKED:  http://localhost:5173/verify/${PILOT.verify14}`);
  console.log(`   EXPIRED:  http://localhost:5173/verify/${PILOT.verify15}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding pilot data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
