# Zeitdruck aus der App entfernen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Countdown, harte Zeit-Sperren und Zeit-basierte Rangvergleiche aus der App entfernen, sodass Teams ohne Zeitdruck spielen und die Rallye ausschließlich über den admin-gesetzten Status endet.

**Architecture:** Sechs unabhängig committbare Änderungen an bestehenden Dateien: Countdown-Komponente → statischer Endzeit-Hinweis, Entfernen von `store$.timeExpired` und aller Stellen, die es lesen/schreiben, sowie Umbau der Scoreboard-Sortierung/-Anzeige (Dense Ranking, Zeit nur als eigener Rückblick).

**Tech Stack:** React Native / Expo Router, TypeScript (strict), Legend State (`@legendapp/state`), Jest + `@testing-library/react-native`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-09-remove-time-pressure-design.md` (abgestimmt, committet).
- Countdown-Header wird durch statischen Endzeit-Hinweis im **gleichen Header-Slot** ersetzt; `rallye_end` null/undefined → kein Zeit-Hinweis.
- `store$.timeExpired` wird **vollständig entfernt**, nicht nur wirkungslos gemacht. Einzige Quelle für „Rallye beendet" ist `rallye.status` bzw. `allQuestionsAnswered`.
- Eigene Spielzeit erscheint **nur** in der eigenen Scoreboard-Zeile, als reiner Rückblick, nie als Vergleich zu anderen Teams.
- Ranking sortiert **nur nach Punkten**; bei Punktgleichheit teilen sich Teams denselben Rang, der nächste Rang wird **nicht übersprungen** (Dense Ranking: 1, 2, 2, 3).
- Code-Kommentare ausschließlich auf Englisch (AGENTS.md).
- Nach **jedem Step**: `npm run lint`, `npx tsc --noEmit`, `npm test` müssen grün sein, bevor committet oder weitergemacht wird.
- **AGENTS.md-Hardregel:** Nach jedem Step anhalten und explizites „OK" abwarten, bevor committet oder zum nächsten Step übergegangen wird — das gilt zusätzlich zu den Commit-Steps in diesem Plan; kein Task-Commit ohne vorherige Bestätigung.
- Reihenfolge der Tasks ist verbindlich: Tasks 1–3 entfernen alle Lese-/Schreibzugriffe auf `store$.timeExpired`, bevor Task 4 das Feld selbst aus `Store.ts` löscht (sonst bricht `npx tsc --noEmit`).

---

### Task 1: Countdown → ruhiger Endzeit-Hinweis im Header

**Files:**
- Create (via `git mv`): `components/rallye/PlannedEndInfo.tsx` (aus `components/rallye/TimerHeader.tsx`)
- Create (via `git mv`): `components/rallye/__tests__/PlannedEndInfo.test.tsx` (aus `components/rallye/__tests__/TimerHeader.test.tsx`)
- Modify: `app/(tabs)/rallye/_layout.tsx`
- Modify: `app/(tabs)/rallye/__tests__/_layout.test.tsx`
- Modify: `utils/i18n.ts`
- Delete: `components/rallye/TimerHeader.tsx`, `components/rallye/__tests__/TimerHeader.test.tsx` (durch `git mv` bereits erledigt)

**Interfaces:**
- Produces: `PlannedEndInfo({ endTime?: string | Date | null }): JSX.Element | null` — Default-Export, ersetzt `TimerHeader`. Rendert `null` bei `endTime` falsy, sonst Icon + `t('rallye.plannedEnd', { time })`.
- Consumes: `useTheme()` (`@/utils/ThemeContext`), `useLanguage()` (`@/utils/LanguageContext`, liefert `{ t, language }`), `IconSymbol` (`@/components/ui/IconSymbol`), `ThemedText` (`@/components/themed/ThemedText`).

- [ ] **Step 1: Dateien umbenennen**

```bash
git mv components/rallye/TimerHeader.tsx components/rallye/PlannedEndInfo.tsx
git mv components/rallye/__tests__/TimerHeader.test.tsx components/rallye/__tests__/PlannedEndInfo.test.tsx
```

- [ ] **Step 2: Neuen Test schreiben (ersetzt kompletten Dateiinhalt)**

`components/rallye/__tests__/PlannedEndInfo.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import PlannedEndInfo from '../PlannedEndInfo';

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'de',
    t: (key: string, params?: Record<string, unknown>) =>
      key === 'rallye.plannedEnd' ? `geplant bis ${params?.time} Uhr` : key,
  }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('PlannedEndInfo', () => {
  it('renders nothing when there is no planned end time', () => {
    const { toJSON } = render(<PlannedEndInfo endTime={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when endTime is undefined', () => {
    const { toJSON } = render(<PlannedEndInfo endTime={undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('shows the planned end time as calm orientation text', () => {
    const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { getByText } = render(<PlannedEndInfo endTime={endTime} />);

    expect(getByText(/geplant bis .* Uhr/)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Test laufen lassen — erwartetes Scheitern**

Run: `npm test -- PlannedEndInfo`
Expected: FAIL (die umbenannte Datei enthält noch die alte `TimerHeader`-Implementierung: kein `rallye.plannedEnd`-Text, `store$` wird noch importiert/aufgerufen und ist im neuen Test nicht gemockt)

- [ ] **Step 4: Komponente neu implementieren (ersetzt kompletten Dateiinhalt)**

`components/rallye/PlannedEndInfo.tsx`:

```tsx
import { View } from 'react-native';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

function formatPlannedEndTime(endTime: string | Date, language: 'de' | 'en') {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return new Date(endTime).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PlannedEndInfo({
  endTime,
}: {
  endTime?: string | Date | null;
}) {
  const { isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  if (!endTime) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <IconSymbol name="clock" size={16} color={palette.text} />
      <ThemedText variant="label">
        {t('rallye.plannedEnd', {
          time: formatPlannedEndTime(endTime, language),
        })}
      </ThemedText>
    </View>
  );
}
```

- [ ] **Step 5: i18n-Key `rallye.plannedEnd` ergänzen**

In `utils/i18n.ts`, im deutschen Block, nach der Zeile `'rallye.backToStart': 'Zurück zum Start',`:

```ts
    'rallye.backToStart': 'Zurück zum Start',
    'rallye.plannedEnd': 'geplant bis {{time}} Uhr',
```

Im englischen Block, nach der Zeile `'rallye.backToStart': 'Back to start',`:

```ts
    'rallye.backToStart': 'Back to start',
    'rallye.plannedEnd': 'planned until {{time}}',
```

- [ ] **Step 6: Test laufen lassen — erwartetes Bestehen**

Run: `npm test -- PlannedEndInfo`
Expected: PASS

- [ ] **Step 7: `_layout.tsx` auf `PlannedEndInfo` umstellen**

In `app/(tabs)/rallye/_layout.tsx`:

```ts
import TimerHeader from '@/components/rallye/TimerHeader';
```
→
```ts
import PlannedEndInfo from '@/components/rallye/PlannedEndInfo';
```

```ts
  const showTimer = rallye?.status === 'running' && !isTourMode;
```
→
```ts
  const showPlannedEnd = rallye?.status === 'running' && !isTourMode;
```

```ts
        headerTitle: () =>
          showTimer ? <TimerHeader endTime={rallye?.rallye_end} /> : null,
```
→
```ts
        headerTitle: () =>
          showPlannedEnd ? (
            <PlannedEndInfo endTime={rallye?.rallye_end} />
          ) : null,
```

- [ ] **Step 8: `_layout.test.tsx` Mock-Pfad anpassen**

In `app/(tabs)/rallye/__tests__/_layout.test.tsx`:

```ts
jest.mock('@/components/rallye/TimerHeader', () => () => null);
```
→
```ts
jest.mock('@/components/rallye/PlannedEndInfo', () => () => null);
```

- [ ] **Step 9: Gesamten Check-Zyklus laufen lassen**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: alle drei PASS

- [ ] **Step 10: Commit (nach explizitem „OK")**

```bash
git add components/rallye/PlannedEndInfo.tsx components/rallye/__tests__/PlannedEndInfo.test.tsx app/"(tabs)"/rallye/_layout.tsx app/"(tabs)"/rallye/__tests__/_layout.test.tsx utils/i18n.ts
git commit -m "Replace rallye countdown with a calm planned-end display"
```

---

### Task 2: Antwortabgabe nicht mehr nach Zeitablauf sperren

**Files:**
- Modify: `services/storage/answerSubmission.ts`
- Modify: `services/storage/__tests__/answerSubmission.test.ts`

**Interfaces:**
- Produces: `SubmitOutcome = { status: 'local' } | { status: 'sent' } | { status: 'queued' }` (ohne `'expired'`); `SubmitPhotoOutcome = { status: 'sent' } | { status: 'queued' } | { status: 'requires_online' }` (ohne `'expired'`).
- Consumes: `store$.rallye`, `store$.points`, `store$.gotoNextQuestion` aus `@/services/storage/Store` (unverändert; `store$.timeExpired` wird ab diesem Task nicht mehr gelesen/geschrieben).

- [ ] **Step 1: Test neu schreiben (ersetzt kompletten Dateiinhalt)**

`services/storage/__tests__/answerSubmission.test.ts`:

```ts
import {
  submitAnswerAndAdvance,
  submitPhotoAnswerAndAdvance,
} from '@/services/storage/answerSubmission';

// --- Mocks ---
const mockSaveAnswer = jest.fn();
const mockUploadPhotoAnswer = jest.fn();
jest.mock('@/services/storage/answerStorage', () => ({
  saveAnswer: (...args: unknown[]) => mockSaveAnswer(...args),
  uploadPhotoAnswer: (...args: unknown[]) => mockUploadPhotoAnswer(...args),
}));

const mockPointsGet = jest.fn(() => 0);
const mockPointsSet = jest.fn();
const mockGotoNextQuestion = jest.fn(async () => {});
const mockRallyeGet = jest.fn((): { rallye_end: string | null } => ({
  rallye_end: null,
}));
jest.mock('@/services/storage/Store', () => ({
  store$: {
    rallye: {
      get: () => mockRallyeGet(),
    },
    points: {
      get: () => mockPointsGet(),
      set: (v: number) => mockPointsSet(v),
    },
    gotoNextQuestion: () => mockGotoNextQuestion(),
  },
}));

let mockIsConnected = true;
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({ isConnected: mockIsConnected })),
}));

describe('submitAnswerAndAdvance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPointsGet.mockReturnValue(0);
    mockRallyeGet.mockReturnValue({ rallye_end: null });
    mockSaveAnswer.mockResolvedValue({ status: 'sent' });
  });

  it('returns "local" and advances without saving when no teamId', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      answeredCorrectly: true,
      pointsAwarded: 5,
    });

    expect(result).toEqual({ status: 'local' });
    expect(mockSaveAnswer).not.toHaveBeenCalled();
    expect(mockPointsSet).toHaveBeenCalledWith(5);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('saves to backend and adds points when team exists', async () => {
    mockPointsGet.mockReturnValue(10);
    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      answeredCorrectly: true,
      pointsAwarded: 3,
      answerText: 'hello',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, true, 3, 'hello');
    expect(mockPointsSet).toHaveBeenCalledWith(13);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('saves the answer even after the stored end time has passed', async () => {
    mockRallyeGet.mockReturnValue({
      rallye_end: new Date(Date.now() - 1_000).toISOString(),
    });

    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      answeredCorrectly: true,
      pointsAwarded: 2,
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 7, true, 2, '');
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('does not add points when pointsAwarded is 0 (incorrect answer)', async () => {
    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      answeredCorrectly: false,
      pointsAwarded: 0,
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockPointsSet).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('returns queued status when saveAnswer queues offline', async () => {
    mockSaveAnswer.mockResolvedValue({ status: 'queued' });

    const result = await submitAnswerAndAdvance({
      teamId: 42,
      questionId: 7,
      answeredCorrectly: true,
      pointsAwarded: 2,
    });

    expect(result).toEqual({ status: 'queued' });
  });
});

describe('submitPhotoAnswerAndAdvance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
    mockPointsGet.mockReturnValue(0);
    mockRallyeGet.mockReturnValue({ rallye_end: null });
    mockSaveAnswer.mockResolvedValue({ status: 'sent' });
    mockUploadPhotoAnswer.mockResolvedValue({ filePath: '1_2.jpg' });
  });

  it('returns requires_online when no teamId', async () => {
    const result = await submitPhotoAnswerAndAdvance({
      teamId: null,
      questionId: 1,
      pointsAwarded: 5,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'requires_online' });
    expect(mockUploadPhotoAnswer).not.toHaveBeenCalled();
    expect(mockGotoNextQuestion).not.toHaveBeenCalled();
  });

  it('returns requires_online when device is offline', async () => {
    mockIsConnected = false;

    const result = await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 1,
      pointsAwarded: 5,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'requires_online' });
    expect(mockUploadPhotoAnswer).not.toHaveBeenCalled();
  });

  it('uploads photo, saves answer, and advances when online', async () => {
    mockPointsGet.mockReturnValue(5);

    const result = await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 3,
      pointsAwarded: 10,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockUploadPhotoAnswer).toHaveBeenCalledWith({
      imageUri: '/tmp/photo.jpg',
      teamId: 42,
      questionId: 3,
    });
    expect(mockSaveAnswer).toHaveBeenCalledWith(42, 3, true, 10, '1_2.jpg');
    expect(mockPointsSet).toHaveBeenCalledWith(15);
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });

  it('uploads and saves the photo even after the stored end time has passed', async () => {
    mockRallyeGet.mockReturnValue({
      rallye_end: new Date(Date.now() - 1_000).toISOString(),
    });

    const result = await submitPhotoAnswerAndAdvance({
      teamId: 42,
      questionId: 3,
      pointsAwarded: 10,
      imageUri: '/tmp/photo.jpg',
    });

    expect(result).toEqual({ status: 'sent' });
    expect(mockUploadPhotoAnswer).toHaveBeenCalled();
    expect(mockSaveAnswer).toHaveBeenCalled();
    expect(mockGotoNextQuestion).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Test laufen lassen — erwartetes Scheitern**

Run: `npm test -- answerSubmission`
Expected: FAIL (die alte Implementierung ruft weiterhin `store$.timeExpired.get()` auf, das im neuen Mock nicht existiert, und blockiert die Fälle mit abgelaufener `rallye_end` statt zu speichern)

- [ ] **Step 3: `isRallyeTimeExpired` und beide Guards entfernen (ersetzt kompletten Dateiinhalt)**

`services/storage/answerSubmission.ts`:

```ts
import NetInfo from '@react-native-community/netinfo';
import { store$ } from '@/services/storage/Store';
import {
  saveAnswer,
  uploadPhotoAnswer,
} from '@/services/storage/answerStorage';

export type SubmitOutcome =
  | { status: 'local' }
  | { status: 'sent' }
  | { status: 'queued' };

export async function submitAnswerAndAdvance(options: {
  teamId: number | null;
  questionId: number;
  answeredCorrectly: boolean;
  pointsAwarded: number;
  answerText?: string;
}): Promise<SubmitOutcome> {
  const { teamId, questionId, answeredCorrectly, pointsAwarded, answerText } =
    options;

  if (!teamId) {
    if (pointsAwarded > 0) {
      store$.points.set((store$.points.get() as number) + pointsAwarded);
    }
    await store$.gotoNextQuestion();
    return { status: 'local' };
  }

  const result = await saveAnswer(
    teamId,
    questionId,
    answeredCorrectly,
    pointsAwarded,
    answerText ?? ''
  );

  if (pointsAwarded > 0) {
    store$.points.set((store$.points.get() as number) + pointsAwarded);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}

export type SubmitPhotoOutcome =
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'requires_online' };

export async function submitPhotoAnswerAndAdvance(options: {
  teamId: number | null;
  questionId: number;
  pointsAwarded: number;
  imageUri: string;
}): Promise<SubmitPhotoOutcome> {
  const { teamId, questionId, pointsAwarded, imageUri } = options;
  if (!teamId) return { status: 'requires_online' };

  const net = await NetInfo.fetch();
  if (!net.isConnected) return { status: 'requires_online' };

  const { filePath } = await uploadPhotoAnswer({
    imageUri,
    teamId,
    questionId,
  });

  const result = await saveAnswer(
    teamId,
    questionId,
    true,
    pointsAwarded,
    filePath
  );

  if (pointsAwarded > 0) {
    store$.points.set((store$.points.get() as number) + pointsAwarded);
  }
  await store$.gotoNextQuestion();
  return { status: result.status };
}
```

- [ ] **Step 4: Test laufen lassen — erwartetes Bestehen**

Run: `npm test -- answerSubmission`
Expected: PASS

- [ ] **Step 5: Gesamten Check-Zyklus laufen lassen**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: alle drei PASS

- [ ] **Step 6: Commit (nach explizitem „OK")**

```bash
git add services/storage/answerSubmission.ts services/storage/__tests__/answerSubmission.test.ts
git commit -m "Stop blocking answer submission after the rallye end time"
```

---

### Task 3: Fragen-Screen nach Zeitablauf nicht mehr sperren

**Files:**
- Modify: `app/(tabs)/rallye/index.tsx`
- Modify: `app/(tabs)/rallye/__tests__/index.test.tsx`
- Modify: `app/(tabs)/rallye/__tests__/index-effects.test.tsx`
- Modify: `utils/i18n.ts` (Key `rallye.timeUp` entfernen)

**Interfaces:**
- Produces: `teamRallyeFinished = !isTourMode && allQuestionsAnswered` (ersetzt die bisherige zeitbasierte Bedingung); dieser Wert steuert weiterhin, ob der „Rallye beendet"-Screen gerendert wird.
- Consumes: `store$.allQuestionsAnswered`, `store$.isTourMode`, `store$.rallye` (unverändert). `store$.timeExpired` wird ab diesem Task nirgends mehr in `index.tsx` gelesen.

- [ ] **Step 1: Store-Mock und betroffene Tests in `index.test.tsx` anpassen**

In `app/(tabs)/rallye/__tests__/index.test.tsx`, im `jest.mock('@/services/storage/Store', ...)`-Block, Zeile entfernen:

```ts
    timeExpired: { get: jest.fn(() => false), set: jest.fn() },
```

Im `beforeEach`, Zeile entfernen:

```ts
    (store$.timeExpired.get as jest.Mock).mockReturnValue(false);
```

Test `'shows the time-up state instead of active questions after team rallye expiry'` ersetzen durch:

```tsx
  it('keeps rendering active team questions after the stored end time has passed', () => {
    (store$.rallye.get as jest.Mock).mockReturnValue({
      id: 1,
      name: 'Campus Rallye',
      status: 'running',
      mode: 'classic',
      rallye_end: new Date(Date.now() - 1_000).toISOString(),
    });
    (store$.team.get as jest.Mock).mockReturnValue({ id: 2, name: 'Team A' });
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.isTourMode.get as jest.Mock).mockReturnValue(false);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', points: 1 },
    ]);
    (store$.currentQuestion.get as jest.Mock).mockReturnValue({
      id: 1,
      question: 'Q1',
      question_type: 'knowledge',
      points: 1,
    });

    render(<RallyeIndex />);

    expect(mockQuestionRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ id: 1 }),
      })
    );
  });
```

Test `'keeps rendering active team questions when stale timeExpired has a future end time'` **komplett löschen** (durch obigen Test bereits abgedeckt — es gibt kein `timeExpired` mehr, das „stale" sein könnte).

Test `'keeps rendering active tour questions even if timeExpired is true'` ersetzen durch:

```tsx
  it('keeps rendering active tour questions after the stored end time has passed', () => {
    (store$.rallye.get as jest.Mock).mockReturnValue({
      id: 1,
      name: 'Campus Tour',
      status: 'running',
      mode: 'tour',
      rallye_end: new Date(Date.now() - 1_000).toISOString(),
    });
    (store$.allQuestionsAnswered.get as jest.Mock).mockReturnValue(false);
    (store$.isTourMode.get as jest.Mock).mockReturnValue(true);
    (store$.questions.get as jest.Mock).mockReturnValue([
      { id: 1, question: 'Q1', question_type: 'knowledge', points: 1 },
    ]);
    (store$.currentQuestion.get as jest.Mock).mockReturnValue({
      id: 1,
      question: 'Q1',
      question_type: 'knowledge',
      points: 1,
    });

    render(<RallyeIndex />);

    expect(mockQuestionRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ id: 1 }),
      })
    );
  });
```

- [ ] **Step 2: Store-Mock in `index-effects.test.tsx` anpassen**

In `app/(tabs)/rallye/__tests__/index-effects.test.tsx`, im `jest.mock('@/services/storage/Store', ...)`-Block, Zeile entfernen:

```ts
    timeExpired: { get: jest.fn(() => false), set: jest.fn() },
```

- [ ] **Step 3: Tests laufen lassen — erwartetes Scheitern**

Run: `npm test -- index.test index-effects.test`
Expected: FAIL (die Produktionslogik in `index.tsx` liest weiterhin `store$.timeExpired.get()`, das in den Mocks jetzt fehlt, und zeigt bei abgelaufener `rallye_end` noch den `rallye.timeUp`-Screen statt der Fragen)

- [ ] **Step 4: `teamRallyeFinished`-Logik in `index.tsx` vereinfachen**

```tsx
  const allQuestionsAnswered = useSelector(() =>
    store$.allQuestionsAnswered.get()
  );
  const timeExpired = useSelector(() => store$.timeExpired.get());
  const isTourMode = useSelector(() => store$.isTourMode.get());

  // Use primitive IDs as callback dependencies so that sub-field mutations
  // on the rallye observable (status, rallye_end, name) don't recreate the
  // callbacks and re-trigger the main data-loading effect.
  const rallyeId = rallye?.id;
  const teamId = team?.id;
  const endTimeMs = rallye?.rallye_end
    ? new Date(rallye.rallye_end).getTime()
    : null;
  const hasFutureEndTime =
    typeof endTimeMs === 'number' &&
    Number.isFinite(endTimeMs) &&
    endTimeMs > Date.now();
  const rallyeTimeExpired = timeExpired && !hasFutureEndTime;
  const teamRallyeFinished =
    !isTourMode && (allQuestionsAnswered || rallyeTimeExpired);
```
→
```tsx
  const allQuestionsAnswered = useSelector(() =>
    store$.allQuestionsAnswered.get()
  );
  const isTourMode = useSelector(() => store$.isTourMode.get());

  const rallyeId = rallye?.id;
  const teamId = team?.id;
  const teamRallyeFinished = !isTourMode && allQuestionsAnswered;
```

- [ ] **Step 5: „Rallye beendet"-Screen vereinfachen**

```tsx
  if (teamRallyeFinished) {
    // Time up vs finished before end
    return (
```
→
```tsx
  if (teamRallyeFinished) {
    return (
```

```tsx
              {rallyeTimeExpired
                ? t('rallye.timeUp')
                : t('rallye.allAnswered.simple')}
            </ThemedText>
            {!rallyeTimeExpired && team ? (
```
→
```tsx
              {t('rallye.allAnswered.simple')}
            </ThemedText>
            {team ? (
```

- [ ] **Step 6: `rallye.timeUp`-Key aus `utils/i18n.ts` entfernen**

Deutscher Block:
```ts
    'rallye.timeUp': 'Zeit abgelaufen!',
```
Zeile löschen.

Englischer Block:
```ts
    'rallye.timeUp': 'Time up!',
```
Zeile löschen.

- [ ] **Step 7: Tests laufen lassen — erwartetes Bestehen**

Run: `npm test -- index.test index-effects.test`
Expected: PASS

- [ ] **Step 8: Gesamten Check-Zyklus laufen lassen**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: alle drei PASS

- [ ] **Step 9: Commit (nach explizitem „OK")**

```bash
git add app/"(tabs)"/rallye/index.tsx app/"(tabs)"/rallye/__tests__/index.test.tsx app/"(tabs)"/rallye/__tests__/index-effects.test.tsx utils/i18n.ts
git commit -m "Keep questions accessible after the rallye end time"
```

---

### Task 4: `timeExpired` aus dem Store entfernen

**Files:**
- Modify: `services/storage/Store.ts`
- Modify: `services/storage/__tests__/Store.test.ts`

**Interfaces:**
- Produces: `SessionInputs = { enabled: boolean; rallye: RallyeRow | null; allQuestionsAnswered: boolean }` (ohne `timeExpired`); `store$` ohne `timeExpired`-Feld.
- Consumes: keine externen Abhängigkeiten geändert. Voraussetzung: Tasks 1–3 abgeschlossen (kein Code liest/schreibt `store$.timeExpired` mehr außerhalb dieser Datei).

- [ ] **Step 1: Test anpassen — Fall „time expired" entfernen**

In `services/storage/__tests__/Store.test.ts`, Test entfernen:

```ts
    it('returns finished when time expired', () => {
      store$.enabled.set(true);
      store$.rallye.set({ id: 1, name: 'R', status: 'active' } as any);
      store$.timeExpired.set(true);
      expect(store$.sessionState.get()).toBe('finished');
    });
```

Im Test `'resets all gameplay observables to defaults'`, Zeilen entfernen:

```ts
      store$.timeExpired.set(true);
```
und
```ts
      expect(store$.timeExpired.get()).toBe(false);
```

- [ ] **Step 2: Test laufen lassen — erwartetes Bestehen (Vorab-Check)**

Run: `npm test -- Store.test`
Expected: PASS (die Store-Implementierung ändert sich in diesem Step noch nicht; der Test soll bereits ohne die entfernten Assertions grün sein, bevor das Feld selbst gelöscht wird)

- [ ] **Step 3: `timeExpired` aus `Store.ts` entfernen**

```ts
type SessionInputs = {
  enabled: boolean;
  rallye: RallyeRow | null;
  allQuestionsAnswered: boolean;
  timeExpired: boolean;
};

function deriveSessionState({
  enabled,
  rallye,
  allQuestionsAnswered,
  timeExpired,
}: SessionInputs): SessionState {
  if (!enabled || !rallye) return 'not_joined';
  if (rallye.status === 'voting') return 'voting';
  if (
    rallye.status === 'ranking' ||
    rallye.status === 'ended' ||
    allQuestionsAnswered ||
    timeExpired
  )
    return 'finished';
  return 'playing';
}
```
→
```ts
type SessionInputs = {
  enabled: boolean;
  rallye: RallyeRow | null;
  allQuestionsAnswered: boolean;
};

function deriveSessionState({
  enabled,
  rallye,
  allQuestionsAnswered,
}: SessionInputs): SessionState {
  if (!enabled || !rallye) return 'not_joined';
  if (rallye.status === 'voting') return 'voting';
  if (
    rallye.status === 'ranking' ||
    rallye.status === 'ended' ||
    allQuestionsAnswered
  )
    return 'finished';
  return 'playing';
}
```

```ts
  allQuestionsAnswered: false,
  answers: [] as AnswerRow[],
  team: null as Team | null,
  timeExpired: false,
  teamDeleted: false,
```
→
```ts
  allQuestionsAnswered: false,
  answers: [] as AnswerRow[],
  team: null as Team | null,
  teamDeleted: false,
```

```ts
  sessionState: () =>
    deriveSessionState({
      enabled: store$.enabled.get(),
      rallye: store$.rallye.get(),
      allQuestionsAnswered: store$.allQuestionsAnswered.get(),
      timeExpired: store$.timeExpired.get(),
    }),
```
→
```ts
  sessionState: () =>
    deriveSessionState({
      enabled: store$.enabled.get(),
      rallye: store$.rallye.get(),
      allQuestionsAnswered: store$.allQuestionsAnswered.get(),
    }),
```

```ts
    store$.answers.set([]);
    store$.timeExpired.set(false);
    store$.totalQuestions.set(0);
```
→
```ts
    store$.answers.set([]);
    store$.totalQuestions.set(0);
```

- [ ] **Step 4: Gesamten Check-Zyklus laufen lassen**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: alle drei PASS

- [ ] **Step 5: Commit (nach explizitem „OK")**

```bash
git add services/storage/Store.ts services/storage/__tests__/Store.test.ts
git commit -m "Remove the timeExpired session flag from the store"
```

---

### Task 5: Scoreboard — nur Punkte zählen, Gleichstand = gleicher Rang

**Files:**
- Modify: `app/(tabs)/rallye/scoreboard.tsx`
- Modify: `app/(tabs)/rallye/__tests__/scoreboard.test.tsx`

**Interfaces:**
- Produces: `TeamRow.rank` wird per **Dense Ranking** vergeben (Teams mit gleichen `total_points` teilen sich den Rang; der nächste unterschiedliche Punktwert bekommt `vorherigerRang + 1`, kein Überspringen).
- Consumes: `TeamRow` (unverändert, inkl. `time_spent`), `calculateDuration` (unverändert, wird in Task 6 weiter benötigt).

- [ ] **Step 1: Test `'sorts teams by points descending, then by time'` ersetzen**

In `app/(tabs)/rallye/__tests__/scoreboard.test.tsx`:

```tsx
  it('sorts teams by points descending, then by time', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ranking' };
    mockTeams = [
      {
        id: '1',
        name: 'Slow',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T12:00:00Z',
      },
      {
        id: '2',
        name: 'Fast',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T10:30:00Z',
      },
    ];
    // Same points — Fast should rank first due to shorter time
    mockPoints = [
      { team_id: '1', points: 10 },
      { team_id: '2', points: 10 },
    ];

    const { getAllByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    // 🥇 should appear before 🥈
    const gold = getAllByText('🥇');
    const silver = getAllByText('🥈');
    expect(gold.length).toBe(1);
    expect(silver.length).toBe(1);
  });
```
→
```tsx
  it('ranks tied teams equally without skipping the next rank (dense ranking)', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ranking' };
    mockTeams = [
      {
        id: '1',
        name: 'A',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T12:00:00Z',
      },
      {
        id: '2',
        name: 'B',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T10:30:00Z',
      },
      {
        id: '3',
        name: 'C',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
    ];
    // A and B tie on points despite different play time; C has fewer points
    // and must land on rank 2, not 3 (dense ranking, no skipped rank).
    mockPoints = [
      { team_id: '1', points: 10 },
      { team_id: '2', points: 10 },
      { team_id: '3', points: 5 },
    ];

    const { getAllByText, getByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    expect(getAllByText('🥇').length).toBe(2);
    expect(getByText('🥈')).toBeTruthy();
  });
```

- [ ] **Step 2: Test laufen lassen — erwartetes Scheitern**

Run: `npm test -- scoreboard.test`
Expected: FAIL (die aktuelle Sortierung bricht Punktgleichheit per Zeit auf und vergibt Ränge per striktem Array-Index, sodass Team C Rang 3 statt 2 erhält und nur ein Team 🥇 zeigt)

- [ ] **Step 3: Sortierung und Rangvergabe in `scoreboard.tsx` umstellen**

```tsx
        combined.sort((a, b) => {
          if (b.total_points! !== a.total_points!) {
            return b.total_points! - a.total_points!;
          }
          const timeA = a.time_spent ?? Number.MAX_SAFE_INTEGER;
          const timeB = b.time_spent ?? Number.MAX_SAFE_INTEGER;
          return timeA - timeB;
        });

        combined = combined.map((t, i) => {
          return { ...t, rank: i + 1, group_name: t.name };
        });
```
→
```tsx
        combined.sort(
          (a, b) => (b.total_points ?? 0) - (a.total_points ?? 0)
        );

        // Dense ranking: teams with equal points share a rank; the next
        // distinct point value gets previousRank + 1 (no skipped ranks).
        let currentRank = 0;
        let previousPoints: number | null = null;
        combined = combined.map((t) => {
          const points = t.total_points ?? 0;
          if (previousPoints === null || points !== previousPoints) {
            currentRank += 1;
            previousPoints = points;
          }
          return { ...t, rank: currentRank, group_name: t.name };
        });
```

- [ ] **Step 4: Test laufen lassen — erwartetes Bestehen**

Run: `npm test -- scoreboard.test`
Expected: PASS

- [ ] **Step 5: Gesamten Check-Zyklus laufen lassen**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: alle drei PASS

- [ ] **Step 6: Commit (nach explizitem „OK")**

```bash
git add app/"(tabs)"/rallye/scoreboard.tsx app/"(tabs)"/rallye/__tests__/scoreboard.test.tsx
git commit -m "Rank tied scoreboard teams equally by points only"
```

---

### Task 6: Eigene Spielzeit nur als Rückblick fürs eigene Team

**Files:**
- Modify: `app/(tabs)/rallye/scoreboard.tsx`
- Modify: `app/(tabs)/rallye/__tests__/scoreboard.test.tsx`
- Modify: `utils/i18n.ts`

**Interfaces:**
- Produces: `formatOwnDuration(ms: number, t: Translator): string` (ersetzt `formatDuration`), genutzt ausschließlich für die eigene Team-Zeile.
- Consumes: `Translator` (`@/utils/i18n`), `calculateDuration` (unverändert aus Task 5).

- [ ] **Step 1: Neuen Test für die eigene Rückblick-Zeit hinzufügen**

In `app/(tabs)/rallye/__tests__/scoreboard.test.tsx`, nach dem Test `'highlights own team row'` einfügen:

```tsx
  it('shows the own team play time as a retrospective, not for other teams', async () => {
    mockRallye = { id: 1, name: 'R', status: 'ended' };
    mockTeam = { id: '2', name: 'MyTeam' };
    mockTeams = [
      {
        id: '1',
        name: 'Other',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T11:00:00Z',
      },
      {
        id: '2',
        name: 'MyTeam',
        created_at: '2024-01-01T10:00:00Z',
        play_time: '2024-01-01T10:47:00Z',
      },
    ];
    mockPoints = [
      { team_id: '1', points: 20 },
      { team_id: '2', points: 10 },
    ];

    const { getAllByText } = render(<Scoreboard />);
    await act(async () => {
      await flushPromises();
    });

    // Only the own team's row renders the retrospective duration text.
    expect(getAllByText('scoreboard.ownDuration').length).toBe(1);
  });
```

- [ ] **Step 2: Test laufen lassen — erwartetes Scheitern**

Run: `npm test -- scoreboard.test`
Expected: FAIL (`scoreboard.ownDuration` existiert noch nicht; aktuell zeigen alle Zeilen die Dauer im `hh:mm:ss`-Format statt der eigenen Zeile eine Rückblick-Formulierung)

- [ ] **Step 3: `formatDuration` durch `formatOwnDuration` ersetzen**

```tsx
function formatDuration(ms?: number | null) {
  if (ms == null) return '-';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}
```
→
```tsx
function formatOwnDuration(ms: number, t: Translator): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? t('scoreboard.durationHoursMinutes', { hours, minutes })
    : t('scoreboard.durationMinutes', { minutes });
}
```

Import ergänzen (oben in der Datei, bei den übrigen Imports):

```ts
import type { Translator } from '@/utils/i18n';
```

- [ ] **Step 4: Zeilen-Rendering umstellen — Zeit nur noch für die eigene Zeile**

```tsx
          {rows.map((team) => {
            const rowLabel = t('scoreboard.rowLabel', {
              rank: team.rank ?? '-',
              team: team.group_name ?? '-',
              time: formatDuration(team.time_spent),
              points: team.total_points ?? '-',
            });
            const isOurTeam =
              ourTeam?.id !== undefined &&
              String(team.id) === String(ourTeam.id);
```
→
```tsx
          {rows.map((team) => {
            const isOurTeam =
              ourTeam?.id !== undefined &&
              String(team.id) === String(ourTeam.id);
            const ownDurationText =
              isOurTeam && team.time_spent != null
                ? t('scoreboard.ownDuration', {
                    time: formatOwnDuration(team.time_spent, t),
                  })
                : null;
            const baseRowLabel = t('scoreboard.rowLabel', {
              rank: team.rank ?? '-',
              team: team.group_name ?? '-',
              points: team.total_points ?? '-',
            });
            const rowLabel = ownDurationText
              ? `${baseRowLabel}, ${ownDurationText}`
              : baseRowLabel;
```

```tsx
                  {team.total_points}
                  {'\n'}
                  <ThemedText style={[s.muted, { fontSize: 12, opacity: 0.7 }]}>
                    ({formatDuration(team.time_spent)})
                  </ThemedText>
                </ThemedText>
```
→
```tsx
                  {team.total_points}
                  {ownDurationText ? (
                    <>
                      {'\n'}
                      <ThemedText
                        style={[s.muted, { fontSize: 12, opacity: 0.7 }]}
                      >
                        {ownDurationText}
                      </ThemedText>
                    </>
                  ) : null}
                </ThemedText>
```

- [ ] **Step 5: i18n-Keys ergänzen und `scoreboard.rowLabel` anpassen**

Deutscher Block, `scoreboard.rowLabel` ändern:

```ts
    'scoreboard.rowLabel':
      'Platz {{rank}}, Team {{team}}, Zeit {{time}}, Punkte {{points}}',
```
→
```ts
    'scoreboard.rowLabel':
      'Platz {{rank}}, Team {{team}}, Punkte {{points}}',
    'scoreboard.ownDuration': 'Ihr wart {{time}} unterwegs',
    'scoreboard.durationMinutes': '{{minutes}} Min.',
    'scoreboard.durationHoursMinutes': '{{hours}} Std. {{minutes}} Min.',
```

Englischer Block, `scoreboard.rowLabel` ändern:

```ts
    'scoreboard.rowLabel':
      'Rank {{rank}}, Team {{team}}, Time {{time}}, Points {{points}}',
```
→
```ts
    'scoreboard.rowLabel':
      'Rank {{rank}}, Team {{team}}, Points {{points}}',
    'scoreboard.ownDuration': 'You took {{time}}',
    'scoreboard.durationMinutes': '{{minutes}} min',
    'scoreboard.durationHoursMinutes': '{{hours}} hr {{minutes}} min',
```

- [ ] **Step 6: Test laufen lassen — erwartetes Bestehen**

Run: `npm test -- scoreboard.test`
Expected: PASS

- [ ] **Step 7: Gesamten Check-Zyklus laufen lassen**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: alle drei PASS

- [ ] **Step 8: Commit (nach explizitem „OK")**

```bash
git add app/"(tabs)"/rallye/scoreboard.tsx app/"(tabs)"/rallye/__tests__/scoreboard.test.tsx utils/i18n.ts
git commit -m "Show own team's play time as a retrospective only"
```
