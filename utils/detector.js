const cheerio = require('cheerio');
const keywords = ['judi', 'casino', 'poker', 'taruhan', 'slot'];

async function fetchHTML(url) {
    try {
        // Ensure URL starts with http(s)://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
    
        const response = await fetch(url);
    
        // Check for successful response
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const body = await response.text();
        return body;
      } catch (error) {
        console.error('Error:', error);
        return error.message; // Or handle the error differently
      }
}

function containsNegativeContent($, keywords) {
    const text = $('body').text().toLowerCase();
    return keywords.some(keyword => text.includes(keyword));
}

async function detectNegativeContent(url) {
    const results = [];

    const html = await fetchHTML(url);
    if (html) {
        const $ = cheerio.load(html); // Create a Cheerio object
        const hasNegativeContent = containsNegativeContent($, keywords);
        results.push({ url, hasNegativeContent });
    } else {
        results.push({ url, error: 'Failed to fetch HTML' });
    }

    console.log(results);

    // return results;
}

module.exports = {
  detectNegativeContent,
};