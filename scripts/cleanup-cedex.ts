
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up CEDEX from city names...");
  const orgs = await prisma.organization.findMany({
    where: {
      city: { contains: 'CEDEX', mode: 'insensitive' }
    }
  });

  console.log(`Found ${orgs.length} organizations with CEDEX in city.`);

  let updatedCount = 0;

  for (const org of orgs) {
    if (!org.city) continue;

    const originalCity = org.city;
    // Remove "CEDEX" word, case insensitive. 
    // \bCEDEX\b matches whole word.
    // Also remove digits that might follow if they are just like "Cedex 13"?
    // User said "elimia ... le parole = CEDEX".
    // I will replace "CEDEX" (and surrounding spaces) with empty string.
    
    let newCity = originalCity.replace(/\bCEDEX\b/gi, '').trim();
    
    // Clean up potential double spaces
    newCity = newCity.replace(/\s+/g, ' ');

    if (newCity !== originalCity) {
        console.log(`Org "${org.name}": "${originalCity}" -> "${newCity}"`);
        
        if (newCity.length > 0) {
            await prisma.organization.update({
                where: { id: org.id },
                data: { city: newCity }
            });
            updatedCount++;
        }
    }
  }

  console.log(`Cleanup complete. Updated ${updatedCount} organizations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
