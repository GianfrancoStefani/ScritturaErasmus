
import prisma from './src/lib/prisma';

async function main() {
    const projectId = 'cmjhik6jk0025ad4aomivzx5s';
    const targetNames = ['Davide', 'Matteo'];

    console.log(`Searching for users: ${targetNames.join(', ')}...`);
    const users = await prisma.user.findMany({
        where: {
            name: { in: targetNames }
        },
        include: {
            affiliations: true
        }
    });

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`\nProcessing ${user.name} ${user.surname} (${user.id})...`);
        
        // Check if already member
        const existing = await prisma.projectMember.findFirst({
            where: {
                userId: user.id,
                projectId
            }
        });

        if (existing) {
            console.log(`- Already a member (Role: ${existing.role}). Skipping.`);
            continue;
        }

        // Find a partner ID for this user. 
        // We'll use their first affiliation's organization/partner ID if available.
        // If UserAffiliation links to Organization, we need to map Organization -> Partner for this project?
        // Or does ProjectMember link to a Partner that is already part of the project?
        
        // Let's see what partners are in the project
        const projectPartners = await prisma.partner.findMany({
            where: { projectId }
        });

        // Heuristic: Try to match User's affiliation Organization ID to a Partner's Organization ID?
        // Or just assign to the first available partner for now to fix the visibility issue, 
        // as the user just wants them "available".
        
        // Better: Check if they have an affiliation that matches a partner in the project.
        let targetPartnerId = projectPartners[0]?.id; // Fallback
        
        // If we can't match, we just add them. But ProjectMember might require partnerId?
        // Let's check schema via code completion mental model or just try.
        // ProjectMember usually acts as the link.
        
        if (projectPartners.length === 0) {
            console.error("- No partners in project! Cannot assign.");
            continue;
        }

        console.log(`- Assigning to Partner: ${projectPartners[0].name} (ID: ${targetPartnerId})`);

        await prisma.projectMember.create({
            data: {
                projectId,
                userId: user.id,
                partnerId: targetPartnerId,
                role: 'MEMBER'
            }
        });
        console.log("- Successfully added to project.");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
