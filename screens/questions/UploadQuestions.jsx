import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Button,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as MailComposer from "expo-mail-composer";
import { useSharedStates } from "../../utils/SharedStates";
import { useSetPoints } from "../../utils/Points";
import Colors from "../../utils/Colors";

import { Camera } from "expo-camera";
import { Video } from "expo-av";
import * as FileSystem from "expo-file-system";


export default function UploadQuestions() {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isMediaSelected, setIsMediaSelected] = useState(false);

  const [mode, setMode] = useState(null);

  const { questions, currentQuestion, setCurrentQuestion, group, groups, rallye } =
    useSharedStates();
  const setPoints = useSetPoints();

  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [record, setRecord] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const video = useRef(null);
  const [status, setStatus] = useState({});


  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert(
            "Sorry, wir benötigen die Berechtigung zur Nutzung der Kamera!"
          );
        }
      }
    })();
  }, []);

  const getGroupName = (groups, groupId) => {
    print("groups", groups);
    print("groupId", groupId);
    const group = groups.find(group => group.id === groupId);
    return group ? group.name : null;
  }

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");

      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === "granted");
    })();
  }, []);

  const handleTakePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
      setIsMediaSelected(true);
    }
  };

  const takeVideo = async () => {
    if (camera) {
      const data = await camera.recordAsync({
        VideoQuality:['720p'],
        maxDuration:20,
        maxFileSize:16500000,
        mute:false,
        videoBitrate:500000
      });
      setRecord(data.uri);
      setSelectedMedia(data.uri);
      setIsMediaSelected(true);
      console.log(data.uri);
    }
  };

  const stopVideo = async () => {
    camera.stopRecording();
  };

  if (hasCameraPermission === null || hasAudioPermission === null) {
    return <View />;
  }
  if (hasCameraPermission === false || hasAudioPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const handleSendEmail = async () => {
    const hasPermission = await MediaLibrary.requestPermissionsAsync();

    if (!hasPermission.granted) {
      Alert.alert(
        "Berechtigung erforderlich",
        "Bitte gewähren Sie uns Zugriff auf Ihre Mediathek!"
      );
      return;
    }

    if (!selectedMedia) {
      Alert.alert("Fehler", "Bitte wählen Sie ein Bild oder Video aus!");
      return;
    }

    //Android ab Version 7.0 (Nougat) aus Sicherheitsgründen den Zugriff auf Dateien über file:// URIs nicht mehr erlaubt, wenn diese von außerhalb der App kommen.
    //Erstellen einer Kopie der Datei im temporären Verzeichnis der App

    const newUri =
      FileSystem.documentDirectory + selectedMedia.split("/").pop();
    await FileSystem.copyAsync({
      from: selectedMedia,
      to: newUri,
    });

    const groupName = getGroupName(groups, group);

    let mailOptions = {
      recipients: [rallye.mail_adress],
      subject:
        mode === "photo"
          ? "Gruppenfoto -- Gruppe: " + groupName
          : "Gruppenvideo -- Gruppe: " + groupName,
      body:
        mode === "photo"
          ? `Das ist unser Gruppenfoto!\n\nFrage: ${questions[currentQuestion].question}`
          : `Das ist unser Gruppenvideo!\n\nFrage: ${questions[currentQuestion].question}`,
      attachments: [newUri],
    };
    try {
      await MailComposer.composeAsync(mailOptions);
    } catch (error) {
      console.error("Fehler beim Senden der E-Mail: ", error);
    }
  };

  const handleNext = async () => {
    await setPoints(true, questions[currentQuestion].points);
    setCurrentQuestion(currentQuestion + 1);
  };

  const handleAnswerSubmit = () => {
    Alert.alert(
      "Sicherheitsfrage",
      ` Hast du die Mail mit dem Bild / Video gesendet ?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Ja, ich habe die Mail gesendet",
          onPress: () => handleNext(),
        },
      ]
    );
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.text}>{questions[currentQuestion].question}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Foto Modus"
            onPress={() => setMode("photo")}
            style={styles.button}
            color={"grey"}
          />
          <Button
            title="Video Modus"
            onPress={() => setMode("video")}
            style={styles.button}
            color={"grey"}
          />
        </View>

        {mode === "video" && (
          <>
            <View style={styles.cameraContainer}>
              <Camera
                ref={(ref) => setCamera(ref)}
                style={styles.fixedRatio}
                type={type}
                ratio={"4:3"}
              />
            </View>

            <Button
              title="Flip Video"
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}
            ></Button>
            <Button title="Take video" onPress={() => takeVideo()} />
            <Button title="Stop Video" onPress={() => stopVideo()} />

            <Video
              ref={video}
              style={styles.video}
              source={{
                uri: record,
              }}
              useNativeControls
              resizeMode="contain"
              isLooping
              onPlaybackStatusUpdate={(status) => setStatus(() => status)}
            />
            <View style={styles.buttons}>
              <Button
                title={status.isPlaying ? "Pause" : "Play"}
                onPress={() =>
                  status.isPlaying
                    ? video.current.pauseAsync()
                    : video.current.playAsync()
                }
              />
            </View>
            <View
              style={
                !isMediaSelected
                  ? styles.buttonContainerDeactive
                  : styles.buttonContainer
              }
            >
              <Button
                title="Senden"
                onPress={handleSendEmail}
                disabled={!isMediaSelected}
                style={styles.button}
                color={"red"}
              />
            </View>
            <Text style={styles.infoText}>
              Das aufgenommene Video soll über den Button "SENDEN" per E-Mail
              gesendet werden
            </Text>
            <Text style={styles.infoText}>
              Falls das Senden über den Button nicht geht, dann macht das Video
              in eurer Kamera App und schickt es selsbtständig mit eurem
              Gruppennamen an: {rallye.mail_adress}
            </Text>
            <Text style={styles.infoText}>
              Das Video bricht ab 15MB Dateigröße automatisch ab.
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Weiter"
                onPress={handleAnswerSubmit}
                style={styles.button}
              />
            </View>
          </>
        )}

        {mode === "photo" && (
          <>
            <View style={styles.imageContainer}>
              {selectedMedia ? (
                <Image source={{ uri: selectedMedia }} style={styles.image} />
              ) : (
                <Text style={styles.noImageText}>Kein Foto ausgewählt</Text>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="Bild aufnehmen"
                onPress={handleTakePhoto}
                style={styles.button}
                color={"grey"}
              />
            </View>
            <View
              style={
                !isMediaSelected
                  ? styles.buttonContainerDeactive
                  : styles.buttonContainer
              }
            >
              <Button
                title="Senden"
                onPress={handleSendEmail}
                disabled={!isMediaSelected}
                style={styles.button}
                color={"red"}
              />
            </View>
            <Text style={styles.infoText}>
              Das aufgenommene Foto soll über den Button "SENDEN" per E-Mail
              gesendet werden
            </Text>
            <Text style={styles.infoText}>
              Falls das Senden über den Button nicht geht, dann macht die Fotos
              in eurer Kamera App und schickt die Fotos selsbtständig mit
              Gruppenname an {rallye.mail_adress}
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Weiter"
                onPress={handleAnswerSubmit}
                style={styles.button}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imageContainer: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    aspectRatio: 4 / 3,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImageText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
  buttonContainer: {
    margin: 10,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonContainerDeactive: {
    backgroundColor: Colors.dhbwGray,
    margin: 6,
    borderRadius: 5,
  },
  cameraContainer: {
    flex: 1,
    flexDirection: "row",
  },
  fixedRatio: {
    flex: 1,
    aspectRatio: 1,
  },
  video: {
    alignSelf: "center",
    width: 350,
    height: 220,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
