import { RefreshControl, ScrollView, Text, View } from 'react-native';
import VotingScreen from './VotingScreen';
import Scoreboard from './ScoreboardScreen';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/GlobalStyles';
import { store$ } from '../utils/Store';

export const PreparationState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.default.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <Text style={[globalStyles.default.bigText, { marginBottom: 20 }]}>
      Die Rallye hat noch nicht begonnen.
    </Text>
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
  <View style={globalStyles.default.container}>
    <Text style={globalStyles.default.bigText}>
      Bitte bilde zuerst ein Team.
    </Text>
  </View>
);

export const NoQuestionsAvailableState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.default.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <Text style={[globalStyles.default.bigText, { marginBottom: 20 }]}>
      Es sind keine Fragen verfügbar.
    </Text>
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

export const TimeExpiredState = ({
  loading,
  onRefresh,
  teamName,
  points,
}) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.default.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <Text style={[globalStyles.default.bigText, { marginBottom: 8 }]}>
      Die Zeit für die Rallye ist abgelaufen.
    </Text>
    <ResultText points={points} teamName={teamName} />
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
      globalStyles.default.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <View>
      <Text style={[globalStyles.default.bigText, { marginBottom: 8 }]}>
        Ihr habt alle Fragen beantwortet, Glückwunsch!
      </Text>
      <ResultText points={points} teamName={teamName} />
    </View>
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
