
const axios = require('axios');
const fs = require('fs');

async function debugScraper() {
    try {
        const url = 'https://www.unirank.org/it/ranking/';
        console.log(`Fetching ${url}...`);
        const response = await axios.get(url, {
             headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36' }
        });
        fs.writeFileSync('debug.html', response.data);
        console.log('Saved to debug.html');
    } catch (e) {
        console.error(e);
    }
}

debugScraper();
