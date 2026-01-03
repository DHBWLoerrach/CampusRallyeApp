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
  time_spent?: number;
  rank?: number;
  group_name?: string;
};

// Hilfsfunktion zum Formatieren der Zeit (ms -> MM:SS oder HH:MM:SS)
function formatDuration(ms?: number) {
  if (!ms) return '-';
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
    if (!rallyeId || rallyeStatus !== 'ended') return;
    (async () => {
      try {
        let { data } = await supabase
          .from('rallye_team')
          .select('id, name, created_at, time_played')
          .eq('rallye_id', rallyeId);
        const teamRows = (data || []) as TeamRow[];

        const { data: teamPoints, error } = await supabase
          .from('team_questions')
          .select('team_id, points')
          .in(
            'team_id',
            teamRows.map((t) => t.id)
          );
        if (error) throw error;

        let combined = teamRows.map((t) => {
          const pts = (teamPoints || []).filter((p: any) => p.team_id === t.id);
          const total_points = pts.reduce(
            (acc: number, cur: any) => acc + cur.points,
            0
          );
          const start = new Date(t.created_at).getTime();
          const end = t.time_played ? new Date(t.time_played).getTime() : start;
          const time_spent = Math.max(0, end - start);
          return { ...t, total_points, time_spent } as TeamRow;
        });

        combined.sort((a, b) =>
          b.total_points! !== a.total_points!
            ? b.total_points! - a.total_points!
            : a.time_spent! - b.time_spent!
        );

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
      ]}
    >
      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <ThemedText
          variant="title"
          style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
        >
          {t('scoreboard.title')}
        </ThemedText>
        {ourTeam ? (
          <ThemedText
            variant="body"
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              s.muted,
              { marginTop: 10 },
            ]}
          >
            {t('scoreboard.yourTeam', { team: ourTeam.name })}
          </ThemedText>
        ) : null}
      </View>

      <View
        style={[
          globalStyles.rallyeStatesStyles.infoBox,
          { padding: 0 },
          s.infoBox,
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: palette.cellBorder,
            backgroundColor: palette.surface2,
          }}
        >
          <ThemedText
            style={[globalStyles.scoreboardStyles.headerCell, s.text]}
          >
            {t('scoreboard.rank')}
          </ThemedText>
          <ThemedText
            style={[globalStyles.scoreboardStyles.headerCellWide, s.text]}
          >
            {t('scoreboard.team')}
          </ThemedText>
          <ThemedText
            style={[globalStyles.scoreboardStyles.headerCell, s.text]}
          >
            {t('scoreboard.points')}
          </ThemedText>
        </View>

        <ScrollView
          style={[
            { maxHeight: 300 },
            {
              backgroundColor: palette.surface1,
            },
          ]}
        >
          {rows.map((team) => {
            const rowLabel = t('scoreboard.rowLabel', {
              rank: team.rank ?? '-',
              team: team.group_name ?? '-',
              time: formatDuration(team.time_spent),
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
                  team.id === String(ourTeam?.id) && {
                    backgroundColor: palette.surface2,
                  },
                ]}
              >
                <ThemedText
                  style={[globalStyles.scoreboardStyles.cell, s.text]}
                >
                  {team.rank}
                </ThemedText>
                <ThemedText
                  style={[
                    globalStyles.scoreboardStyles.cellWide,
                    s.text,
                    team.id === String(ourTeam?.id) &&
                      globalStyles.scoreboardStyles.cellHighlighted,
                    {
                      color:
                        team.id === String(ourTeam?.id)
                          ? Colors.dhbwRed
                          : Colors.dhbwGray,
                    },
                  ]}
                >
                  {team.group_name}
                </ThemedText>

                <ThemedText
                  style={[globalStyles.scoreboardStyles.cell, s.text]}
                >
                  {team.total_points}
                  {'\n'}
                  <ThemedText style={[s.muted, { fontSize: 12 }]}>
                    {formatDuration(team.time_spent)}
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
