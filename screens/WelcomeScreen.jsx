import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
} from "react-native";
import Colors from "../utils/Colors";
import UIButton from "../ui/UIButton";
import { globalStyles } from "../utils/GlobalStyles";
import Card from "../ui/Card";

export default function WelcomeScreen({
  onPasswordSubmit,
  onContinueWithoutRallye,
  networkAvailable,
  loading,
  onRefresh,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const OnlineContent = () => (
    <View style={globalStyles.welcomeStyles.container}>
      <Card
        title="An Campus Rallye teilnehmen"
        description="Nimm an einer geführten Rallye teil und entdecke den Campus mit deinem Team"
        icon="map-marker"
        onPress={() => setModalVisible(true)}
        onPasswordSubmit={onPasswordSubmit}
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
    </>
  );
}
