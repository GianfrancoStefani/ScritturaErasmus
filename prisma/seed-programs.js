const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ka2 = await prisma.program.upsert({
    where: { code: 'KA220' },
    update: {},
    create: {
      code: 'KA220',
      name: 'Cooperation partnerships in vocational education and training',
      allowedDurations: [12, 24, 36, 48, 60],
      allowedBudgets: [120000, 250000, 400000],
      nationalAgencies: {
        "IT": "INDIRE",
        "DE": "NA-BIBB",
        "ES": "SEPIE",
        "FR": "Agence Erasmus+ France",
        "PT": "Erasmus+ Educação e Formação"
      }
    }
  });
  console.log('Created Program:', ka2.code);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
