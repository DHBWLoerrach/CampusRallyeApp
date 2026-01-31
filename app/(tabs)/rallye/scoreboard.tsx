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

type TeamRow = {
  id: string;
  name: string;
  created_at: string;
  time_played: string | null;
  total_points?: number;
  time_spent?: number | null;
  rank?: number;
  group_name?: string;
};

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

const calculateDuration = (
  created_at: string,
  time_played: string | null
): number | null => {
  if (!time_played) return null;
  const start = new Date(created_at).getTime();
  const end = new Date(time_played).getTime();
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
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const s = useAppStyles();
  const { t } = useLanguage();

  useEffect(() => {
    if (
      !rallyeId ||
      (rallyeStatus !== 'ranking' && rallyeStatus !== 'ended')
    )
      return;
    (async () => {
      try {
        let { data } = await supabase
          .from('rallye_team')
          .select('id, name, created_at, time_played')
          .eq('rallye_id', rallyeId);
        const teamRows = (data || []) as TeamRow[];

        const teamIds = teamRows.map((t) => t.id);

        const { data: teamPoints, error } = await supabase
          .from('team_questions')
          .select('team_id, points')
          .in('team_id', teamIds);
        if (error) throw error;

        let combined = teamRows.map((t) => {
          const pts = (teamPoints || []).filter((p: any) => p.team_id === t.id);
          const total_points = pts.reduce(
            (acc: number, cur: any) => acc + cur.points,
            0
          );
          const time_spent = calculateDuration(t.created_at, t.time_played);
          return { ...t, total_points, time_spent } as TeamRow;
        });

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

        setRows(combined);
      } catch (e) {
        console.error('Error loading scoreboard:', e);
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
          {ourTeam ? (
            <ThemedText
              variant="body"
              style={[
                globalStyles.rallyeStatesStyles.infoSubtitle,
                s.muted,
                { marginTop: 10 },
              ]}
            >
              {t('scoreboard.yourTeamLabel')}{' '}
              <ThemedText variant="accent" style={{ fontWeight: '700' }}>
                {ourTeam.name}
              </ThemedText>
            </ThemedText>
          ) : null}
        </View>

        <ScrollView style={{ backgroundColor: palette.surface1 }}>
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
            const highlightAccent = isDarkMode
              ? 'rgba(226, 0, 26, 0.35)'
              : Colors.dhbwRed;
            const highlightBackground = isDarkMode
              ? 'rgba(226, 0, 26, 0.03)'
              : 'rgba(226, 0, 26, 0.025)';
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
                    isOurTeam && globalStyles.scoreboardStyles.cellHighlighted,
                  ]}
                >
                  {team.group_name}
                </ThemedText>

                <ThemedText
                  style={[
                    globalStyles.scoreboardStyles.cell,
                    s.text,
                    isOurTeam && globalStyles.scoreboardStyles.cellHighlighted,
                    isOurTeam && { fontWeight: '700' },
                  ]}
                >
                  {team.total_points}
                  {'\n'}
                  <ThemedText style={[s.muted, { fontSize: 12, opacity: 0.7 }]}>
                    ({formatDuration(team.time_spent)})
                  </ThemedText>
                </ThemedText>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScreenScrollView>
  );
}
