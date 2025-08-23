import { useState, useEffect } from 'react';
import { Text, View, Alert, useColorScheme } from 'react-native';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import UIButton from '@/ui/UIButton';
import { globalStyles } from '@/utils/GlobalStyles';
import { getCurrentTeam, createTeam } from '@/services/storage/teamStorage';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import generateTeamName from '@/utils/RandomTeamNames';

const TeamScreen = observer(function TeamScreen() {
  const [loading, setLoading] = useState(false);
  const rallye = store$.rallye.get();
  const team = store$.team.get();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

  useEffect(() => {
    if (!rallye) {
      router.replace('/');
      return;
    }

    const loadTeam = async () => {
      const localTeam = await getCurrentTeam(rallye.id);
      if (localTeam) {
        // Verify team still exists in database
        const { data: onlineTeam, error } = await supabase
          .from('rallye_team')
          .select('*')
          .eq('rallye_id', rallye.id)
          .eq('id', localTeam?.id)
          .single();

        if (localTeam && !error && onlineTeam) {
          store$.team.set(localTeam);
        } else {
          store$.team.set(null);
        }
      }
    };

    loadTeam();
  }, [rallye]);

  if (!rallye) {
    return (
      <View
        style={[
          globalStyles.default?.container || {},
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.default?.bigText || {},
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
        <UIButton 
          icon="arrow-left" 
          onPress={() => router.replace('/')}
          color={Colors.dhbwRed}
          disabled={false}
        >
          {language === 'de' ? 'Zurück zur Anmeldung' : 'Back to registration'}
        </UIButton>
      </View>
    );
  }

  function ShowTeam() {
    return (
      <View
        style={[
          globalStyles.teamStyles?.infoBox || {},
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.teamStyles?.message || {},
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de' ? 'Name deines Teams:' : 'Your team name:'}
        </Text>
        <Text
          style={[
            globalStyles.teamStyles?.teamName || {},
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {team?.name}
        </Text>
        <UIButton 
          onPress={() => router.push('/rally')}
          color={Colors.dhbwRed}
          disabled={false}
          icon="arrow-right"
        >
          {language === 'de' ? 'Gehe zur Rallye' : 'Go to rally'}
        </UIButton>
      </View>
    );
  }

  function BuildTeam() {
    async function handleCreateTeam() {
      if (!rallye) return;
      
      setLoading(true);
      const teamName = generateTeamName();

      try {
        const newTeam = await createTeam(teamName, rallye.id);
        if (newTeam) {
          store$.reset();
          store$.team.set(newTeam);
        } else {
          throw new Error('Team creation failed');
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
          globalStyles.teamStyles?.infoBox || {},
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.teamStyles?.message || {},
            {
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Bilde ein Team, um an der Rallye teilzunehmen.'
            : 'Create a team to participate in the rally.'}
        </Text>
        <UIButton 
          disabled={loading} 
          onPress={handleCreateTeam}
          color={Colors.dhbwRed}
          icon="users"
        >
          {language === 'de' ? 'Team bilden' : 'Create team'}
        </UIButton>
      </View>
    );
  }

  return (
    <View
      style={[
        globalStyles.default?.container || {},
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
    >
      <Text
        style={[
          globalStyles.teamStyles?.title || {},
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
          globalStyles.teamStyles?.container || {},
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        {team ? <ShowTeam /> : <BuildTeam />}
      </View>
    </View>
  );
});

export default TeamScreen;