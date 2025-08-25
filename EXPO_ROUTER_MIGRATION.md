# Expo-Router Rally App Migration

This document describes the new expo-router based rally app structure that replaces the legacy navigation system.

## New Structure

### Main Navigation Routes

- `/` - Welcome/Index screen with mode selection
- `/rally/*` - Rally participation flow
- `/explore/*` - Exploration mode flow
- `/(tabs)/*` - Existing tab navigation (infos, etc.)

### Rally Participation Mode (`/rally/*`)

#### Flow:
1. **Welcome screen** → Select rally and enter password → `/rally/team`
2. **Team screen** (`/rally/team`) → Create or show team → `/rally`
3. **Rally main** (`/rally`) → Handle different rally states:
   - `preparation`: Wait screen with refresh button
   - `running`: Navigate to `/rally/questions`
   - `post_processing`: Show voting screen
   - `ended`: Show scoreboard
4. **Questions** (`/rally/questions`) → Question flow with timer
5. **Voting** (`/rally/voting`) → Team voting during post-processing
6. **Scoreboard** (`/rally/scoreboard`) → Final rankings

#### Rally States:
- **preparation**: Teams wait until rally begins
- **running**: Rally is active, questions can be answered
- **post_processing**: Rally ended, voting phase
- **ended**: Rally complete, show results

### Exploration Mode (`/explore/*`)

#### Flow:
1. **Welcome screen** → "Campus erkunden" → `/explore`
2. **Rally selection** (`/explore`) → Choose rally → `/explore/questions`
3. **Questions** (`/explore/questions`) → Answer questions without team/timer
4. **Results** (`/explore/results`) → Show final score → Back to welcome

## Key Features

### State Management
- Uses existing `@legendapp/state` store
- Maintains compatibility with legacy services
- Proper state reset between modes

### Team Management
- Random team name generation
- Team persistence across sessions
- Database verification of team existence

### Question Handling
- Support for all question types (knowledge, upload, qr_code, multiple_choice, picture)
- Random question order
- Progress tracking
- Answer persistence (rally mode only)

### Navigation
- Clean expo-router based navigation
- Proper back button handling
- State-based routing logic

## Usage

### Starting Rally Participation:
1. Select "An Campus Rallye teilnehmen" on welcome screen
2. Choose active rally from list
3. Enter rally password
4. Create team (if not exists)
5. Wait for rally to start or participate if running

### Starting Exploration:
1. Select "Campus-Gelände erkunden" on welcome screen
2. Choose rally to explore
3. Answer questions at your own pace
4. View results when complete

## Technical Details

### File Structure:
```
app/
├── _layout.tsx          # Root layout with Stack navigation
├── index.tsx            # Welcome screen with mode selection
├── rally/
│   ├── _layout.tsx      # Rally stack navigation
│   ├── index.tsx        # Main rally screen with state handling
│   ├── team.tsx         # Team creation/management
│   ├── questions.tsx    # Question flow
│   ├── voting.tsx       # Post-processing voting
│   └── scoreboard.tsx   # Final results
└── explore/
    ├── _layout.tsx      # Explore stack navigation
    ├── index.tsx        # Rally selection for exploration
    ├── questions.tsx    # Question flow without team
    └── results.tsx      # Final exploration results
```

### Integration with Existing Code:
- Reuses legacy screens for question components
- Maintains compatibility with existing services
- Uses existing UI components and styles
- Preserves offline functionality

### Data Flow:
- All rally data managed through existing `store$`
- Database operations use existing Supabase services
- Answer persistence handled by existing answer storage
- Team management via existing team storage services

## Migration Benefits

1. **Modern Navigation**: expo-router provides better navigation handling
2. **Clean Separation**: Clear distinction between participation and exploration
3. **Maintainable**: Easier to understand and modify
4. **Consistent**: Follows React Native and Expo best practices
5. **Scalable**: Easy to add new features and screens

## Testing

To test the implementation:
1. Start with `npx expo start`
2. Test rally participation flow with active rally
3. Test exploration mode with tour rally
4. Verify state transitions work correctly
5. Test navigation between screens