
import prisma from "./src/lib/prisma";

async function verifyPopups() {
    const modules = await prisma.module.findMany({
        where: { type: "POPUP" },
        select: { id: true, title: true, type: true, options: true, maxSelections: true }
    });

    console.log(`Found ${modules.length} POPUP modules.`);
    modules.forEach(m => {
        console.log(`[${m.type}] ${m.title}`);
        console.log(`  Options: ${m.options}`);
        console.log(`  Max: ${m.maxSelections}`);
    });
}

verifyPopups()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
