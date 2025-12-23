
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    where: {
      address: { not: null }
    },
    take: 20,
    select: { name: true, address: true, city: true }
  });

  console.log("Sample Organization Addresses:");
  orgs.forEach(org => {
     console.log(`Name: ${org.name}`);
     console.log(`Address: "${org.address}"`);
     console.log(`City (current): "${org.city}"`);
     console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
