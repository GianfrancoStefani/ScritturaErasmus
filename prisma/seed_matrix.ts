import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Matrix Migration...');

  // 1. Migrate Partners -> Organizations
  const partners = await prisma.partner.findMany();
  console.log(`Found ${partners.length} partners.`);

  for (const partner of partners) {
    if (partner.organizationId) continue;

    console.log(`Processing Partner: ${partner.name}`);
    
    // Check if Org exists (by name matching for reuse?)
    // For now, simple 1-to-1 migration to be safe, or name match.
    // Let's do simple name match.
    let org = await prisma.organization.findFirst({
        where: { name: partner.name }
    });

    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: partner.name,
                type: partner.type,
            }
        });
        console.log(`Created Organization: ${org.name}`);
    }

    // Link Partner to Org
    await prisma.partner.update({
        where: { id: partner.id },
        data: { organizationId: org.id }
    });
  }

  // 2. Migrate Users -> ProjectMember
  const users = await prisma.user.findMany({
      include: { partner: true }
  });
  console.log(`Found ${users.length} users.`);

  for (const user of users) {
      if (!user.partnerId || !user.partner) {
          console.warn(`User ${user.email} has no partnerId. Skipping membership.`);
          continue;
      }

      const partner = user.partner;
      const projectId = partner.projectId;

      // Check if Member exists
      const existingMember = await prisma.projectMember.findUnique({
          where: {
              userId_projectId: {
                  userId: user.id,
                  projectId: projectId
              }
          }
      });

      if (!existingMember) {
          await prisma.projectMember.create({
              data: {
                  userId: user.id,
                  projectId: projectId,
                  partnerId: partner.id,
                  role: user.role,
                  // No department for legacy migration
              }
          });
          console.log(`Created ProjectMember for ${user.email} in Project ${projectId}`);
      }

      // 3. Seed Availability (2025, 2026, 2027)
      const years = [2025, 2026, 2027];
      for (const year of years) {
          const avail = await prisma.userAvailability.findUnique({
              where: {
                  userId_year: { userId: user.id, year }
              }
          });

          if (!avail) {
              await prisma.userAvailability.create({
                  data: {
                      userId: user.id,
                      year: year,
                      // Default 20 days/month? Or 0? Plan said simplified logic.
                      // Let's set default 0 and let them edit.
                  }
              });
          }
      }
  }

  console.log('Migration Completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
