-- ============================================================================
-- Migration: v3 → v4
-- ============================================================================
-- Änderungen:
--   1. Neue ENUM-Werte 'geocaching' und 'nfc' für question_type
--   2. Neue Tabelle questions_geocaching (1:1-Beziehung zu questions)
--   3. NFC nutzt bewusst KEINE eigene Subtype-Tabelle (String-Vergleich via answers)
-- ============================================================================

-- ============================================================================
-- 1. ENUM question_type erweitern
-- ============================================================================
-- HINWEIS: ALTER TYPE ... ADD VALUE kann NICHT innerhalb einer Transaktion
-- ausgeführt werden (PostgreSQL-Beschränkung). Dieses Statement muss einzeln
-- im Supabase SQL Editor ausgeführt werden oder als separate Migration.

ALTER TYPE "public"."question_type" ADD VALUE IF NOT EXISTS 'geocaching';
ALTER TYPE "public"."question_type" ADD VALUE IF NOT EXISTS 'nfc';


-- ============================================================================
-- 2. Neue Tabelle für Geocaching-spezifische Daten
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "public"."questions_geocaching" (
    "question_id" bigint NOT NULL,
    "target_latitude" double precision NOT NULL,
    "target_longitude" double precision NOT NULL,
    "proximity_radius" integer NOT NULL DEFAULT 10,
    "geocaching_input_type" "text" NOT NULL DEFAULT 'text'
);

ALTER TABLE "public"."questions_geocaching" OWNER TO "postgres";

-- Primary Key
ALTER TABLE ONLY "public"."questions_geocaching"
    ADD CONSTRAINT "questions_geocaching_pkey" PRIMARY KEY ("question_id");

-- Foreign Key → questions.id (cascade delete)
ALTER TABLE ONLY "public"."questions_geocaching"
    ADD CONSTRAINT "questions_geocaching_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;

-- Constraint: geocaching_input_type must be 'text' or 'qr'
ALTER TABLE ONLY "public"."questions_geocaching"
    ADD CONSTRAINT "questions_geocaching_input_type_check"
    CHECK ("geocaching_input_type" IN ('text', 'qr'));

-- ============================================================================
-- 3. Row Level Security
-- ============================================================================

ALTER TABLE "public"."questions_geocaching" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON "public"."questions_geocaching" FOR SELECT USING (true);

CREATE POLICY "Enable write for authenticated users only"
    ON "public"."questions_geocaching" TO "authenticated" USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. Migrate existing geocaching data (if columns exist from a previous v4)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'questions'
      AND column_name = 'target_latitude'
  ) THEN
    INSERT INTO "public"."questions_geocaching"
        ("question_id", "target_latitude", "target_longitude", "proximity_radius", "geocaching_input_type")
    SELECT
        "id",
        "target_latitude",
        "target_longitude",
        COALESCE("proximity_radius", 10),
        COALESCE("geocaching_input_type", 'text')
    FROM "public"."questions"
    WHERE "type" = 'geocaching'
      AND "target_latitude" IS NOT NULL
      AND "target_longitude" IS NOT NULL;

    -- Remove old columns
    ALTER TABLE "public"."questions" DROP CONSTRAINT IF EXISTS "questions_geocaching_columns_only_check";
    ALTER TABLE "public"."questions" DROP CONSTRAINT IF EXISTS "questions_geocaching_input_type_check";
    ALTER TABLE "public"."questions" DROP COLUMN IF EXISTS "geocaching_input_type";
    ALTER TABLE "public"."questions" DROP COLUMN IF EXISTS "proximity_radius";
    ALTER TABLE "public"."questions" DROP COLUMN IF EXISTS "target_longitude";
    ALTER TABLE "public"."questions" DROP COLUMN IF EXISTS "target_latitude";
  END IF;
END
$$;

COMMIT;

-- ============================================================================
-- Migration v3 → v4 abgeschlossen
-- ============================================================================
