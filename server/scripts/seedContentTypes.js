require('dotenv').config();
const mongoose = require('mongoose');
const ContentType = require('../models/ContentType');

const sampleContentTypes = [
  {
    name: "News Article",
    description: "Standard news article format",
    selectors: {
      listPage: {
        container: ".news-item",
        title: "h2",
        content: ".summary",
        date: ".date",
        links: "a[href*='/article/']"
      },
      articlePage: {
        container: ".article-container",
        title: "h1",
        content: ".content p",
        date: ".date",
        links: "a[href]"
      }
    },
    isActive: true
  }
];

async function seedContentTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await ContentType.deleteMany({});
    console.log('Cleared existing content types');

    const result = await ContentType.create(sampleContentTypes);
    console.log(`Seeded ${result.length} content types`);
    console.log(result);

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedContentTypes();
