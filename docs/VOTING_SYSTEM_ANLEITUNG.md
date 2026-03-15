# Voting System - Anleitung zur Aktivierung

## Überblick

Das neue Voting-System vergibt Punkte basierend auf der `points`-Spalte in der `questions`-Tabelle:

- **Vorher:** Jeder Vote = +1 Punkt (unbegrenzt)
- **Jetzt:** Team(s) mit den meisten Stimmen bekommen die definierten `question.points` (z.B. 2 Punkte)
- **Bei Gleichstand:** Alle Teams mit gleicher Stimmenzahl erhalten die Punkte

## Aktivierung in 2 Schritten

### Schritt 1: SQL-Migration in Supabase ausführen

1. Öffne dein Supabase-Projekt: https://supabase.com
2. Gehe zum **SQL Editor** (linke Seitenleiste)
3. Öffne die Datei `docs/VOTING_SYSTEM_MIGRATION.sql`
4. Kopiere den kompletten SQL-Code
5. Füge ihn im SQL Editor ein
6. Klicke auf **Run** (grüner Button)

**Was wird erstellt:**
- Tabelle `voting_votes`: Speichert die einzelnen Votes
- Funktion `cast_voting_vote`: Handhabt Vote-Logik und Punktevergabe
- Funktion `reset_voting_for_question`: Zum Zurücksetzen (optional)

### Schritt 2: App-Code ist bereits angepasst ✅

Die App verwendet jetzt automatisch die neue Voting-Logik:
- Datei: `app/(tabs)/rallye/voting.tsx`
- Tests: Aktualisiert und bestanden
- Translations: Neue Meldungen hinzugefügt

## Funktionsweise

### Voting-Ablauf

1. **Team A votet für Team B**
   - Vote wird in `voting_votes` gespeichert
   - Noch keine Punkte vergeben
   - Status: "1 von 3 Teams haben gevotet"

2. **Team B votet für Team C**
   - Vote wird gespeichert
   - Status: "2 von 3 Teams haben gevotet"

3. **Team C votet für Team B**
   - Vote wird gespeichert
   - Status: **Alle Teams haben gevotet!**
   - Auswertung startet:
     - Team B: 2 Stimmen (Gewinner)
     - Team C: 1 Stimme
   - **Team B erhält 2 Punkte** (aus `questions.points`)
   - Alert: "Abstimmung abgeschlossen! 2 Punkte wurden vergeben."

### Bei Gleichstand

Beispiel: Team B und Team C haben beide 1 Stimme
- **Beide Teams erhalten die 2 Punkte**
- Faire Lösung bei Unentschieden

## Anforderungen

- ✅ Mindestens 3 Teams (bereits implementiert)
- ✅ Eigene Gruppe kann nicht gewählt werden
- ✅ Text in Team-Boxen zentriert
- ✅ Visuelle Hervorhebung bei Auswahl
- ✅ Konsistente Abstände im UI

## Testen

Nach der SQL-Migration kannst du das System testen:

1. Erstelle eine Rallye mit mindestens 3 Teams
2. Füge eine Voting-Frage hinzu (z.B. ID 8: "Welche Gruppe hat das beste Bild")
3. Setze die Rallye in Status `voting`
4. Jedes Team öffnet die App und votet
5. Nach dem letzten Vote: Alert mit Punktevergabe erscheint

## Rollback (Falls nötig)

### Schneller Rollback mit Rollback-Script

Falls das neue System nicht funktioniert oder du zurück möchtest:

1. Öffne Supabase **SQL Editor**
2. Kopiere den Inhalt von `docs/VOTING_SYSTEM_ROLLBACK.sql`
3. Füge ein und klicke **Run**
4. **Fertig!** Alles ist rückgängig gemacht

**⚠️ Warnung:** Das Rollback löscht die `voting_votes`-Tabelle und alle gespeicherten Votes!

### Manueller Rollback (Alternative)

```sql
-- Policies löschen
DROP POLICY IF EXISTS "Teams can insert their own votes" ON voting_votes;
DROP POLICY IF EXISTS "Teams can view all votes" ON voting_votes;

-- Funktionen löschen
DROP FUNCTION IF EXISTS reset_voting_for_question(int8, int8);
DROP FUNCTION IF EXISTS cast_voting_vote(int8, int8, text, text);

-- Tabelle löschen
DROP TABLE IF EXISTS voting_votes CASCADE;
```

### Nach dem Rollback: App-Code zurücksetzen

In `app/(tabs)/rallye/voting.tsx` zurück zur alten Logik:

```tsx
const handleNextQuestion = async () => {
  try {
    if (!selectedUpdateId) return;
    setSendingResult(true);
    const { error } = await supabase.rpc('increment_team_question_points', {
      target_answer_id: selectedUpdateId,
    });
    if (error) throw error;
    setCurrentVotingIdx((i) => i + 1);
    setSelectedUpdateId(null);
    setSelectedTeam(null);
  } catch {
    Alert.alert(t('common.errorTitle'), t('voting.error.submit'));
  } finally {
    setSendingResult(false);
  }
};
```

## Sicheres Testen

### Option 1: Backup-Ansatz (Empfohlen)

1. **Vor der Migration:** Kopiere wichtige Daten
   ```sql
   -- Team-Punkte sichern
   SELECT * FROM team_questions;
   ```

2. **Migration durchführen** (`VOTING_SYSTEM_MIGRATION.sql`)

3. **Testen** mit Test-Teams

4. **Falls Probleme:** Rollback ausführen (`VOTING_SYSTEM_ROLLBACK.sql`)

### Option 2: Separates Test-Projekt

- Erstelle ein zweites Supabase-Projekt für Tests
- Teste dort zuerst das neue System
- Bei Erfolg: Im Produktiv-Projekt ausrollen

## Häufige Fehler beim Ausführen

### Fehler: "relation already exists"

**Lösung:** Die Tabelle existiert bereits. Zuerst Rollback ausführen, dann erneut migrieren.

### Fehler: "function does not exist"

**Ursache:** Die alte `increment_team_question_points` Funktion fehlt.
**Lösung:** Kein Problem - wird vom neuen System nicht mehr benötigt.

### Fehler: Foreign Key Constraint

**Ursache:** Referenzierte Tabellen (rallye, questions, rallye_team) fehlen.
**Lösung:** Schema aus dem Admin-Projekt muss zuerst installiert sein.

## Vorteile des neuen Systems

1. **Gerechte Punktevergabe:** Egal wie viele Teams teilnehmen, die Punkte bleiben gleich
2. **Konsistenz:** Die in Supabase definierten `question.points` werden verwendet
3. **Transparenz:** Admins sehen alle Votes in der `voting_votes`-Tabelle
4. **Flexibilität:** Gleichstand wird fair behandelt
5. **Vote-Historie:** Alle Votes bleiben gespeichert für Auswertungen
