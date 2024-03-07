import { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  Dimensions,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useSharedStates } from '../../utils/SharedStates';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../utils/Supabase';
import Colors from '../../utils/Colors';
import { useSetPoints } from '../../utils/Points';

export default function QRScan() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const navigation = useNavigation();
  const {
    questions,
    currentQuestion,
    setCurrentQuestion,
    setQRScan,
    group,
  } = useSharedStates();
  const setPoints = useSetPoints();
  
  useEffect(() => {}, []);

  useEffect(() => {
    (async () => {
      const { status } =
        await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    if (questions[currentQuestion].answer !== data) {
      alert(
        `Der Barcode ist falsch! Du bist vermutlich nicht am richtigen Ort.`
      );
    } else if (questions[currentQuestion].answer === data) {
      setCurrentQuestion(currentQuestion + 1);
      correctly_answered = answer.trim() === questions[currentQuestion].answer
    await setPoints(correctly_answered,questions[currentQuestion].points);
    }
    setQRScan(false);
    navigation.navigate('Rallye');
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View>
      <View style={styles.mapContainer}>
        <BarCodeScanner
          style={styles.map}
          onBarCodeScanned={
            scanned ? undefined : handleBarCodeScanned
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Zurück"
          onPress={() => setQRScan(false)}
          color="grey"
          textTransform="none"
        />
      </View>
      <View>
        <Text style={styles.title}>
          Hinweis: falls nicht gescannt wird, einmal zurück und neu
          auf Scannen klicken!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  qrscancontainer: {
    flex: 1,
    width: '100%',
    height: '50%',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  buttonContainer: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: Colors.dhbwRed,
    margin: 1,
    marginBottom: 15,
    borderRadius: 5,
  },
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
    flex: 6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
    flex: 1,
  },
});
