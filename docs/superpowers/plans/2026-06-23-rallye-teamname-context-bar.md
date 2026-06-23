# Rallye Teamname Context Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the team name out of the truncating navigation header into a full-width, wrapping context bar shown at the top of the in-rallye gameplay screens.

**Architecture:** A new presentational component `RallyeContextBar` reads the team from the global store and renders an icon + the full team name (wrapping, no truncation). It is placed as the first scrollable element on the question screen, the Voting list, and the Scoreboard. The old `RallyeHeader` is removed from the stack header and deleted.

**Tech Stack:** React Native, Expo Router, `@legendapp/state` store, Jest + `@testing-library/react-native`.

## Global Constraints

- TypeScript strict mode; 2-space indentation.
- Code comments in English; UI strings via `useLanguage()` `t(...)` keys (no new copy needed here).
- Path alias `@/*` is available.
- After every task run: `npm run lint`, `npx tsc --noEmit`, `npm test`. Do not commit if any fail.
- Commit messages: imperative mood, concise.

## Scope note

The team name currently lives in `components/rallye/RallyeHeader.tsx` and is shown via the stack header `headerLeft` (`app/(tabs)/rallye/_layout.tsx`), so it appears on every rallye screen but is width-capped to `Math.max(width - 220, 96)` and truncated with `ellipsizeMode="tail"`.

The bar is added to the three screens where a team is actively playing and the team name is **not** already displayed: the question screen, Voting, and Scoreboard. It is intentionally **not** added to:

- `app/(tabs)/rallye/team-setup.tsx` — no team name exists yet (it is being created).
- `states/Preparation.tsx`, `states/NoQuestions.tsx` — transitional/empty centered states (NoQuestions also renders with no team/rallye).
- The "all answered" branches in `index.tsx` — the non-tour branch already shows the team via `t('rallye.teamLabel')` (`index.tsx:412`).

The component self-guards (`return null` when no team name), so accidental placement elsewhere is harmless.

---

## File Structure

- Create: `components/rallye/RallyeContextBar.tsx` — presentational bar (icon + full team name, wrapping).
- Create: `components/rallye/__tests__/RallyeContextBar.test.tsx` — unit tests.
- Modify: `app/(tabs)/rallye/index.tsx` — render bar on question screen; drop redundant rallye-name prefix from the progress line.
- Modify: `app/(tabs)/rallye/scoreboard.tsx` — render bar at top of scroll content.
- Modify: `app/(tabs)/rallye/voting.tsx` — render bar inside the FlatList header so it scrolls with content.
- Modify: `app/(tabs)/rallye/_layout.tsx` — remove `RallyeHeader` from `headerLeft`.
- Delete: `components/rallye/RallyeHeader.tsx` and `components/rallye/__tests__/RallyeHeader.test.tsx`.
- Modify: `app/(tabs)/rallye/__tests__/_layout.test.tsx` — drop the now-dangling `RallyeHeader` mock.

---

## Task 1: RallyeContextBar component

**Files:**
- Create: `components/rallye/RallyeContextBar.tsx`
- Test: `components/rallye/__tests__/RallyeContextBar.test.tsx`

**Interfaces:**
- Consumes: `store$.team` from `@/services/storage/Store` (`{ name?: string } | null`).
- Produces: `export default function RallyeContextBar(): JSX.Element | null` — no props.

- [ ] **Step 1: Write the failing test**

Create `components/rallye/__tests__/RallyeContextBar.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import RallyeContextBar from '../RallyeContextBar';

let mockTeam: { name: string } | null = null;

jest.mock('@legendapp/state/react', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    team: { get: () => mockTeam },
  },
}));

jest.mock('@/utils/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => null,
}));

describe('RallyeContextBar', () => {
  it('renders the full team name without truncation', () => {
    mockTeam = { name: 'Invincible Green Sharks with a Very Long Team Name' };

    const { getByText } = render(<RallyeContextBar />);
    const teamName = getByText(mockTeam.name);

    expect(teamName.props.numberOfLines).toBeUndefined();
    expect(teamName.props.ellipsizeMode).toBeUndefined();
  });

  it('renders nothing when no team exists', () => {
    mockTeam = null;

    const { toJSON } = render(<RallyeContextBar />);

    expect(toJSON()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- RallyeContextBar`
