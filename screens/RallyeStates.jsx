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
import { useContext } from 'react';
import { ThemeContext } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext'; // Import LanguageContext

export const PreparationState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  return (
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
        name="clock-o"
        size={80}
        color={Colors.dhbwRed}
        style={globalStyles.rallyeStatesStyles.successIcon}
      />

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Die Rallye hat noch nicht begonnen' : 'The rally has not started yet'}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Bitte warte auf den Start der Rallye' : 'Please wait for the rally to start'}
        </Text>
      </View>

      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        {language === 'de' ? 'Aktualisieren' : 'Refresh'}
      </UIButton>
    </ScrollView>
  );
};

export const EndedState = () => <Scoreboard />;

export const TeamNotSelectedState = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  return (
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

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Kein Team ausgewählt' : 'No team selected'}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Bitte bilde zuerst ein Team' : 'Please create a team first'}
        </Text>
      </View>
    </ScrollView>
  );
};

export const NoQuestionsAvailableState = ({ loading, onRefresh }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  return (
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

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Keine Fragen verfügbar' : 'No questions available'}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Momentan sind keine Fragen zum Beantworten verfügbar' : 'Currently no questions available to answer'}
        </Text>
      </View>

      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        {language === 'de' ? 'Aktualisieren' : 'Refresh'}
      </UIButton>
    </ScrollView>
  );
};

export const ExplorationFinishedState = ({
  goBackToLogin,
  points,
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  return (
    <View style={[globalStyles.default.container, { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }]}>
      <Text style={[globalStyles.default.bigText, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        {language === 'de' ? 'Alle Fragen wurden beantwortet.' : 'All questions have been answered.'}
      </Text>
      <Text style={[globalStyles.default.bigText, { marginBottom: 10 }, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        {language === 'de' ? 'Erreichte Punktzahl:' : 'Points achieved:'} {points}
      </Text>
      <UIButton icon="arrow-left" onPress={goBackToLogin}>
        {language === 'de' ? 'Zurück zur Anmeldung' : 'Back to Registration'}
      </UIButton>
    </View>
  );
};

export const TimeExpiredState = ({loading, onRefresh, teamName, points}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

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

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Zeit abgelaufen' : 'Time expired'}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Die Zeit für die Rallye ist abgelaufen' : 'The time for the rally has expired'}
        </Text>
      </View>

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.pointsTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Team:' : 'Team:'} {teamName}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.pointsValue]}>
          {points} {language === 'de' ? 'Punkte' : 'Points'}
        </Text>
      </View>

      <Text style={[globalStyles.rallyeStatesStyles.footer, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        {language === 'de' ? 'Wartet bis die Rallye beendet wird, um das Ergebnis zu sehen.\nGeht zum vereinbarten Treffpunkt.' : 'Wait until the rally is over to see the result.\nGo to the agreed meeting point.'}
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
  const { language } = useLanguage(); // Use LanguageContext

  return (
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

      <Text style={globalStyles.rallyeStatesStyles.title}>
        {language === 'de' ? 'Glückwunsch!' : 'Congratulations!'}
      </Text>

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Alle Fragen beantwortet' : 'All questions answered'}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Team:' : 'Team:'} {teamName}
        </Text>
      </View>

      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.pointsTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
          {language === 'de' ? 'Erreichte Punkte' : 'Points achieved'}
        </Text>
        <Text style={globalStyles.rallyeStatesStyles.pointsValue}>{points}</Text>
      </View>

      <Text style={[globalStyles.rallyeStatesStyles.footer, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray }]}>
        {language === 'de' ? 'Wartet auf die Beendigung der Rallye\nund geht zum vereinbarten Treffpunkt.' : 'Wait for the rally to end\nand go to the agreed meeting point.'}
      </Text>
    </ScrollView>
  );
};