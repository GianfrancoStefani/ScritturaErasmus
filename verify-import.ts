
import prisma from "./src/lib/prisma";

async function verifyStructure() {
    const project = await prisma.project.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            sections: { include: { modules: true } },
            works: { include: { modules: true } }
        }
    });

    if (!project) {
        console.log("No project found");
        return;
    }

    console.log(`Project: ${project.title} (${project.id})`);
    
    console.log("\n--- WORK PACKAGES ---");
    project.works.forEach(w => {
        console.log(`[WORK] ${w.title} - ${w.modules.length} modules`);
        w.modules.forEach(m => console.log(`  - ${m.title} (Chars: ${m.maxChars})`));
    });

    console.log("\n--- SECTIONS ---");
    project.sections.forEach(s => {
        console.log(`[SECTION] ${s.title} (Order: ${s.order}) - ${s.modules.length} modules`);
        s.modules.forEach(m => console.log(`  - ${m.title} (Chars: ${m.maxChars})`));
    });
}

verifyStructure()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
