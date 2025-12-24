
import prisma from './src/lib/prisma';

async function main() {
    const projectId = 'cmjhik6jk0025ad4aomivzx5s';
    
    console.log("Checking Project Members...");
    const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
    });
    console.log("Project Members:", members.map((m: any) => `${m.user.name} ${m.user.surname} (${m.role})`));

    console.log("\nChecking Specific Users (Davide, Matteo)...");
    const users = await prisma.user.findMany({
        where: {
            name: { in: ['Davide', 'Matteo'] } // Case sensitive check, maybe ilike? but prisma standard
        }
    });
    console.log("Found Users:", users);
    
    if (users.length > 0) {
        const userIds = users.map((u: any) => u.id);
        const memberships = await prisma.projectMember.findMany({
            where: {
                userId: { in: userIds },
                projectId
            }
        });
        console.log("\nMemberships for these users in project:", memberships);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
