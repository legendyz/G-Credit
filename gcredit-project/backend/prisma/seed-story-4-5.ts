import { PrismaClient, UserRole, TemplateStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for Story 4.5 Email Testing...\n');

  // 1. Create Admin User
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('Admin123!@#', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gcredit.com' },
    update: {},
    create: {
      email: 'admin@gcredit.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 2. Create Employee User (for testing email)
  console.log('\nCreating employee user...');
  const employeePassword = await bcrypt.hash('Employee123!', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@gcredit.com' },
    update: {},
    create: {
      email: 'employee@gcredit.com',
      passwordHash: employeePassword,
      role: UserRole.EMPLOYEE,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
    },
  });
  console.log('✅ Employee created:', employee.email);

  // 3. Create Badge Template
  console.log('\nCreating badge template...');
  const template = await prisma.badgeTemplate.create({
    data: {
      name: 'Outstanding Performance',
      description: 'Awarded to employees who demonstrate exceptional performance and dedication to their work.',
      // Using a reliable CDN image (picsum.photos is widely accessible)
      imageUrl: 'https://picsum.photos/400/400?random=1',
      status: TemplateStatus.ACTIVE,
      category: 'Performance',
      skillIds: [],
      issuanceCriteria: {
        requirements: [
          'Consistently exceeds performance targets',
          'Demonstrates leadership qualities',
          'Positive impact on team morale',
        ],
      },
      validityPeriod: 365,
      createdBy: admin.id,
    },
  });
  console.log('✅ Template created:', template.name);

  // 4. Create another template
  console.log('\nCreating second badge template...');
  const template2 = await prisma.badgeTemplate.create({
    data: {
      name: 'Team Player',
      description: 'Recognizes individuals who excel at collaboration and supporting their teammates.',
      // Using a different random image
      imageUrl: 'https://picsum.photos/400/400?random=2',
      status: TemplateStatus.ACTIVE,
      category: 'Teamwork',
      skillIds: [],
      issuanceCriteria: {
        requirements: [
          'Excellent collaboration skills',
          'Supports team members',
          'Contributes to positive team culture',
        ],
      },
      validityPeriod: 365,
      createdBy: admin.id,
    },
  });
  console.log('✅ Template created:', template2.name);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@gcredit.com');
  console.log('     Password: Admin123!@#');
  console.log('   Employee:');
  console.log('     Email: employee@gcredit.com');
  console.log('     Password: Employee123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
