/**
 * Handles extraction of content from web pages
 * Can be tested independently of the main scraper
 */
class ContentExtractor {
  constructor(selectors) {
    this.selectors = selectors;
  }

  async extractContent(page, selectors) {
    try {
      console.log('Extracting content with selectors:', selectors);
      
      const content = await page.evaluate((selectors) => {
        // Find all news items
        const newsItems = document.querySelectorAll('.news-item');
        console.log(`Found ${newsItems.length} news items`);
        
        if (!newsItems.length) return null;

        // Extract content from each news item
        const items = Array.from(newsItems).map(item => {
          const titleEl = item.querySelector('h2 a');
          const dateEl = item.querySelector('.date');
          const summaryEl = item.querySelector('.summary');

          return {
            title: titleEl?.textContent?.trim(),
            url: titleEl?.href,
            content: summaryEl?.textContent?.trim(),
            date: dateEl?.textContent?.trim(),
            articleUrl: titleEl?.href // Store the article URL
          };
        });

        console.log('Extracted items:', items);
        return items;
      }, selectors);

      return content;

    } catch (error) {
      console.error('Content extraction failed:', error);
      return null;
    }
  }

  async extractArticleContent(page) {
    try {
      const content = await page.evaluate(() => {
        const article = document.querySelector('.article-container');
        if (!article) return null;

        return {
          title: article.querySelector('h1')?.textContent?.trim(),
          content: Array.from(article.querySelectorAll('.content p'))
            .map(p => p.textContent.trim())
            .filter(Boolean)
            .join('\n\n'),
          date: article.querySelector('.date')?.textContent?.trim(),
        };
      });

      return content;
    } catch (error) {
      console.error('Article extraction failed:', error);
      return null;
    }
  }

  async extractLinks(page, selectors) {
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.news-item h2 a'))
        .map(a => a.href)
        .filter(href => href && href.includes('/article/'));
    });
    console.log('Found article links:', links);
    return links;
  }
}

module.exports = new ContentExtractor();
