-- Rollback: Remove sorting support from questions system
-- Date: 2026-03-24
-- Description: Drops sorting groups, pairs, and pair items tables

-- Tabellen löschen
DROP TABLE IF EXISTS sorting_pair_items;
DROP TABLE IF EXISTS sorting_pairs;
DROP TABLE IF EXISTS sorting_groups;

-- ENUM zurücksetzen (optional, falls keine anderen Fragen diesen Typ verwenden)
-- ALTER TYPE question_type DROP VALUE 'sorting';