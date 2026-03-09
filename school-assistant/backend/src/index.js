/**
 * ============================================================
 * SCHOOL ASSISTANT — MAIN BACKEND ENGINE
 * Powered by Google Gemini Vision AI + PostgreSQL (Render.com)
 * ============================================================
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { initDB } = require('./db/database');

const analyzeRoutes = require('./routes/analyze');
const chatRoutes = require('./routes/chat');
const papersRoutes = require('./routes/papers');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 }, useTempFiles: false }));

// ── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'School Assistant Backend Running 🎓', timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/analyze', analyzeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/history', historyRoutes);

// ── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start Server ────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    console.log('✅ Database connected & tables ready');
    app.listen(PORT, () => {
      console.log(`🚀 School Assistant Backend running on http://localhost:${PORT}`);
      console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Connected' : '⚠️ Missing API Key'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
