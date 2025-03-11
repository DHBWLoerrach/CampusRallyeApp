import { View, Text, Linking, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';
import { useContext } from 'react';
import { ThemeContext } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext'; // Import LanguageContext

const AppVersion = () => {
  // let versionString = `Version: ${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;
  let versionString = `Version: ${Constants.expoConfig.version} (${Constants.expoConfig.sdkVersion})`;
  if (Constants.expoVersion) {
    versionString = `App runs in Expo version ${Constants.expoVersion}`;
  }
  return (
    <Text style={globalStyles.informationStyles.paragraph}>
      {versionString}
    </Text>
  );
};

export default function InformationScreen() {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useLanguage(); // Use LanguageContext

  return (
    <ScrollView
      style={{
        backgroundColor: isDarkMode
          ? Colors.darkMode.background
          : Colors.lightMode.background,
      }}
    >
      <View
        style={[
          globalStyles.informationStyles.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <Text
          style={[
            globalStyles.informationStyles.paragraph,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Die Idee zu dieser Campus Rallye App entstand aus einer Idee von Ulrike Menke, Managerin Studienzentrum IT-Management und Informatik der DHBW Lörrach (SZI).'
            : 'The idea for this Campus Rallye App came from an idea by Ulrike Menke, Manager of the IT Management and Computer Science Study Center at DHBW Lörrach (SZI).'}
        </Text>
        <Text
          style={[
            globalStyles.informationStyles.paragraph,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Die Konzeption und Umsetzung erfolgte an der DHBW Lörrach durch Studierende im Rahmen von Studienarbeiten und Projekten am SZI unter Betreuung und Leitung von Ulrike Menke und Selina Quade (Konzeptgestaltung und Projektbetreuung) und Prof. Dr. Erik Behrends (technische Umsetzung).'
            : 'The conception and implementation was carried out at DHBW Lörrach by students as part of study projects and projects at SZI under the supervision and direction of Ulrike Menke and Selina Quade (concept design and project supervision) and Prof. Dr. Erik Behrends (technical implementation).'}
        </Text>
        <Text
          style={[
            globalStyles.informationStyles.paragraph,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Bisher haben folgende Studierende an der Entwicklung dieser App mitgewirkt:'
            : 'The following students have contributed to the development of this app so far:'}
          {'\n\t'}
          {language === 'de'
            ? 'Fabian Kaiser, Sophie Strittmatter (TIF20)'
            : 'Fabian Kaiser, Sophie Strittmatter (TIF20)'}
          {'\n\t'}
          {language === 'de'
            ? 'Patrick Furtwängler, Marvin Obert (TIF21)'
            : 'Patrick Furtwängler, Marvin Obert (TIF21)'}
          {'\n\t'}
          {language === 'de'
            ? 'Roman von Bosse, Leon Jegg (TIF22)'
            : 'Roman von Bosse, Leon Jegg (TIF22)'}
        </Text>
        <Text
          style={[
            globalStyles.informationStyles.paragraph,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.text,
            },
          ]}
        >
          {language === 'de'
            ? 'Die Campus Rallye App wird als Open Source Projekt kontinuierlich weiterentwickelt:'
            : 'The Campus Rallye App is continuously developed as an open source project:'}
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
