const cheerio = require('cheerio');
const axios = require('axios'); // Using axios for redirect handling

const keywords = ['judi', 'casino', 'poker', 'slot', 'gacor', 'withdraw', 'togel', 'depo', 'maxxwin', 'jackpot'];

async function fetchHTML(url) {
  // Ensure URL starts with http(s)://
  
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      newUrl = 'https://' + url;
    }
    
    const response = await axios.get(newUrl, {
      // Follow redirects automatically (up to a reasonable limit)
      maxRedirects: 100,
      // Validate response status (optional, depending on your needs)
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // console.log(response)
    return response; // Assuming response.data contains the HTML content
  } catch (error) {
    return { url, error: 'Failed to fetch HTML' };
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

  for (const url of urls) {
    const htmlOrError = await fetchHTML(url);

    if (htmlOrError.error) {
      results.push(htmlOrError);
    } else {
      const $ = cheerio.load(htmlOrError.data); // Assuming htmlOrError contains the HTML
      const hasNegativeContent = containsNegativeContent($, keywords);
      const keywordCounts = countKeywords($, keywords);
      const redirect = htmlOrError.request.socket.servername
      console.log(redirect)
      results.push({ url, redirect, hasNegativeContent, ...keywordCounts });
    }
  }

  return results;
}

module.exports = {
  detectNegativeContent,
};
