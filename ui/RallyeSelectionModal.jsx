import React from "react";
import { Modal, View, Text, FlatList } from "react-native";
import { globalStyles } from "../utils/GlobalStyles";
import UIButton from "../ui/UIButton";

const RallyeSelectionModal = ({
  visible,
  onClose,
  activeRallyes,
  onSelect,
}) => {
  const renderItem = ({ item }) => (
    <View style={globalStyles.rallyeModal.rallyeCard}>
      <View style={globalStyles.rallyeModal.rallyeInfo}>
        <Text style={globalStyles.rallyeModal.rallyeName}>{item.name}</Text>
        <Text style={globalStyles.rallyeModal.rallyeStudiengang}>
          {item.studiengang}
        </Text>
        <Text style={globalStyles.rallyeModal.rallyeStatus}>
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
        <View style={globalStyles.rallyeModal.modalContent}>
          <Text style={globalStyles.rallyeModal.modalTitle}>
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
