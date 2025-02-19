const express = require('express');
const router = express.Router();
const ContentType = require('../models/ContentType');
const { protect } = require('../middleware/auth');
const sanitize = require('mongo-sanitize');

// Get all content types with pagination and filtering
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const isActive = req.query.isActive === 'true' ? true : 
                    req.query.isActive === 'false' ? false : null;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    if (isActive !== null) {
      query.isActive = isActive;
    }

    // If pagination is requested
    if (req.query.page || req.query.limit) {
      const total = await ContentType.countDocuments(query);
      const contentTypes = await ContentType.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({
        items: contentTypes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // If no pagination requested, return all items
    const contentTypes = await ContentType.find(query).sort({ [sortBy]: sortOrder });
    return res.json(contentTypes);

  } catch (error) {
    console.error('Content Types fetch error:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create content type
router.post('/', protect, async (req, res) => {
  try {
    // Sanitize input
    const sanitizedData = sanitize(req.body);
    const contentType = new ContentType(sanitizedData);
    const savedContentType = await contentType.save();
    res.status(201).json(savedContentType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update content type
router.put('/:id', protect, async (req, res) => {
  try {
    const sanitizedData = sanitize(req.body);
    const contentType = await ContentType.findByIdAndUpdate(
      req.params.id,
      sanitizedData,
      { new: true }
    );
    if (!contentType) {
      return res.status(404).json({ message: 'Content type not found' });
    }
    res.json(contentType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete content type
router.delete('/:id', protect, async (req, res) => {
  try {
    const contentType = await ContentType.findByIdAndDelete(req.params.id);
    if (!contentType) {
      return res.status(404).json({ message: 'Content type not found' });
    }
    res.json({ message: 'Content type deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
