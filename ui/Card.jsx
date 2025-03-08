import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  View,
  Alert,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "../utils/Colors";
import { globalStyles } from "../utils/GlobalStyles";
import UIButton from "./UIButton";
import { ThemeContext } from "../utils/ThemeContext";

const Card = ({
  title,
  description,
  icon,
  onPress,
  onShowModal, // Neuer prop
  onPasswordSubmit,
  selectedRallye,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [password, setPassword] = useState("");
  const flipAnim = useRef(new Animated.Value(0)).current;
  const { isDarkMode } = useContext(ThemeContext);

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    if (selectedRallye) {
      flipCard();
    }
  }, [selectedRallye]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    zIndex: isFlipped ? 0 : 1,
    pointerEvents: isFlipped ? "none" : "auto",
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    zIndex: isFlipped ? 1 : 0,
    pointerEvents: isFlipped ? "auto" : "none",
  };

  const handlePasswordSubmit = () => {
    if (!selectedRallye && icon === "map-marker") {
      Alert.alert("Fehler", "Bitte wähle zuerst eine Rallye aus.");
      return;
    }
    onPasswordSubmit(password);
    setPassword("");
    flipCard();
  };

  return (
    <TouchableOpacity
      style={[
        globalStyles.cardStyles.card,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}
      // Hier die Logik anpassen:
      onPress={icon === "map-marker" ? onShowModal : onPress}
    >
      <Animated.View
        style={[globalStyles.cardStyles.cardFace, frontAnimatedStyle]}
      >
        <FontAwesome name={icon} size={40} color={Colors.dhbwRed} />
        <Text style={[
          globalStyles.cardStyles.cardTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          {title}
        </Text>
        <Text style={[
          globalStyles.cardStyles.cardDescription,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          {description}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          globalStyles.cardStyles.cardFace,
          globalStyles.cardStyles.cardBack,
          backAnimatedStyle,
        ]}
      >
        <Text style={[
          globalStyles.cardStyles.cardTitle,
          { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
        ]}>
          Passwort eingeben
        </Text>
        <TextInput
          style={[
            globalStyles.cardStyles.passwordInput,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray, borderColor: isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray },
          ]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Passwort"
          placeholderTextColor={isDarkMode ? Colors.darkMode.text : Colors.lightMode.dhbwGray}
        />
        <View style={globalStyles.cardStyles.buttonRow}>
          <UIButton
            style={[globalStyles.cardStyles.button]}
            textStyle={globalStyles.cardStyles.buttonText}
            onPress={flipCard}
            variant="custom"
            color={Colors.dhbwRedLight}
          >
            Zurück
          </UIButton>
          <UIButton
            style={[globalStyles.cardStyles.button]}
            textStyle={globalStyles.cardStyles.buttonText}
            onPress={handlePasswordSubmit}
            variant="custom"
            color={Colors.dhbwRed}
          >
            Bestätigen
          </UIButton>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default Card;
