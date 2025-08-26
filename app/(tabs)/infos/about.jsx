import { Linking, View } from 'react-native';
import * as Application from 'expo-application';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';

const AppVersion = ({ isDarkMode }) => {
  let versionString = `Version: ${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`;
  return (
    <ThemedText style={globalStyles.informationStyles.paragraph}>
      {versionString}
    </ThemedText>
  );
};

export default function About() {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();

  return (
    <ThemedScrollView variant="background">
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
        <ThemedText style={globalStyles.informationStyles.paragraph}>
          {language === 'de'
            ? 'Die Idee zu dieser Campus Rallye App entstand aus einer Idee von Ulrike Menke, Managerin Studienzentrum IT-Management und Informatik der DHBW Lörrach (SZI).'
            : 'The idea for this Campus Rallye App came from an idea by Ulrike Menke, Manager of the IT Management and Computer Science Study Center at DHBW Lörrach (SZI).'}
        </ThemedText>
        <ThemedText style={globalStyles.informationStyles.paragraph}>
          {language === 'de'
            ? 'Die Konzeption und Umsetzung erfolgt an der DHBW Lörrach durch Studierende im Rahmen von Studienarbeiten und Projekten am SZI unter Betreuung und Leitung von Ulrike Menke (Konzeptgestaltung und Projektbetreuung) und Prof. Dr. Erik Behrends (technische Umsetzung).'
            : 'The conception and implementation is carried out at DHBW Lörrach by students as part of projects at SZI under the supervision and direction of Ulrike Menke (concept design and project supervision) and Prof. Dr. Erik Behrends (technical implementation).'}
        </ThemedText>
        <ThemedText style={globalStyles.informationStyles.paragraph}>
          {language === 'de'
            ? 'Ehemalige Beteiligte von Seiten der DHBW Lörrach: Selina Quade'
            : 'Former participants from DHBW Lörrach: Selina Quade'}
        </ThemedText>
        <ThemedText style={globalStyles.informationStyles.paragraph}>
          {language === 'de'
            ? 'Bisher haben folgende Studierende an der Entwicklung dieser App mitgewirkt:'
            : 'The following students have contributed to the development of this app so far:'}
          {'\n\t'}
          Fabian Kaiser, Sophie Strittmatter (TIF20)
          {'\n\t'}
          Patrick Furtwängler, Marvin Obert (TIF21)
          {'\n\t'}
          Roman von Bosse, Leon Jegg (TIF22)
        </ThemedText>
        <ThemedText style={globalStyles.informationStyles.paragraph}>
          {language === 'de'
            ? 'Die Campus Rallye App wird als Open Source Projekt kontinuierlich weiterentwickelt:'
            : 'The Campus Rallye App is continuously developed as an open source project:'}
          {'\n'}
          <ThemedText
            style={{ color: Colors.dhbwRed }}
            onPress={() =>
              Linking.openURL('https://github.com/DHBWLoerrach/CampusRallyeApp')
            }
          >
            https://github.com/DHBWLoerrach/CampusRallyeApp
          </ThemedText>
        </ThemedText>
        <AppVersion isDarkMode={isDarkMode} />
      </View>
    </ThemedScrollView>
  );
}
