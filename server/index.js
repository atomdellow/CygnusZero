const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ContentType = require('./models/ContentType');
const { initializeContent } = require('./models/Content');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Import routes
const authRoutes = require('./routes/auth');
const sourceRoutes = require('./routes/source');
const contentTypeRoutes = require('./routes/contentType');
const contentRoutes = require('./routes/content');

// Mount routes - Note the plural 'sources' for consistency
app.use('/api/auth', authRoutes);
app.use('/api/sources', sourceRoutes);        // Changed from source to sources
app.use('/api/content-types', contentTypeRoutes);
app.use('/api/content', contentRoutes);

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Initialize models
    await initializeContent();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`MongoDB URI: ${mongoUri}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();
