const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create a dummy partner if not exists (User needs a partner relation)
  const project = await prisma.project.findFirst();
  let projectId = project?.id;
  
  if (!projectId) {
      // Emergency project creation if none exists
      const newProject = await prisma.project.create({
          data: {
              title: "Seed Project",
              titleEn: "Seed Project",
              acronym: "SEED",
              startDate: new Date(),
              endDate: new Date(),
              duration: 12,
              nationalAgency: "IT02",
              language: "en"
          }
      });
      projectId = newProject.id;
  }

  let partner = await prisma.partner.findFirst({ where: { projectId } });
  if (!partner) {
      partner = await prisma.partner.create({
          data: {
              projectId: projectId,
              name: "Seed Partner",
              nation: "IT",
              city: "Rome",
              role: "COORDINATOR",
              type: "NGO",
              budget: 0
          }
      })
  }

    // Check if user exists first to avoid unique constraint errors if re-running
    const existingUser = await prisma.user.findUnique({
        where: { email: 'admin@scrituraerasmus.com' }
    });

    if (!existingUser) {
        const user = await prisma.user.create({
            data: {
            email: 'admin@scrituraerasmus.com',
            username: 'admin',
            password: hashedPassword,
            name: 'Admin User',
            surname: 'System',
            role: 'ADMIN',
            partnerId: partner.id
            },
        });
        console.log("User created:", user);
    } else {
        console.log("User already exists, skipping creation.");
    }
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
