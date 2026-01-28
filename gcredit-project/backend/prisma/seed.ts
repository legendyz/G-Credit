import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create test issuer user
  const issuerPassword = await bcrypt.hash('password123', 10);
  const issuer = await prisma.user.upsert({
    where: { email: 'issuer@gcredit.com' },
    update: {},
    create: {
      email: 'issuer@gcredit.com',
      passwordHash: issuerPassword,
      firstName: 'Demo',
      lastName: 'Issuer',
      role: 'ISSUER',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Created issuer user:', issuer.email);

  // 2. Create test recipient user
  const recipientPassword = await bcrypt.hash('password123', 10);
  const recipient = await prisma.user.upsert({
    where: { email: 'recipient@example.com' },
    update: {},
    create: {
      email: 'recipient@example.com',
      passwordHash: recipientPassword,
      firstName: 'Demo',
      lastName: 'Recipient',
      role: 'EMPLOYEE',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Created recipient user:', recipient.email);

  // 3. Create badge template
  const badgeTemplate = await prisma.badgeTemplate.upsert({
    where: { id: 'demo-badge-template-1' },
    update: {},
    create: {
      id: 'demo-badge-template-1',
      name: 'Excellence Award',
      description: 'Awarded for outstanding performance and dedication',
      category: 'Achievement',
      skillIds: [],
      issuanceCriteria: {
        criteria: 'Demonstrated exceptional work quality and team collaboration',
        requirements: ['Complete project successfully', 'Team collaboration']
      },
      imageUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Excellence+Award',
      status: 'ACTIVE',
      validityPeriod: 365,
      createdBy: issuer.id,
    },
  });
  console.log('✅ Created badge template:', badgeTemplate.name);

  // 4. Create a badge with verification fields (Story 6.1 & 6.5)
  const verificationId = '550e8400-e29b-41d4-a716-446655440001';
  
  const badge = await prisma.badge.upsert({
    where: { id: 'demo-badge-1' },
    update: {},
    create: {
      id: 'demo-badge-1',
      recipientId: recipient.id,
      templateId: badgeTemplate.id,
      issuerId: issuer.id,
      status: 'CLAIMED',
      claimToken: 'demo-claim-token-123',
      verificationId: verificationId,
      metadataHash: 'abc123hashfordemopurposes',
      recipientHash: 'sha256hash',
      assertionJson: {
        '@context': 'https://w3id.org/openbadges/v2',
        'type': 'Assertion',
        'id': `http://localhost:3000/api/verification/${verificationId}/assertion`
      },
      issuedAt: new Date(),
      claimedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });
  console.log('✅ Created demo badge:', badge.id);
  console.log('   Verification ID:', badge.verificationId);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Data Summary:');
  console.log('   Issuer: issuer@gcredit.com / password123');
  console.log('   Recipient: recipient@example.com / password123');
  console.log('   Badge Verification ID:', verificationId);
  console.log('   Badge Verification URL: http://localhost:5173/verify/' + verificationId);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
