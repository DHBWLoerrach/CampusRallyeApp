-- ENUM erweitern
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'sorting';

-- Tabellen erstellen
CREATE TABLE sorting_groups (
  id SERIAL PRIMARY KEY,
  sorting_question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sorting_pairs (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES sorting_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sorting_pair_items (
  id SERIAL PRIMARY KEY,
  pair_id INT NOT NULL REFERENCES sorting_pairs(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sorting_pairs_group ON sorting_pairs(group_id);
CREATE INDEX idx_sorting_pair_items_pair ON sorting_pair_items(pair_id);

-- Stellt sicher, dass pro Pair genau ein Primary-Item existiert
CREATE UNIQUE INDEX one_primary_per_pair
  ON sorting_pair_items (pair_id)
  WHERE is_primary = true;

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE sorting_groups IS 'Defines which questions are sorting puzzles';
COMMENT ON TABLE sorting_pairs IS 'Defines pairs for sorting groups';
COMMENT ON TABLE sorting_pair_items IS 'Links items to sorting pairs with primary/secondary distinction';
COMMENT ON COLUMN sorting_pair_items.is_primary IS 'true: main item, false: associated item';

-- Row Level Security aktivieren
ALTER TABLE sorting_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorting_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sorting_pair_items ENABLE ROW LEVEL SECURITY;

-- Policies: Public read access (nur SELECT erlaubt)
CREATE POLICY "Public read access for sorting_groups"
  ON sorting_groups FOR SELECT
  USING (true);

CREATE POLICY "Public read access for sorting_pairs"
  ON sorting_pairs FOR SELECT
  USING (true);

CREATE POLICY "Public read access for sorting_pair_items"
  ON sorting_pair_items FOR SELECT
  USING (true);

-- Policies: Schreibzugriff nur für authentifizierte Benutzer
CREATE POLICY "Authenticated write access for sorting_groups"
  ON sorting_groups FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write access for sorting_pairs"
  ON sorting_pairs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write access for sorting_pair_items"
  ON sorting_pair_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');