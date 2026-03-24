# Puzzle-Fragetyp System

## Übersicht

Das Puzzle-System ermöglicht es, Schnitzeljagd-artige Fragen zu erstellen, bei denen Teams mehrere Fragment-Aufgaben sammeln müssen, bevor sie die Hauptfrage beantworten können.

**Status:** Fragment-System vollständig implementiert.

---

## Datenbank-Schema

### Neue Tabellen

#### `puzzle_groups`
Definiert, welche Frage ein Puzzle ist und wie die Fragmente angezeigt werden.

```sql
CREATE TABLE puzzle_groups (
  id SERIAL PRIMARY KEY,
  puzzle_question_id INT NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Felder:**
- `puzzle_question_id`: FK zur Hauptfrage in der `questions` Tabelle
- `visible`: 
  - `true`: Hauptfrage ist von Anfang an sichtbar
  - `false`: Hauptfrage erscheint erst nach Beantworten aller Teilfragen

#### `puzzle_fragments`
Ordnet Fragment-Fragen einem Puzzle zu.

```sql
CREATE TABLE puzzle_fragments (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES puzzle_groups(id) ON DELETE CASCADE,
  fragment_question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  location_hint TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, fragment_question_id),
  UNIQUE(group_id, order_index)
);

CREATE INDEX idx_puzzle_fragments_group ON puzzle_fragments(group_id);
```

**Felder:**
- `group_id`: FK zu `puzzle_groups`
- `fragment_question_id`: FK zu einer Frage in `questions` (beliebiger Typ)
- `order_index`: Reihenfolge der Anzeige (0-basiert)
- `location_hint`: Optionaler Hinweis wie "Bibliothek – Eingang"

### Row Level Security (RLS)

```sql
ALTER TABLE puzzle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_fragments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for puzzle_groups"
  ON puzzle_groups FOR SELECT USING (true);

CREATE POLICY "Public read access for puzzle_fragments"
  ON puzzle_fragments FOR SELECT USING (true);
```

Schreibzugriff ist nur für authentifizierte Admins vorgesehen.

---

## Question Type Erweiterung

### Supabase ENUM

```sql
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'puzzle';
```

### TypeScript

**Datei:** `types/rallye.ts`

```typescript
export type QuestionType =
  | 'knowledge'
  | 'upload'
  | 'qr_code'
  | 'multiple_choice'
  | 'picture'
  | 'puzzle';
```

---

## Datenstruktur & Konventionen

### Wie Puzzles strukturiert sind

1. **Hauptfrage** (z.B. ID 11):
   - Typ: `'puzzle'`
   - Inhalt: Die finale Frage (z.B. "Wie viele Stunden sind Bibliothek UND Sekretariat geöffnet?")
   - **IN** `join_rallye_questions` (erscheint im Rallye-Flow)
   - Hat einen Eintrag in `puzzle_groups`

2. **Fragment-Fragen** (z.B. ID 13, 14):
   - Typ: `'knowledge'`, `'qr_code'`, `'multiple_choice'` etc. (beliebig)
   - Inhalt: Die Teilaufgaben (z.B. "Scanne QR-Code an der Bibliothek")
   - **NICHT IN** `join_rallye_questions` (erscheinen nicht einzeln im Flow)
   - Referenziert in `puzzle_fragments` mit `fragment_question_id`

3. **Antworten**:
   - Alle Fragen (Haupt- und Fragment-Fragen) haben normale Antworten in der `answers` Tabelle

### Beispiel-Setup

```sql
-- 1. Fragen erstellen
INSERT INTO questions (content, type, points) VALUES
  ('Wie viele Stunden gesamt?', 'puzzle', 5),        -- ID 11
  ('Bibliothek Öffnungszeit?', 'knowledge', 6),      -- ID 13
  ('Sekretariat Öffnungszeit?', 'knowledge', 0);     -- ID 14

