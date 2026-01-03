# Code-Analyse: Bugs, UI-Glitches und UX-Issues

**Datum:** 03.01.2026  
**Analysiert:** CampusRallyeApp  
**Fokus:** Benutzerperspektive (keine Sicherheitsthemen)

---

## Zusammenfassung

| Schweregrad | Anzahl |
|-------------|--------|
| Kritisch    | 6      |
| Hoch        | 7      |
| Mittel      | 25+    |
| Niedrig     | 30+    |

---

## Task-Liste

### Phase 1: Kritisch (Datenverlust/Crashes)

- [ ] **CRIT-01:** Inner-Components in `UploadPhotoQuestion.tsx` extrahieren
- [ ] **CRIT-02:** Silent storage failures in `asyncStorage.ts` fixen
- [ ] **CRIT-03:** `teamExists` Network-Error-Handling in `teamStorage.ts`
- [ ] **CRIT-04:** Offline-Queue Race Condition in `offlineOutbox.ts` mit Mutex fixen
- [ ] **CRIT-05:** Voting-Error-Handling in `voting.tsx` implementieren
- [ ] **CRIT-06:** Hints server-seitig speichern (`Hint.tsx`)

### Phase 2: Hoch (UX-Blocker)

- [ ] **HIGH-01:** KeyboardAvoidingView `behavior` Props in `ImageQuestion.tsx` und `SkillQuestion.tsx`
- [ ] **HIGH-02:** MultipleChoice `correctAnswer` Check vor Submit
- [ ] **HIGH-03:** QR-Scanner Barcode-Type-Filter in `QRCodeQuestion.tsx`
- [ ] **HIGH-04:** Skip-Button Answer speichern in `question-renderer.tsx`
- [ ] **HIGH-05:** Initial-Loading-State für Questions in `rallye/index.tsx`
- [ ] **HIGH-06:** Offline-Queue Maximum Retries in `offlineOutbox.ts`
- [ ] **HIGH-07:** IconSymbol Null-Check in `IconSymbol.tsx`

### Phase 3: Mittel (Polish)

- [ ] **MED-01:** Loading-State für Permission in `QRCodeQuestion.tsx`
- [ ] **MED-02:** Loading-State für Permission in `UploadPhotoQuestion.tsx`
- [ ] **MED-03:** Loading-State für Voting-Daten in `voting.tsx`
- [ ] **MED-04:** Loading/Placeholder für Bilder in `ImageQuestion.tsx`
- [ ] **MED-05:** Loading-State in `RallyeSelectionModal.tsx`
- [ ] **MED-06:** Error-Handler für Images in `voting.tsx`
- [ ] **MED-07:** Error-Handler für Images in `ImageQuestion.tsx`
- [ ] **MED-08:** Kamera-Fehler User-Feedback in `UploadPhotoQuestion.tsx`
- [ ] **MED-09:** Scoreboard-Fehler anzeigen in `scoreboard.tsx`
- [ ] **MED-10:** `setTimePlayed` Error-Handling in `teamStorage.ts`
- [ ] **MED-11:** Lokalisierung Screen-Titel in `infos/_layout.tsx`
- [ ] **MED-12:** Lokalisierung Tab-Labels in `app/(tabs)/_layout.tsx`
- [ ] **MED-13:** `t()` statt Inline-Ternary in `infos/index.jsx`
- [ ] **MED-14:** `t()` statt Language-Check in `SyncStatusBadge.tsx`
- [ ] **MED-15:** Accessibility für `SyncStatusBadge.tsx`
- [ ] **MED-16:** Accessibility Labels für alle TextInputs
- [ ] **MED-17:** Alt-Text für Bilder in `ImageQuestion.tsx`
- [ ] **MED-18:** Accessibility für CameraView in `QRCodeQuestion.tsx`
- [ ] **MED-19:** Alt-Text für Bild-Preview in `UploadPhotoQuestion.tsx`
- [ ] **MED-20:** QR-Scan Debounce verbessern in `QRCodeQuestion.tsx`
- [ ] **MED-21:** Empty-State für Scoreboard in `scoreboard.tsx`

### Phase 4: Niedrig (Nice-to-have)

