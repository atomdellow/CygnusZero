const { Metric, Log } = require('../models/Analytics');
const fs = require('fs').promises;
const path = require('path');

class AnalyticsService {
  constructor() {
    this.logPath = path.join(__dirname, '../logs');
  }

  async trackMetric(eventType, action, metadata) {
    try {
      await Metric.create({
        eventType,
        action,
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking metric:', error);
    }
  }

  async log(level, category, message, details = {}) {
    try {
      // Save to database
      const log = await Log.create({
        level,
        category,
        message,
        details,
        timestamp: new Date()
      });

      // Save to file
      const logFile = path.join(this.logPath, `${category}-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}\n`;
      
      await fs.appendFile(logFile, logEntry);

      return log;
    } catch (error) {
      console.error('Error logging:', error);
    }
  }

  async getMetrics(filter = {}, timeRange = { days: 7 }) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange.days);

    return await Metric.find({
      ...filter,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });
  }

  async getLogs(filter = {}, limit = 100) {
    return await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getSourceMetrics(sourceId) {
    return await Metric.aggregate([
      {
        $match: {
          'metadata.sourceId': mongoose.Types.ObjectId(sourceId)
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          avgDuration: { $avg: '$metadata.duration' },
          totalContentFound: { $sum: '$metadata.contentFound' },
          totalLinksFollowed: { $sum: '$metadata.linksFollowed' }
        }
      }
    ]);
  }
}

module.exports = new AnalyticsService();
