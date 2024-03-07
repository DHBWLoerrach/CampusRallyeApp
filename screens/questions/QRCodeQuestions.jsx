import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useSharedStates } from '../../utils/SharedStates';
import { supabase } from '../../utils/Supabase';
import { useNavigation } from '@react-navigation/native';
import QRScan from './QRScan';
import Colors, { dhbwRed } from '../../utils/Colors';
import MapView, { Marker } from 'react-native-maps';

export default function QRCodeQuestions() {

  const navigation = useNavigation();
  const {
    questions,
    currentQuestion,
    setCurrentQuestion,
    setQRScan,
    group,
    qrScan,
  } = useSharedStates();

  const [mapRegion, setMapRegion] = useState({
    latitude: 47.61706708166155,
    longitude: 7.678012011562073,
    latitudeDelta: 0.0004,
    longitudeDelta: 0.004,
  });

  //Default werte für Position bis aktuelle Position abgerufen wird.
  const [myPosition, setMyPosition] = useState({
    latitude: 47.61706708166155,
    longitude: 7.678012011562073,
  });


  // User Location holen
  const userLocation = async () => {
    let { status } =
      await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
    }

    let location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
    });
    setMapRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0004,
      longitudeDelta: 0.0009,
    });
    setMyPosition({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    console.log(location.coords.latitude, location.coords.longitude);
  };

  const standardLocation = () => {
    setMapRegion({
      latitude: 47.61706708166155,
      longitude: 7.678012011562073,
      latitudeDelta: 0.0004,
      longitudeDelta: 0.004,
    });
  };

  useEffect(() => {
    userLocation();
  }, []);

  let content;

  submitSurrender = async () => {
    setCurrentQuestion(currentQuestion + 1);
    await supabase
      .from('group_questions')
      .insert({
        group_id: group,
        question_id: questions[currentQuestion].id,
        answered_correctly: false,
        points: questions[currentQuestion].points
      });
  navigation.navigate('Rallye');
  };

  const handleSurrender = () => {
    Alert.alert(
      'Sicherheitsfrage',
      `Bist du sicher, dass du diese Aufgabe Aufgeben möchtest?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Ja, ich möchte aufgeben',
          onPress: () => submitSurrender(),
        },
      ]
    );
  };

  const handlepress = () => {
    setQRScan(!qrScan);
  };

  if (!qrScan) {
    content = (
      <ScrollView>
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>
              {questions[currentQuestion].question}
            </Text>
          </View>
          <View style={styles.mapContainer}>
            <MapView style={styles.map} region={mapRegion}>
              <Marker
                coordinate={myPosition}
                title="Meine Position"
              />
            </MapView>

            <View style={styles.buttonRow}>
              <Button
                title="Aktuelle Position"
                onPress={userLocation}
                textTransform="none"
              />
              <Button
                title="Zur DHBW"
                onPress={standardLocation}
                color={dhbwRed}
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Button
              title={'QR-Code Scannen'}
              onPress={() => handlepress()}
              color={'grey'}
            />
            <Button
              title={'Aufgeben'}
              onPress={() => handleSurrender()}
              color={dhbwRed}
            />

          </View>
        </View>
      </ScrollView>
    );
  } else if (qrScan) {
    content = (
      <View>
        <QRScan />
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: Dimensions.get('window').height * 0.025,
    textAlign: 'center',
  },
  mapContainer: {
    marginTop: 10,
    marginBottom: 10,
    flex: 6,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    marginBottom: 10,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
    flex: 1,
  },
  buttonContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.dhbwRed,
    margin: 6,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  qrscancontainer: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
