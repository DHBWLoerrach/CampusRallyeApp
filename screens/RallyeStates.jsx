import { RefreshControl, ScrollView, Text, View } from 'react-native';
import VotingScreen from './VotingScreen';
import Scoreboard from './ScoreboardScreen';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';
import { store$ } from '../services/storage/Store';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Colors from '../utils/Colors';
import { useContext } from 'react';
import { ThemeContext } from '../utils/ThemeContext';

export const PreparationState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <FontAwesome
        name="clock-o"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Die Rallye hat noch nicht begonnen
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Bitte warte auf den Start der Rallye
        </Text>
      </View>

      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        Aktualisieren
      </UIButton>
    </ScrollView>
  );
};

export const PostProcessingState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={globalStyles.default.refreshContainer}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <VotingScreen onRefresh={onRefresh} loading={loading} />
    </ScrollView>
  );
};

export const EndedState = () => <Scoreboard />;

export const TeamNotSelectedState = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
    >
      <FontAwesome
        name="users"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Kein Team ausgewählt
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Bitte bilde zuerst ein Team
        </Text>
      </View>
    </ScrollView>
  );
};

export const NoQuestionsAvailableState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <FontAwesome
        name="exclamation-circle"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Keine Fragen verfügbar
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Momentan sind keine Fragen zum Beantworten verfügbar
        </Text>
      </View>

      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        Aktualisieren
      </UIButton>
    </ScrollView>
  );
};

export const ExplorationFinishedState = ({
  goBackToLogin,
  points,
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <View style={[
      globalStyles.default.container,
      { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
    ]}>
      <Text style={[
        globalStyles.default.bigText,
        { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Alle Fragen wurden beantwortet.
      </Text>
      <Text style={[
        globalStyles.default.bigText,
        { marginBottom: 10, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Erreichte Punktzahl: {points}
      </Text>
      <UIButton icon="arrow-left" onPress={goBackToLogin}>
        Zurück zur Anmeldung
      </UIButton>
    </View>
  );
};

export const TimeExpiredState = ({loading, onRefresh, teamName, points}) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <FontAwesome
        name="hourglass-end"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Zeit abgelaufen
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Die Zeit für die Rallye ist abgelaufen
        </Text>
      </View>

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.pointsTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Team: {teamName}
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.pointsValue,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          {points} Punkte
        </Text>
      </View>

      <Text style={[
        globalStyles.rallyeStatesStyles.footer,
        { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Wartet bis die Rallye beendet wird, um das Ergebnis zu sehen.{'\n'}
        Geht zum vereinbarten Treffpunkt.
      </Text>
    </ScrollView>
  );
};

export const AllQuestionsAnsweredState = ({
  loading,
  onRefresh,
  points,
  teamName,
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <FontAwesome
        name="trophy"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <Text style={[
        globalStyles.rallyeStatesStyles.title,
        { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Glückwunsch!
      </Text>

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Alle Fragen beantwortet
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Team: {teamName}
        </Text>
      </View>

      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Text style={[
          globalStyles.rallyeStatesStyles.pointsTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          Erreichte Punkte
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.pointsValue,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
        ]}>
          {points}
        </Text>
      </View>

      <Text style={[
        globalStyles.rallyeStatesStyles.footer,
        { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Wartet auf die Beendigung der Rallye{"\n"}
        und geht zum vereinbarten Treffpunkt.
      </Text>
    </ScrollView>
  );
};

function ResultText({ teamName, points }) {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <>
      <Text style={[
        globalStyles.default.bigText,
        { marginBottom: 8, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Wartet bis die Rallye beendet wird, um das Ergebnis zu sehen.
      </Text>
      <Text style={[
        globalStyles.default.bigText,
        { marginBottom: 8, color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Euer Team {teamName} hat {points} Punkte erreicht.
      </Text>
      <Text style={[
        globalStyles.default.bigText,
        { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
      ]}>
        Geht zu eurem vereinbarten Treffpunkt. {"\n\n"}
      </Text>
    </>
  );
}
