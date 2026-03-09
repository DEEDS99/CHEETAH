/**
 * Route: /api/papers
 * Upload past papers, extract questions, generate quizzes
 */
const express = require('express');
const router = express.Router();
const pdf = require('pdf-parse');
const { parsePastPaper, generateQuiz } = require('../services/gemini');
const { pool } = require('../db/database');

// GET /api/papers — list all papers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, subject, year, filename, file_size, question_count, created_at
       FROM past_papers ORDER BY created_at DESC`
    );
    res.json({ success: true, papers: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/papers/upload — upload a PDF past paper
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.paper) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "paper"' });
    }

    const file = req.files.paper;
    const { title = file.name, subject = 'General', year } = req.body;

    console.log(`📄 Processing paper: ${file.name}`);

    // Extract text from PDF
    let pdfText = '';
    try {
      const parsed = await pdf(file.data);
      pdfText = parsed.text;
    } catch (e) {
      pdfText = 'Could not extract PDF text. Manual entry needed.';
    }

    // Use Gemini to parse questions
    const parsed = await parsePastPaper(pdfText, title);

    // Save paper to DB
    const paperResult = await pool.query(
      `INSERT INTO past_papers (title, subject, year, content, filename, file_size, question_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        title,
        parsed.subject || subject,
        parsed.year || year || null,
        pdfText.substring(0, 50000),
        file.name,
        file.size,
        parsed.questions.length
      ]
    );

    const paperId = paperResult.rows[0].id;

    // Save individual questions
    for (const q of parsed.questions) {
      await pool.query(
        `INSERT INTO paper_questions (paper_id, question_number, question_text, answer_text, marks, topic)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [paperId, q.number || 0, q.question, q.answer || '', q.marks || 0, q.topic || '']
      );
    }

    res.json({
      success: true,
      paper: {
        id: paperId,
        title,
        subject: parsed.subject || subject,
        year: parsed.year || year,
        questionCount: parsed.questions.length
      }
    });
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// GET /api/papers/:id/questions — get all questions for a paper
router.get('/:id/questions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM paper_questions WHERE paper_id = $1 ORDER BY question_number`,
      [req.params.id]
    );
    res.json({ success: true, questions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/papers/:id/quiz — generate a quiz from the paper
router.post('/:id/quiz', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const questionsResult = await pool.query(
      `SELECT * FROM paper_questions WHERE paper_id = $1 ORDER BY RANDOM() LIMIT 20`,
      [req.params.id]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this paper' });
    }

    const quiz = await generateQuiz(questionsResult.rows, count);

    // Save quiz session
    await pool.query(
      `INSERT INTO quiz_sessions (paper_id, total_questions) VALUES ($1, $2)`,
      [req.params.id, quiz.quiz.length]
    );

    res.json({ success: true, quiz: quiz.quiz });
  } catch (err) {
    res.status(500).json({ error: 'Quiz generation failed: ' + err.message });
  }
});

// DELETE /api/papers/:id — delete a paper
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM past_papers WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Paper deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
