/**
 * Configuration for welland.ca scraping
 * Defines selectors and content transformation rules
 */
module.exports = {
  selectors: {
    container: 'article, .news-item, [class*="news"], [class*="article"], .content > div, #content div',
    title: 'h1, h2, h3, h4, [class*="title"], [class*="heading"], a[href]:not([href*="javascript"])',
    content: 'p, [class*="content"], [class*="description"], [class*="text"], [class*="body"]',
    date: '[class*="date"], time, small, .meta',
    links: 'a[href*="releases"], a[href*=".asp"]'
  },
  transform: (content, metadata = {}) => {
    // ...existing transform code...
  },
  validate: (item) => item.title && item.title !== 'Untitled Content'
};
