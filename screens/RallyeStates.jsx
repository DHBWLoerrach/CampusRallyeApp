import { RefreshControl, ScrollView, Text, View } from "react-native";
import VotingScreen from "./VotingScreen";
import Scoreboard from "./ScoreboardScreen";
import UIButton from "../ui/UIButton";
import { globalStyles } from "../utils/GlobalStyles";
import { store$ } from "../services/storage/Store";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Colors from "../utils/Colors";
import { setTimePlayed } from "../services/storage";
import React, { useEffect } from "react";
import { useContext } from "react";
import { ThemeContext } from "../utils/ThemeContext";

export const PreparationState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
      {
        backgroundColor: isDarkMode
          ? Colors.darkMode.background
          : Colors.lightMode.background,
      },
    ]}
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

    <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
      <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        Die Rallye hat noch nicht begonnen
      </Text>
      <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        Bitte warte auf den Start der Rallye
      </Text>
    </View>

    <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
      Aktualisieren
    </UIButton>
  </ScrollView>;

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <VotingScreen onRefresh={onRefresh} loading={loading} />
    </ScrollView>
  );
};

export const EndedState = () => <Scoreboard />;

export const TeamNotSelectedState = () => {(
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
      { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
    ]}
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
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Kein Team ausgewählt
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Bitte bilde zuerst ein Team
        </Text>
      </View>
    </ScrollView>
  );
};

export const NoQuestionsAvailableState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);

  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
      { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
    ]}
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
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Keine Fragen verfügbar
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Momentan sind keine Fragen zum Beantworten verfügbar
        </Text>
      </View>

      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        Aktualisieren
      </UIButton>
    </ScrollView>
};

export const ExplorationFinishedState = ({ goBackToLogin, points }) => {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.background
            : Colors.lightMode.background,
        },
      ]}
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
          Alle Fragen wurden beantwortet.
        </Text>
      </View>

      <View style={globalStyles.rallyeStatesStyles.infoBox}>
        <Text style={globalStyles.rallyeStatesStyles.pointsTitle}>
          Erreichte Punktzahl
        </Text>
        <Text style={globalStyles.rallyeStatesStyles.pointsValue}>
          {points}
        </Text>
      </View>
      <View style={globalStyles.rallyeStatesStyles.infoBox}>
        <UIButton
          icon="arrow-left"
          onPress={() => {
            goBackToLogin();
          }}
        >
          Erkundungsmodus beenden
        </UIButton>
      </View>
    </ScrollView>
  );
};


export const TimeExpiredState = ({loading, onRefresh, teamName, points}) => {
  const { isDarkMode } = useContext(ThemeContext);
  return (
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
      { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background},
    ]}
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
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Zeit abgelaufen
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.infoSubtitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
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
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Team: {teamName}
        </Text>
        <Text style={[
          globalStyles.rallyeStatesStyles.pointsValue,
        ]}>
          {points} Punkte
        </Text>
      </View>

    <Text style={[globalStyles.rallyeStatesStyles.footer, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
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
  return(
  <ScrollView
    contentContainerStyle={[
      globalStyles.default.refreshContainer,
      globalStyles.rallyeStatesStyles.container,
      { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
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

    <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
      <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        Alle Fragen beantwortet
      </Text>
      <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        Team: {teamName}
      </Text>
    </View>

    <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
      <Text style={[globalStyles.rallyeStatesStyles.pointsTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        Erreichte Punkte
      </Text>
      <Text style={globalStyles.rallyeStatesStyles.pointsValue}>{points}</Text>
    </View>

    <Text style={[globalStyles.rallyeStatesStyles.footer, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
      Wartet auf die Beendigung der Rallye{"\n"}
      und geht zum vereinbarten Treffpunkt.
    </Text>
  </ScrollView>
);
};