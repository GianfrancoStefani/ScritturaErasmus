
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const org = await prisma.organization.findFirst({
        where: { name: { contains: 'Padova', mode: 'insensitive' } }
    });
    
    console.log('--- PADOVA CHECK ---');
    if (org) {
        console.log(`Name: ${org.name}`);
        console.log(`Address: ${org.address}`); // Should be "VIA 8 FEBBRAIO 2..."
        console.log(`Website: ${org.website}`);
        console.log(`Erasmus: ${org.erasmusCode}`);
    } else {
        console.log('Not found');
    }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