Expected: FAIL — cannot find module `../RallyeContextBar`.

- [ ] **Step 3: Write the component**

Create `components/rallye/RallyeContextBar.tsx`:

```tsx
import { View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { useTheme } from '@/utils/ThemeContext';
import Colors from '@/utils/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ThemedText from '@/components/themed/ThemedText';

// Full-width team-name strip rendered at the top of in-rallye screens.
// Unlike the old header it does not cap width or truncate, so long team
// names wrap instead of being cut off.
export default function RallyeContextBar() {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const team = useSelector(() => store$.team.get());

  if (!team?.name) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
      }}
    >
      <IconSymbol name="person.3" size={16} color={palette.text} />
      <ThemedText variant="label" style={{ flexShrink: 1 }}>
        {team.name}
      </ThemedText>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- RallyeContextBar`
Expected: PASS (2 tests).

- [ ] **Step 5: Verify lint and types**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/rallye/RallyeContextBar.tsx components/rallye/__tests__/RallyeContextBar.test.tsx
git commit -m "Add RallyeContextBar component for full-width team name"
```

---

## Task 2: Show bar on the question screen and trim progress prefix

**Files:**
- Modify: `app/(tabs)/rallye/index.tsx` (import; question-screen branch around lines 308-330)

**Interfaces:**
- Consumes: `RallyeContextBar` (default export, no props) from Task 1.

- [ ] **Step 1: Add the import**

In `app/(tabs)/rallye/index.tsx`, add to the component imports (next to the other `@/components/...` imports, e.g. after the `ScreenScrollView` import line):

```tsx
import RallyeContextBar from '@/components/rallye/RallyeContextBar';
```

- [ ] **Step 2: Render the bar and drop the rallye-name prefix**

Replace this block (currently around `index.tsx:319-327`):

```tsx
        <ThemedText variant="bodyStrong" style={{ marginBottom: 8 }}>
          {(rallye?.name ? `${rallye.name} • ` : '') +
            t('rallye.progress', {
              current: isTourMode
                ? idx + 1
                : Math.min((answeredCount || 0) + 1, totalQuestions || qsLen),
              total: isTourMode ? qsLen : totalQuestions || qsLen,
            })}
        </ThemedText>
```

with:

```tsx
        <RallyeContextBar />
        <ThemedText variant="bodyStrong" style={{ marginBottom: 8 }}>
          {t('rallye.progress', {
            current: isTourMode
              ? idx + 1
              : Math.min((answeredCount || 0) + 1, totalQuestions || qsLen),
            total: isTourMode ? qsLen : totalQuestions || qsLen,
          })}
        </ThemedText>
```

- [ ] **Step 3: Verify lint, types, and tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: all pass. If a test asserted the rallye-name prefix in the progress line, update it to expect only the `rallye.progress` output.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/rallye/index.tsx
git commit -m "Show team context bar on rallye question screen"
```

---

## Task 3: Show bar on the Scoreboard

**Files:**
- Modify: `app/(tabs)/rallye/scoreboard.tsx` (import; return around lines 114-124)

**Interfaces:**
- Consumes: `RallyeContextBar` from Task 1.

- [ ] **Step 1: Add the import**

In `app/(tabs)/rallye/scoreboard.tsx`, add next to the other `@/components/...` imports:

```tsx
import RallyeContextBar from '@/components/rallye/RallyeContextBar';
```

- [ ] **Step 2: Render the bar as the first scroll child**

In the returned JSX (currently around `scoreboard.tsx:114-124`), insert `<RallyeContextBar />` as the first child inside `<ScreenScrollView ...>`, before the `<View style={[globalStyles.rallyeStatesStyles.infoBox, ...]}>`:

```tsx
    <ScreenScrollView
      padding="none"
      edges={['bottom']}
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        { justifyContent: 'flex-start' },
      ]}
    >
      <RallyeContextBar />
      <View
        style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { padding: 0, maxHeight: '100%' },
          s.infoBox,
        ]}
      >
```

