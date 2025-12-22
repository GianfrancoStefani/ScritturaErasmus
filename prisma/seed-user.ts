const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prismaClient = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create Leader User
  
  // Create a dummy partner if not exists (User needs a partner relation)
  const project = await prismaClient.project.findFirst();
  let projectId = project?.id;
  
  if (!projectId) {
      // Emergency project creation if none exists
      const newProject = await prismaClient.project.create({
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

  let partner = await prismaClient.partner.findFirst({ where: { projectId } });
  if (!partner) {
      partner = await prismaClient.partner.create({
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
    const existingUser = await prismaClient.user.findUnique({
        where: { email: 'admin@scrituraerasmus.com' }
    });

    if (!existingUser) {
        const user = await prismaClient.user.create({
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
        console.log("User already exists:", existingUser);
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
