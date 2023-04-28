import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, Alert, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as MailComposer from 'expo-mail-composer';
import { useNavigation } from '@react-navigation/native';
import {useSharedStates} from '../sharedStates'
import { supabase } from '../../../supabase';

export default function BildFragen() {
  const navigation = useNavigation();

  // import shared States
  const {fragen, setFragen} = useSharedStates();
  const {aktuelleFrage, setAktuelleFrage} = useSharedStates();
  const [selectedImage, setSelectedImage] = useState(null);
  const [mailsend, setmailsend] = useState(null); 

  const [mailadress, setmailadress] = useState(null) 

  useEffect(() => {
    async function getData() {
      let { data: mailadress, error } = await supabase
      .from('Rallye')
      .select('mail');
      setmailadress(mailadress[0].mail);
    }
    getData();
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, wir benötigen die Berechtigung zur Nutzung der Kamera!');
        }
      }
    })();
  }, []);

  const handleLaunchCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSendEmail = async () => {
    const hasPermission = await MediaLibrary.requestPermissionsAsync();

    if (!hasPermission.granted) {
      Alert.alert('Berechtigung erforderlich', 'Bitte gewähren Sie uns Zugriff auf Ihre Mediathek!');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Fehler', 'Bitte wählen Sie ein Bild oder Video aus!');
      return;
    }

    let asset = await MediaLibrary.createAssetAsync(selectedImage);
    setmailsend(selectedImage)
    MailComposer.composeAsync({
      recipients: [mailadress],
      subject: 'Gruppenfoto Gruppe: ',
      body: 'Das ist unser Gruppenfoto!',
      attachments: [asset.uri],
    });
  };

  const handleNext = () => {
    setAktuelleFrage(aktuelleFrage+1);      
  }

  const handleAnswerSubmit = () => {
    Alert.alert(
      "Sicherheitsfrage",
      ` Hast du die Mail mit dem Bild abgesendet ?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Ja, ich habe die Mail gesendet",
          onPress: () => handleNext(),
        },
      ],
    );
  };

  return (
    <ScrollView>
    <View style={styles.container}>
      <Text style={styles.text}>{fragen[aktuelleFrage].frage}</Text>
      <View style={styles.imageContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.image} />
        ) : (
          <Text style={styles.noImageText}>Kein Foto ausgewählt</Text>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Bild aufnehmen" onPress={handleLaunchCamera} style={styles.button} />
        <Button title="Senden" onPress={handleSendEmail} disabled={!selectedImage} style={styles.button} />
      </View>
      <Text style={styles.infoText}>Das aufgenommene Foto soll über den Button "SENDEN" per E-Mail gesendet werden</Text>
      <Text style={styles.infoText}>Falls das Senden über den Button nicht geht, dann macht die Fotos in eurer Kamera App und schickt die Fotos selsbtständig mit Gruppenname an {mailadress}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Weiter" onPress={handleAnswerSubmit} style={styles.button} />
      </View>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 4 / 3,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  buttonContainer: {
    width: '100%',
  },
});