
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Axios uses http/https in Node, usually safe.

const BASE_URL = 'https://www.unirank.org';
const EUROPE_URL = `${BASE_URL}/europe/`;

// Top Erasmus countries
const TARGET_COUNTRIES = [
    'it', 'fr', 'de', 'es', 'pl', 'nl', 'be', 'se', 'at', 'ie', 'pt', 'gr', 'cz', 'dk', 'fi', 'hu', 'no', 'ro', 'bg', 'hr'
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeUniversities() {
    console.log('Starting European Universities scrape (No Cheerio)...');
    const allUniversities = [];

    for (const code of TARGET_COUNTRIES) {
        try {
            const url = `${BASE_URL}/${code}/ranking/`;
            console.log(`Fetching ${url}...`);
            

            try {
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36' }
                });
                let html = response.data;
                
                // Normalize whitespace to single line for easier regex
                html = html.replace(/\s+/g, ' ');

                // Find rows (<tr>...</tr>)
                // Use a non-greedy match for table rows
                const rowMatches = html.match(/<tr[^>]*>.*?<\/tr>/g);
                
                let count = 0;
                
                if (rowMatches) {
                    for (const row of rowMatches) {
                        // Extract cells
                        const cells = row.match(/<td[^>]*>.*?<\/td>/g);
                        
                        if (cells && cells.length >= 3) {
                             // Clean tags function
                             const clean = (str) => str.replace(/<[^>]*>/g, '').trim().replace(/&amp;/g, '&');
                             const extractHref = (str) => {
                                 const m = str.match(/href="([^"]*)"/);
                                 return m ? m[1] : null;
                             };

                            const rankText = clean(cells[0]); // Rank is usually in first col: <b>1</b>
                            const nameHtml = cells[1];
                            const townHtml = cells[2];
                            
                            const rank = parseInt(rankText, 10);
                            const name = clean(nameHtml);
                            const town = clean(townHtml);
                            const href = extractHref(nameHtml);

                            if (name && !isNaN(rank) && rank > 0 && href) {
                                allUniversities.push({
                                    name,
                                    country: code.toUpperCase(),
                                    city: town,
                                    website: BASE_URL + href,
                                    rank
                                });
                                count++;
                            }
                        }
                    }
                }

                console.log(`Parsed ${code}: ${count} universities.`);
            } catch (err) {
                 if (err.response && err.response.status === 404) {
                      console.warn(`Url ${url} 404.`);
                 } else {
                     console.error(`Fetch error ${code}:`, err.message);
                 }
            }

            await sleep(1000); 

        } catch (error) {
            console.error(`Error scraping ${code}:`, error.message);
        }
    }

    console.log(`Total universities scraped: ${allUniversities.length}`);
    
    // Ensure dir exists
    const prismaDir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir);

    const outputPath = path.join(prismaDir, 'universities.json');
    fs.writeFileSync(outputPath, JSON.stringify(allUniversities, null, 2));
    console.log(`Saved to ${outputPath}`);
}

scrapeUniversities();
