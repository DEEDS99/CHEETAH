-- School Assistant — Database Init
-- Render.com PostgreSQL: cheetah_aeef

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_created ON answer_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_paper ON paper_questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_papers_subject ON past_papers(subject);
