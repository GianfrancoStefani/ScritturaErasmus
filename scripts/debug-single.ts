
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const address = "DIETER GORLITZ PLATZ 1, 94469, DEGGENDORF, Germany";
  console.log(`Processing: "${address}"`);

  let city = null;
  const cleanAddress = address.trim();

  // Strategy 1
  const words = cleanAddress.split(/[\s,]+/).filter(w => w.length > 0 && !/\d/.test(w));
  console.log(`Words check: len=${cleanAddress.split(/[\s,]+/).length}`);

  if (cleanAddress.split(/[\s,]+/).length <= 2 && !/\d/.test(cleanAddress)) {
       city = cleanAddress;
       console.log("Strategy 1 matched");
  }
  else {
      // Strategy 2
      const zipRegex = /\b\d{4,6}\b/g;
      const zipMatches = [...cleanAddress.matchAll(zipRegex)];
      console.log(`ZIP matches found: ${zipMatches.length}`);
      
      if (zipMatches.length > 0) {
          const lastZip = zipMatches[zipMatches.length - 1];
          console.log(`Last ZIP: "${lastZip[0]}" at index ${lastZip.index}`);
          
          if (lastZip.index !== undefined) {
               const afterZip = cleanAddress.substring(lastZip.index + lastZip[0].length);
               console.log(`After ZIP raw: "${afterZip}"`);
               
               let candidate = afterZip.trim();
               candidate = candidate.replace(/^[,.\-\s]+/, '');
               console.log(`Candidate filtered: "${candidate}"`);
               
               candidate = candidate.replace(/\(.*\)/, '');
               const parts = candidate.split(',');
               console.log(`Parts: ${JSON.stringify(parts)}`);

               if (parts.length > 0 && parts[0].trim().length > 1) {
                   city = parts[0].trim();
                   console.log(`Selected City: "${city}"`);
               }
          }
      }
  }
}

main();
