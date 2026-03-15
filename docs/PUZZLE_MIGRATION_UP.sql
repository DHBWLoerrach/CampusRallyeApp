-- Migration: Add puzzle support to questions system
-- Date: 2026-03-15
-- Description: Introduces puzzle groups and fragments to enable scavenger hunt puzzles

-- Definiert, welche Frage ein Puzzle ist
CREATE TABLE puzzle_groups (
  id SERIAL PRIMARY KEY,
  puzzle_question_id INT NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  variant VARCHAR(20) NOT NULL CHECK (variant IN ('visible', 'hidden')),
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ordnet Fragment-Fragen einem Puzzle zu
CREATE TABLE puzzle_fragments (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES puzzle_groups(id) ON DELETE CASCADE,
  fragment_question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  location_hint TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, fragment_question_id),
  UNIQUE(group_id, order_index)
);

-- Performance-Index für häufige Abfragen
CREATE INDEX idx_puzzle_fragments_group ON puzzle_fragments(group_id);

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE puzzle_groups IS 'Defines which questions are puzzles that require collecting fragments';
COMMENT ON TABLE puzzle_fragments IS 'Links fragment questions to puzzle groups with ordering';
COMMENT ON COLUMN puzzle_groups.variant IS 'visible: main question shown immediately, hidden: shown after all fragments collected';
COMMENT ON COLUMN puzzle_fragments.order_index IS 'Display order of fragments (0-based)';
COMMENT ON COLUMN puzzle_fragments.location_hint IS 'Optional hint text like "Bibliothek – Eingang"';

-- Row Level Security aktivieren
ALTER TABLE puzzle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_fragments ENABLE ROW LEVEL SECURITY;

-- Policies: Public read access (puzzle configuration data)
CREATE POLICY "Public read access for puzzle_groups"
  ON puzzle_groups FOR SELECT
  USING (true);

CREATE POLICY "Public read access for puzzle_fragments"
  ON puzzle_fragments FOR SELECT
  USING (true);

-- Note: Write access should be granted only to authenticated admin users
-- For now, INSERT/UPDATE/DELETE are restricted (no policies = no access for anon users)
