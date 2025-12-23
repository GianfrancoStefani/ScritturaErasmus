
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stringSimilarity = require('string-similarity');

const mockExcelRow = {
  Nome: 'UNIVERSITA DEGLI STUDI DI PADOVA',
  'Indirizzo web': 'https://www.unipd.it',
  'Indirizzo fisico': 'VIA 8 FEBBRAIO 2, 35122, PADOVA, Italy',
  'Logo (URL, best-effort)': 'https://logo.clearbit.com/unipd.it'
};

const normalize = (str) => {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
};

async function test() {
    const dbOrg = await prisma.organization.findFirst({
        where: { name: { contains: 'Padova', mode: 'insensitive' } }
    });
    
    if (!dbOrg) {
        console.log('DB Org not found');
        return;
    }

    console.log(`DB Name: ${dbOrg.name}`);
    console.log(`DB Address: ${dbOrg.address}`);
    
    const excelName = mockExcelRow['Nome'];
    const normExcel = normalize(excelName);
    const normDB = normalize(dbOrg.name);
    
    console.log(`Norm Excel: ${normExcel}`);
    console.log(`Norm DB:    ${normDB}`);
    console.log(`Match Strict? ${normExcel === normDB}`);
    
    if (normExcel !== normDB) {
        const matches = stringSimilarity.findBestMatch(excelName, [dbOrg.name]);
        console.log(`Fuzzy Score: ${matches.bestMatch.rating}`);
    }
    
    // Logic Check
    const address = mockExcelRow['Indirizzo fisico'];
    if (address && (!dbOrg.address || address.length > dbOrg.address.length)) {
        console.log(`Should update address to: ${address}`);
    } else {
        console.log('Should NOT update address');
    }
    
    // Do update
    if (address && (!dbOrg.address || address.length > dbOrg.address.length)) {
        await prisma.organization.update({
            where: { id: dbOrg.id },
            data: { address: address }
        });
        console.log('Updated!');
    }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
