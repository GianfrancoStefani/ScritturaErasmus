const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const GROUP_1 = {
    area: "Group 1",
    rate: 241,
    countries: ["Austria", "Belgium", "Denmark", "Finland", "France", "Germany", "Ireland", "Iceland", "Italy", "Liechtenstein", "Luxembourg", "Norway", "Netherlands", "Sweden"]
};

const GROUP_2 = {
    area: "Group 2",
    rate: 137,
    countries: ["Czechia", "Cyprus", "Estonia", "Greece", "Latvia", "Malta", "Portugal", "Slovakia", "Slovenia", "Spain"]
};

const GROUP_3 = {
    area: "Group 3",
    rate: 74,
    countries: ["Bulgaria", "Croatia", "Lithuania", "North Macedonia", "Poland", "Romania", "Serbia", "Turkey", "Hungary"]
};

const GROUPS = [GROUP_1, GROUP_2, GROUP_3];
const DEFAULT_ROLE = "Researcher";

async function main() {
    console.log(`Start seeding daily rates...`);

    for (const group of GROUPS) {
        for (const country of group.countries) {
            await prisma.standardCost.upsert({
                where: {
                    nation_role: {
                        nation: country,
                        role: DEFAULT_ROLE
                    }
                },
                update: {
                    area: group.area,
                    dailyRate: group.rate
                },
                create: {
                    area: group.area,
                    nation: country,
                    role: DEFAULT_ROLE,
                    dailyRate: group.rate
                }
            });
        }
    }
    console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
