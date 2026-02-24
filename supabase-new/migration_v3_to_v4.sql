-- ============================================================================
-- Migration: v3 → v4
-- ============================================================================
-- Änderungen:
--   1. Neuer ENUM-Wert 'geocaching' für question_type
--   2. Neue Spalten in questions: target_latitude, target_longitude,
--      proximity_radius, geocaching_input_type
-- ============================================================================

-- ============================================================================
-- 1. ENUM question_type erweitern
-- ============================================================================
-- HINWEIS: ALTER TYPE ... ADD VALUE kann NICHT innerhalb einer Transaktion
-- ausgeführt werden (PostgreSQL-Beschränkung). Dieses Statement muss einzeln
-- im Supabase SQL Editor ausgeführt werden oder als separate Migration.

ALTER TYPE "public"."question_type" ADD VALUE IF NOT EXISTS 'geocaching';


-- ============================================================================
-- 2. Neue Spalten für Geocaching-Fragen
-- ============================================================================

BEGIN;

-- Breitengrad des Zielorts (WGS 84)
ALTER TABLE "public"."questions"
    ADD COLUMN IF NOT EXISTS "target_latitude" double precision;

-- Längengrad des Zielorts (WGS 84)
ALTER TABLE "public"."questions"
    ADD COLUMN IF NOT EXISTS "target_longitude" double precision;

-- Radius in Metern, ab dem die Frage freigeschaltet wird (Default: 10m)
ALTER TABLE "public"."questions"
    ADD COLUMN IF NOT EXISTS "proximity_radius" integer DEFAULT 10;

-- Eingabetyp für die Antwort: 'text' (Freitext) oder 'qr' (QR-Code-Scan)
ALTER TABLE "public"."questions"
    ADD COLUMN IF NOT EXISTS "geocaching_input_type" text DEFAULT 'text';

-- Constraint: geocaching_input_type darf nur 'text' oder 'qr' sein
ALTER TABLE "public"."questions"
    ADD CONSTRAINT "questions_geocaching_input_type_check"
    CHECK ("geocaching_input_type" IS NULL OR "geocaching_input_type" IN ('text', 'qr'));

-- Defaults entfernen: Geocaching-Spalten sollen nur bei type='geocaching' gesetzt sein
ALTER TABLE "public"."questions"
    ALTER COLUMN "proximity_radius" DROP DEFAULT;

ALTER TABLE "public"."questions"
    ALTER COLUMN "geocaching_input_type" DROP DEFAULT;

-- Bestehende Nicht-Geocaching-Fragen aufräumen
UPDATE "public"."questions"
SET
    "target_latitude" = NULL,
    "target_longitude" = NULL,
    "proximity_radius" = NULL,
    "geocaching_input_type" = NULL
WHERE "type" != 'geocaching';

-- Constraint: Geocaching-Spalten dürfen NUR bei type='geocaching' gesetzt sein
ALTER TABLE "public"."questions"
    ADD CONSTRAINT "questions_geocaching_columns_only_check"
    CHECK (
        "type" = 'geocaching'
        OR (
            "target_latitude" IS NULL
            AND "target_longitude" IS NULL
            AND "proximity_radius" IS NULL
            AND "geocaching_input_type" IS NULL
        )
    );

COMMIT;

-- ============================================================================
-- Migration v3 → v4 abgeschlossen
-- ============================================================================
