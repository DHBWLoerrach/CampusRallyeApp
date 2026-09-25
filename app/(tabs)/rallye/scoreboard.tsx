import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import {
  getScoreboardData,
  type ScoreboardTeamRow,
} from '@/services/storage/scoreboardStorage';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { ScreenScrollView } from '@/components/ui/Screen';
import RallyeContextBar from '@/components/rallye/RallyeContextBar';

type TeamRow = ScoreboardTeamRow & {
  total_points?: number;
  rank?: number;
  group_name?: string;
};

export default function Scoreboard() {
  const rallye = useSelector(() => store$.rallye.get());
  const rallyeId = rallye?.id;
  const rallyeStatus = rallye?.status;
  const ourTeam = useSelector(() => store$.team.get());
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loadError, setLoadError] = useState(false);
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const highlightAccent = isDarkMode
    ? 'rgba(226, 0, 26, 0.35)'
    : Colors.dhbwRed;
  const highlightBackground = isDarkMode
    ? 'rgba(226, 0, 26, 0.03)'
    : 'rgba(226, 0, 26, 0.025)';
  const s = useAppStyles();
  const { t } = useLanguage();

  useEffect(() => {
    if (!rallyeId || (rallyeStatus !== 'results' && rallyeStatus !== 'ended'))
      return;
    let cancelled = false;
    (async () => {
      try {
        setLoadError(false);
        const { teams: teamRows, points: teamPoints } =
          await getScoreboardData(rallyeId);

        const pointsByTeamId = new Map<TeamRow['id'], number>();
        for (const row of teamPoints) {
          pointsByTeamId.set(
            row.team_id,
            (pointsByTeamId.get(row.team_id) ?? 0) + row.team_points
          );
        }

        let combined = teamRows.map(
          (t) =>
            ({
              ...t,
              total_points: pointsByTeamId.get(t.id) ?? 0,
            }) as TeamRow
        );

        combined.sort(
          (a, b) =>
            (b.total_points ?? 0) - (a.total_points ?? 0) ||
            a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
        );

        // Tied teams share a rank; the next distinct score uses its row position.
        let currentRank = 0;
        let previousPoints: number | null = null;
        combined = combined.map((t, index) => {
          const points = t.total_points ?? 0;
          if (previousPoints === null || points !== previousPoints) {
            currentRank = index + 1;
            previousPoints = points;
          }
          return { ...t, rank: currentRank, group_name: t.name };
        });

        if (cancelled) return;
        setRows(combined);
      } catch (e) {
        if (cancelled) return;
        console.error('Error loading scoreboard:', e);
        setRows([]);
        setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rallyeId, rallyeStatus]);

  return (
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
        <View
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: palette.cellBorder,
          }}
        >
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {t('scoreboard.title')}
          </ThemedText>
          {rallye?.name && (
            <ThemedText
              variant="subtitle"
              style={[
                globalStyles.rallyeStatesStyles.infoSubtitle,
                s.text,
                { marginTop: 4, marginBottom: 8 },
              ]}
            >
              {rallye.name}
            </ThemedText>
          )}
        </View>

        <ScrollView style={{ backgroundColor: palette.surface1 }}>
          {loadError ? (
            <ThemedText style={[s.text, { padding: 16, textAlign: 'center' }]}>
              {t('scoreboard.error.load')}
            </ThemedText>
          ) : (
            rows.map((team) => {
              const isOurTeam =
                ourTeam?.id !== undefined && team.id === ourTeam.id;
              const rowLabel = t('scoreboard.rowLabel', {
                rank: team.rank ?? '-',
                team: team.group_name ?? '-',
                points: team.total_points ?? '-',
              });
              return (
                <View
                  key={team.id}
                  accessible
                  accessibilityLabel={rowLabel}
                  style={[
                    globalStyles.scoreboardStyles.row,
                    s.listRow,
                    isOurTeam && {
                      backgroundColor: highlightBackground,
                      borderLeftWidth: 3,
                      borderLeftColor: highlightAccent,
                      paddingLeft: 12,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      globalStyles.scoreboardStyles.cell,
                      s.text,
                      isOurTeam && { fontWeight: '700' },
                    ]}
                  >
                    {team.rank === 1
                      ? '🥇'
                      : team.rank === 2
                        ? '🥈'
                        : team.rank === 3
                          ? '🥉'
                          : team.rank}
                  </ThemedText>
                  <ThemedText
                    style={[
                      globalStyles.scoreboardStyles.cellWide,
                      s.text,
                      isOurTeam &&
                        globalStyles.scoreboardStyles.cellHighlighted,
                    ]}
                  >
                    {team.group_name}
                  </ThemedText>

                  <ThemedText
                    style={[
                      globalStyles.scoreboardStyles.cell,
                      s.text,
                      isOurTeam &&
                        globalStyles.scoreboardStyles.cellHighlighted,
                      isOurTeam && { fontWeight: '700' },
                    ]}
                  >
                    {team.total_points}
                  </ThemedText>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenScrollView>
  );
}
