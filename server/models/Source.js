const mongoose = require('mongoose');

const CONTENT_TYPES = ['article', 'full', 'auto', 'news', 'blog', 'summary'];
const SCRAPE_MODES = ['smart', 'article', 'full'];

const sourceSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  schedule: {
    type: String,
    required: true,
    default: '*/30 * * * *',
    validate: {
      validator: function(v) {
        // Accept predefined values and basic cron format
        const validSchedules = [
          '*/30 * * * *',
          '0 * * * *',
          '0 */6 * * *',
          '0 0 * * *',
          '0 0 * * 0'
        ];
        return validSchedules.includes(v);
      },
      message: props => `${props.value} is not a valid schedule. Please use one of the predefined schedules.`
    }
  },
  lastRun: {
    type: Date,
    default: null
  },
  contentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentType',
    required: true
  },
  scrapeMode: {
    type: String,
    default: 'smart',
    enum: {
      values: SCRAPE_MODES,
      message: 'Invalid scrape mode. Must be one of: ' + SCRAPE_MODES.join(', ')
    }
  },
  selectors: {
    title: {
      type: String,
      required: false,
      default: 'h1, h2, h3, .title, [class*="title"], [class*="heading"]'
    },
    content: {
      type: String,
      required: false,
      default: 'article, .article, .content, .post-content, main, [role="main"]'
    },
    date: {
      type: String,
      required: false,
      default: 'time, .date, [class*="date"], [datetime]'
    },
    links: {
      type: String,
      required: false,
      default: 'a[href]:not([href^="#"])'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastStatus: {
    type: String,
    enum: ['success', 'failed', null],
    default: null
  },
  lastError: {
    type: String,
    default: null
  },
  followLinks: {
    type: Boolean,
    default: true
  },
  maxDepth: {
    type: Number,
    default: 1,
    min: 0,
    max: 3
  },
  contentTypes: [{
    type: {
      type: String,
      enum: CONTENT_TYPES,  // Use same enum for consistency
      required: true
    },
    selectors: {
      container: String,
      title: String,
      content: String,
      date: String,
      links: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add validation middleware
sourceSchema.pre('save', function(next) {
  if (!SCRAPE_MODES.includes(this.scrapeMode)) {
    next(new Error(`Invalid scrape mode: ${this.scrapeMode}`));
  }
  next();
});

// Add method to combine content types
sourceSchema.methods.addContentType = function(newType) {
  if (!this.contentTypes) {
    this.contentTypes = [];
  }
  
  if (!this.contentTypes.find(type => type.type === newType.type)) {
    this.contentTypes.push(newType);
  }
  
  return this;
};

// Create the model
const Source = mongoose.model('Source', sourceSchema);

// Export both the model and the constants
module.exports = {
  Source,
  SCRAPE_MODES,
  CONTENT_TYPES
};
