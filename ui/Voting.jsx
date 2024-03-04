import { View, Text, ScrollView, StyleSheet } from 'react-native';
import UIButton from '../ui/UIButton';
import { useSharedStates } from '../utils/SharedStates';
import Colors from '../utils/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/Supabase';
import { getData, storeData } from '../utils/LocalStorage';

export default function VotingScreen() {
  const {
    groups,
    setGroups,
    group,
    setGroup,
    questions,
    currentQuestion,
    points,
    rallye,
    useRallye,
    setEnabled,
  } = useSharedStates();
  const [loading, setLoading] = useState(true);
  const [selectionMade, setSelectionMade] = useState(false);

  useEffect(() => {
    const fetchDataSupabase = async () => {
      const { data: groups } = await supabase
        .from('rallye_group')
        .select('*')
        .eq('rallye_id', rallye.id)
        .order('id', { ascending: false });
      setGroups(groups);
      setLoading(false);
    };
    fetchDataSupabase();
  }, []);

  return (
    <ScrollView>
      {groups?.filter(item => item.id !== group).map((item, index) => (
        <View
          key={index}
          style={[
            styles.section,
            {
              borderColor:
                item.id === group ? Colors.dhbwRed : 'white',
            },
          ]}
        >
          <UIButton
            size="small"
            color="grey"
            outline={true}
            onClick={async () => {
              setGroup(item.id);
              setSelectionMade(true);
              await supabase
                .from('rallye_group')
                .update({ used: true })
                .eq('id', item.id);
              await storeData('group_key', item.id);
            }}
            disabled={selectionMade}
          >
            Auswählen
          </UIButton>
        </View>
      ))}
    </ScrollView>
  );
}
