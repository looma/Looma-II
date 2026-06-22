PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  language TEXT,
  title TEXT,
  subject TEXT,
  grade_level INTEGER,
  total_pages INTEGER,
  ocr_required INTEGER DEFAULT 0,
  ingestion_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chapter_number INTEGER,
  chapter_title TEXT NOT NULL,
  subject TEXT,
  grade_level INTEGER,
  page_start INTEGER,
  page_end INTEGER,
  keywords_json TEXT,
  learning_goals_json TEXT,
  sequence_order INTEGER,
  FOREIGN KEY(document_id) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  section_title TEXT,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  clean_text TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  language TEXT,
  content_type TEXT,
  difficulty TEXT,
  pedagogical_role TEXT,
  token_count INTEGER,
  char_count INTEGER,
  keywords_json TEXT,
  learning_objectives_json TEXT,
  prerequisites_json TEXT,
  related_concepts_json TEXT,
  zvec_doc_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(document_id) REFERENCES documents(id),
  FOREIGN KEY(chapter_id) REFERENCES chapters(id)
);

CREATE TABLE IF NOT EXISTS glossary (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  simple_definition TEXT,
  subject TEXT,
  grade_level INTEGER,
  chapter_id TEXT,
  related_terms_json TEXT,
  examples_json TEXT,
  zvec_doc_id TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  chapter_id TEXT,
  subject TEXT,
  grade_level INTEGER,
  question_text TEXT NOT NULL,
  question_type TEXT,
  difficulty TEXT,
  answer_options_json TEXT,
  correct_answer TEXT,
  solution_text TEXT,
  hint TEXT,
  skills_json TEXT,
  learning_objectives_json TEXT,
  source_type TEXT,
  source_ref TEXT,
  zvec_doc_id TEXT
);

CREATE TABLE IF NOT EXISTS generated_content (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  subject TEXT,
  grade_level INTEGER,
  chapter_id TEXT,
  source_chunk_ids_json TEXT,
  generator_model TEXT,
  prompt_version TEXT,
  status TEXT,
  approved_by_teacher INTEGER DEFAULT 0,
  teacher_feedback TEXT,
  quality_score REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  zvec_doc_id TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  chunk_id UNINDEXED,
  text,
  chapter_title,
  subject,
  grade_level,
  keywords
);
