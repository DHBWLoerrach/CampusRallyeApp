import { RefreshControl, ScrollView, Text, View } from 'react-native';
import VotingScreen from './VotingScreen';
import Scoreboard from './ScoreboardScreen';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';
import { store$ } from '../utils/Store';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Colors from '../utils/Colors';

export const PreparationState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
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

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
        Die Rallye hat noch nicht begonnen
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
        Bitte warte auf den Start der Rallye
      </Text>
    </View>

    <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
      Aktualisieren
    </UIButton>
  </ScrollView>
);

export const PostProcessingState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={globalStyles.default.refreshContainer}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <VotingScreen onRefresh={onRefresh} loading={loading} />
  </ScrollView>
);

export const EndedState = () => <Scoreboard />;

export const TeamNotSelectedState = () => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
  >
    <FontAwesome
      name="users"
      size={80}
      color={Colors.dhbwRed}
      style={globalStyles.rallyeStatesStyles.successIcon}
    />

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
        Kein Team ausgewählt
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
        Bitte bilde zuerst ein Team
      </Text>
    </View>
  </ScrollView>
);

export const NoQuestionsAvailableState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
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

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
        Keine Fragen verfügbar
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
        Momentan sind keine Fragen zum Beantworten verfügbar
      </Text>
    </View>

    <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
      Aktualisieren
    </UIButton>
  </ScrollView>
);

export const ExplorationFinishedState = ({
  goBackToLogin,
  points,
}) => (
  <View style={globalStyles.default.container}>
    <Text style={globalStyles.default.bigText}>
      Alle Fragen wurden beantwortet.
    </Text>
    <Text style={[globalStyles.default.bigText, { marginBottom: 10 }]}>
      Erreichte Punktzahl: {points}
    </Text>
    <UIButton icon="arrow-left" onPress={goBackToLogin}>
      Zurück zur Anmeldung
    </UIButton>
  </View>
);

export const TimeExpiredState = ({loading, onRefresh, teamName, points}) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
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

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
        Zeit abgelaufen
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
        Die Zeit für die Rallye ist abgelaufen
      </Text>
    </View>

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.pointsTitle}>
        Team: {teamName}
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.pointsValue}>
        {points} Punkte
      </Text>
    </View>

    <Text style={globalStyles.rallyeStatesStyles.footer}>
      Wartet bis die Rallye beendet wird, um das Ergebnis zu sehen.{'\n'}
      Geht zum vereinbarten Treffpunkt.
    </Text>
  </ScrollView>
);

export const AllQuestionsAnsweredState = ({
  loading,
  onRefresh,
  points,
  teamName,
}) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
    ]}
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

    <Text style={globalStyles.rallyeStatesStyles.title}>Glückwunsch!</Text>

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.infoTitle}>
        Alle Fragen beantwortet
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.infoSubtitle}>
        Team: {teamName}
      </Text>
    </View>

    <View style={globalStyles.rallyeStatesStyles.infoBox}>
      <Text style={globalStyles.rallyeStatesStyles.pointsTitle}>
        Erreichte Punkte
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.pointsValue}>{points}</Text>
    </View>

    <Text style={globalStyles.rallyeStatesStyles.footer}>
      Wartet auf die Beendigung der Rallye{"\n"}
      und geht zum vereinbarten Treffpunkt.
    </Text>
  </ScrollView>
);

function ResultText({ teamName, points }) {
  return (
    <>
      <Text style={[globalStyles.default.bigText, { marginBottom: 8 }]}>
        Wartet bis die Rallye beendet wird, um das Ergebnis zu sehen.
      </Text>
      <Text style={[globalStyles.default.bigText, { marginBottom: 8 }]}>
        Euer Team {teamName} hat {points} Punkte erreicht.
      </Text>
      <Text style={globalStyles.default.bigText}>
        Geht zu eurem vereinbarten Treffpunkt. {"\n\n"}
      </Text>
    </>
  );
}
