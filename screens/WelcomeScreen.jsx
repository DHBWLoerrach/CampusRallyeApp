import { ActivityIndicator, Image, Text, View } from "react-native";
import Colors from "../utils/Colors";
import UIButton from "../ui/UIButton";
import { globalStyles } from "../utils/GlobalStyles";
import Card from "../ui/Card";
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import RallyeSelectionModal from "../ui/RallyeSelectionModal";
import {
  getActiveRallyes,
  getCurrentRallye,
  setCurrentRallye,
} from "../services/storage";

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
    <View style={globalStyles.welcomeStyles.container}>
      <Card
        title="An Campus Rallye teilnehmen"
        description="Nimm an einer geführten Rallye teil und entdecke den Campus mit deinem Team"
        icon="map-marker"
        onShowModal={() => {
          setShowRallyeModal(true);
        }}
        selectedRallye={selectedRallye}
        onPasswordSubmit={(password) => {
          if (!selectedRallye) {
            Alert.alert("Fehler", "Bitte wähle zuerst eine Rallye aus.");
            return;
          }
          onPasswordSubmit(password, selectedRallye);
        }}
      />
      <Card
        title="Campus-Gelände erkunden"
        description="Erkunde den Campus in deinem eigenen Tempo ohne Zeitdruck"
        icon="compass"
        onPress={onContinueWithoutRallye}
      />
    </View>
  );

  const OfflineContent = ({ loading, onRefresh }) => (
    <View style={globalStyles.welcomeStyles.offline}>
      <Text style={[globalStyles.welcomeStyles.text, { marginBottom: 20 }]}>
        Du bist offline…
      </Text>
      <UIButton icon="rotate" disabled={loading} onPress={onRefresh}>
        Aktualisieren
      </UIButton>
    </View>
  );

  return (
    <>
      <View style={globalStyles.welcomeStyles.container}>
        <Image
          style={globalStyles.welcomeStyles.headerImage}
          source={require("../assets/dhbw-campus-header.png")}
        />
        <View style={globalStyles.welcomeStyles.header}>
          <Text
            style={[
              globalStyles.welcomeStyles.text,
              globalStyles.welcomeStyles.title,
            ]}
          >
            DHBW Lörrach Campus Rallye
          </Text>
          <Image
            style={globalStyles.welcomeStyles.logo}
            source={require("../assets/dhbw-logo.png")}
          />
        </View>
        <View style={globalStyles.welcomeStyles.content}>
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
