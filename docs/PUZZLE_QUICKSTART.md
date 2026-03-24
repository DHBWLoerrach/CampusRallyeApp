# Puzzle-Fragetyp Quickstart

Das Puzzle-System ermöglicht es, Schnitzeljagd-artige Fragen zu erstellen, bei denen Teams mehrere Fragment-Aufgaben abschließen müssen, bevor sie die Hauptfrage beantworten können.

---

## Tabellenübersicht

### `puzzle_groups`

Definiert, welche Frage ein Puzzle ist und wie die Fragmente angezeigt werden.

**Felder:**
- `puzzle_question_id`: Fremdschlüssel zur Hauptfrage in der `questions`-Tabelle.
- `visible`: Boolean-Feld:
  - `true`: Hauptfrage ist von Anfang an sichtbar.
  - `false`: Hauptfrage wird erst sichtbar, nachdem alle Fragmente abgeschlossen wurden.
- `created_at`: Zeitstempel der Erstellung.

### `puzzle_fragments`

Verknüpft Fragment-Fragen mit einer Puzzle-Gruppe.

**Felder:**
- `group_id`: Fremdschlüssel zu `puzzle_groups`.
- `fragment_question_id`: Fremdschlüssel zu einer Frage in `questions` (beliebiger Typ).
- `order_index`: Reihenfolge der Anzeige der Fragmente (0-basiert).
- `location_hint`: Optionaler Hinweistext (z. B. „Bibliothek – Eingang").
- `created_at`: Zeitstempel der Erstellung.

---

## Konzept

**Hauptfrage:**
- Die Hauptfrage ist vom Typ `puzzle`.
- Sie ist mit einer `puzzle_group` verknüpft.

**Fragment-Fragen:**
- Fragment-Fragen können jeden Typ haben (z. B. `knowledge`, `qr_code`).
- Sie sind über `puzzle_fragments` mit der `puzzle_group` verknüpft.

**Sichtbarkeit:**
- Wenn `visible = true`, ist die Hauptfrage immer sichtbar.
- Wenn `visible = false`, erscheint die Hauptfrage erst, nachdem alle Fragmente abgeschlossen wurden.

---

## Beispiel-Workflow

1. Erstelle eine Hauptfrage vom Typ `puzzle`.
2. Erstelle Fragment-Fragen beliebigen Typs.
3. Verknüpfe die Hauptfrage mit einer `puzzle_group`.
4. Verknüpfe die Fragment-Fragen über `puzzle_fragments` mit der `puzzle_group`.
5. Füge nur die Hauptfrage zur Rallye hinzu.