- [ ] **LOW-01:** Text-Truncation in `Card.tsx` (Title/Description)
- [ ] **LOW-02:** Text-Truncation in `TeamNameSheet.tsx`
- [ ] **LOW-03:** Text-Truncation in `RallyeHeader.tsx`
- [ ] **LOW-04:** Touch-Target-Größe in `Card.tsx`
- [ ] **LOW-05:** Touch-Target-Größe in `CollapsibleHeroHeader.tsx`
- [ ] **LOW-06:** Touch-Target-Größe in `MultipleChoiceQuestion.tsx`
- [ ] **LOW-07:** Password autoFocus Timing in `RallyeSelectionModal.tsx`
- [ ] **LOW-08:** Countdown-Indikator in `TeamNameSheet.tsx`
- [ ] **LOW-09:** Android Keyboard-Handling in `Screen.tsx`
- [ ] **LOW-10:** AsyncStorage-Wrapper konsolidieren
- [ ] **LOW-11:** Type-Safety verbessern (as any entfernen)
- [ ] **LOW-12:** `currentMultipleChoiceAnswers` Shuffle-Caching

---

## Kritische Bugs (Details)

### CRIT-01: Inner-Components verursachen State-Verlust

**Dateien:** `components/rallye/questions/UploadPhotoQuestion.tsx:111-274`

**Problem:** `PhotoCamera` und `ImagePreview` sind als Funktionskomponenten *innerhalb* der Parent-Komponente definiert. Sie werden bei jedem Render neu erstellt.

```tsx
// FALSCH - Komponente wird bei jedem Render neu erstellt
export default function UploadPhotoQuestion(...) {
  const PhotoCamera = () => {  // ← Neu bei jedem Render!
    const [facing, setFacing] = useState<CameraType>('back');
    // ...
  };
}
```

**Auswirkung:**
- Kamera wird bei jedem Parent-Render neu gemountet
- `facing`-State geht verloren
- Flackern und schlechte Performance
- User verliert möglicherweise aufgenommenes Foto

**Lösung:** Komponenten außerhalb definieren oder Conditional Rendering nutzen.

---

### CRIT-02: Stille Speicher-Fehler

**Datei:** `services/storage/asyncStorage.ts:19-25`

```typescript
export async function setStorageItem(key: string, value: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error setting storage item', e);
    // Kein throw! Caller denkt Operation war erfolgreich
  }
}
```

**Auswirkung:**
- User-Antworten können verloren gehen ohne Feedback
- Team-Zuweisungen nicht persistiert
- Rallye-Status nicht gespeichert

**Lösung:** Fehler werfen oder Erfolgs-Status zurückgeben.

---

### CRIT-03: Netzwerkfehler löscht Team-Zuweisung

**Datei:** `services/storage/teamStorage.ts:53-66`

```typescript
export async function teamExists(rallyeId: number, teamId: number) {
  const { data, error } = await supabase...
  if (error) {
    console.error('Error checking team existence:', error);
    return false;  // Netzwerkfehler = "Team existiert nicht"!
  }
  return !!data;
}
```

**In Store.ts:180-191:**
```typescript
const exists = await teamExists(rallyeId, (loadTeam as any).id);
if (!exists) {
  await clearCurrentTeam(rallyeId);  // LÖSCHT LOKALE TEAM-DATEN!
  store$.teamDeleted.set(true);
}
```

**Auswirkung:** Bei Netzwerk-Glitch während App-Start wird Team-Zuweisung gelöscht und User sieht "Team wurde gelöscht" obwohl Team existiert.

**Lösung:** Zwischen "nicht gefunden" und "Netzwerkfehler" unterscheiden.

---

### CRIT-04: Race Condition in Offline-Queue

**Datei:** `services/storage/offlineOutbox.ts:159-163`

```typescript
export async function processOutbox() {
  if (syncInProgress) return;  // Check passiert zuerst
  if (!outbox$.online.get()) return;
  
  syncInProgress = true;  // Flag wird NACH dem Check gesetzt
```

**Problem:** Zwischen Check und Flag-Setzen können mehrere Aufrufe passieren (z.B. wenn App in Vordergrund kommt + Netzwerk wechselt gleichzeitig).

