import React, { useState, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  View,
  Pressable,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "../utils/Colors";
import { globalStyles } from "../utils/GlobalStyles";

const Card = ({ title, description, icon, onPress, onPasswordSubmit }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [password, setPassword] = useState("");
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

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
    // Deaktiviert Touch-Events wenn Karte gedreht
    pointerEvents: isFlipped ? "none" : "auto",
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    zIndex: isFlipped ? 1 : 0,
    // Aktiviert Touch-Events nur wenn Karte gedreht
    pointerEvents: isFlipped ? "auto" : "none",
  };

  const handlePasswordSubmit = () => {
    onPasswordSubmit(password);
    setPassword("");
    flipCard();
  };

  return (
    <TouchableOpacity
      style={[globalStyles.cardStyles.card, { height: 200 }]}
      onPress={icon === "map-marker" ? flipCard : onPress}
    >
      <Animated.View
        style={[globalStyles.cardStyles.cardFace, frontAnimatedStyle]}
      >
        <FontAwesome name={icon} size={40} color={Colors.dhbwRed} />
        <Text style={globalStyles.cardStyles.cardTitle}>{title}</Text>
        <Text style={globalStyles.cardStyles.cardDescription}>
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
        <Text style={globalStyles.cardStyles.cardTitle}>Passwort eingeben</Text>
        <TextInput
          style={globalStyles.cardStyles.passwordInput}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Passwort"
        />
        <View style={globalStyles.cardStyles.buttonRow}>
          <Pressable
            style={globalStyles.cardStyles.button}
            onPress={handlePasswordSubmit}
          >
            <Text style={globalStyles.cardStyles.buttonText}>Bestätigen</Text>
          </Pressable>
          <Pressable style={globalStyles.cardStyles.button} onPress={flipCard}>
            <Text style={globalStyles.cardStyles.buttonText}>Zurück</Text>
          </Pressable>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default Card;
