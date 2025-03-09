import { ActivityIndicator, Image, Text, View, TouchableOpacity } from "react-native";
import Colors from "../utils/Colors";
import UIButton from "../ui/UIButton";
import { globalStyles } from "../utils/GlobalStyles";
import Card from "../ui/Card";
import { useState, useEffect, useContext } from "react";
import { Alert } from "react-native";
import RallyeSelectionModal from "../ui/RallyeSelectionModal";
import { getActiveRallyes, getCurrentRallye, setCurrentRallye } from "../services/storage";
import { ThemeContext } from "../utils/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useLanguage } from "../utils/LanguageContext"; // Import LanguageContext

export default function WelcomeScreen({
  onPasswordSubmit,
  onContinueWithoutRallye,
  networkAvailable,
  loading,
  onRefresh,
}) {
  const [showRallyeModal, setShowRallyeModal] = useState(false);
  const [activeRallyes, setActiveRallyes] = useState([]);
  const [selectedRallye, setSelectedRallye] = useState(null);
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const { language, toggleLanguage } = useLanguage(); // Use LanguageContext

  // Sicherstellen dass Rallyes beim ersten Render geladen werden
  useEffect(() => {
    (async () => {
      const rallyes = await getActiveRallyes();
      setActiveRallyes(rallyes);
    })();
  }, [showRallyeModal]);

  const handleRallyeSelect = async (rallye) => {
    setSelectedRallye(rallye);
    const currentRallye = await getCurrentRallye();
    if (rallye.id === currentRallye?.id) {
      onPasswordSubmit(rallye.password, rallye);
    } else {
      await setCurrentRallye(rallye);
    }
    setShowRallyeModal(false);
  };

  const OnlineContent = () => (
    <View style={[
            globalStyles.welcomeStyles.container,
            { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
            ]}>
      <Card
        title={language === 'de' ? "An Campus Rallye teilnehmen" : "Join Campus Rallye"}
        description={language === 'de' ? "Nimm an einer geführten Rallye teil und entdecke den Campus mit deinem Team" : "Join a guided rally and explore the campus with your team"}
        icon="map-marker"
        onShowModal={() => {
          setShowRallyeModal(true);
        }}
        selectedRallye={selectedRallye}
        onPasswordSubmit={(password) => {
          if (!selectedRallye) {
            Alert.alert(language === 'de' ? "Fehler" : "Error", language === 'de' ? "Bitte wähle zuerst eine Rallye aus." : "Please select a rally first.");
            return;
          }
          onPasswordSubmit(password, selectedRallye);
        }}
      />
      <Card
        title={language === 'de' ? "Campus-Gelände erkunden" : "Explore Campus"}
        description={language === 'de' ? "Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck" : "Explore the campus at your own pace without time pressure"}
        icon="compass"
        onPress={onContinueWithoutRallye}
      />
    </View>
  );

  const OfflineContent = ({ loading, onRefresh }) => (
    <View style={[
            globalStyles.welcomeStyles.offline,
            { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
            ]}>
      <Text style={[globalStyles.welcomeStyles.text, { marginBottom: 20 },
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
            ]}>
        {language === 'de' ? "Du bist offline…" : "You are offline…"}
      </Text>
      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        {language === 'de' ? "Aktualisieren" : "Refresh"}
      </UIButton>
    </View>
  );

  return (
    <>
      <View style={[
        globalStyles.welcomeStyles.container,
        { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }
      ]}>
        <View style={{ position: "relative" }}>
          <Image
            style={globalStyles.welcomeStyles.headerImage}
            source={require("../assets/dhbw-campus-header.png")}
          />
          <TouchableOpacity
            style={{ position: "absolute", top: 40, left: 13 }}
            onPress={toggleDarkMode}
          >
            <MaterialIcons
              name={isDarkMode ? "brightness-3" : "brightness-7"}
              size={24}
              color={isDarkMode ? Colors.lightMode.text : Colors.darkMode.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ position: "absolute", top: 40, right: 13 }}
            onPress={toggleLanguage}
          >
            <MaterialIcons
              name="language"
              size={24}
              color={isDarkMode ? Colors.lightMode.text : Colors.darkMode.text}
            />
          </TouchableOpacity>
        </View>
        <View style={globalStyles.welcomeStyles.header}>
          <Text
            style={[
              globalStyles.welcomeStyles.text,
              globalStyles.welcomeStyles.title,
              { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }
            ]}
          >
            {language === 'de' ? "DHBW Lörrach Campus Rallye" : "DHBW Lörrach Campus Rallye"}
          </Text>
          <Image
            style={globalStyles.welcomeStyles.logo}
            source={require("../assets/dhbw-logo.png")}
          />
        </View>
        <View style={[
                globalStyles.welcomeStyles.content,
                { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background},
                ]}>
          {loading && (
            <View>
              <ActivityIndicator size="large" color={Colors.dhbwRed} />
            </View>
          )}
          {networkAvailable && !loading && <OnlineContent />}
          {!networkAvailable && !loading && (
            <OfflineContent onRefresh={onRefresh} loading={loading} />
          )}
        </View>
      </View>
      <RallyeSelectionModal
        visible={showRallyeModal}
        onClose={() => setShowRallyeModal(false)}
        activeRallyes={activeRallyes}
        onSelect={handleRallyeSelect}
      />
    </>
  );
}
