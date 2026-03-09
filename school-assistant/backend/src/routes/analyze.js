/**
 * Route: /api/analyze
 * Accepts base64 screenshot, runs Gemini Vision, saves to DB
 */
const express = require('express');
const router = express.Router();
const { analyzeScreenshot } = require('../services/gemini');
const { pool } = require('../db/database');

// POST /api/analyze — analyze a screenshot
router.post('/', async (req, res) => {
  try {
    const { screenshot, saveToHistory = true } = req.body;

    if (!screenshot) {
      return res.status(400).json({ error: 'No screenshot provided' });
    }

    console.log('🔍 Analyzing screenshot with Gemini...');
    const analysis = await analyzeScreenshot(screenshot);

    // Save questions + answers to history
    if (saveToHistory && analysis.questions && analysis.questions.length > 0) {
      for (const q of analysis.questions) {
        if (q.question && q.answer) {
          await pool.query(
            `INSERT INTO answer_history (question, answer, source, screenshot_taken)
             VALUES ($1, $2, 'screen', true)`,
            [q.question, q.answer]
          );
        }
      }
    }

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('❌ Analyze error:', err.message);
    res.status(500).json({ error: 'Failed to analyze screenshot: ' + err.message });
  }
});

module.exports = router;
