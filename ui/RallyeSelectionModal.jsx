import React, { useContext } from "react";
import { Modal, View, Text, FlatList } from "react-native";
import { globalStyles } from "../utils/GlobalStyles";
import UIButton from "../ui/UIButton";
import { ThemeContext } from "../utils/ThemeContext";
import Colors from "../utils/Colors";

const RallyeSelectionModal = ({
  visible,
  onClose,
  activeRallyes,
  onSelect,
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const renderItem = ({ item }) => (
    <View style={[globalStyles.rallyeModal.rallyeCard, { backgroundColor: isDarkMode ? Colors.darkMode.dhbwGray : globalStyles.rallyeModal.rallyeCard.backgroundColor }]}>
      <View style={globalStyles.rallyeModal.rallyeInfo}>
        <Text style={[globalStyles.rallyeModal.rallyeName, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text}]}>{item.name}</Text>
        <Text style={[globalStyles.rallyeModal.rallyeStudiengang, { color: isDarkMode ? Colors.darkMode.text : globalStyles.rallyeModal.rallyeStudiengang.color }]}>
          {item.studiengang}
        </Text>
        <Text style={[globalStyles.rallyeModal.rallyeStatus, { color: isDarkMode ? Colors.darkMode.text : globalStyles.rallyeModal.rallyeStatus.color }]}>

          {item.status.split("_").join(" ")}
        </Text>
      </View>
      <UIButton
        onPress={() => onSelect(item)}
        style={globalStyles.rallyeModal.selectButton}
      >
        Auswählen
      </UIButton>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={globalStyles.rallyeModal.modalContainer}>
        <View style={[globalStyles.rallyeModal.modalContent, { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.background }]}>
          <Text style={[globalStyles.rallyeModal.modalTitle, { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }]}>
            Aktive Rallyes
          </Text>
          {activeRallyes.length > 0 ? (
            <FlatList
              data={activeRallyes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          ) : (
            <Text style={globalStyles.rallyeModal.noDataText}>
              Keine aktiven Rallyes verfügbar
            </Text>
          )}
          <UIButton
            onPress={onClose}
            style={globalStyles.rallyeModal.cancelButton}
          >
            Abbrechen
          </UIButton>
        </View>
      </View>
    </Modal>
  );
};

export default RallyeSelectionModal;
