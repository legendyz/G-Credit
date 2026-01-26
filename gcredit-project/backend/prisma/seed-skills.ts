import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sprint 2: Seed 5 System-Defined Skill Categories
 * 
 * Categories:
 * 1. 技术技能 (Technical Skills)
 * 2. 软技能 (Soft Skills)
 * 3. 行业知识 (Domain Knowledge)
 * 4. 公司特定能力 (Company-Specific Competencies) - User's custom addition
 * 5. 通用职业技能 (Professional Skills)
 */
async function seedSkillCategories() {
  console.log('🌱 Seeding skill categories...\n');

  const categories = [
    {
      name: '技术技能',
      nameEn: 'Technical Skills',
      description: '编程、开发工具、云平台等技术相关能力',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 1,
      children: [
        { name: '编程语言', nameEn: 'Programming Languages', level: 2, displayOrder: 1 },
        { name: '开发工具', nameEn: 'Development Tools', level: 2, displayOrder: 2 },
        { name: '云平台', nameEn: 'Cloud Platforms', level: 2, displayOrder: 3 },
        { name: '数据库', nameEn: 'Databases', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: '软技能',
      nameEn: 'Soft Skills',
      description: '沟通、领导力、团队协作等人际交往能力',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 2,
      children: [
        { name: '沟通能力', nameEn: 'Communication', level: 2, displayOrder: 1 },
        { name: '领导力', nameEn: 'Leadership', level: 2, displayOrder: 2 },
        { name: '团队协作', nameEn: 'Teamwork', level: 2, displayOrder: 3 },
        { name: '问题解决', nameEn: 'Problem Solving', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: '行业知识',
      nameEn: 'Domain Knowledge',
      description: '特定行业的专业知识与经验',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 3,
      children: [
        { name: '金融', nameEn: 'Finance', level: 2, displayOrder: 1 },
        { name: '医疗', nameEn: 'Healthcare', level: 2, displayOrder: 2 },
        { name: '教育', nameEn: 'Education', level: 2, displayOrder: 3 },
        { name: '制造', nameEn: 'Manufacturing', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: '公司特定能力',
      nameEn: 'Company-Specific Competencies',
      description: '企业文化、内部流程、专有工具等公司特有的能力要求',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 4,
      children: [
        { name: '企业文化', nameEn: 'Corporate Culture', level: 2, displayOrder: 1 },
        { name: '内部流程', nameEn: 'Internal Processes', level: 2, displayOrder: 2 },
        { name: '专有工具', nameEn: 'Proprietary Tools', level: 2, displayOrder: 3 },
        { name: '合规要求', nameEn: 'Compliance', level: 2, displayOrder: 4 },
      ],
    },
    {
      name: '通用职业技能',
      nameEn: 'Professional Skills',
      description: '项目管理、数据分析等跨行业的通用职业技能',
      level: 1,
      isSystemDefined: true,
      isEditable: false,
      displayOrder: 5,
      children: [
        { name: '项目管理', nameEn: 'Project Management', level: 2, displayOrder: 1 },
        { name: '数据分析', nameEn: 'Data Analysis', level: 2, displayOrder: 2 },
        { name: '商务演讲', nameEn: 'Business Presentation', level: 2, displayOrder: 3 },
        { name: '时间管理', nameEn: 'Time Management', level: 2, displayOrder: 4 },
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

  // Find "编程语言" category
  const programmingCategory = await prisma.skillCategory.findFirst({
    where: { name: '编程语言' },
  });

  if (programmingCategory) {
    console.log('📁 Creating skills for: 编程语言');
    
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

  // Find "云平台" category
  const cloudCategory = await prisma.skillCategory.findFirst({
    where: { name: '云平台' },
  });

  if (cloudCategory) {
    console.log('\n📁 Creating skills for: 云平台');
    
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