-- 2. Antworten hinzufügen
INSERT INTO answers (question_id, text, correct) VALUES
  (11, '42', true),
  (13, '20', true),
  (14, '22', true);

-- 3. Puzzle-Gruppe erstellen
INSERT INTO puzzle_groups (puzzle_question_id, visible)
VALUES (11, true);  -- ID 1

-- 4. Fragmente zuordnen
INSERT INTO puzzle_fragments (group_id, fragment_question_id, order_index, location_hint) VALUES
  (1, 13, 1, 'Bibliothek – Eingang'),
  (1, 14, 2, 'Sekretariat – Flur A1');

-- 5. Nur Hauptfrage zur Rallye hinzufügen
INSERT INTO join_rallye_questions (rallye_id, question_id) VALUES
  (1, 11);  -- Nur ID 11, NICHT 13 oder 14!
```

---

## TypeScript Interfaces

**Datei:** `types/rallye.ts`

```typescript
export interface PuzzleGroup {
  id: number;
  puzzle_question_id: number;
  visible: boolean;
  created_at: string;
}

export interface PuzzleFragment {
  id: number;
  group_id: number;
  fragment_question_id: number;
  order_index: number;
  location_hint?: string | null;
  created_at: string;
}

export interface PuzzleFragmentWithQuestion extends PuzzleFragment {
  fragment_question: Question;
}
```

---

## Component Implementation

### PuzzleQuestion Component

**Datei:** `components/rallye/questions/PuzzleQuestion.tsx`

**Aktueller Stand:**
- Hauptfrage mit darunterliegender Teilfragen-Übersicht
- Teilfragen werden **nacheinander** angezeigt (basierend auf `order_index`)
- Nach Beantwortung einer Teilfrage erscheint Button "Zur nächsten Teilfrage"
- Fortschrittsanzeige: "x von n beantwortet"
- Jede Teilfrage öffnet die entsprechende Fragment-Komponente (SkillQuestion, QRCodeQuestion etc.)
- Aufgeben möglich für Teilfragen und Hauptfrage
- Bei `visible = false`: Hauptfrage erst sichtbar wenn alle Teilfragen beantwortet sind
- Beantwortete Teilfragen zeigen die eigene Antwort des Teams + ✓/✗ je nach Korrektheit

**Integration:**

Datei: `app/(tabs)/rallye/question-renderer.tsx`

```typescript
import PuzzleQuestion from '@/components/rallye/questions/PuzzleQuestion';

const components: Record<string, any> = {
  knowledge: SkillQuestion,
  upload: UploadPhotoQuestion,
  qr_code: QRCodeQuestion,
  multiple_choice: MultipleChoiceQuestion,
  picture: ImageQuestion,
  puzzle: PuzzleQuestion,
};
```

---

## Internationalisierung (i18n)

**Datei:** `utils/i18n.ts`

### Deutsche Übersetzungen

```typescript
'puzzle.error.loadFragments': 'Puzzle-Fragmente konnten nicht geladen werden.',
'puzzle.error.fragmentsIncompleteTitle': 'Fragmente fehlen',
'puzzle.error.fragmentsIncompleteMessage': 'Du musst erst alle Fragmente einsammeln, bevor du die Hauptfrage beantworten kannst.',
'puzzle.fragment.collect': 'Fragment einsammeln (Demo)',
'puzzle.fragment.demo': 'Demo: Fragment würde hier angezeigt.',
'puzzle.fragmentsRemaining': 'Noch {{count}} Fragment(e) ausstehend',
'puzzle.submit': 'Prüfen',
```

### Englische Übersetzungen

```typescript
'puzzle.error.loadFragments': 'Puzzle fragments could not be loaded.',
'puzzle.error.fragmentsIncompleteTitle': 'Fragments missing',
'puzzle.error.fragmentsIncompleteMessage': 'You must collect all fragments before you can answer the main question.',
'puzzle.fragment.collect': 'Collect fragment (Demo)',
'puzzle.fragment.demo': 'Demo: Fragment would be displayed here.',
'puzzle.fragmentsRemaining': '{{count}} fragment(s) remaining',
'puzzle.submit': 'Check',
```

---

## Bug-Fix: Fragen-Duplikate

### Problem

Nach dem Beantworten einer Frage wurde `loadQuestions()` erneut aufgerufen, was die Fragen neu mischte. Dadurch konnte dieselbe Frage mehrfach im Flow erscheinen.

### Ursachen

1. `useEffect` mit `loadQuestions` als Dependency triggerte bei jedem Re-Render
2. Pull-to-Refresh rief `loadQuestions()` auf und mischte neu
3. `loadQuestions()` setzte immer `questionIndex` auf 0 zurück

### Lösung

**Datei:** `app/(tabs)/rallye/index.tsx`

#### 1. Fragen nur einmal laden

```typescript
useEffect(() => {
  if (!rallyeId) return;
  // Nur laden wenn noch keine Fragen vorhanden
  const currentQuestions = store$.questions.get();
  if (currentQuestions.length === 0) {
    void loadQuestions();
  }
}, [loadQuestions, rallyeId]);
```

#### 2. Keine Aktualisierung bei unveränderter Liste

```typescript
const ordered = orderQuestionsWithUploadsLast(mapped);

