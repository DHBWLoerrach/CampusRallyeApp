-- ============================================================================
-- Downgrade: v4 → v3
-- ============================================================================
-- Voraussetzung: Es dürfen KEINE Fragen mit type = 'geocaching' mehr
-- existieren. Das Skript prüft dies und bricht bei Verstoß ab.
-- ============================================================================

BEGIN;

-- 1. Sicherstellen, dass keine Geocaching-Fragen mehr existieren
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "public"."questions" WHERE "type" = 'geocaching'
  ) THEN
    RAISE EXCEPTION
      'Downgrade abgebrochen: Es existieren noch Fragen mit type = ''geocaching''. '
      'Bitte lösche oder ändere diese Fragen zuerst.';
  END IF;
END
$$;

-- 2. Tabelle questions_geocaching entfernen
DROP TABLE IF EXISTS "public"."questions_geocaching";

COMMIT;

-- ============================================================================
-- 3. ENUM-Wert 'geocaching' entfernen
-- ============================================================================
-- HINWEIS: PostgreSQL unterstützt kein ALTER TYPE ... REMOVE VALUE.
-- Stattdessen wird der Typ neu erstellt und die Spalte umgestellt.
-- Dies muss AUSSERHALB einer Transaktion laufen.
-- ============================================================================

-- Neuen Typ ohne 'geocaching' anlegen
CREATE TYPE "public"."question_type_v3" AS ENUM (
    'multiple_choice',
    'knowledge',
    'picture',
    'qr_code',
    'upload'
);

-- Spalte auf neuen Typ umstellen
ALTER TABLE "public"."questions"
    ALTER COLUMN "type" TYPE "public"."question_type_v3"
    USING "type"::text::"public"."question_type_v3";

-- Abhängige Funktion droppen, damit der alte Typ entfernt werden kann
DROP FUNCTION IF EXISTS "public"."get_voting_content"(bigint, bigint);

-- Alten Typ löschen und neuen umbenennen
DROP TYPE "public"."question_type";
ALTER TYPE "public"."question_type_v3" RENAME TO "question_type";

-- Funktion mit neuem Typ wiederherstellen
CREATE OR REPLACE FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint)
RETURNS TABLE(
    "tq_id" bigint, "tq_team_id" bigint, "tq_question_id" bigint, "tq_points" bigint,
    "rt_id" bigint, "rt_rallye_id" bigint, "rt_team_name" "text", "tq_team_answer" "text",
    "question_content" "text", "question_type" "public"."question_type"
)
LANGUAGE "plpgsql"
AS $$
BEGIN
  RETURN QUERY
    SELECT tq.id, tq.team_id, tq.question_id, tq.points,
           rt.id, rt.rallye_id, rt.name, tq.team_answer,
           q.content, q.type
    FROM team_questions AS tq
    JOIN rallye_team AS rt ON tq.team_id = rt.id
    JOIN questions AS q ON tq.question_id = q.id
    WHERE tq.question_id IN (
          SELECT v.question_id
          FROM voting AS v
          WHERE v.rallye_id = rallye_id_param
    )
    AND rt.rallye_id = rallye_id_param
    AND rt.id != own_team_id_param;
END;
$$;

ALTER FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint) OWNER TO "postgres";

-- ============================================================================
-- Downgrade v4 → v3 abgeschlossen
-- ============================================================================
