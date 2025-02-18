const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Source, SCRAPE_MODES } = require('../models/Source'); // Fix: Added SCRAPE_MODES import
const { Content } = require('../models/Content'); // Fix: Proper import with destructuring
const { AppError } = require('../middleware/error');
const scraperService = require('../services/scraper');
const mongoose = require('mongoose');

// GET all sources
router.get('/', protect, async (req, res) => {
  try {
    const sources = await Source.find({ user: req.user._id });
    res.json(sources);
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new source
router.post('/', protect, async (req, res) => {
  try {
    const source = await Source.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json(source);
  } catch (error) {
    console.error('Create source error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update source
router.put('/:id', protect, [
  body('scrapeMode')
    .optional()
    .isIn(SCRAPE_MODES)
    .withMessage(`Scrape mode must be one of: ${SCRAPE_MODES.join(', ')}`),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error', 400, errors.array());
    }

    const source = await Source.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { 
        new: true, 
        runValidators: true,
        validateBeforeSave: true
      }
    );

    if (!source) {
      throw new AppError('Source not found', 404);
    }

    scraperService.scheduleJob(source);
    res.json(source);
  } catch (error) {
    next(error);
  }
});

// Delete source and all its content
router.delete('/:id', protect, async (req, res) => {
  try {
    const sourceId = req.params.id;
    console.log('Attempting to delete source:', sourceId);

    // First verify source exists and belongs to user
    const source = await Source.findOne({
      _id: sourceId,
      user: req.user._id
    });

    if (!source) {
      console.log('Source not found:', sourceId);
      return res.status(404).json({ message: 'Source not found' });
    }

    // Delete all related content first
    console.log('Deleting content for source:', sourceId);
    const contentDeleteResult = await Content.deleteMany({ source: sourceId });
    console.log('Deleted content count:', contentDeleteResult.deletedCount);

    // Then delete the source
    console.log('Deleting source:', sourceId);
    const sourceDeleteResult = await Source.findByIdAndDelete(sourceId);
    
    if (!sourceDeleteResult) {
      throw new Error('Failed to delete source');
    }

    // Clean up any scheduled jobs
    if (scraperService.jobs.has(sourceId)) {
      scraperService.jobs.get(sourceId).stop();
      scraperService.jobs.delete(sourceId);
      console.log('Cleaned up scheduled jobs for source:', sourceId);
    }

    console.log('Successfully deleted source and content');
    res.json({
      message: 'Source and related content deleted successfully',
      sourceId: sourceId,
      contentDeleted: contentDeleteResult.deletedCount
    });

  } catch (error) {
    console.error('Delete operation failed:', error);
    res.status(500).json({
      error: 'Failed to delete source and content',
      details: error.message
    });
  }
});

// Manual trigger endpoint with enhanced logging
router.post('/:id/trigger', protect, async (req, res) => {
  try {
    console.log('🚀 Trigger request received for source:', req.params.id);
    
    const source = await Source.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('contentType');

    if (!source) {
      console.log('❌ Source not found:', req.params.id);
      return res.status(404).json({ message: 'Source not found' });
    }

    if (!source.contentType) {
      return res.status(400).json({ message: 'Content type not configured for this source' });
    }

    console.log('📝 Source configuration:', {
      url: source.url,
      contentType: source.contentType.name,
      scrapeMode: source.scrapeMode,
      selectors: source.contentType.selectors || 'No selectors configured'
    });

    // Start scraping with progress updates
    const scrapeResult = await scraperService.scrape(source);
    
    console.log('✅ Scrape completed:', scrapeResult);
    
    res.json({ 
      message: 'Scrape completed successfully',
      result: scrapeResult,
      lastRun: new Date(),
      stats: {
        contentFound: scrapeResult.contentCount,
        depth: scrapeResult.maxDepth,
        duration: scrapeResult.duration
      }
    });

  } catch (error) {
    console.error('❌ Trigger error:', error);
    res.status(500).json({ 
      message: 'Failed to trigger scrape',
      error: error.message 
    });
  }
});

module.exports = router;
