import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
} from 'react-native';
import UIButton from '../ui/UIButton';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/Supabase';

export default function VotingScreen() {
  const { groups, group } = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [selectionMade, setSelectionMade] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [voting, setVoting] = useState([]);
  const [currentVoting, setCurrentVoting] = useState(0);
  const [disabledGroups, setDisabledGroups] = useState([]);
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
      setLoading(false);
    };
    fetchDataSupabase();
  }, []);

  const handleNextQuestion = async () => {
    setSendingResult(true);
    for (let vote of selectedGroups) {
      await supabase.from('question_voting').insert([
        {
          question_id: voting[currentVoting]?.id,
          group_id: group,
          voted_group_id: vote.id,
        },
      ]);
    }

    setCurrentVoting(currentVoting + 1);
    setSelectedGroups([]);
    setDisabledGroups([]);
    setSelectionMade(false);
    setSendingResult(false);
  };

  if (!voting[currentVoting]) {
    return (
      <View style={styles.deactivatedContainer}>
        <Text style={styles.Text}>Voting wurde beendet</Text>
      </View>
    );
  } else {
    return (
      <ScrollView style={styles.main}>
        <View>
          <Text style={styles.Text}>
            {voting[currentVoting]?.question}
          </Text>
        </View>
        {groups
          ?.filter((item) => item.id !== group)
          .map((item, index) => (
            <View
              key={index}
              style={[
                styles.section,
                {
                  borderColor: disabledGroups.includes(item.id)
                    ? 'red'
                    : 'white',
                },
              ]}
            >
              <View style={styles.row}>
                <Text style={styles.label}>Name der Gruppe:</Text>
                <Text style={styles.value}>{item.name}</Text>
              </View>
              <UIButton
                size="small"
                color="grey"
                outline={true}
                onClick={async () => {
                  if (groups.length === 1) {
                    setSelectionMade(true);
                  }
                  if (groups.length > 3) {
                    if (!selectionMade) {
                      setSelectedGroups([...selectedGroups, item]);
                      setDisabledGroups([...disabledGroups, item.id]);
                      if (
                        groups.length - 4 ===
                        selectedGroups.length
                      ) {
                        setSelectionMade(true);
                      }
                    }
                  } else {
                    if (!selectionMade) {
                      setSelectedGroups([...selectedGroups, item.id]);
                      if (
                        groups.length - 1 ===
                        selectedGroups.length
                      ) {
                        setSelectionMade(true);
                      }
                    }
                  }
                }}
                disabled={
                  selectionMade || disabledGroups.includes(item.id)
                }
              >
                Punkt vergeben
              </UIButton>
            </View>
          ))}
        <View
          style={
            !selectionMade || sendingResult
              ? styles.buttonContainerDeactive
              : styles.buttonContainer
          }
        >
          <Button
            style={styles.button}
            title="Nächste Abstimmung"
            onPress={handleNextQuestion}
            disabled={!selectionMade || sendingResult}
          />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: 'grey',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    padding: 10,
  },
  buttonContainer: {
    backgroundColor: Colors.dhbwRed,
    margin: 6,
    borderRadius: 5,
  },
  buttonContainerDeactive: {
    backgroundColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5,
  },
  blueButtonContainer: {
    backgroundColor: Colors.lightBlue,
    margin: 6,
    borderRadius: 5,
  },
  Text: {
    fontSize: 20,
    color: 'grey',
    textAlign: 'center',
  },
  deactivatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
