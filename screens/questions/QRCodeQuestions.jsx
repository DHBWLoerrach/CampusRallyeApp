import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Dimensions,
  ScrollView,
} from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useSharedStates } from '../../utils/sharedStates';
import { supabase } from '../../utils/supabase';
import QRScan from './QRScan';

export default function QRCodeQuestions() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [markerLocation, setMarkerLocation] = useState({
    latitude: 47.617030510990055,
    longitude: 7.6782348392200195,
  });
  const { questions, currentQuestion, qrScan, setQRScan } =
    useSharedStates();

  useEffect(() => {
    const fetchData = async () => {
      const { data: answer } = await supabase
        .from('QRFragen')
        .select('Latitude, Longitude, fragen_id')
        .eq('fragen_id', questions[currentQuestion].fragen_id);
      setMarkerLocation({
        latitude: answer[0].Latitude,
        longitude: answer[0].Longitude,
      });
    };
    fetchData();
  }, [!qrScan]);

  useEffect(() => {
    (async () => {
      let { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
    if (isLocationEnabled) {
      const locationSubscriber = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        setLocation
      );
      if (locationSubscriber && locationSubscriber.remove) {
        return () => {
          locationSubscriber.remove();
        };
      }
    }
  }, [isLocationEnabled]);

  const toggleLocation = () => {
    setIsLocationEnabled(!isLocationEnabled);
  };

  let userlocation = {
    latitude: 47.61709224449131,
    longitude: 7.678051759539827,
  };

  if (errorMsg) {
    console.log(errorMsg);
  } else if (location) {
    userlocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  const mapRegion = {
    latitude: userlocation.latitude,
    longitude: userlocation.longitude,
    latitudeDelta: 0.0004,
    longitudeDelta: 0.004,
  };
  let content;

  const handlepress = () => {
    setQRScan(!qrScan);
  };

  // if (!qrScan) {
  //   content = (
  //     <ScrollView>
  //       <View>
  //         <View style={styles.header}>
  //           <Text style={styles.title}>
  //             {questions[currentQuestion].frage}
  //           </Text>
  //         </View>
  //         <View style={styles.mapContainer}>
  //           <MapView style={styles.map} region={mapRegion}>
  //             <Marker coordinate={userlocation}>
  //               <MaterialIcon
  //                 name="gps-fixed"
  //                 size={35}
  //                 color={'blue'}
  //               />
  //             </Marker>
  //             <Marker coordinate={markerLocation}>
  //               <MaterialIcon name="place" size={60} color={'red'} />
  //             </Marker>
  //           </MapView>
  //         </View>
  //         <View style={styles.buttonContainer}>
  //           <Button
  //             title={'QR-Code Scannen'}
  //             onPress={() => handlepress()}
  //             color={'red'}
  //           />
  //         </View>
  //       </View>
  //     </ScrollView>
  //   );
  // } else if (qrScan) {
  content = (
    <View>
      <QRScan />
    </View>
  );
  // }

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
    flex: 6,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrscancontainer: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
