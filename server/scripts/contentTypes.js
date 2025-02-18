require('dotenv').config();
const mongoose = require('mongoose');
const ContentType = require('../models/ContentType');

const defaultContentTypes = [
  {
    name: 'News Article',
    description: 'Standard news article format with list and detail views',
    selectors: {
      listPage: {
        container: '.news-item',
        title: 'h2, .news-title',
        content: '.summary, .excerpt',
        date: '.date, time, .published-date',
        links: 'a[href*="/article/"], a[href*="/news/"]'
      },
      articlePage: {
        container: '.article-container, article',
        title: 'h1, .article-title',
        content: '.content p, .article-content p',
        date: '.date, time, meta[property="article:published_time"]',
        links: 'a[href]:not([href^="#"])'
      }
    },
    isActive: true,
    metadata: {
      canHaveArticles: true,
      defaultDepth: 1,
      supportedFeatures: ['summary', 'full-article']
    }
  },
  {
    name: 'Blog Post',
    description: 'Blog format with list and single post views',
    selectors: {
      listPage: {
        container: '.post-preview, .blog-post',
        title: 'h2, .post-title',
        content: '.post-excerpt, .summary',
        date: '.post-date, time',
        links: 'a[href*="/post/"], a[href*="/blog/"]'
      },
      articlePage: {
        container: '.post-content, .blog-post',
        title: 'h1, .post-title',
        content: '.post-content, .entry-content',
        date: '.post-date, time',
        links: 'a[href]:not([href^="#"])'
      }
    },
    isActive: true,
    metadata: {
      canHaveArticles: true,
      defaultDepth: 1,
      supportedFeatures: ['comments', 'tags']
    }
  },
  {
    name: 'Documentation',
    description: 'Technical documentation format',
    selectors: {
      listPage: {
        container: '.doc-section, .documentation',
        title: 'h2, .doc-title',
        content: '.doc-summary, .description',
        date: '.last-updated, time',
        links: 'a[href*="/docs/"], a[href*="/documentation/"]'
      },
      articlePage: {
        container: '.doc-content, .documentation',
        title: 'h1, .doc-title',
        content: '.content, .doc-content',
        date: '.last-updated, time',
        links: 'a[href*="/docs/"]'
      }
    },
    isActive: true,
    metadata: {
      canHaveArticles: true,
      defaultDepth: 2,
      supportedFeatures: ['versioning', 'code-blocks']
    }
  }
];

async function seedContentTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing content types
    await ContentType.deleteMany({});
    console.log('Cleared existing content types');

    // Insert new content types
    const result = await ContentType.insertMany(defaultContentTypes);
    console.log(`Seeded ${result.length} content types successfully`);

    // Display the seeded data
    const seeded = await ContentType.find({});
    console.log('\nSeeded Content Types:');
    console.log(JSON.stringify(seeded, null, 2));

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run seeding if --seed flag is present
if (process.argv.includes('--seed')) {
  seedContentTypes();
}

module.exports = { defaultContentTypes };
