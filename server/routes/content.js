const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Content } = require('../models/Content');
const { AppError } = require('../middleware/error');

// Verify Content model is available
console.log('Content model:', !!Content);

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-metadata.extractedAt', ...filters } = req.query

    console.log('Processing content request:', { page, limit, sort, filters })

    const query = { user: req.user._id };

    // Add filters
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { content: new RegExp(filters.search, 'i') }
      ];
    }

    if (filters.domain) {
      query.url = new RegExp(filters.domain, 'i');
    }

    if (filters.linkedOnly === 'true') {
      query['metadata.isArticle'] = true;
    }

    if (filters.dateFrom || filters.dateTo) {
      query['metadata.extractedAt'] = {};
      if (filters.dateFrom) query['metadata.extractedAt'].$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query['metadata.extractedAt'].$lte = new Date(filters.dateTo);
    }

    console.log('Executing query:', JSON.stringify(query))

    const items = await Content.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('relatedContent', 'title _id')
      .populate('contentType', 'name')
      .lean()

    console.log(`Found ${items.length} items`)

    const total = await Content.countDocuments(query)

    const response = {
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    }

    console.log('Sending response:', {
      itemCount: response.items.length,
      total: response.total,
      page: response.page
    })

    res.json(response)

  } catch (error) {
    console.error('Content fetch error:', error)
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const content = await Content.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: req.body.read },
      { new: true }
    );

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    res.json(content);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    console.log('Deleting content:', req.params.id);
    
    const content = await Content.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    await Content.deleteOne({ _id: req.params.id });
    res.status(204).end();
    
  } catch (error) {
    console.error('Delete error:', error);
    next(error);
  }
});

module.exports = router;
