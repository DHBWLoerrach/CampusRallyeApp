-- Rollback: Remove puzzle support from questions system
-- Date: 2026-03-15
-- Description: Drops puzzle_groups and puzzle_fragments tables
-- WARNING: This will delete all puzzle configuration data!

-- Drop policies first
DROP POLICY IF EXISTS "Public read access for puzzle_fragments" ON puzzle_fragments;
DROP POLICY IF EXISTS "Public read access for puzzle_groups" ON puzzle_groups;

-- Drop index
DROP INDEX IF EXISTS idx_puzzle_fragments_group;

-- Drop tables in reverse order (child tables first due to FK constraints)
DROP TABLE IF EXISTS puzzle_fragments CASCADE;
DROP TABLE IF EXISTS puzzle_groups CASCADE;
