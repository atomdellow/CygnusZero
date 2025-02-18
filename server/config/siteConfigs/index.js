const welland = require('./welland');

// Export all site configurations
module.exports = {
  'welland.ca': welland,
  'localhost': {
    modes: {
      // Full mode configuration
      full: {
        // No specific selectors needed - grab everything
        fullPage: true,
        transform: (content) => ({
          title: document.title || 'Full Page Content',
          content: document.documentElement.innerText,
          html: document.documentElement.innerHTML,
          metadata: {
            fullPage: true,
            url: window.location.href,
            elements: {
              paragraphs: document.getElementsByTagName('p').length,
              headings: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
              links: document.getElementsByTagName('a').length
            }
          }
        })
      },
      // Article mode configuration
      article: {
        selectors: {
          container: '.news-item, .article-container',
          title: 'h1, h2, h3, .article-title, .news-title',
          content: '.content p, .summary, .article-content',
          date: '.date, time',
          links: 'a[href*="/article/"]'
        }
      },
      // Smart mode configuration
      smart: {
        selectors: {
          container: 'article, [class*="article"], [class*="content"]',
          title: 'h1, h2, [class*="title"]',
          content: 'p, [class*="content"], [class*="text"]',
          date: 'time, [datetime], [class*="date"]'
        }
      }
    },
    validate: (item, mode) => {
      if (mode === 'full') return true;
      return item.title && item.content;
    }
  }
};