**Auswirkung:**
- Doppelte Answer-Submissions
- Verlorene Queue-Items
- Inkonsistente Daten

**Lösung:** Mutex/Lock implementieren oder atomare Operation nutzen.

---

### CRIT-05: Voting-Fehler ohne User-Feedback

**Datei:** `app/(tabs)/rallye/voting.tsx:105-121`

```typescript
} catch (e) {
  console.error('Error updating team question:', e);
  // UI geht einfach weiter!
}
```

**Auswirkung:** User denkt Vote wurde gezählt, wurde aber nicht. Keine Möglichkeit zum Retry.

**Lösung:** Alert anzeigen und Frage nicht weitergehen lassen.

---

### CRIT-06: Hint-Kosten nur lokal gespeichert

**Datei:** `components/ui/Hint.tsx:42-46`

```typescript
store$.usedHints[questionId].set(true);
store$.points.set(Math.max(0, currentPoints - HINT_COST));
// Nicht auf Server gespeichert!
```

**Auswirkung:** Bei App-Neustart oder Gerätewechsel sind Hint-Punkte zurück. User könnte alle Hints "kostenlos" nutzen.

**Lösung:** Hint-Nutzung in `team_questions` oder dedizierter Tabelle speichern.

---

## Hohe Priorität (Details)

### HIGH-01: KeyboardAvoidingView ohne `behavior` Prop

**Dateien:**
- `components/rallye/questions/ImageQuestion.tsx:91`
- `components/rallye/questions/SkillQuestion.tsx:77`

```tsx
<KeyboardAvoidingView>  {/* Kein behavior prop! */}
```

**Problem:** Ohne `behavior` Prop funktioniert KeyboardAvoidingView nicht korrekt auf iOS.

**Auswirkung:** Keyboard verdeckt Eingabefelder, User muss scrollen.

**Lösung:**
```tsx
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
```

---

### HIGH-02: Keine Prüfung ob Antworten geladen

**Datei:** `components/rallye/questions/MultipleChoiceQuestion.tsx:82-91`

**Problem:** User kann Submit drücken bevor `correctAnswer` geladen ist.

**Auswirkung:** Antwort wird als "falsch" gewertet obwohl sie richtig sein könnte.

**Lösung:** Submit-Button disabled halten bis `correctAnswer` vorhanden.

---

### HIGH-03: QR-Scanner ohne Barcode-Type-Filter

**Datei:** `components/rallye/questions/QRCodeQuestion.tsx:145`

```tsx
<CameraView
  onBarcodeScanned={...}  // Reagiert auf JEDEN Barcode-Typ
>
```

**Problem:** Handler feuert für jeden Barcode (QR, EAN, UPC, etc.).

**Auswirkung:** Falsche Barcodes triggern den Handler.

**Lösung:** `barCodeTypes={['qr']}` hinzufügen.

---

### HIGH-04: Skip bei unbekanntem Frage-Typ speichert nichts

**Datei:** `app/(tabs)/rallye/question-renderer.tsx:122-132`

```tsx
<UIButton
  onPress={() => {
    console.error('Unknown question type:', { id: q?.id, type });
    store$.gotoNextQuestion();  // Keine Answer gespeichert!
  }}
>
  {t('question.skip')}
</UIButton>
```

**Auswirkung:** Frage erscheint nach App-Neustart erneut.

**Lösung:** "Skipped"-Eintrag in Datenbank speichern.

---

### HIGH-05: "Keine Fragen" Flash beim Laden

**Datei:** `app/(tabs)/rallye/index.tsx:216-227`

```tsx
if (!allQuestionsAnswered && questions.length === 0) {
  return <NoQuestions loading={loading} onRefresh={onRefresh} />;
}
```

**Problem:** Beim ersten Render ist `questions.length === 0` und `loading` möglicherweise noch `false`.

**Auswirkung:** User sieht kurz "Keine Fragen" bevor echte Fragen laden.

**Lösung:** Initial-Loading-State der `true` ist bis erster Fetch abgeschlossen.

---

### HIGH-06: Offline-Queue ohne Maximum Retries

**Datei:** `services/storage/offlineOutbox.ts:206-214`

