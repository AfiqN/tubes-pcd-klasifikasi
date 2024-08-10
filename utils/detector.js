const cheerio = require('cheerio');
const axios = require('axios'); // Using axios for redirect handling

const keywords = ['judi', 'casino', 'poker', 'slot', 'gacor', 'withdraw', 'togel', 'depo', 'maxxwin', 'jackpot'];
const keywordsPorno = ['sex', 'porno', 'bacol', 'mesum', 'ngewe', 'bdsm', 'kontol', 'ngentot', 'memek', 'porn', 'xxx', 'adult', 'erotic', 'nude', 'naked', 'fetish', 'hentai', 'masturbation', 'orgasm', 'explicit', 'sexual', 'sensual', 'smut', 'voyeur', 'lewd', 'kinky', 'dominatrix', 'bondage', 'pornhub', 'redtube', 'xvideos', 'onlyfans', 'bangbros', 'brazzers', 'xnxx', 'livejasmin', 'pornographic content', 'adult entertainment', 'sex videos', 'adult images', 'pornographic material', 'sexual content', 'roleplay', 'sex games', 'fetish wear', 'camgirls', 'amateur porn', 'webcam girls']

async function fetchHTML(url) {
  let newUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    newUrl = 'https://' + url;
  }

  try {
    const response = await axios.get(newUrl, {
      maxRedirects: 100,
      validateStatus: (status) => status >= 200 && status < 300,
    });

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
      const hasPornoContent = containsNegativeContent($, keywordsPorno);
      const keywordCounts = hasPornoContent ? countKeywords($, keywordsPorno) : countKeywords($, keywords);
      const redirect = htmlOrError.request.socket.servername;

      results.push({ url, redirect, hasNegativeContent, hasPornoContent, keywordCounts });
    }
  }

  return results;
}

module.exports = {
  detectNegativeContent,
};
