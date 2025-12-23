const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUrl(url) {
    if (!url) return false;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(url, { 
            method: 'HEAD', 
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36' }
        });
        clearTimeout(timeoutId);
        
        return response.ok; // 200-299 range
    } catch (e) {
        return false;
    }
}

async function main() {
    console.log("Fetching organizations with favicons...");
    const orgs = await prisma.organization.findMany({
        where: {
            favicon: { not: null }
        },
        select: { id: true, name: true, favicon: true }
    });

    console.log(`Found ${orgs.length} organizations to check.`);

    let validCount = 0;
    let removedCount = 0;

    for (const org of orgs) {
        if (!org.favicon) continue;
        
        const isValid = await checkUrl(org.favicon);
        
        if (!isValid) {
            console.log(`[X] Invalid favicon for ${org.name}: ${org.favicon} -> Removing...`);
            await prisma.organization.update({
                where: { id: org.id },
                data: { favicon: null }
            });
            removedCount++;
        } else {
            // console.log(`[OK] ${org.name}`);
            validCount++;
        }
        
        // Small delay to be polite
        if (validCount % 20 === 0) process.stdout.write('.');
    }

    console.log("\nDone.");
    console.log(`Valid: ${validCount}`);
    console.log(`Removed: ${removedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
