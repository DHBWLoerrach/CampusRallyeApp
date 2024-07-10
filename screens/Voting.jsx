import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../utils/Supabase';
import { useSharedStates } from '../utils/SharedStates';
import UIButton from '../ui/UIButton';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/Styles';

export default function VotingScreen() {
  const { groups, group } = useSharedStates();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [voting, setVoting] = useState([]);
  const [currentVoting, setCurrentVoting] = useState(0);
  const [sendingResult, setSendingResult] = useState(false);

  useEffect(() => {
    const fetchDataSupabase = async () => {
      const { data: vote } = await supabase.rpc(
        'get_unvoted_questions',
        {
          input_group_id: group,
        }
      );
      if (vote !== null) {
        setVoting(vote);
      }
    };
    fetchDataSupabase();
  }, []);

  const handleNextQuestion = async () => {
    setSendingResult(true);
    await supabase.from('question_voting').insert([
      {
        question_id: voting[currentVoting]?.id,
        group_id: group,
        voted_group_id: selectedGroup,
      },
    ]);
    setCurrentVoting(currentVoting + 1);
    setSelectedGroup(null);
    setSendingResult(false);
  };

  if (groups.length < 2 || !voting[currentVoting]) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.bigText}>
          Die Abstimmung wurde beendet.
        </Text>
        <Text style={globalStyles.bigText}>
          Lade diese Seite neu, um das Ergebnis zu sehen, nachdem die
          Rallye beendet wurde.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.main}>
      <Text style={[styles.text, { fontStyle: 'italic' }]}>
        {voting[currentVoting]?.question}
      </Text>
      <Text
        style={[
          styles.text,
          {
            margin: 20,
            color: Colors.dhbwRed,
          },
        ]}
      >
        Gebt der Gruppe einen zusätzlichen Punkt, die eurer Meinung
        nach die oben gestellte Aufgabe am besten gelöst hat.
      </Text>
      {groups
        ?.filter((item) => item.id !== group)
        .map((item, index) => (
          <View
            key={index}
            style={[
              globalStyles.section,
              {
                borderColor:
                  selectedGroup === item.id
                    ? Colors.dhbwRed
                    : 'white',
              },
            ]}
          >
            <View style={styles.row}>
              <Text style={styles.label}>Name der Gruppe:</Text>
              <Text style={styles.value}>{item.name}</Text>
            </View>
            <UIButton
              color={Colors.dhbwGray}
              outline={true}
              onPress={() => setSelectedGroup(item.id)}
            >
              Punkt vergeben
            </UIButton>
          </View>
        ))}
      <UIButton
        color={selectedGroup ? Colors.dhbwRed : Colors.dhbwLightGray}
        disabled={!selectedGroup || sendingResult}
        onPress={handleNextQuestion}
      >
        Nächste Abstimmung
      </UIButton>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: Colors.dhbwGray,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: Colors.dhbwGray,
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
