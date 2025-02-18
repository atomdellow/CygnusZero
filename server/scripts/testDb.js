require('dotenv').config();
const mongoose = require('mongoose');
const ContentType = require('../models/ContentType');

async function testDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const count = await ContentType.countDocuments();
    console.log(`Found ${count} content types`);
    
    if (count === 0) {
      console.log('Creating test content type...');
      await ContentType.create({
        name: 'Test Type',
        description: 'Test content type',
        selectors: {
          listPage: {
            container: '.test-container',
            title: '.test-title',
            content: '.test-content',
            date: '.test-date',
            links: '.test-links'
          },
          articlePage: {
            container: '.article',
            title: 'h1',
            content: '.content',
            date: '.date',
            links: 'a'
          }
        },
        isActive: true
      });
      console.log('Test content type created');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testDb();
