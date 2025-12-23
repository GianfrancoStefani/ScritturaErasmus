
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill of city from address...");
  const orgs = await prisma.organization.findMany({
    where: {
      address: {
        not: null
      }
    }
  });

  console.log(`Found ${orgs.length} organizations to process.`);

  let updatedCount = 0;

  for (const org of orgs) {
    if (!org.address) continue;

    // Heuristics to extract city
    // 1. If address contains commas, assume last part is city/country or city?
    // Often address is "Via Roma 1, 00100 Rome, Italy"
    // Let's look for known patterns or just take the whole address if it looks short (which is unlikely).
    
    // Simple heuristic: Try to find a city in the address string.
    // This is hard without a library. 
    // User asked to "cercare di estrarre". 
    // Let's assume standard Italian format: "Via X, CAP City (Prov)"
    // We can try to regex for the part after the ZIP code (5 digits).
    
    // Regex for Italian ZIP: \b\d{5}\b
    // If found, take the text AFTER it until comma or end.
    
    let city = null;
    const cleanAddress = org.address.trim();

    // Strategy 1: Short address (1-2 words) is likely just the City
    if (cleanAddress.split(/[\s,]+/).length <= 2 && !/\d/.test(cleanAddress)) {
         city = cleanAddress;
    }
    else {
        // Strategy 2: Find right-most ZIP (4-6 digits)
        const zipMatches = [...cleanAddress.matchAll(/\b\d{4,6}\b/g)];
        
        if (zipMatches.length > 0) {
            const lastZip = zipMatches[zipMatches.length - 1];
            
            if (lastZip.index !== undefined) {
                 const afterZip = cleanAddress.substring(lastZip.index + lastZip[0].length);
                 
                 let candidate = afterZip.trim();
                 candidate = candidate.replace(/^[,.\-\s]+/, '');
                 candidate = candidate.replace(/\(.*\)/, '');
                 
                 const parts = candidate.split(',');
                 if (parts.length > 0 && parts[0].trim().length > 1) {
                     city = parts[0].trim();
                 }
            }
        }
    }

    // Additional Cleanup: Capitalize
    if (city) {
        city = city.replace(/\bCEDEX\b/gi, '').trim();
        city = city.replace(/[^\w\sÀ-ÿ'-]/g, '').trim(); 
        if (city && (city === city.toUpperCase() || city === city.toLowerCase())) {
            city = city.toLowerCase().replace(/(?:^|\s|['-])\S/g, (a: string) => a.toUpperCase());
        }
    }

    if (city && city.length > 1) {
        // console.log(`Org "${org.name}": Extracted city "${city}"`);
        await prisma.organization.update({
            where: { id: org.id },
            data: { city: city }
        });
        updatedCount++;
    }
  }

  console.log(`Backfill complete. Updated ${updatedCount} organizations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
