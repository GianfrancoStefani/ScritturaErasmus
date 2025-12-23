const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Migrating website -> unirankUrl...");
    
    // Find organizations where website contains "unirank" or "4icu" and unirankUrl is empty
    const orgs = await prisma.organization.findMany({
        where: {
            website: { contains: 'unirank' }
        }
    });

    console.log(`Found ${orgs.length} orgs with 'unirank' in website.`);

    let count = 0;
    for (const org of orgs) {
        // If unirankUrl is empty, move it
        if (!org.unirankUrl) {
            await prisma.organization.update({
                where: { id: org.id },
                data: {
                    unirankUrl: org.website,
                    website: null // Clear website to be ready for real import (or keep it? User said "rinomina", so implies moving it)
                }
            });
            count++;
            process.stdout.write('.');
        }
    }
    
    console.log(`\nMigrated ${count} records.`);
    
    // Also handle 4icu.org if any
     const orgs4icu = await prisma.organization.findMany({
        where: {
            website: { contains: '4icu.org' }
        }
    });
     console.log(`Found ${orgs4icu.length} orgs with '4icu' in website.`);
      for (const org of orgs4icu) {
        if (!org.unirankUrl && org.website) {
            await prisma.organization.update({
                where: { id: org.id },
                data: {
                    unirankUrl: org.website,
                    website: null
                }
            });
            count++;
            process.stdout.write('+');
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
