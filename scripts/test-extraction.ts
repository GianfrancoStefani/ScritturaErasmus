
const samples = [
  "Via Festa Del Perdono 7, 20122, MILANO, Italy",
  "VIA GIUSEPPE VERDI 8, 10124, TORINO, Italy",
  "Pisa",
  "CORSO DUCA DEGLI ABRUZZI 24, 10129, TORINO, Italy",
  "Piazza San Marco  4, 50121, Florence, Italy",
  "CORSO UMBERTO I, 40, 80138, NAPOLI, Italy",
  "VIA CALEPINA 14, 38122, TRENTO, Italy",
  "Venice",
  "VIA BALBI 5, 16126, GENOVA, Italy"
];

function extractCity(address: string) {
    let city = null;
    const cleanAddress = address.trim();
    const words = cleanAddress.split(/[\s,]+/).filter(w => w.length > 0 && !/\d/.test(w));

    // Strategy 1: Short address (1-2 words) is likely just the City
    if (cleanAddress.split(/[\s,]+/).length <= 2 && !/\d/.test(cleanAddress)) {
         city = cleanAddress;
         console.log(`[Strategy 1] "${address}" -> "${city}"`);
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
                     console.log(`[Strategy 2] "${address}" -> ZIP:${lastZip[0]} After:"${afterZip}" -> "${city}"`);
                 } else {
                     console.log(`[Strategy 2 FAIL] "${address}" -> ZIP:${lastZip[0]} After:"${afterZip}" -> Candidate:"${candidate}"`);
                 }
            }
        } else {
             console.log(`[No ZIP] "${address}"`);
        }
    }

    if (city) {
        city = city.replace(/[^\w\sÀ-ÿ'-]/g, '').trim(); 
        if (city && (city === city.toUpperCase() || city === city.toLowerCase())) {
            city = city.toLowerCase().replace(/(?:^|\s|['-])\S/g, (a) => a.toUpperCase());
        }
    }
    return city;
}

console.log("Testing Extraction Logic:");
samples.forEach(s => {
    const res = extractCity(s);
    console.log(`Final: "${res}"\n---`);
});
