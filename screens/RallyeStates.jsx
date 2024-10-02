import { RefreshControl, ScrollView, Text, View } from 'react-native';
import VotingScreen from './VotingScreen';
import Scoreboard from './ScoreboardScreen';
import UIButton from '../ui/UIButton';
import { globalStyles } from '../utils/Styles';

export const PreparationState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.refreshContainer,
      globalStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <Text style={[globalStyles.bigText, { marginBottom: 20 }]}>
      Die Rallye hat noch nicht begonnen.
    </Text>
    <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
      Aktualisieren
    </UIButton>
  </ScrollView>
);

export const PostProcessingState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={globalStyles.refreshContainer}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <VotingScreen onRefresh={onRefresh} loading={loading} />
  </ScrollView>
);

export const EndedState = () => <Scoreboard />;

export const TeamNotSelectedState = () => (
  <View style={globalStyles.container}>
    <Text style={globalStyles.bigText}>
      Bitte bilde zuerst ein Team.
    </Text>
  </View>
);

export const NoQuestionsAvailableState = ({ loading, onRefresh }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.refreshContainer,
      globalStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <Text style={[globalStyles.bigText, { marginBottom: 20 }]}>
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
  <View style={globalStyles.container}>
    <Text style={globalStyles.bigText}>
      Alle Fragen wurden beantwortet.
    </Text>
    <Text style={[globalStyles.bigText, { marginBottom: 10 }]}>
      Erreichte Punktzahl: {points}
    </Text>
    <UIButton icon="arrow-left" onPress={goBackToLogin}>
      Zurück zur Anmeldung
    </UIButton>
  </View>
);

export const TimeExpiredState = ({ loading, onRefresh, points }) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.refreshContainer,
      globalStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <Text style={[globalStyles.bigText, { marginBottom: 8 }]}>
      Die Zeit für die Rallye ist abgelaufen.
    </Text>
    <ResultText points={points} />
  </ScrollView>
);

export const AllQuestionsAnsweredState = ({
  loading,
  onRefresh,
  points,
}) => (
  <ScrollView
    contentContainerStyle={[
      globalStyles.refreshContainer,
      globalStyles.container,
    ]}
    style={{ backgroundColor: 'white' }}
    refreshControl={
      <RefreshControl refreshing={loading} onRefresh={onRefresh} />
    }
  >
    <View>
      <Text style={[globalStyles.bigText, { marginBottom: 8 }]}>
        Ihr habt alle Fragen beantwortet, Glückwunsch!
      </Text>
      <ResultText points={points} />
    </View>
  </ScrollView>
);

function ResultText({ points }) {
  return (
    <>
      <Text style={[globalStyles.bigText, { marginBottom: 8 }]}>
        Wartet bis die Rallye beendet wird, um das Ergebnis zu sehen.
      </Text>
      <Text style={[globalStyles.bigText, { marginBottom: 8 }]}>
        Eure erreichte Punktzahl: {points}
      </Text>
      <Text style={globalStyles.bigText}>
        Geht zu eurem vereinbarten Treffpunkt.
      </Text>
    </>
  );
}
