import React, { useState, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  View,
  } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "../utils/Colors";
import { globalStyles } from "../utils/GlobalStyles";
import UIButton from "./UIButton";

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
    pointerEvents: isFlipped ? "none" : "auto",
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    zIndex: isFlipped ? 1 : 0,
    pointerEvents: isFlipped ? "auto" : "none",
  };

  const handlePasswordSubmit = () => {
    onPasswordSubmit(password);
    setPassword("");
    flipCard();
  };

  return (
    <TouchableOpacity
      style={globalStyles.cardStyles.card }
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
