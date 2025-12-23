
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'prisma', 'universities.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('prisma/universities.json not found. Run scraper first.');
    return;
  }

  const data = fs.readFileSync(jsonPath, 'utf-8');
  const universities = JSON.parse(data);

  console.log(`Loading ${universities.length} universities into DB...`);

  let count = 0;
  for (const uni of universities) {
    // Check if exists by name
    const existing = await prisma.organization.findFirst({
      where: { name: uni.name }
    });

    if (!existing) {
      await prisma.organization.create({
        data: {
          name: uni.name,
          nation: uni.country, // 2-letter code
          type: 'UNIVERSITY',
          address: uni.city, // Storing city in address for now or we could add city field
          website: uni.website,
          // logoUrl: uni.logoUrl // If we had it
        }
      });
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\nImported ${count} new universities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
