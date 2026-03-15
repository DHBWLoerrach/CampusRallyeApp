# Automatisches Voting-System - Quick Start

## ✅ Was wurde implementiert

**Automatische Punktevergabe beim Status-Wechsel:**
- Teams voten während Status = `voting`
- Admin wechselt Rallye-Status zu `ranking` oder `ended`
- **Trigger vergibt automatisch Punkte** an die Gewinner-Teams
- Bei Gleichstand: Alle Teams mit gleicher Stimmenzahl bekommen die Punkte

## 🚀 Aktivierung in 3 Schritten

### 1. SQL-Migration ausführen

In Supabase SQL Editor:
```sql
-- Vollständiges Script aus:
docs/VOTING_SYSTEM_MIGRATION.sql
```

**Was wird erstellt:**
- Tabelle `voting_votes` (speichert Stimmen)
- Funktion `cast_voting_vote` (speichert Vote)
- Funktion `finalize_voting_for_question` (vergibt Punkte)
- **Trigger `auto_finalize_voting`** (reagiert auf Status-Wechsel)

### 2. Voting-Frage zuweisen

In der `voting`-Tabelle einen Eintrag erstellen:
```sql
INSERT INTO voting (rallye_id, question_id)
VALUES (6, 8);  -- Rallye 6, Frage 8
```

### 3. Testen!

**Workflow:**
1. Rallye-Status auf `voting` setzen
2. Mindestens 3 Teams erstellen
3. Teams öffnen App und voten
4. **Admin setzt Status auf `ranking`**
5. ✨ **Punkte werden automatisch vergeben!**

## 📊 Wie das System funktioniert

### Phase 1: Voting läuft (Status = `voting`)

```
Team A votet für Team B  →  Vote gespeichert in voting_votes
Team B votet für Team C  →  Vote gespeichert
Team C votet für Team B  →  Vote gespeichert

Zwischenstand:
- Team B: 2 Stimmen
- Team C: 1 Stimme
```

**Noch keine Punkte vergeben!** 👈

### Phase 2: Admin beendet Voting

```sql
-- Admin im Admin-Interface oder direkt in Supabase:
UPDATE rallye SET status = 'ranking' WHERE id = 6;
```

**Trigger startet automatisch:** 🚀

```
1. Trigger erkennt: Status-Wechsel von "voting" → "ranking"
2. Findet alle Voting-Fragen (aus voting-Tabelle)
3. Für jede Frage:
   - Zählt Stimmen
   - Findet Gewinner (höchste Stimmenzahl)
   - Holt question.points (z.B. 2 Punkte)
   - Vergibt Punkte an Gewinner-Team(s)
```

**Ergebnis:**
- Team B erhält +2 Punkte (aus questions.points)
- Automatisch in `team_questions` aktualisiert
- Scoreboard zeigt korrekte Punkte

### Bei Gleichstand

```
Team B: 2 Stimmen  →  +2 Punkte
Team C: 2 Stimmen  →  +2 Punkte
Team A: 0 Stimmen  →  +0 Punkte
```

## 🔍 Überprüfung

Nach dem Status-Wechsel kannst du kontrollieren:

```sql
-- Zeige alle Votes
SELECT * FROM voting_votes WHERE rallye_id = 6;

-- Zeige Punkte der Teams
SELECT rt.name, SUM(tq.points) as total_points
FROM rallye_team rt
LEFT JOIN team_questions tq ON tq.team_id = rt.id
WHERE rt.rallye_id = 6
GROUP BY rt.id, rt.name
ORDER BY total_points DESC;
```

## 🔧 Manuelle Punktevergabe (Optional)

Falls du manuell Punkte vergeben willst (z.B. für Tests):

```sql
-- Punkte für Frage 8 in Rallye 6 vergeben
SELECT finalize_voting_for_question(6, 8);

-- Rückgabe zeigt was passiert ist:
-- {"success": true, "points_awarded": 2, "teams_updated": 1}
```

## 🔄 Voting zurücksetzen

```sql
-- Nur die Votes löschen (Punkte bleiben)
SELECT reset_voting_for_question(6, 8);

-- Oder komplettes Rollback (alles löschen):
-- docs/VOTING_SYSTEM_ROLLBACK.sql ausführen
```

## ⚠️ Wichtige Hinweise

1. **Mindestens 3 Teams erforderlich** (bereits in App implementiert)
2. **Eigene Gruppe kann nicht gewählt werden** (bereits gefiltert)
3. **Trigger läuft nur einmal** - mehrfacher Status-Wechsel fügt keine Extra-Punkte hinzu
4. **Team kann Vote ändern** bis Voting beendet wird (ON CONFLICT DO UPDATE)

## 🎯 Vorteile des Systems

- ✅ **Automatisch:** Keine manuelle Punktevergabe nötig
- ✅ **Fair:** Bei Gleichstand teilen sich Teams die Punkte
- ✅ **Transparent:** Alle Votes bleiben gespeichert
- ✅ **Flexibel:** Admin entscheidet wann Voting endet
- ✅ **Konsistent:** Verwendet die question.points aus der DB
