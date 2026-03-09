/**
 * Route: /api/history
 * Answer history management
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await pool.query(
      `SELECT * FROM answer_history ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history
router.delete('/', async (req, res) => {
  try {
    await pool.query(`DELETE FROM answer_history`);
    res.json({ success: true, message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