**Problem:** Fehlerhafte Items werden ewig mit Exponential Backoff wiederholt.

**Auswirkung:**
- Batterie-Drain durch wiederholte Netzwerk-Calls
- Sync-Badge zeigt ewig "Pending"
- Stale Daten in Queue

**Lösung:** Maximum Retry-Limit (z.B. 10 Versuche), danach Item als "failed" markieren.

---

### HIGH-07: Crash bei unbekanntem Icon

**Datei:** `components/ui/IconSymbol.tsx:59`

```typescript
const iconConfig = ICON_MAPPINGS[name];
// Kein Null-Check!
return iconConfig.source;  // Crash wenn name nicht gemappt
```

**Lösung:** Null-Check hinzufügen, Fallback-Icon verwenden.

---

## Mittlere Priorität (Details)

### Fehlende Loading-States

| Datei | Zeile | Problem |
|-------|-------|---------|
| `QRCodeQuestion.tsx` | 110 | Leere View während Permission lädt |
| `UploadPhotoQuestion.tsx` | 69 | Leere View während Permission lädt |
| `voting.tsx` | 73-78 | Kein Loading während Voting-Daten laden |
| `ImageQuestion.tsx` | 124-131 | Kein Loading/Placeholder während Bild lädt |
| `RallyeSelectionModal.tsx` | 69 | Kein Loading wenn Modal öffnet |

**Lösung:** ActivityIndicator oder Skeleton-Loader anzeigen.

---

### Fehlende Error-Handler

| Datei | Zeile | Problem |
|-------|-------|---------|
| `voting.tsx` | 216-231 | Kein `onError` für Image-Komponente |
| `ImageQuestion.tsx` | 126-129 | Kein Fallback wenn Bild nicht lädt |
| `UploadPhotoQuestion.tsx` | 140-147 | Kamera-Fehler nur geloggt |
| `scoreboard.tsx` | 97-99 | Scoreboard-Fehler nicht angezeigt |
| `teamStorage.ts` | 25-31 | `setTimePlayed` ignoriert Fehler |

**Lösung:** User-Feedback bei Fehlern, Retry-Möglichkeiten.

---

### Lokalisierung/i18n

| Datei | Zeile | Problem |
|-------|-------|---------|
| `infos/_layout.tsx` | 17-19 | Screen-Titel hardcoded Deutsch |
| `app/(tabs)/_layout.tsx` | 33, 43 | Tab-Labels hardcoded |
| `infos/index.jsx` | 29, 44 | Inline-Ternary statt `t()` |
| `SyncStatusBadge.tsx` | 25-38 | `language === 'de'` statt `t()` |

**Beispiel:**
```tsx
// FALSCH
<Stack.Screen name="imprint" options={{ title: 'Impressum' }} />

// RICHTIG
<Stack.Screen name="imprint" options={{ title: t('infos.imprint') }} />
```

---

### Accessibility-Probleme

| Datei | Problem |
|-------|---------|
| `SyncStatusBadge.tsx:24-38` | Keine `accessibilityRole`/`accessibilityLabel` |
| Alle TextInputs | Fehlende `accessibilityLabel` und `accessibilityHint` |
| `ImageQuestion.tsx:128` | Bild ohne Alt-Text |
| `CollapsibleHeroHeader.tsx:134, 173` | Bilder ohne `accessibilityLabel` |
| `QRCodeQuestion.tsx:142-146` | CameraView ohne Accessibility-Beschreibung |
| `UploadPhotoQuestion.tsx:193-197` | Bild-Preview ohne Alt-Text |

---

### Doppelter Alert bei QR-Scan

**Datei:** `components/rallye/questions/QRCodeQuestion.tsx:76-77, 104-107`

**Problem:** Nach "falscher QR Code" Alert wird `processingRef` nach 2s zurückgesetzt. Kamera ist aber weiter offen, gleicher falscher QR triggert erneut.

**Auswirkung:** Rapid-Fire Alerts wenn User vor falschem QR Code steht.

**Lösung:** Längeres Debounce oder gescannte QR Codes tracken.

---

## Niedrige Priorität (Details)

### Lange Texte ohne Truncation

