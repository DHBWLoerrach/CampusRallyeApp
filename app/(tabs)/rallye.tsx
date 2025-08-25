import { useEffect, useState } from 'react';
import { Text, View, Button, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useSelector } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import { createTeam } from '@/services/storage/teamStorage';
import generateTeamName from '@/utils/RandomTeamNames';
import { useNavigation } from 'expo-router';

function TeamSetupScreen() {
  const rallye = useSelector(() => store$.rallye.get());
  const [teamName, setTeamName] = useState(generateTeamName());
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!rallye?.id) return;
    setSaving(true);
    const created = await createTeam(teamName, rallye.id);
    if (created) {
      store$.team.set(created);
    }
    setSaving(false);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>Team erstellen</Text>
      <TextInput
        value={teamName}
        onChangeText={setTeamName}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 8,
          width: '80%',
          marginBottom: 16,
          textAlign: 'center',
        }}
      />
      <Button
        title="Neuer Name"
        onPress={() => setTeamName(generateTeamName())}
        disabled={saving}
      />
      <View style={{ height: 16 }} />
      <Button title="Team speichern" onPress={handleCreate} disabled={saving} />
    </View>
  );
}

function PreparationScreen({ onRefresh }: { onRefresh: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ marginBottom: 16, fontSize: 18 }}>Rallye noch nicht gestartet</Text>
      <Button title="Aktualisieren" onPress={onRefresh} />
    </View>
  );
}

function RunningScreen() {
  const navigation = useNavigation();
  const rallye = useSelector(() => store$.rallye.get());
  const question = useSelector(() => store$.currentQuestion());
  const allAnswered = useSelector(() => store$.allQuestionsAnswered.get());
  const team = useSelector(() => store$.team.get());

  useEffect(() => {
    const loadQuestions = async () => {
      if (!rallye?.id) return;
      const { data: joinData } = await supabase
        .from('join_rallye_questions')
        .select('question_id')
        .eq('rallye_id', rallye.id);
      const ids = joinData?.map((r) => r.question_id) ?? [];
      if (ids.length === 0) return;
      const { data: questionsData } = await supabase
        .from('questions')
        .select('id, content')
        .in('id', ids);
      const mapped = (questionsData ?? []).map((q) => ({
        id: q.id,
        title: q.content,
      }));
      const randomized = mapped.sort(() => Math.random() - 0.5);
      store$.questions.set(randomized);
      store$.questionIndex.set(0);
      store$.allQuestionsAnswered.set(false);
    };
    if (!question) {
      loadQuestions();
    }
  }, [rallye?.id]);

  // Timer
  useEffect(() => {
    if (!rallye?.end_time) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        new Date(rallye.end_time).getTime() - Date.now()
      );
      const seconds = Math.floor(diff / 1000);
      const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      navigation.setOptions({ title: `${m}:${s}` });
    }, 1000);
    return () => clearInterval(interval);
  }, [rallye?.end_time, navigation]);

  if (allAnswered) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Alle Fragen beantwortet</Text>
        <View style={{ height: 16 }} />
        <Button
          title={rallye?.tour_mode ? 'Zurück zum Start' : 'Warten auf Auswertung'}
          onPress={() => {
            if (rallye?.tour_mode) {
              store$.enabled.set(false);
              store$.reset();
            }
          }}
        />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Keine Fragen verfügbar</Text>
      </View>
    );
  }

  const handleNext = async () => {
    if (team && question) {
      await supabase.from('team_questions').insert({
        team_id: team.id,
        question_id: question.id,
        points: 1,
      });
    }
    store$.points.set((p) => p + 1);
    store$.gotoNextQuestion();
  };

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <Text style={{ fontSize: 18, marginBottom: 16 }}>{question.title}</Text>
      <Button title="Weiter" onPress={handleNext} />
    </View>
  );
}

