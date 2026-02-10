-- ============================================
-- Voting System ROLLBACK
-- ============================================
-- Dieses Script macht alle Änderungen aus VOTING_SYSTEM_MIGRATION.sql
-- rückgängig und stellt den vorherigen Zustand wieder her.
--
-- WICHTIG: Dieses Script löscht ALLE gespeicherten Votes!
-- Falls du die Vote-Daten behalten möchtest, sichere sie vorher:
-- SELECT * FROM voting_votes;

-- 1. RLS Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Teams can insert their own votes" ON voting_votes;
DROP POLICY IF EXISTS "Teams can view all votes" ON voting_votes;

-- 2. Trigger und Funktionen löschen
DROP TRIGGER IF EXISTS trigger_auto_finalize_voting ON rallye;
DROP FUNCTION IF EXISTS auto_finalize_voting();
DROP FUNCTION IF EXISTS finalize_voting_for_question(int8, int8);
DROP FUNCTION IF EXISTS reset_voting_for_question(int8, int8);
DROP FUNCTION IF EXISTS cast_voting_vote(int8, int8, int8, int8);

-- 3. Tabelle löschen (CASCADE entfernt auch alle Abhängigkeiten)
DROP TABLE IF EXISTS voting_votes CASCADE;

-- Fertig! Das alte System mit increment_team_question_points ist wieder aktiv.
-- Die App würde dann wieder +1 Punkt pro Vote vergeben.
