import { useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { CameraView } from 'expo-camera';
import UIButton from '../../ui/UIButton';
import globalStyles from '../../utils/GlobalStyles';

export default function UploadPhoto({ handleSendEmail }) {
  const [picture, setPicture] = useState(null);
  const cameraRef = useRef(null);

  function PhotoCamera() {
    const [facing, setFacing] = useState('back');
    return (
      <>
        <CameraView
          ref={cameraRef}
          style={globalStyles.uploadStyles.camera}
          facing={facing}
        />
        <View style={globalStyles.uploadStyles.buttonRow}>
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
        <Image source={{ uri: picture.uri }} style={globalStyles.uploadStyles.image} />
        <View style={globalStyles.uploadStyles.buttonRow}>
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
    <View style={globalStyles.uploadStyles.container}>
      {picture ? <ImagePreview /> : <PhotoCamera />}
    </View>
  );
}
