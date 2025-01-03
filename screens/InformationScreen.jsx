import {
  View,
  Text,
  Linking,
  ScrollView,
} from 'react-native';
import * as Application from 'expo-application';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';

const AppVersion = () => {
  let versionString = `Version: ${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;
  if (Constants.expoVersion) {
    versionString = `App runs in Expo version ${Constants.expoVersion}`;
  }
  return <Text style={globalStyles.informationStyles.paragraph}>{versionString}</Text>;
};

export default function InformationScreen() {
  return (
    <ScrollView>
      <View style={globalStyles.informationStyles.container}>
        <Text style={globalStyles.informationStyles.paragraph}>
          Die Idee zu dieser Campus Rallye App entstand aus einer Idee
          von Ulrike Menke, Managerin Studienzentrum IT-Management und
          Informatik der DHBW Lörrach (SZI).
        </Text>
        <Text style={globalStyles.informationStyles.paragraph}>
          Die Konzeption und Umsetzung erfolgte an der DHBW Lörrach
          durch Studierende im Rahmen von Studienarbeiten und
          Projekten am SZI unter Betreuung und Leitung von Ulrike
          Menke und Selina Quade (Konzeptgestaltung und
          Projektbetreuung) und Prof. Dr. Erik Behrends (technische
          Umsetzung).
        </Text>
        <Text style={globalStyles.informationStyles.paragraph}>
          Bisher haben folgende Studierende an der Entwicklung dieser
          App mitgewirkt:
          {'\n\t'}
          Fabian Kaiser, Sophie Strittmatter (TIF20)
          {'\n\t'}
          Patrick Furtwängler, Marvin Obert (TIF21)
        </Text>
        <Text style={globalStyles.informationStyles.paragraph}>
          Die Campus Rallye App wird als Open Source Projekt
          kontinuierlich weiterentwickelt:
          {'\n'}
          <Text
            style={{ color: Colors.dhbwRed }}
            onPress={() =>
              Linking.openURL(
                'https://github.com/DHBWLoerrach/CampusRallyeApp'
              )
            }
          >
            https://github.com/DHBWLoerrach/CampusRallyeApp
          </Text>
        </Text>
        <AppVersion />
      </View>
    </ScrollView>
  );
}