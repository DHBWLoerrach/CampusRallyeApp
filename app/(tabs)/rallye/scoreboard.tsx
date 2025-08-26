import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/components/ui/UIButton';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';

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

export default function Scoreboard() {
  const rallye = useSelector(() => store$.rallye.get());
  const ourTeam = useSelector(() => store$.team.get());
  const [rows, setRows] = useState<TeamRow[]>([]);
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

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
          .in('team_id', teamRows.map((t) => t.id));
        if (error) throw error;

        let combined = teamRows.map((t) => {
          const pts = (teamPoints || []).filter((p: any) => p.team_id === t.id);
          const total_points = pts.reduce((acc: number, cur: any) => acc + cur.points, 0);
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

        let rank = 1;
        let prevPts = combined[0]?.total_points;
        combined = combined.map((t, i) => {
          if (i > 0 && t.total_points !== prevPts) rank = i + 1;
          prevPts = t.total_points;
          return { ...t, rank, group_name: t.name };
        });

        setRows(combined);
      } catch (e) {
        console.error('Error loading scoreboard:', e);
      }
    })();
  }, [rallye?.id, rallye?.status]);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        { backgroundColor: palette.background },
      ]}
    >
      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: palette.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: palette.text }]}>Punktestand</Text>
        {ourTeam ? (
          <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10, color: palette.text }]}>
            Dein Team: {ourTeam.name}
          </Text>
        ) : null}
      </View>

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { padding: 0, backgroundColor: palette.card }]}>
        <View
          style={{
            flexDirection: 'row',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: palette.cellBorder,
            backgroundColor: isDarkMode ? palette.scheduleHeader : Colors.veryLightGray,
          }}
        >
          <Text style={[globalStyles.scoreboardStyles.headerCell, { color: palette.text }]}>Platz</Text>
          <Text style={[globalStyles.scoreboardStyles.headerCellWide, { color: palette.text }]}>Team</Text>
          <Text style={[globalStyles.scoreboardStyles.headerCell, { color: palette.text }]}>Punkte</Text>
        </View>

        <ScrollView style={[{ maxHeight: 300 }, { backgroundColor: isDarkMode ? palette.scheduleHeader : Colors.veryLightGray }]}>
          {rows.map((team) => (
            <View
              key={team.id}
              style={[
                globalStyles.scoreboardStyles.row,
                team.group_name === ourTeam?.name && globalStyles.scoreboardStyles.rowHighlighted,
                { backgroundColor: palette.card, borderBottomColor: palette.cellBorder },
              ]}
            >
              <Text style={[globalStyles.scoreboardStyles.cell, { color: palette.text }]}>{team.rank}</Text>
              <Text
                style={[
                  globalStyles.scoreboardStyles.cellWide,
                  team.group_name === ourTeam?.name && globalStyles.scoreboardStyles.cellHighlighted,
                  { color: team.group_name === ourTeam?.name ? Colors.dhbwRed : palette.text },
                ]}
              >
                {team.group_name}
              </Text>
              <Text style={[globalStyles.scoreboardStyles.cell, { color: palette.text }]}>{team.total_points}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: palette.card }]}>
        <UIButton icon="arrow-left" onPress={() => store$.enabled.set(false)}>
          Rallye beenden
        </UIButton>
      </View>
    </ScrollView>
  );
}
