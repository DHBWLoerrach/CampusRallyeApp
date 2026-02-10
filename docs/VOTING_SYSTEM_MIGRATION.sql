-- ============================================
-- Voting System Migration
-- ============================================
-- Diese SQL-Datei muss in Supabase ausgeführt werden (SQL Editor)
-- um das neue Voting-System zu aktivieren.

-- 1. Tabelle für Vote-Speicherung erstellen
CREATE TABLE IF NOT EXISTS voting_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rallye_id int8 NOT NULL REFERENCES rallye(id) ON DELETE CASCADE,
  question_id int8 NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  voting_team_id int8 NOT NULL REFERENCES rallye_team(id) ON DELETE CASCADE,
  voted_for_team_id int8 NOT NULL REFERENCES rallye_team(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rallye_id, question_id, voting_team_id)
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_voting_votes_rallye_question 
  ON voting_votes(rallye_id, question_id);

-- 2. RPC-Funktion für Vote-Cast (OHNE automatische Punktevergabe)
CREATE OR REPLACE FUNCTION cast_voting_vote(
  p_rallye_id int8,
  p_question_id int8,
  p_voting_team_id int8,
  p_voted_for_team_id int8
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_teams int;
  v_voted_teams int;
  v_result json;
BEGIN
  -- Vote speichern oder aktualisieren (Team kann Vote ändern)
  INSERT INTO voting_votes (rallye_id, question_id, voting_team_id, voted_for_team_id)
  VALUES (p_rallye_id, p_question_id, p_voting_team_id, p_voted_for_team_id)
  ON CONFLICT (rallye_id, question_id, voting_team_id) 
  DO UPDATE SET 
    voted_for_team_id = p_voted_for_team_id,
    created_at = now();
  
  -- Gesamtanzahl Teams in dieser Rallye
  SELECT COUNT(*) INTO v_total_teams
  FROM rallye_team
  WHERE rallye_id = p_rallye_id;
  
  -- Anzahl Teams die bereits gevotet haben
  SELECT COUNT(DISTINCT voting_team_id) INTO v_voted_teams
  FROM voting_votes
  WHERE rallye_id = p_rallye_id AND question_id = p_question_id;
  
  -- Nur Status zurückgeben, keine automatische Punktevergabe
  v_result = json_build_object(
    'voting_complete', false,
    'teams_voted', v_voted_teams,
    'total_teams', v_total_teams
  );
  
  RETURN v_result;
END;
$$;

-- 3. Funktion zum Beenden und Auswerten des Votings
CREATE OR REPLACE FUNCTION finalize_voting_for_question(
  p_rallye_id int8,
  p_question_id int8
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_points int;
  v_max_votes int;
  v_teams_updated int;
  v_result json;
BEGIN
  -- Punkte der Frage aus questions-Tabelle holen
  SELECT points INTO v_question_points
  FROM questions
  WHERE id = p_question_id;
  
  -- Höchste Stimmenanzahl ermitteln
  SELECT MAX(vote_count) INTO v_max_votes
  FROM (
    SELECT voted_for_team_id, COUNT(*) as vote_count
    FROM voting_votes
    WHERE rallye_id = p_rallye_id AND question_id = p_question_id
    GROUP BY voted_for_team_id
  ) vote_counts;
  
  -- Falls keine Votes vorhanden
  IF v_max_votes IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No votes found',
      'points_awarded', 0,
      'teams_updated', 0
    );
  END IF;
  
  -- Sicherstellen, dass team_questions Einträge für alle Gewinner existieren
  INSERT INTO team_questions (team_id, question_id, team_answer, points, correct)
  SELECT 
    winners.voted_for_team_id,
    p_question_id,
    NULL,
    0,
    false
  FROM (
    SELECT voted_for_team_id
    FROM voting_votes
    WHERE rallye_id = p_rallye_id AND question_id = p_question_id
    GROUP BY voted_for_team_id
    HAVING COUNT(*) = v_max_votes
  ) winners
  WHERE NOT EXISTS (
    SELECT 1 FROM team_questions 
    WHERE team_id = winners.voted_for_team_id 
    AND question_id = p_question_id
  );
  
  -- Punkte an ALLE Teams mit höchster Stimmenzahl vergeben (bei Gleichstand)
  WITH winners AS (
    SELECT voted_for_team_id
    FROM voting_votes
    WHERE rallye_id = p_rallye_id AND question_id = p_question_id
    GROUP BY voted_for_team_id
    HAVING COUNT(*) = v_max_votes
  ),
  updated AS (
    UPDATE team_questions tq
    SET points = points + v_question_points
    FROM winners
    WHERE tq.team_id = winners.voted_for_team_id
      AND tq.question_id = p_question_id
    RETURNING tq.team_id
  )
  SELECT COUNT(*) INTO v_teams_updated FROM updated;
  
  v_result = json_build_object(
    'success', true,
    'points_awarded', v_question_points,
    'max_votes', v_max_votes,
    'teams_updated', v_teams_updated
  );
  
  RETURN v_result;
END;
$$;

-- 4. Optional: Funktion zum Zurücksetzen des Votings für eine Frage
CREATE OR REPLACE FUNCTION reset_voting_for_question(
  p_rallye_id int8,
  p_question_id int8
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Nur Votes löschen, Punkte bleiben erhalten
  DELETE FROM voting_votes
  WHERE rallye_id = p_rallye_id AND question_id = p_question_id;
END;
$$;

-- 5. Automatische Punktevergabe beim Status-Wechsel
-- Trigger-Funktion die beim Rallye-Status-Wechsel ausgelöst wird
CREATE OR REPLACE FUNCTION auto_finalize_voting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_record RECORD;
  v_result json;
BEGIN
  -- Nur ausführen wenn Status von 'voting' zu 'ranking' oder 'ended' wechselt
  IF OLD.status = 'voting' AND (NEW.status = 'ranking' OR NEW.status = 'ended') THEN
    -- Alle Voting-Fragen für diese Rallye durchgehen
    FOR v_question_record IN 
      SELECT question_id 
      FROM voting 
      WHERE rallye_id = NEW.id
    LOOP
      -- Punktevergabe für jede Voting-Frage
      SELECT finalize_voting_for_question(NEW.id, v_question_record.question_id) 
      INTO v_result;
      
      -- Optional: Logging (kann später entfernt werden)
      RAISE NOTICE 'Finalized voting for question % in rallye %: %', 
        v_question_record.question_id, NEW.id, v_result;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger auf rallye-Tabelle registrieren
DROP TRIGGER IF EXISTS trigger_auto_finalize_voting ON rallye;
CREATE TRIGGER trigger_auto_finalize_voting
  AFTER UPDATE OF status ON rallye
  FOR EACH ROW
  EXECUTE FUNCTION auto_finalize_voting();

-- 6. RLS Policies (optional, je nach Security-Anforderungen)
ALTER TABLE voting_votes ENABLE ROW LEVEL SECURITY;

-- Teams können ihre eigenen Votes sehen und erstellen
CREATE POLICY "Teams can insert their own votes"
  ON voting_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teams can view all votes"
  ON voting_votes FOR SELECT
  USING (true);

-- ============================================
-- FERTIG!
-- ============================================
-- Das System funktioniert jetzt automatisch:
-- 1. Teams voten während "voting" Status
-- 2. Admin wechselt Rallye zu "ranking" oder "ended"
-- 3. Trigger vergibt automatisch Punkte an Gewinner-Teams
-- 4. Scoreboard zeigt aktualisierte Punkte
