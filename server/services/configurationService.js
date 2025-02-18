const ContentType = require('../models/ContentType');

class ConfigurationService {
  constructor() {
    this.config = null;
    this.defaultSelectors = {
      listPage: {
        container: '.news-item, article, [class*="article"]',
        title: 'h1, h2, .title',
        content: '.content, .summary, p',
        date: 'time, .date',
        links: 'a[href*="/article/"], a[href*="/news/"]'
      },
      articlePage: {
        container: '.article-container, article',
        title: 'h1, .article-title',
        content: '.content p, article p',
        date: 'time, .date',
        links: 'a[href]'
      }
    };
  }

  async initialize() {
    await this.reloadConfiguration();
  }

  async reloadConfiguration() {
    const contentTypes = await ContentType.find({ isActive: true });
    
    this.config = {
      contentTypes: contentTypes.reduce((acc, type) => {
        acc[type.name] = {
          id: type._id,
          modes: {
            listPage: type.selectors.listPage,
            articlePage: type.selectors.articlePage
          },
          metadata: type.metadata
        };
        return acc;
      }, {})
    };

    return this.config;
  }

  getContentTypeConfig(typeName) {
    return this.config?.contentTypes[typeName];
  }

  getAllContentTypes() {
    return Object.keys(this.config?.contentTypes || {});
  }

  async getSelectors(source) {
    await source.populate('contentType');
    
    if (!source.contentType?.selectors) {
      return this.defaultSelectors;
    }

    return {
      listPage: {
        ...this.defaultSelectors.listPage,
        ...source.contentType.selectors.listPage
      },
      articlePage: {
        ...this.defaultSelectors.articlePage,
        ...source.contentType.selectors.articlePage
      }
    };
  }
}

module.exports = new ConfigurationService();