| Datei | Zeile | Element |
|-------|-------|---------|
| `Card.tsx` | 55-65 | Title und Description |
| `TeamNameSheet.tsx` | 73 | Team-Name |
| `RallyeHeader.tsx` | 26-37 | Team-Name |

**Lösung:** `numberOfLines` und `ellipsizeMode` hinzufügen.

---

### Touch-Targets unter 44pt

| Datei | Problem |
|-------|---------|
| `Card.tsx:91-105` | Kleine Karten könnten zu klein sein |
| `CollapsibleHeroHeader.tsx:145-161` | Sprach-Toggle relativ klein |
| `MultipleChoiceQuestion.tsx:126-161` | Checkbox-Bereich könnte größer sein |

**Lösung:** `minHeight: 44` oder größere `hitSlop`.

---

### Password autoFocus während Animation

**Datei:** `components/ui/RallyeSelectionModal.tsx:362-377`

**Problem:** `autoFocus` auf Password-Input triggert während Flip-Animation.

**Auswirkung:** Keyboard erscheint während Animation läuft - wirkt ruckelig.

**Lösung:** `autoFocus` entfernen, manuell nach Animation fokussieren.

---

### TeamNameSheet ohne Countdown-Indikator

**Datei:** `components/ui/TeamNameSheet.tsx:18-26`

**Problem:** Sheet schließt nach 3 Sekunden automatisch ohne visuelle Anzeige.

**Auswirkung:** User weiß nicht, dass und wann Sheet verschwindet.

**Lösung:** Progress-Bar oder Countdown-Timer anzeigen.

---

### Screen.tsx - Android Keyboard-Handling

**Datei:** `components/ui/Screen.tsx:56-61`

```tsx
behavior={Platform.OS === 'ios' ? 'padding' : undefined}
```

**Problem:** Android bekommt kein Keyboard-Avoiding-Behavior.

**Auswirkung:** Auf Android kann Keyboard Inhalte verdecken.

**Lösung:** `behavior="height"` für Android verwenden.

---

## Architektur-Probleme

### Doppelte AsyncStorage-Wrapper

**Dateien:**
- `services/storage/asyncStorage.ts` - `getStorageItem`/`setStorageItem`
- `services/storage/LocalStorage.ts` - `getData`/`storeData`

Beide haben das gleiche Silent-Failure-Problem. Sollte konsolidiert werden.

---

### Type-Safety durch `as any`

**Dateien mit häufigen `as any` Casts:**
- `services/storage/Store.ts:41, 47, 57, etc.`
- `components/ui/UIButton.tsx:77, 84-86, 106, 124, 129`
- `components/ui/Hint.tsx:15-18`
- `components/rallye/questions/*.tsx` - Answer-Casts

**Problem:** Compile-Zeit-Fehler werden unterdrückt, Bugs schwerer zu finden.

---

### currentMultipleChoiceAnswers shuffled bei jedem Zugriff

**Datei:** `services/storage/Store.ts:85-98`

```typescript
currentMultipleChoiceAnswers: () => {
  // ...
  return shuffleArray(filtered);  // Shuffled bei JEDEM Aufruf!
};
```

**Problem:** Computed Property shuffled Antworten bei jedem Zugriff neu.

**Hinweis:** MultipleChoiceQuestion cached das Ergebnis (Zeile 35-48), aber andere Stellen könnten betroffen sein.

---

## Testempfehlungen

Nach Fixes sollten folgende Szenarien getestet werden:

1. **Offline-Modus:** App starten → Offline gehen → Antworten geben → Online gehen
2. **Netzwerk-Glitch:** App im Hintergrund → Flugmodus an/aus → App öffnen
3. **Kamera-Permissions:** Permissions ablehnen → später erlauben
4. **Lange Inhalte:** Team-Namen mit 50+ Zeichen
5. **Schnelle Interaktion:** Rapid-Fire Button-Taps, schnelles QR-Scannen
6. **Keyboard:** Alle Text-Inputs auf iOS und Android testen
7. **Screen-Reader:** VoiceOver (iOS) / TalkBack (Android) durchlaufen

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 03.01.2026 | Initiale Analyse erstellt |
