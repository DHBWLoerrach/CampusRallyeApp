import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';

const Card = ({ title, description, icon, onPress }) => (
  <TouchableOpacity style={globalStyles.cardStyles.card} onPress={onPress}>
    <FontAwesome name={icon} size={40} color={Colors.dhbwRed} />
    <Text style={globalStyles.cardStyles.cardTitle}>{title}</Text>
    <Text style={globalStyles.cardStyles.cardDescription}>{description}</Text>
  </TouchableOpacity>
);

export default Card;