const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ContentType = require('../models/ContentType');

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Content type router is working' });
});

// Simple GET route without authentication
router.get('/', async (req, res) => {
  console.log('GET route hit for /api/content-types');
  try {
    const types = await ContentType.find();
    //console.log(`Found ${types.length} content types:`, types);
    res.json(types);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch content types' });
  }
});

// Create content type
router.post('/', protect, async (req, res) => {
  try {
    const contentType = await ContentType.create(req.body);
    res.status(201).json(contentType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update content type
router.put('/:id', protect, async (req, res) => {
  try {
    const contentType = await ContentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(contentType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete content type
router.delete('/:id', protect, async (req, res) => {
  try {
    await ContentType.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
