require('dotenv').config();
const mongoose = require('mongoose');
const ContentType = require('../models/ContentType');

async function debugDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const count = await ContentType.countDocuments();
    console.log(`Found ${count} content types`);

    const types = await ContentType.find({});
    console.log('Content Types:', JSON.stringify(types, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

debugDb();
