
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const org = await prisma.organization.findFirst({
        where: { name: { contains: 'Padova', mode: 'insensitive' } }
    });
    
    console.log('--- PADOVA CHECK ---');
    if (org) {
        console.log(`Name: ${org.name}`);
        console.log(`Type: ${org.type}`);
        console.log(`Address: ${org.address}`);
        console.log(`Website: ${org.website}`);
    } else {
        console.log('Not found');
    }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
