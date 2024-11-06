import { useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import UIButton from '../../ui/UIButton';

export default function UploadPhoto({ handleSendEmail }) {
  const [picture, setPicture] = useState(null);
  const cameraRef = useRef(null);

  function PhotoCamera() {
    const [facing, setFacing] = useState('back');
    return (
      <>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />
        <View style={styles.buttonRow}>
          <UIButton
            icon="camera"
            onPress={async () => {
              try {
                const picture =
                  await cameraRef.current.takePictureAsync();
                setPicture(picture);
              } catch (error) {
                console.log('error taking picture', error);
              }
            }}
          >
            Aufnahme
          </UIButton>
          <UIButton
            icon="camera-rotate"
            label="Kamera"
            onPress={() =>
              setFacing((current) =>
                current === 'back' ? 'front' : 'back'
              )
            }
          >
            Kamera
          </UIButton>
        </View>
      </>
    );
  }

  function ImagePreview() {
    return (
      <>
        <Image source={{ uri: picture.uri }} style={styles.image} />
        <View style={styles.buttonRow}>
          <UIButton icon="recycle" onPress={() => setPicture(null)}>
            Neues Foto
          </UIButton>
          <UIButton
            icon="envelope"
            onPress={() => handleSendEmail(picture.uri)}
          >
            Foto senden
          </UIButton>
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
