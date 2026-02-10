const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function q() {
  const files = await p.evidenceFile.findMany({
    include: {
      badge: {
        select: {
          id: true, status: true,
          template: { select: { name: true } },
          recipient: { select: { email: true, firstName: true, lastName: true } }
        }
      }
    }
  });
  files.forEach(e => console.log(
    e.badge.template.name, '|', e.badge.status, '|',
    e.badge.recipient.email, '|', e.fileName
  ));
  await p.$disconnect();
}
q();