- [ ] **Step 3: Verify lint, types, and tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: all pass (including the existing `scoreboard.test.tsx`).

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/rallye/scoreboard.tsx
git commit -m "Show team context bar on scoreboard"
```

---

## Task 4: Show bar on the Voting screen

**Files:**
- Modify: `app/(tabs)/rallye/voting.tsx` (import; `ListHeaderComponent` around lines 167-173)

**Interfaces:**
- Consumes: `RallyeContextBar` from Task 1.

- [ ] **Step 1: Add the import**

In `app/(tabs)/rallye/voting.tsx`, add next to the other `@/components/...` imports:

```tsx
import RallyeContextBar from '@/components/rallye/RallyeContextBar';
```

- [ ] **Step 2: Render the bar inside the FlatList header**

The current `ListHeaderComponent` (around `voting.tsx:167`) renders the question header only when there are voting items. Change it so the bar always renders and scrolls with the list. Replace:

```tsx
        ListHeaderComponent={() =>
          currentQuestion && currentQuestion.length > 0 ? (
            <View style={{ paddingTop: 10, paddingBottom: 30 }}>
```

with:

```tsx
        ListHeaderComponent={() =>
          currentQuestion && currentQuestion.length > 0 ? (
            <View style={{ paddingTop: 10, paddingBottom: 30 }}>
              <RallyeContextBar />
```

(The new `<RallyeContextBar />` becomes the first child of that `<View>`; the existing `<InfoBox mb={2}>...` that followed stays directly after it. Do not change the closing tags.)

- [ ] **Step 3: Verify lint, types, and tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: all pass (including the existing `voting.test.tsx`).

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/rallye/voting.tsx
git commit -m "Show team context bar on voting screen"
```

---

## Task 5: Remove the old RallyeHeader from the stack header

**Files:**
- Modify: `app/(tabs)/rallye/_layout.tsx` (import + `headerLeft`)
- Modify: `app/(tabs)/rallye/__tests__/_layout.test.tsx` (drop dangling mock)
- Delete: `components/rallye/RallyeHeader.tsx`
- Delete: `components/rallye/__tests__/RallyeHeader.test.tsx`

**Interfaces:**
- None produced. This task removes the now-redundant header usage.

- [ ] **Step 1: Remove the header usage in `_layout.tsx`**

Remove the import line:

```tsx
import RallyeHeader from '@/components/rallye/RallyeHeader';
```

Remove the `headerLeft` option from `screenOptions` (currently `_layout.tsx:38-42`):

```tsx
        headerLeft: () => (
          <View style={{ paddingLeft: 16 }}>
            <RallyeHeader />
          </View>
        ),
```

After removal, check whether `View` from `react-native` is still used elsewhere in the file. It is still used in the Android `headerRight` (`<View style={{ paddingRight: 16 }}>` is a `Pressable`, but verify): if `View` is no longer referenced, remove it from the `react-native` import (`import { Platform, Pressable, View } from 'react-native';`) to satisfy lint. If it is still used, leave the import as is.

- [ ] **Step 2: Drop the dangling mock in the layout test**

In `app/(tabs)/rallye/__tests__/_layout.test.tsx`, remove the line (currently line 82):

```tsx
jest.mock('@/components/rallye/RallyeHeader', () => () => null);
```

- [ ] **Step 3: Delete the old component and its test**

```bash
git rm components/rallye/RallyeHeader.tsx components/rallye/__tests__/RallyeHeader.test.tsx
```

- [ ] **Step 4: Verify lint, types, and tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: all pass; no references to `RallyeHeader` remain.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/rallye/_layout.tsx app/(tabs)/rallye/__tests__/_layout.test.tsx
git commit -m "Remove RallyeHeader in favor of in-screen team context bar"
```

---

## Self-Review notes

- **Spec coverage:** Component (Task 1), all-screen visibility via the gameplay screens question/Voting/Scoreboard (Tasks 2-4), header cleanup + deletion (Task 5), progress-line redundancy removal (Task 2). Deviation from the spec's "Preparation/NoQuestions/all-answered" list is documented in the Scope note above and flagged to the user.
- **No placeholders:** every code step shows full code or exact edits.
- **Type consistency:** `RallyeContextBar` is a default export with no props, consumed identically in Tasks 2-4.
