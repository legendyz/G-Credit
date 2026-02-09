import {
  PrismaClient,
  UserRole,
  TemplateStatus,
  BadgeStatus,
  MilestoneType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Fixed UUIDs for easy reference during UAT
const IDS = {
  // Templates
  tmpl1: 'uat-tmpl-0001-0001-0001-000000000001',
  tmpl2: 'uat-tmpl-0001-0001-0001-000000000002',
  tmpl3: 'uat-tmpl-0001-0001-0001-000000000003',
  tmpl4: 'uat-tmpl-0001-0001-0001-000000000004',
  tmpl5: 'uat-tmpl-0001-0001-0001-000000000005',
  // Badges
  badge1: 'uat-bdge-0001-0001-0001-000000000001',
  badge2: 'uat-bdge-0001-0001-0001-000000000002',
  badge3: 'uat-bdge-0001-0001-0001-000000000003',
  badge4: 'uat-bdge-0001-0001-0001-000000000004',
  badge5: 'uat-bdge-0001-0001-0001-000000000005',
  badge6: 'uat-bdge-0001-0001-0001-000000000006',
  badge7: 'uat-bdge-0001-0001-0001-000000000007',
  badge8: 'uat-bdge-0001-0001-0001-000000000008',
  badge9: 'uat-bdge-0001-0001-0001-000000000009',
  badge10: 'uat-bdge-0001-0001-0001-000000000010',
  badge11: 'uat-bdge-0001-0001-0001-000000000011',
  // Verification IDs
  verify1: 'uat-veri-0001-0001-0001-000000000001',
  verify2: 'uat-veri-0001-0001-0001-000000000002',
  verify3: 'uat-veri-0001-0001-0001-000000000003',
  verify4: 'uat-veri-0001-0001-0001-000000000004',
  verify5: 'uat-veri-0001-0001-0001-000000000005',
  verify6: 'uat-veri-0001-0001-0001-000000000006',
  verify7: 'uat-veri-0001-0001-0001-000000000007',
  verify8: 'uat-veri-0001-0001-0001-000000000008',
  verify9: 'uat-veri-0001-0001-0001-000000000009',
  verify10: 'uat-veri-0001-0001-0001-000000000010',
  verify11: 'uat-veri-0001-0001-0001-000000000011',
  // Evidence
  evidence1: 'uat-evid-0001-0001-0001-000000000001',
  evidence2: 'uat-evid-0001-0001-0001-000000000002',
  // Milestones
  milestone1: 'uat-mile-0001-0001-0001-000000000001',
  milestone2: 'uat-mile-0001-0001-0001-000000000002',
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

  console.log('✅ 4 users created/updated');

  // ========================================
  // 2. BADGE TEMPLATES (5 templates, all ACTIVE)
  // ========================================

  // Clean existing UAT templates if re-running
  await prisma.badgeTemplate.deleteMany({
    where: { id: { in: Object.values(IDS).filter((id) => id.startsWith('uat-tmpl')) } },
  });

  const templates = await Promise.all([
    prisma.badgeTemplate.create({
      data: {
        id: IDS.tmpl1,
        name: 'Cloud Expert Certification',
        description:
          'Awarded for demonstrating advanced cloud computing skills including architecture, deployment, and security best practices.',
        imageUrl: 'https://picsum.photos/400/400?random=1',
        category: 'Technical',
        skillIds: [],
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
        skillIds: [],
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
        skillIds: [],
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

  console.log(`✅ ${templates.length} badge templates created`);

  // ========================================
  // 3. BADGES (11 total, various states)
  // ========================================
  // Clean existing UAT badges if re-running
  await prisma.evidenceFile.deleteMany({
    where: { id: { in: Object.values(IDS).filter((id) => id.startsWith('uat-evid')) } },
  });
  await prisma.badge.deleteMany({
    where: { id: { in: Object.values(IDS).filter((id) => id.startsWith('uat-bdge')) } },
  });

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
      metadataHash: crypto.createHash('sha256').update('badge1-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge2-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge3-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge4-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge5-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge6-meta').digest('hex'),
      recipientHash: hashEmail('M365DevAdmin@2wjh85.onmicrosoft.com'),
      assertionJson: makeAssertion(IDS.verify6),
      issuedAt: twoMonthsAgo,
      claimedAt: new Date(twoMonthsAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      expiresAt: oneYearLater,
      revokedAt: oneWeekAgo,
      revokedBy: manager.id,
      revocationReason: 'Certification expired - employee did not renew within grace period',
      revocationNotes: 'UAT test data: revoked badge for verification page testing',
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
      metadataHash: crypto.createHash('sha256').update('badge7-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge8-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge9-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge10-meta').digest('hex'),
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
      metadataHash: crypto.createHash('sha256').update('badge11-meta').digest('hex'),
      recipientHash: hashEmail('admin@gcredit.com'),
      assertionJson: makeAssertion(IDS.verify11),
      issuedAt: now,
      claimedAt: null,
      expiresAt: oneYearLater,
    },
  });

  console.log('✅ 11 badges created (7 CLAIMED, 2 PENDING, 1 REVOKED, 1 expired)');

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
      blobUrl: 'https://placeholder.blob.core.windows.net/evidence/cloud-cert-2026.pdf',
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
      blobUrl: 'https://placeholder.blob.core.windows.net/evidence/innovation-proposal-q1.pdf',
      uploadedBy: employee.id,
    },
  });

  console.log('✅ 2 evidence files created');

  // ========================================
  // 5. MILESTONE CONFIGS (2 milestones)
  // ========================================

  await prisma.milestoneConfig.deleteMany({
    where: { id: { in: [IDS.milestone1, IDS.milestone2] } },
  });

  await prisma.milestoneConfig.create({
    data: {
      id: IDS.milestone1,
      type: MilestoneType.BADGE_COUNT,
      title: 'First Badge',
      description: 'Earned your very first badge! Welcome to the G-Credit community.',
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
          reason: 'Certification expired - employee did not renew within grace period',
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
  console.log('   Employee: M365DevAdmin@2wjh85.onmicrosoft.com / password123');
  console.log('\n📊 Data Summary:');
  console.log('   4 users, 5 templates, 11 badges, 2 evidence files');
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
