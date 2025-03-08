import { useRef, useState, useContext } from 'react';
import { Image, View, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import UIButton from '../../ui/UIButton';
import { globalStyles } from '../../utils/GlobalStyles';
import Colors from '../../utils/Colors';
import { ThemeContext } from '../../utils/ThemeContext';

export default function UploadPhoto({ handleSendEmail }) {
  const [picture, setPicture] = useState(null);
  const cameraRef = useRef(null);
  const { isDarkMode } = useContext(ThemeContext);

  function PhotoCamera() {
    const [facing, setFacing] = useState('back');
    return (
      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <CameraView
          ref={cameraRef}
          style={globalStyles.uploadStyles.camera}
          facing={facing}
        />
        <View style={globalStyles.qrCodeStyles.buttonRow}>
          <UIButton
            icon="camera"
            onPress={async () => {
              try {
                const picture = await cameraRef.current.takePictureAsync();
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
            color={Colors.dhbwGray}
            onPress={() => setFacing((current) => current === 'back' ? 'front' : 'back')}
          >
            Kamera wechseln
          </UIButton>
        </View>
      </View>
    );
  }

  function ImagePreview() {
    return (
      <View style={[
        globalStyles.rallyeStatesStyles.infoBox,
        { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
      ]}>
        <Image 
          source={{ uri: picture.uri }} 
          style={globalStyles.uploadStyles.image} 
          resizeMode="contain"
        />
        <View style={globalStyles.qrCodeStyles.buttonRow}>
          <UIButton 
            icon="recycle"
            color={Colors.dhbwGray} 
            onPress={() => setPicture(null)}
          >
            Neues Foto
          </UIButton>
          <UIButton
            icon="envelope"
            onPress={() => handleSendEmail(picture.uri)}
          >
            Foto senden
          </UIButton>
        </View>
      </View>
    );
  }

  return picture ? <ImagePreview /> : <PhotoCamera />;
}