function PostProcessingScreen({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const [items, setItems] = useState<any[][]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!rallye?.id || !team?.id) return;
      const { data } = await supabase.rpc('get_voting_content', {
        rallye_id_param: rallye.id,
        own_team_id_param: team.id,
      });
      if (data) {
        const grouped: any[][] = [];
        let current = data[0]?.tq_question_id;
        let arr: any[] = [];
        data.forEach((d: any) => {
          if (d.tq_question_id !== current) {
            grouped.push(arr);
            arr = [];
            current = d.tq_question_id;
          }
          arr.push(d);
        });
        if (arr.length) grouped.push(arr);
        setItems(grouped);
      }
    };
    load();
  }, [rallye?.id, team?.id]);

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    await supabase.rpc('increment_team_question_points', {
      target_answer_id: selected.tq_id,
    });
    setSelected(null);
    setIndex((i) => i + 1);
    setLoading(false);
  };

  if (index >= items.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Abstimmung beendet</Text>
        <View style={{ height: 16 }} />
        <Button title="Aktualisieren" onPress={onRefresh} />
      </View>
    );
  }

  const current = items[index];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>
        {current[0]?.question_content}
      </Text>
      <FlatList
        data={current}
        keyExtractor={(item) => item.tq_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 12,
              borderWidth: selected?.tq_id === item.tq_id ? 2 : 1,
              borderColor:
                selected?.tq_id === item.tq_id ? '#e3001b' : 'lightgray',
              marginBottom: 12,
            }}
            onPress={() => setSelected(item)}
          >
            {item.question_type === 'photo' ? (
              <Text>{item.rt_team_name}</Text>
            ) : (
              <Text>{item.tq_team_answer}</Text>
            )}
          </TouchableOpacity>
        )}
      />
      <Button title="Abstimmen" onPress={submit} disabled={!selected || loading} />
    </View>
  );
}

function EndedScreen() {
  const rallye = useSelector(() => store$.rallye.get());
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!rallye?.id) return;
      const { data: teamData } = await supabase
        .from('rallye_team')
        .select('id,name')
        .eq('rallye_id', rallye.id);
      if (!teamData || teamData.length === 0) return;
      const { data: pointsData } = await supabase
        .from('team_questions')
        .select('team_id, points')
        .in('team_id', teamData.map((t) => t.id));
      const merged = teamData.map((t) => ({
        ...t,
        total: pointsData
          ?.filter((p) => p.team_id === t.id)
          .reduce((acc, cur) => acc + cur.points, 0) ?? 0,
      }));
      merged.sort((a, b) => b.total - a.total);
      setTeams(merged);
    };
    load();
  }, [rallye?.id]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 16 }}>
        Rangliste
      </Text>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: '#eee',
            }}
          >
            <Text>
              {index + 1}. {item.name}
            </Text>
            <Text>{item.total}</Text>
          </View>
        )}
      />
      <Button
        title="Beenden"
        onPress={() => {
          store$.enabled.set(false);
          store$.reset();
        }}
      />
    </View>
  );
}

export default function Rallye() {
  const rallye = useSelector(() => store$.rallye.get());
  const team = useSelector(() => store$.team.get());
  const [loading, setLoading] = useState(false);

  const refreshStatus = async () => {
    if (!rallye?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('rallye')
      .select('status')
      .eq('id', rallye.id)
      .single();
    if (data) {
      store$.rallye.status.set(data.status);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  if (!rallye) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Keine Rallye ausgewählt</Text>
      </View>
    );
  }

  if (!team && !rallye.tour_mode) {
    return <TeamSetupScreen />;
  }

  const status = rallye.status;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Lade...</Text>
      </View>
    );
  }

  switch (status) {
    case 'preparation':
      return <PreparationScreen onRefresh={refreshStatus} />;
    case 'running':
      return <RunningScreen />;
    case 'post_processing':
      return <PostProcessingScreen onRefresh={refreshStatus} />;
    case 'ended':
      return <EndedScreen />;
    default:
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Unbekannter Status: {status}</Text>
        </View>
      );
  }
}

