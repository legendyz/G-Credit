// Check admin users in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // List users synced from Azure AD
  const azureUsers = await prisma.user.findMany({
    where: { azureId: { not: null } },
    select: { 
      email: true, 
      firstName: true, 
      lastName: true, 
      department: true, 
      role: true,
      azureId: true,
      lastSyncAt: true
    }
  });
  
  console.log('\n=== Azure AD Users Synced ===');
  console.log('Total:', azureUsers.length);
  azureUsers.forEach(u => {
    console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) | Dept: ${u.department || 'N/A'} | Role: ${u.role}`);
  });
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
