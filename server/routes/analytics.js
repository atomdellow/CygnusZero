const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Metric, Log } = require('../models/Analytics');

router.get('/metrics', protect, async (req, res, next) => {
  try {
    const { days = 7 } = req.query.timeRange || {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await Metric.find({
      timestamp: { $gte: startDate },
      'metadata.userId': req.user._id
    }).sort({ timestamp: -1 });

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

router.get('/logs', protect, async (req, res, next) => {
  try {
    const logs = await Log.find({
      'details.userId': req.user._id
    })
    .sort({ timestamp: -1 })
    .limit(100);

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
