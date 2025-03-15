import { useState, useEffect, useContext } from 'react';
import { Text, View, Alert } from 'react-native';
import { observer } from '@legendapp/state/react';
import { store$ } from '../services/storage/Store';
import { supabase } from '../utils/Supabase';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';
import generateTeamName from '../utils/RandomTeamNames';
import { getCurrentTeam, setCurrentTeam } from '../services/storage';
import { ThemeContext } from '../utils/ThemeContext';
import Colors from '../utils/Colors';
import { useLanguage } from '../utils/LanguageContext';

const TeamScreen = observer(function TeamScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage();
  useEffect(() => {
    if (!rallye) return;

    const loadTeam = async () => {
      const localTeam = await getCurrentTeam(rallye.id);
      const { data: onlineTeam, error: teamError } = await supabase
        .from('rallye_team')
        .select('*')
        .eq('rallye_id', rallye.id)
        .eq('id', localTeam?.id)
        .single();

      if (localTeam && !teamError) {
        store$.team.set(localTeam);
      } else {
        store$.team.set(null);
      }
    };

    loadTeam();
  }, [rallye]);

  if (!rallye) {
    return (
      <View
        style={[
          globalStyles.default.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.default.bigText,
            {
              marginBottom: 10,
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Du nimmst gerade nicht an einer Rallye teil.'
            : 'You are not currently participating in a rally.'}
        </Text>
        <UIButton icon="arrow-left" onPress={() => store$.enabled.set(false)}>
          {language === 'de' ? 'Zurück zur Anmeldung' : 'Back to registration'}
        </UIButton>
      </View>
    );
  }

  function ShowTeam({ gotoRallye }) {
    return (
      <View
        style={[
          globalStyles.teamStyles.infoBox,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.teamStyles.message,
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de' ? 'Name deines Teams:' : 'Your team name:'}
        </Text>
        <Text
          style={[
            globalStyles.teamStyles.teamName,
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {team.name}
        </Text>
        <UIButton onPress={gotoRallye}>
          {language === 'de' ? 'Gehe zur Rallye' : 'Go to rally'}
        </UIButton>
      </View>
    );
  }

  function BuildTeam() {
    async function createTeam() {
      setLoading(true);
      const teamName = generateTeamName();

      try {
        const { data, error } = await supabase
          .from('rallye_team')
          .insert({
            name: teamName,
            rallye_id: rallye.id,
          })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          store$.reset();
          store$.team.set(data[0]);
          await setCurrentTeam(rallye.id, data[0]);
        } else {
          throw new Error('No data returned from database');
        }
      } catch (err) {
        console.error('Error creating team:', err);
        Alert.alert(
          language === 'de' ? 'Fehler' : 'Error',
          language === 'de'
            ? 'Team konnte nicht erstellt werden. Bitte erneut versuchen.'
            : 'Team could not be created. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    return (
      <View
        style={[
          globalStyles.teamStyles.infoBox,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.teamStyles.message,
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Bilde ein Team, um an der Rallye teilzunehmen.'
            : 'Create a team to participate in the rally.'}
        </Text>
        <UIButton disabled={loading} onPress={createTeam}>
          {language === 'de' ? 'Team bilden' : 'Create team'}
        </UIButton>
      </View>
    );
  }

  return (
    <View
      style={[
        globalStyles.default.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <Text
        style={[
          globalStyles.teamStyles.title,
          {
            color: isDarkMode
              ? Colors.darkMode.text
              : Colors.lightMode.dhbwGray,
          },
        ]}
      >
        {rallye.name}
      </Text>
      <View
        style={[
          globalStyles.teamStyles.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        {team ? (
          <ShowTeam gotoRallye={() => navigation.navigate('rallye')} />
        ) : (
          <BuildTeam />
        )}
      </View>
    </View>
  );
});

export default TeamScreen;
