import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { ScreenScrollView } from '@/components/ui/Screen';
import RallyeContextBar from '@/components/rallye/RallyeContextBar';
import type { Translator } from '@/utils/i18n';

type TeamRow = {
  id: string;
  name: string;
  created_at: string;
  play_time: string | null;
  total_points?: number;
  time_spent?: number | null;
  rank?: number;
  group_name?: string;
};

function formatOwnDuration(ms: number, t: Translator): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? t('scoreboard.durationHoursMinutes', { hours, minutes })
    : t('scoreboard.durationMinutes', { minutes });
}

const calculateDuration = (
  created_at: string,
  play_time: string | null
): number | null => {
  if (!play_time) return null;
  const start = new Date(created_at).getTime();
  const end = new Date(play_time).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  return end - start;
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
    (async () => {
      try {
        setLoadError(false);
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, created_at, play_time')
          .eq('rallye_id', rallyeId);
        if (teamsError) throw teamsError;
        const teamRows = (data || []) as TeamRow[];

        const teamIds = teamRows.map((t) => t.id);

        const { data: teamPoints, error: pointsError } = await supabase
          .from('team_answers')
          .select('team_id, team_points')
          .in('team_id', teamIds);
        if (pointsError) throw pointsError;

        const pointsByTeamId = new Map<TeamRow['id'], number>();
        for (const row of (teamPoints || []) as {
          team_id: TeamRow['id'];
          team_points: number;
        }[]) {
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
              time_spent: calculateDuration(t.created_at, t.play_time),
            }) as TeamRow
        );

        combined.sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0));

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

        setRows(combined);
      } catch (e) {
        console.error('Error loading scoreboard:', e);
        setRows([]);
        setLoadError(true);
      }
    })();
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
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenScrollView>
  );
}
