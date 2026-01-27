import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating badge template images...\n');

  // Update Outstanding Performance
  const template1 = await prisma.badgeTemplate.updateMany({
    where: { name: 'Outstanding Performance' },
    data: {
      imageUrl: 'https://picsum.photos/400/400?random=1',
    },
  });
  console.log(`✅ Updated ${template1.count} template(s): Outstanding Performance`);

  // Update Team Player
  const template2 = await prisma.badgeTemplate.updateMany({
    where: { name: 'Team Player' },
    data: {
      imageUrl: 'https://picsum.photos/400/400?random=2',
    },
  });
  console.log(`✅ Updated ${template2.count} template(s): Team Player`);

  console.log('\n✅ All badge images updated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
