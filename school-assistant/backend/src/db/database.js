/**
 * Database — PostgreSQL via Render.com
 * Connection: cheetah_aeef on oregon-postgres.render.com
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Render.com
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function initDB() {
  const client = await pool.connect();
  try {
    // Create all tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS answer_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        source VARCHAR(50) DEFAULT 'screen',
        screenshot_taken BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS past_papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(100),
        year INTEGER,
        content TEXT,
        filename VARCHAR(255),
        file_size INTEGER,
        question_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS paper_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paper_id UUID REFERENCES past_papers(id) ON DELETE CASCADE,
        question_number INTEGER,
        question_text TEXT NOT NULL,
        answer_text TEXT,
        marks INTEGER,
        topic VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paper_id UUID REFERENCES past_papers(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tables initialized: answer_history, past_papers, paper_questions, quiz_sessions');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
