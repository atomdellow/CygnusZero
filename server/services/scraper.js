const { Source } = require('../models/Source');
const { Content } = require('../models/Content');
const cron = require('node-cron');
const browserManager = require('./browserManager');

class ScraperService {
  constructor() {
    this.jobs = new Map();
  }

  async scrape(source) {
    let page = null;
    const stats = { summaries: 0, articles: 0, errors: [] };

    try {
      page = await browserManager.getPage();
      
      // Step 1: Get summaries
      console.log('Scraping summaries from:', source.url);
      await page.goto(source.url, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.news-item');

      const summaries = await page.evaluate(() => {
        const items = [];
        const newsItems = document.querySelectorAll('.news-item');
        
        newsItems.forEach(item => {
          const titleEl = item.querySelector('h2 a');
          const summaryEl = item.querySelector('.summary');
          const dateEl = item.querySelector('.date');

          if (titleEl) {
            items.push({
              title: titleEl.textContent.trim(),
              content: summaryEl?.textContent.trim() || '',
              date: dateEl?.textContent.trim() || new Date().toISOString(),
              articleUrl: titleEl.href
            });
          }
        });

        return items;
      });

      console.log(`Found ${summaries?.length || 0} summaries`);

      // Step 2: Process each summary and its related article
      if (summaries?.length) {
        for (const summary of summaries) {
          try {
            // Save summary first
            const savedSummary = await Content.create({
              title: summary.title,
              content: summary.content,
              date: summary.date,
              url: source.url,
              source: source._id,
              user: source.user,
              contentType: source.contentType._id,
              metadata: {
                isSummary: true,
                extractedAt: new Date()
              }
            });
            stats.summaries++;

            // Process related article if it exists
            if (summary.articleUrl) {
              console.log('Processing article:', summary.articleUrl);
              await page.goto(summary.articleUrl, { waitUntil: 'networkidle0' });
              
              const articleContent = await page.evaluate(() => {
                const container = document.querySelector('.article-container');
                if (!container) return null;

                return {
                  title: container.querySelector('h1')?.textContent.trim(),
                  content: Array.from(container.querySelectorAll('.content p'))
                    .map(p => p.textContent.trim())
                    .filter(Boolean)
                    .join('\n\n'),
                  date: container.querySelector('.date')?.textContent.trim()
                };
              });

              if (articleContent) {
                const savedArticle = await Content.create({
                  title: articleContent.title || summary.title,
                  content: articleContent.content,
                  date: articleContent.date || summary.date,
                  url: summary.articleUrl,
                  source: source._id,
                  user: source.user,
                  contentType: source.contentType._id,
                  metadata: {
                    isArticle: true,
                    summaryId: savedSummary._id,
                    extractedAt: new Date()
                  }
                });

                // Link the summary to its article
                await Content.findByIdAndUpdate(savedSummary._id, {
                  $addToSet: { relatedContent: savedArticle._id }
                });

                stats.articles++;
                console.log(`Linked article ${savedArticle._id} to summary ${savedSummary._id}`);
              }
            }
          } catch (error) {
            console.error('Error processing item:', error);
            stats.errors.push(error.message);
          }
        }
      }

      // Update source stats
      await Source.findByIdAndUpdate(source._id, {
        lastRun: new Date(),
        lastStatus: stats.errors.length ? 'error' : 'success',
        stats: {
          summariesFound: stats.summaries,
          articlesFound: stats.articles,
          errors: stats.errors
        }
      });

      return stats;

    } catch (error) {
      console.error('Scrape failed:', error);
      throw error;
    } finally {
      if (page) await page.close();
    }
  }

  scheduleJob(source) {
    if (this.jobs.has(source._id)) {
      this.jobs.get(source._id).stop();
    }

    this.jobs.set(source._id, cron.schedule(source.schedule, () => {
      this.scrape(source);
    }));
  }

  async initializeJobs() {
    const sources = await Source.find({});
    sources.forEach(source => this.scheduleJob(source));
  }
}

module.exports = new ScraperService();
