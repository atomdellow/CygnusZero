const mongoose = require('mongoose');

const contentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  selectors: {
    listPage: {
      container: String,
      title: String,
      content: String,
      date: String,
      links: String
    },
    articlePage: {
      container: String,
      title: String,
      content: String,
      date: String,
      links: String
    }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => new Map([
      ['canHaveArticles', true],
      ['defaultDepth', 1],
      ['supportedFeatures', ['articles', 'dates', 'links']]
    ])
  }
}, {
  timestamps: true
});

// Add predefined content types
contentTypeSchema.statics.createDefaultTypes = async function() {
  const defaults = [
    {
      name: 'Government News',
      description: 'Scraper configuration for government websites using table layouts',
      selectors: {
        listPage: {
          container: 'table tr:not(:first-child)',
          title: 'a, td:nth-child(2)',
          content: 'td:nth-child(2)',
          date: 'td:first-child',
          links: 'a[href*=".asp"], a[href*="/news/"]'
        },
        articlePage: {
          container: '.article, #content, main',
          title: 'h1, .headline, font[size="4"]',
          content: '.content p, td > font, #content p',
          date: 'time, .date, td:contains("Date:")',
          links: 'a[href]:not([href^="#"])'
        }
      }
    },
    {
      name: 'Modern News',
      description: 'Standard news article format with list and detail views',
      selectors: {
        listPage: {
          container: '.news-item, article, [class*="article"]',
          title: 'h1, h2, .title',
          content: '.content, .summary, p',
          date: 'time, .date',
          links: 'a[href*="/article/"], a[href*="/news/"]'
        },
        articlePage: {
          container: '.article-container, article, [class*="article"]',
          title: 'h1, .article-title',
          content: '.content p, .article-content p',
          date: 'time, .date, meta[property="article:published_time"]',
          links: 'a[href]:not([href^="#"])'
        }
      }
    }
  ];

  for (const type of defaults) {
    await this.findOneAndUpdate(
      { name: type.name },
      type,
      { upsert: true, new: true }
    );
  }
};

const ContentType = mongoose.model('ContentType', contentTypeSchema);

module.exports = ContentType;
