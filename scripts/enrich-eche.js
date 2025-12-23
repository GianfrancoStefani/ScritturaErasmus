
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity'); // Need to install this

const prisma = new PrismaClient();

async function main() {
  const excelPath = path.join(process.cwd(), 'universita_europee_ECHE.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`File not found: ${excelPath}`);
    return;
  }

  // Load Excel
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const echeData = XLSX.utils.sheet_to_json(sheet);

  console.log(`Loaded ${echeData.length} rows from ECHE Excel.`);
  if (echeData.length > 0) {
      console.log('Sample Row Keys:', Object.keys(echeData[0]));
      console.log('Sample Row Data:', echeData[0]);
  }

  // Load DB Organizations - Fetch ALL to ensure we don't miss case-sensitive types
  const dbOrgs = await prisma.organization.findMany();
  console.log(`Loaded ${dbOrgs.length} organizations from DB.`);

  let matchCount = 0;
  let updateCount = 0;

  for (const row of echeData) {
      // Map Excel Columns (Assuming standard ECHE headers or inspecting row structure)
      // We will print the first row to verify headers if needed, but let's try standard naming
      // or common ones found in such files.
      // Usually: "Legal Name", "Erasmus Code" (Accreditation Reference?), "OID", "PIC", "Country", "City", "Website"
      
      const name = row['Nome'];
      const city = row['Città'] || row['Town']; // Check if 'Città' exists, debug didn't show it but 'Indirizzo fisico' has it.
      // 'Indirizzo fisico': 'Mühlgasse 67, 2500, Baden, Austria' -> City is part of address.
      // Matches might be harder without clean city.
      const countryName = row['Nazione'];
      const pic = row['PIC'];
      const oid = row['OID'];
      const erasmusCode = row['Codice Erasmus (identificativo)'];
      const website = row['Indirizzo web'];
      const logoUrl = row['Logo (URL, best-effort)'];
      const faviconUrl = row['Favicon (URL, alternativa)'];
      const address = row['Indirizzo fisico'];

      if (!name) continue;

      // Normalization Helper
      const normalize = (str) => {
          return str.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
              .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
      };

      const normName = normalize(name);

      // 1. Strict Normalized Match
      let match = dbOrgs.find(o => normalize(o.name) === normName);

      // 2. Fuzzy Match (if no strict match)
      if (!match) {
           const matches = stringSimilarity.findBestMatch(name, dbOrgs.map(o => o.name));
           if (matches.bestMatch.rating > 0.8) {
               console.log(`Fuzzy match: ${name} -> ${matches.bestMatch.target} (${matches.bestMatch.rating})`);
               match = dbOrgs[matches.bestMatchIndex];
           }
      }
      
      // If we found a match, update it
      if (match) {
          const updateData = {};
          
          if (erasmusCode && (!match.erasmusCode || match.erasmusCode !== erasmusCode)) updateData.erasmusCode = erasmusCode;
          if (oid && (!match.oid || match.oid !== oid.toString())) updateData.oid = oid.toString();
          if (pic && (!match.pic || match.pic !== pic.toString())) updateData.pic = pic.toString();
          
          if (website && !match.website) updateData.website = website;
          // Only update if missing to avoid overwriting good data with bad Excel data
          if (logoUrl && !match.logoUrl) updateData.logoUrl = logoUrl; 
          
          if (faviconUrl && !match.favicon) updateData.favicon = faviconUrl;
          // Enhancing address if missing or if the new one looks more complete (longer)
          if (address && (!match.address || address.length > match.address.length)) updateData.address = address; 
          
          if (faviconUrl && !match.favicon) updateData.favicon = faviconUrl;
          // Enhancing address if missing or if the new one looks more complete (longer)
          if (address && (!match.address || address.length > match.address.length)) updateData.address = address;
          
          if (Object.keys(updateData).length > 0) {
              await prisma.organization.update({
                  where: { id: match.id },
                  data: updateData
              });
              updateCount++;
              if (updateCount % 10 === 0) process.stdout.write('+');
          } else {
              matchCount++; // Start counting matches only if we actually found one, even if no update needed
              process.stdout.write('.');
          }
      }
  }

  console.log(`\nMatching Process Complete.`);
  console.log(`Updated: ${updateCount} records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
