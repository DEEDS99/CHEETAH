/**
 * Route: /api/chat
 * AI chat assistant for school questions
 */
const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../services/gemini');
const { pool } = require('../db/database');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const answer = await chatWithAI(message, history);

    // Save to history
    await pool.query(
      `INSERT INTO answer_history (question, answer, source) VALUES ($1, $2, 'chat')`,
      [message, answer]
    );

    res.json({ success: true, answer });
  } catch (err) {
    console.error('❌ Chat error:', err.message);
    res.status(500).json({ error: 'Chat failed: ' + err.message });
  }
});

module.exports = router;
