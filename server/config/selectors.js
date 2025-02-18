/**
 * Default selectors for different scraping modes
 * Can be overridden by site-specific configs
 */
module.exports = {
  full: {
    container: 'body',
    content: '*',
    title: 'h1, h2, h3',
    date: 'time, [datetime], .date, meta[property*="date"]'
  },
  article: {
    container: 'article, .article, .post, .content, main',
    title: 'h1, h2, .article-title, .post-title',
    content: '.article-content, .post-content, .content p',
    date: '.date, time, .published-date'
  },
  smart: {
    container: 'article, [class*="article"], [class*="post"], .content, main',
    title: 'h1, h2, [class*="title"]',
    content: 'p, [class*="content"], [class*="text"]',
    date: 'time, [datetime], [class*="date"]'
  }
};
