const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['scrape', 'content', 'user', 'source']
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'run']
  },
  metadata: {
    sourceId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    contentFound: Number,
    linksFollowed: Number,
    dataSize: Number,
    duration: Number,
    status: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    required: true,
    enum: ['user', 'system', 'scraper', 'content']
  },
  message: {
    type: String,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
metricSchema.index({ eventType: 1, timestamp: -1 });
metricSchema.index({ 'metadata.sourceId': 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });

module.exports = {
  Metric: mongoose.model('Metric', metricSchema),
  Log: mongoose.model('Log', logSchema)
};
