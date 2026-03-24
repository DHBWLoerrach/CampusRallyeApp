# Sorting-Fragetyp System

## Übersicht

Das Sorting-System ermöglicht es, Fragen zu erstellen, bei denen Teams Items (z. B. Fakultäten) einem Haupt-Item (z. B. einem Campus-Standort) zuordnen müssen. Ein Haupt-Item kann dabei mehreren anderen Items zugeordnet werden.

**Status:** Implementierung abgeschlossen.

---

## Wie es funktioniert

In der App sieht der Benutzer:
1. Die Frage (z. B. „Ordne die Fakultäten den richtigen Campus-Standorten zu.")
2. **Oben:** Die Haupt-Items (Kategorien / Standorte) — z. B. Hangstraße, Marie-Curie-Straße
3. **Unten:** Die zuzuordnenden Items (gemischt angezeigt) — z. B. Technik, Wirtschaft, Gesundheit

**Ablauf:**
1. Standort antippen → wird hervorgehoben (aktiver Zuordnungsmodus)
2. Passendes Item antippen → wird diesem Standort zugeordnet
3. Erneut antippen → Zuordnung aufheben
4. Wenn alle Items zugeordnet sind → „Antwort senden" wird aktiv
5. Nach Bestätigung wird die Korrektheit geprüft (muss jedes Item dem richtigen Pair entsprechen)

---

## Datenbank-Schema

### Tabellen-Übersicht

```
questions
    ↓ (type = 'sorting')
sorting_groups          ← 1 Eintrag pro Frage
    ↓
sorting_pairs           ← 1 Eintrag pro Haupt-Item (z. B. pro Standort)
    ↓
sorting_pair_items      ← n Einträge pro Pair (1× is_primary, n× zugeordnete Items)
```

---

## Beispiel: Fakultäten den Campus-Standorten zuordnen

### Schritt 1 — Frage erstellen (in `questions`)

```sql
INSERT INTO questions (content, type, points)
VALUES ('Ordne die Fakultäten den richtigen Campus-Standorten zu.', 'sorting', 5);
-- Angenommen: neue ID = 18
```

### Schritt 2 — Sorting-Gruppe erstellen (in `sorting_groups`)

```sql
INSERT INTO sorting_groups (sorting_question_id)
VALUES (18);
-- Angenommen: neue ID = 1
```

### Schritt 3 — Paare erstellen (in `sorting_pairs`)

Pro Haupt-Item (Standort) einen Eintrag:

```sql
INSERT INTO sorting_pairs (group_id)
VALUES (1), (1);
-- Ergibt z. B. ID 1 (Hangstraße) und ID 2 (Marie-Curie-Straße)
```

### Schritt 4 — Items den Paaren zuordnen (in `sorting_pair_items`)

Pro Pair: **genau 1 Eintrag mit `is_primary = true`** (das Haupt-Item), dann beliebig viele mit `is_primary = false` (die zuzuordnenden Items).

```sql
-- Pair 1: Hangstraße (primary) → Technik, Wirtschaft
INSERT INTO sorting_pair_items (pair_id, item, is_primary) VALUES
  (1, 'Hangstraße',  true),
  (1, 'Technik',     false),
  (1, 'Wirtschaft',  false);

-- Pair 2: Marie-Curie-Straße (primary) → Gesundheit
INSERT INTO sorting_pair_items (pair_id, item, is_primary) VALUES
  (2, 'Marie-Curie-Straße', true),
  (2, 'Gesundheit',         false);
```

### Schritt 5 — Frage zur Rallye hinzufügen (in `join_rallye_questions`)

```sql
INSERT INTO join_rallye_questions (rallye_id, question_id)
VALUES (<rallye_id>, 18);
```

---

## Auswertung

Die App prüft für jedes sekundäre Item, ob es dem richtigen `pair_id` zugeordnet wurde. Alle Items müssen korrekt sein, damit die Antwort als richtig gewertet wird.

Bei falscher Zuordnung: 0 Punkte. Bei korrekter Zuordnung: volle Punktzahl der Frage.

---

## Migration Scripts

- `docs/SORTING_MIGRATION_UP.sql` — Erstellt alle Tabellen und RLS-Policies
- `docs/SORTING_MIGRATION_DOWN.sql` — Rollback (löscht alle Tabellen)

### Nachträglicher SQL-Befehl (falls Tabellen bereits angelegt)

```sql
-- Unique-Index sicherstellt, dass pro Pair nur 1 primary existiert
CREATE UNIQUE INDEX one_primary_per_pair
  ON sorting_pair_items (pair_id)
  WHERE is_primary = true;
```


---

## Datenbank-Schema

### Neue Tabellen

#### `sorting_groups`
Definiert, welche Frage ein Sortier-Puzzle ist.

```sql
CREATE TABLE sorting_groups (
  id SERIAL PRIMARY KEY,
  sorting_question_id INT NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Felder:**
- `sorting_question_id`: FK zur Hauptfrage in der `questions`-Tabelle.
- `created_at`: Zeitstempel der Erstellung.

---

#### `sorting_pairs`
Definiert Paare innerhalb einer Sortier-Gruppe.

```sql
CREATE TABLE sorting_pairs (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES sorting_groups(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, order_index)
);
```

**Felder:**
- `group_id`: FK zu `sorting_groups`.
- `order_index`: Reihenfolge der Paare (0-basiert).
- `created_at`: Zeitstempel der Erstellung.

---

#### `sorting_pair_items`
Verknüpft Items mit einem Paar. Ein Haupt-Item kann mehreren zugeordneten Items zugewiesen werden.

```sql
CREATE TABLE sorting_pair_items (
  id SERIAL PRIMARY KEY,
  pair_id INT NOT NULL REFERENCES sorting_pairs(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Felder:**
- `pair_id`: FK zu `sorting_pairs`.
- `item`: Der Text des Items.
- `is_primary`: 
  - `true`: Haupt-Item.
  - `false`: Zugeordnetes Item.
- `created_at`: Zeitstempel der Erstellung.

---

## Beispiel-Setup

### 1. Sortier-Gruppe erstellen
```sql
INSERT INTO sorting_groups (sorting_question_id, created_at)
VALUES (21, NOW()); -- ID 1
```

### 2. Paare hinzufügen
```sql
INSERT INTO sorting_pairs (group_id, order_index, created_at)
VALUES
  (1, 0, NOW()), -- ID 1
  (1, 1, NOW()); -- ID 2
```

### 3. Items zu Paaren hinzufügen
```sql
-- Paar 1: Apfel -> Obst, Frucht
INSERT INTO sorting_pair_items (pair_id, item, is_primary, created_at)
VALUES
  (1, 'Apfel', true, NOW()),
  (1, 'Obst', false, NOW()),
  (1, 'Frucht', false, NOW());

-- Paar 2: Hund -> Tier, Haustier
INSERT INTO sorting_pair_items (pair_id, item, is_primary, created_at)
VALUES
  (2, 'Hund', true, NOW()),
  (2, 'Tier', false, NOW()),
  (2, 'Haustier', false, NOW());
```

---

## TypeScript-Interfaces

### Datei: `types/rallye.ts`

#### `SortingGroup`
```typescript
export interface SortingGroup {
  id: number;
  sorting_question_id: number;
  created_at: string;
}
```

#### `SortingPair`
```typescript
export interface SortingPair {
  id: number;
  group_id: number;
  order_index: number;
  created_at: string;
}
```

#### `SortingPairItem`
```typescript
export interface SortingPairItem {
  id: number;
  pair_id: number;
  item: string;
  is_primary: boolean;
  created_at: string;
}
```

---

## Internationalisierung (i18n)

### Deutsche Übersetzungen
```typescript
'sorting.error.loadPairs': 'Sortier-Paare konnten nicht geladen werden.',
'sorting.error.incompleteTitle': 'Zuordnung unvollständig',
'sorting.error.incompleteMessage': 'Du musst alle Paare zuordnen, bevor du die Hauptfrage beantworten kannst.',
'sorting.pair.collect': 'Paar zuordnen (Demo)',
'sorting.pairsRemaining': 'Noch {{count}} Paar(e) ausstehend',
'sorting.submit': 'Prüfen',
```

### Englische Übersetzungen
```typescript
'sorting.error.loadPairs': 'Sorting pairs could not be loaded.',
'sorting.error.incompleteTitle': 'Assignment incomplete',
'sorting.error.incompleteMessage': 'You must assign all pairs before you can answer the main question.',
'sorting.pair.collect': 'Assign pair (Demo)',
'sorting.pairsRemaining': '{{count}} pair(s) remaining',
'sorting.submit': 'Check',
```

---

## Migration Scripts

### Dateien

- `docs/SORTING_MIGRATION_UP.sql` – Erstellt Tabellen für Sortierfragen.
- `docs/SORTING_MIGRATION_DOWN.sql` – Rollback (löscht Tabellen).

### Ausführung

1. **Tabellen erstellen:**
   ```sql
   -- Führe SORTING_MIGRATION_UP.sql aus
   ```

2. **Rollback (falls nötig):**
   ```sql
   -- Führe SORTING_MIGRATION_DOWN.sql aus
   ```