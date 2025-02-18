const mongoose = require('mongoose');

const CONTENT_TYPES = ['article', 'summary', 'full', 'linked-article'];

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  url: String,
  date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Source',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentType',
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => new Map()
  },
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }]
}, {
  timestamps: true
});

// Add proper indexes
contentSchema.index({ source: 1 });
contentSchema.index({ contentType: 1 });
contentSchema.index({ 'metadata.summaryHash': 1 });
contentSchema.index({ 'metadata.articleHash': 1 });
contentSchema.index({ 'metadata.isSummary': 1 });
contentSchema.index({ 'metadata.isArticle': 1 });

// Create the model
const Content = mongoose.model('Content', contentSchema);

// Handle index cleanup after model is created
async function cleanupIndexes() {
  try {
    await Content.collection.dropIndex('title_1_source_1');
    console.log('Dropped compound index on title and source');
  } catch (err) {
    if (err.code !== 27) { // 27 is "index not found"
      console.warn('Warning: ', err.message);
    }
  }
}

// Export a function to initialize the model
async function initializeContent() {
  await cleanupIndexes();
  return Content;
}

module.exports = {
  Content,
  CONTENT_TYPES,
  initializeContent
};
