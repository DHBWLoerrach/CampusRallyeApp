import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
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
  const ourTeam = useSelector(() => store$.team.get());
  const [rows, setRows] = useState<TeamRow[]>([]);
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const s = useAppStyles();

  useEffect(() => {
    if (!rallye || rallye.status !== 'ended') return;
    (async () => {
      try {
        let { data } = await supabase
          .from('rallye_team')
          .select('id, name, created_at, time_played')
          .eq('rallye_id', rallye.id);
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
  }, [rallye?.id, rallye?.status]);

  return (
    <ScreenScrollView
      padding="none"
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
    >
      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
          Punktestand
        </ThemedText>
        {ourTeam ? (
          <ThemedText
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              { marginTop: 10 },
            ]}
          >
            Dein Team: {ourTeam.name}
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
            backgroundColor: isDarkMode
              ? palette.scheduleHeader
              : Colors.veryLightGray,
          }}
        >
          <ThemedText style={[globalStyles.scoreboardStyles.headerCellRank]}>
            Platz
          </ThemedText>
          <ThemedText style={[globalStyles.scoreboardStyles.headerCellTeam]}>
            Team
          </ThemedText>
          <ThemedText style={[globalStyles.scoreboardStyles.headerCellTime]}>
            Zeit
          </ThemedText>
          <ThemedText style={[globalStyles.scoreboardStyles.headerCellPoints]}>
            Punkte
          </ThemedText>
        </View>

        <ScrollView
          style={[
            { maxHeight: 300 },
            {
              backgroundColor: isDarkMode
                ? palette.scheduleHeader
                : Colors.veryLightGray,
            },
          ]}
        >
          {rows.map((team) => (
            <View
              key={team.id}
              style={[
                globalStyles.scoreboardStyles.row,
                s.listRow,
                team.group_name === ourTeam?.name &&
                  globalStyles.scoreboardStyles.rowHighlighted,
              ]}
            >
              <ThemedText style={[globalStyles.scoreboardStyles.cellRank]}>
                {team.rank}
              </ThemedText>
              <ThemedText
                style={[
                  globalStyles.scoreboardStyles.cellTeam,
                  team.group_name === ourTeam?.name &&
                    globalStyles.scoreboardStyles.cellHighlighted,
                  {
                    color:
                      team.group_name === ourTeam?.name
                        ? Colors.dhbwRed
                        : Colors.dhbwGray,
                  },
                ]}
              >
                {team.group_name}
              </ThemedText>
              <ThemedText style={[globalStyles.scoreboardStyles.cellTime]}>
                {formatDuration(team.time_spent)}
              </ThemedText>
              <ThemedText style={[globalStyles.scoreboardStyles.cellPoints]}>
                {team.total_points}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <UIButton
          icon="arrow-left"
          onPress={async () => {
            Alert.alert(
              'Teilnahme an der Rallye beenden',
              'Möchtest du die Teilnahme an der Rallye wirklich beenden? Die Teamzuordnung auf diesem Gerät wird gelöscht.',
              [
                { text: 'Abbrechen', style: 'cancel' },
                {
                  text: 'Beenden',
                  style: 'destructive',
                  onPress: async () => {
                    void store$.leaveRallye();
                  },
                },
              ]
            );
          }}
        >
          Teilnahme an Rallye beenden
        </UIButton>
      </View>
    </ScreenScrollView>
  );
}
