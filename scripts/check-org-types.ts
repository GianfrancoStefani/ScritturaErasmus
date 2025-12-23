
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.organization.findMany({
    select: { type: true, scopeProjectId: true, name: true },
    take: 50
  });
  console.log("Found Organizations:", types);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
