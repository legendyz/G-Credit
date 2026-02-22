import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sprint 2: Seed 5 System-Defined Skill Categories
 * 
 * Categories:
 * 1. Technical Skills
 * 2. Soft Skills
 * 3. Domain Knowledge
 * 4. Company-Specific Competencies - User's custom addition
 * 5. Professional Skills
 */
async function seedSkillCategories() {
  console.log('🌱 Seeding skill categories...\n');

  const categories = [
    {
      name: 'Technical Skills',
      nameEn: 'Technical Skills',
      description: 'Programming, development tools, cloud platforms and other technical competencies',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 1,
      children: [
        { name: 'Programming Languages', nameEn: 'Programming Languages', level: 2, displayOrder: 1 },
        { name: 'Development Tools', nameEn: 'Development Tools', level: 2, displayOrder: 2 },
        { name: 'Cloud Platforms', nameEn: 'Cloud Platforms', level: 2, displayOrder: 3 },
        { name: 'Databases', nameEn: 'Databases', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: 'Soft Skills',
      nameEn: 'Soft Skills',
      description: 'Communication, leadership, teamwork and other interpersonal competencies',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 2,
      children: [
        { name: 'Communication', nameEn: 'Communication', level: 2, displayOrder: 1 },
        { name: 'Leadership', nameEn: 'Leadership', level: 2, displayOrder: 2 },
        { name: 'Teamwork', nameEn: 'Teamwork', level: 2, displayOrder: 3 },
        { name: 'Problem Solving', nameEn: 'Problem Solving', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: 'Domain Knowledge',
      nameEn: 'Domain Knowledge',
      description: 'Industry-specific professional knowledge and experience',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 3,
      children: [
        { name: 'Finance', nameEn: 'Finance', level: 2, displayOrder: 1 },
        { name: 'Healthcare', nameEn: 'Healthcare', level: 2, displayOrder: 2 },
        { name: 'Education', nameEn: 'Education', level: 2, displayOrder: 3 },
        { name: 'Manufacturing', nameEn: 'Manufacturing', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: 'Company-Specific Competencies',
      nameEn: 'Company-Specific Competencies',
      description: 'Corporate culture, internal processes, proprietary tools and other company-specific competencies',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 4,
      children: [
        { name: 'Corporate Culture', nameEn: 'Corporate Culture', level: 2, displayOrder: 1 },
        { name: 'Internal Processes', nameEn: 'Internal Processes', level: 2, displayOrder: 2 },
        { name: 'Proprietary Tools', nameEn: 'Proprietary Tools', level: 2, displayOrder: 3 },
        { name: 'Compliance', nameEn: 'Compliance', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: 'Professional Skills',
      nameEn: 'Professional Skills',
      description: 'Project management, data analysis and other cross-industry professional skills',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 5,
      children: [
        { name: 'Project Management', nameEn: 'Project Management', level: 2, displayOrder: 1 },
        { name: 'Data Analysis', nameEn: 'Data Analysis', level: 2, displayOrder: 2 },
        { name: 'Business Presentation', nameEn: 'Business Presentation', level: 2, displayOrder: 3 },
        { name: 'Time Management', nameEn: 'Time Management', level: 2, displayOrder: 4 },
      ],
    },
  ];

  for (const category of categories) {
    const { children, ...parentData } = category;

    console.log(`📁 Creating category: ${category.name} (${category.nameEn})`);
    
    const parent = await prisma.skillCategory.create({
      data: parentData,
    });

    console.log(`   ✅ Created parent category: ${parent.id}`);

    // Create child categories
    for (const child of children) {
      const childCategory = await prisma.skillCategory.create({
        data: {
          ...child,
          parentId: parent.id,
          isSystemDefined: true,
          isEditable: false,
        },
      });
      console.log(`   📄 Created child: ${child.name} (${childCategory.id})`);
    }

    console.log('');
  }

  console.log('✅ Skill category seeding completed!\n');
}

async function seedSampleSkills() {
  console.log('🌱 Seeding sample skills...\n');

  // Find "Programming Languages" category
  const programmingCategory = await prisma.skillCategory.findFirst({
    where: { name: 'Programming Languages' },
  });

  if (programmingCategory) {
    console.log('📁 Creating skills for: Programming Languages');
    
    const skills = [
      { name: 'JavaScript', level: 'INTERMEDIATE' },
      { name: 'TypeScript', level: 'INTERMEDIATE' },
      { name: 'Python', level: 'BEGINNER' },
      { name: 'Java', level: 'ADVANCED' },
      { name: 'Go', level: 'BEGINNER' },
    ];

    for (const skill of skills) {
      const created = await prisma.skill.create({
        data: {
          name: skill.name,
          categoryId: programmingCategory.id,
          level: skill.level as any,
        },
      });
      console.log(`   ✅ Created skill: ${created.name} (${created.level})`);
    }
  }

  // Find "Cloud Platforms" category
  const cloudCategory = await prisma.skillCategory.findFirst({
    where: { name: 'Cloud Platforms' },
  });

  if (cloudCategory) {
    console.log('\n📁 Creating skills for: Cloud Platforms');
    
    const skills = [
      { name: 'Azure', level: 'INTERMEDIATE' },
      { name: 'AWS', level: 'BEGINNER' },
      { name: 'Google Cloud', level: 'BEGINNER' },
    ];

    for (const skill of skills) {
      const created = await prisma.skill.create({
        data: {
          name: skill.name,
          categoryId: cloudCategory.id,
          level: skill.level as any,
        },
      });
      console.log(`   ✅ Created skill: ${created.name} (${created.level})`);
    }
  }

  console.log('\n✅ Sample skills seeding completed!\n');
}

async function main() {
  try {
    console.log('🚀 Starting Sprint 2 seed script...\n');

    // Check if categories already exist
    const existingCategories = await prisma.skillCategory.count({
      where: { isSystemDefined: true, level: 1 },
    });

    if (existingCategories > 0) {
      console.log(`⚠️  Found ${existingCategories} existing system categories.`);
      console.log('⚠️  Skipping seed to avoid duplicates.\n');
      console.log('To reseed, delete existing categories first:');
      console.log('   npx prisma studio\n');
      return;
    }

    await seedSkillCategories();
    await seedSampleSkills();

    // Summary
    const totalCategories = await prisma.skillCategory.count();
    const totalSkills = await prisma.skill.count();

    console.log('📊 Seeding Summary:');
    console.log(`   Categories: ${totalCategories} (5 top-level, 20 sub-categories)`);
    console.log(`   Skills: ${totalSkills}`);
    console.log('\n🎉 All done!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
