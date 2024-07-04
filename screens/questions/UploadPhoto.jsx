import { useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import Colors from '../../utils/Colors';
import IconButton from '../../ui/IconButton';

export default function UploadPhoto({ handleSendEmail }) {
  const [facing, setFacing] = useState('back');
  const [picture, setPicture] = useState(null);
  const cameraRef = useRef(null);

  function PhotoCamera() {
    return (
      <>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />
        <View style={styles.buttonRow}>
          <IconButton
            icon="camera"
            label="Aufnahme"
            onPress={async () => {
              try {
                const picture =
                  await cameraRef.current.takePictureAsync();
                setPicture(picture);
              } catch (error) {
                console.log('error taking picture', error);
              }
            }}
          />
          <IconButton
            icon="camera-rotate"
            label="Kamera"
            onPress={() =>
              setFacing((current) =>
                current === 'back' ? 'front' : 'back'
              )
            }
          />
        </View>
      </>
    );
  }

  function ImagePreview() {
    return (
      <>
        <Image source={{ uri: picture.uri }} style={styles.image} />
        <View style={styles.buttonRow}>
          <IconButton
            icon="recycle"
            label="Neues Foto"
            onPress={() => setPicture(null)}
          />
          <IconButton
            color={Colors.dhbwRed}
            icon="envelope"
            label="Foto senden"
            onPress={() => handleSendEmail(picture.uri)}
          />
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {picture ? <ImagePreview /> : <PhotoCamera />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
  },
  image: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 30,
    marginVertical: 10,
  },
});
