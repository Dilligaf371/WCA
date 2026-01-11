const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const heroRoutes = require('./routes/heroRoutes');
const { ingestCharacter, MOCK_CHARACTER_ID } = require('./services/ingestion');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/warchain-arena';

// Middleware
app.use(cors()); // Enable CORS for Unity mobile client
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WarChain Arena Character Platform'
  });
});

// API Routes
app.use('/hero', heroRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WarChain Arena Character Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      getHero: 'GET /hero/:nfcId',
      syncHero: 'POST /hero/sync',
      updateHero: 'PATCH /hero/update',
      listHeroes: 'GET /hero'
    }
  });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('[Server] Connected to MongoDB');
  
  // Initialize with mock character on first run (optional)
  if (process.env.INIT_MOCK_CHARACTER === 'true') {
    try {
      const Hero = require('./models/Hero');
      const existingHero = await Hero.findOne({
        dndBeyondId: MOCK_CHARACTER_ID
      });
      
      if (!existingHero) {
        console.log('[Server] Initializing mock character...');
        await ingestCharacter(MOCK_CHARACTER_ID);
        console.log('[Server] Mock character initialized');
      }
    } catch (error) {
      console.error('[Server] Error initializing mock character:', error.message);
    }
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(`[Server] WarChain Arena Character Platform running on port ${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
})
.catch((error) => {
  console.error('[Server] MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(() => {
    console.log('[Server] MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;

