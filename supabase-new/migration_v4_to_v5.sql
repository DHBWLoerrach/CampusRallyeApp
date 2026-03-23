-- ============================================================================
-- Migration: v4 -> v5
-- ============================================================================
-- Ziel:
--   - NFC-Feature als neuer question_type 'nfc'
--   - Keine neue Subtype-Tabelle (Option B)
--   - Validierung bleibt ueber bestehenden answers-Stringvergleich
--
-- Ausgangspunkt (v4):
--   - question_type enthaelt u. a. 'geocaching', aber noch kein 'nfc'
-- ============================================================================

-- WICHTIG:
-- ALTER TYPE ... ADD VALUE darf in PostgreSQL nicht innerhalb einer
-- Transaktion ausgefuehrt werden.
-- Dieses Skript daher ohne BEGIN/COMMIT ausfuehren.

ALTER TYPE "public"."question_type" ADD VALUE IF NOT EXISTS 'nfc';

-- ============================================================================
-- Migration v4 -> v5 abgeschlossen
-- ============================================================================