const currentQuestions = store$.questions.get();
const questionsChanged = 
  currentQuestions.length !== ordered.length ||
  !ordered.every((q, i) => currentQuestions[i]?.id === q.id);

if (questionsChanged || currentQuestions.length === 0) {
  store$.questions.set(ordered);
  store$.questionIndex.set(0);
  store$.currentQuestion.set(ordered[0] || null);
}
```

#### 3. Pull-to-Refresh mischt nicht neu

```typescript
const onRefresh = async () => {
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    Alert.alert(t('common.errorTitle'), t('rallye.error.noInternet'));
    return;
  }
  if (rallye?.status === 'running') {
    // Nur Antworten und Status aktualisieren, NICHT Fragen
    await loadAnswers();
    await refreshStatus();
  } else {
    await refreshStatus();
  }
};
```

**Ergebnis:** Fragen werden einmal beim Rallye-Start geladen und gemischt. Die Reihenfolge bleibt dann für die gesamte Session fix.

---

## Migration Scripts

### Dateien

- `docs/PUZZLE_MIGRATION_UP.sql` – Erstellt puzzle_groups und puzzle_fragments Tabellen
- `docs/PUZZLE_MIGRATION_DOWN.sql` – Rollback (löscht beide Tabellen)
- `docs/ADD_PUZZLE_TYPE.sql` – Fügt 'puzzle' zum question_type ENUM hinzu

### Ausführung

1. **ENUM erweitern:**
   ```sql
   ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'puzzle';
   ```

2. **Tabellen erstellen:**
   Führe `PUZZLE_MIGRATION_UP.sql` in Supabase SQL Editor aus

3. **Rollback (falls nötig):**
   Führe `PUZZLE_MIGRATION_DOWN.sql` aus

---

## Workflow für Ersteller

### Puzzle in Supabase erstellen

1. **Hauptfrage erstellen:**
   - Typ: `puzzle`
   - Punkte festlegen
   - Antwort in `answers` eintragen

2. **Fragment-Fragen erstellen:**
   - Typ: beliebig (`knowledge`, `qr_code`, etc.)
   - Antworten in `answers` eintragen
   - **Nicht** zu `join_rallye_questions` hinzufügen!

3. **Puzzle-Gruppe erstellen:**
   ```sql
   INSERT INTO puzzle_groups (puzzle_question_id, visible)
   VALUES (11, true);
   ```

4. **Fragmente zuordnen:**
   ```sql
   INSERT INTO puzzle_fragments (group_id, fragment_question_id, order_index, location_hint)
   VALUES 
     (1, 13, 1, 'Bibliothek – Eingang'),
     (1, 14, 2, 'Sekretariat – Flur A1');
   ```

5. **Hauptfrage zur Rallye hinzufügen:**
   ```sql
   INSERT INTO join_rallye_questions (rallye_id, question_id)
   VALUES (1, 11);  -- Nur die Hauptfrage!
   ```

---

## Roadmap / ToDo

### Phase 1: Grundfunktion (✅ Abgeschlossen)

- ✅ Datenbank-Schema
- ✅ TypeScript Types
- ✅ Basis-Component (PuzzleQuestion)
- ✅ Question Renderer Integration
- ✅ i18n Übersetzungen
- ✅ Fragen können beantwortet werden
- ✅ Punkte werden korrekt vergeben
- ✅ Bug-Fix: Keine Duplikate mehr

### Phase 2: Fragment-System (✅ Abgeschlossen)

- ✅ Fragment-UI in PuzzleQuestion integriert
- ✅ Fragment-Progress-Tracking via `team_questions`
- ✅ Fragment-Fragen werden nacheinander angezeigt (order_index)
- ✅ Freischalt-Logik implementiert (`visible: false/true`)
- ✅ Progress-Anzeige ("x von n beantwortet")
- ✅ Aufgeben für Teilfragen und Hauptfrage
- ✅ Team-Antwort + Korrektheit in Übersicht angezeigt
- ✅ Schema vereinfacht: `variant` → `visible boolean`, `title` entfernt

### Phase 3: Erweiterte Features (Optional)

- Hinweise für Fragment-Standorte
- Karten-Integration für Fragment-Locations
- Animationen beim Fragment-Sammeln
- Fragment-Belohnungen (Mini-Punkte)

---

## Testing

### Manuelle Tests

1. **Puzzle-Frage erstellen** (siehe Workflow oben)
2. **Rallye starten** mit Team
3. **Puzzle-Frage beantworten:**
   - Eingabefeld erscheint
   - Korrekte Antwort → Punkte werden gutgeschrieben
   - Weiter zur nächsten Frage
4. **Mehrere Durchläufe:** Keine Duplikate

### Bekannte Einschränkungen

- Keine bekannten Einschränkungen.

---

## Geänderte/Neue Dateien

### Neu erstellt

- `docs/PUZZLE_MIGRATION_UP.sql`
- `docs/PUZZLE_MIGRATION_DOWN.sql`
- `docs/ADD_PUZZLE_TYPE.sql`
- `docs/PUZZLE_SYSTEM.md` (diese Datei)
- `components/rallye/questions/PuzzleQuestion.tsx`

### Geändert

- `types/rallye.ts` – QuestionType + neue Interfaces
- `app/(tabs)/rallye/question-renderer.tsx` – PuzzleQuestion registriert
- `utils/i18n.ts` – Puzzle-Übersetzungen
- `app/(tabs)/rallye/index.tsx` – Bug-Fix für Fragen-Duplikate

---

## Support & Troubleshooting

### Problem: "Unbekannter Fragetyp: puzzle"

**Ursache:** ENUM wurde nicht erweitert oder App nicht neu geladen.

**Lösung:**
```sql
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'puzzle';
```
App neu laden (Shake → Reload oder `r` im Terminal).

### Problem: Fragment-Fragen erscheinen einzeln im Flow

**Ursache:** Fragment-Fragen sind in `join_rallye_questions` eingetragen.

**Lösung:**
```sql
DELETE FROM join_rallye_questions 
WHERE question_id IN (13, 14);  -- Fragment-IDs
```

### Problem: Frage erscheint mehrfach

**Ursache:** Alte Version ohne Bug-Fix.

**Lösung:** Stelle sicher, dass die Änderungen in `app/(tabs)/rallye/index.tsx` vorhanden sind (siehe Bug-Fix Sektion).

---

**Datum:** 22. März 2026  
**Version:** 2.0  
**Status:** Phase 1 & 2 abgeschlossen
