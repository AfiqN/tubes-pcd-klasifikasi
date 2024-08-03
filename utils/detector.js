const cheerio = require('cheerio');
const keywords = ['judi', 'casino', 'poker', 'taruhan', 'slot', 'gacor', 'withdraw'];

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
        return false; // Or handle the error differently
      }
}

function containsNegativeContent($, keywords) {
    const text = $('body').text().toLowerCase();
    return keywords.some(keyword => text.includes(keyword));
}

function countKeywords($, keywords) {
    const text = $('body').text().toLowerCase();
    const keywordCounts = {};
  
    keywords.forEach(keyword => {
      keywordCounts[keyword] = (text.match(new RegExp(keyword, 'gi')) || []).length;
    });
  
    return keywordCounts;
}

async function detectNegativeContent(urls) {
    const results = [];

    const promises = urls.map(async url => {
        const html = await fetchHTML(url);
        if (html) {
            const $ = cheerio.load(html);
            const hasNegativeContent = containsNegativeContent($, keywords);
            const keywordCounts = countKeywords($, keywords);
            return { url, hasNegativeContent, ...keywordCounts };
        } else {
            return { url, error: 'Failed to fetch HTML' };
        }
    });
  
    const resultsArray = await Promise.all(promises);

    // console.log(resultsArray)
    return resultsArray;
}

module.exports = {
    detectNegativeContent,
};