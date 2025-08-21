import { Linking, ScrollView, Text, useColorScheme, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';

export default function Imprint() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { language } = useLanguage();

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
          globalStyles.imprintStyles.texts.container,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.background
              : Colors.lightMode.background,
          },
        ]}
      >
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text
            style={{
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            }}
          >
            Duale Hochschule Baden-Württemberg Lörrach
            {'\n'}
            Hangstraße 46-50
            {'\n'}
            79539 Lörrach
            {'\n'}
            Fon +49 7621 2071 - 0{'\n'}
            info@dhbw-loerrach.de
            {'\n'}
            http://www.dhbw-loerrach.de
            {'\n'}
            {'\n'}
            {language === 'de'
              ? 'Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz: DE287664832'
              : 'VAT identification number according to §27a VAT Act: DE287664832'}
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text
            style={[
              globalStyles.imprintStyles.texts.headline,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {language === 'de'
              ? 'Rechtsform und zuständige Aufsichtsbehörde'
              : 'Legal form and responsible supervisory authority'}
          </Text>
          <Text
            style={{
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            }}
          >
            {language === 'de'
              ? 'Die Duale Hochschule Baden-Württemberg ist nach § 1 Abs. 1 DH-ErrichtG vom 12.12.2008 eine rechtsfähige Körperschaft des öffentlichen Rechts und zugleich staatliche Einrichtung. Die Duale Hochschule Baden-Württemberg Lörrach ist nach § 1 Abs. 2 DH-ErrichtG vom 12.12.2008 eine rechtlich unselbständige Untereinheit dieser Hochschule.'
              : 'The Duale Hochschule Baden-Württemberg is a legal entity under public law and a state institution according to § 1 Abs. 1 DH-ErrichtG of 12.12.2008. The Duale Hochschule Baden-Württemberg Lörrach is a legally dependent subunit of this university according to § 1 Abs. 2 DH-ErrichtG of 12.12.2008.'}
            {'\n'}
            {'\n'}
            {language === 'de'
              ? 'Dienstanbieter im Sinne des TDG bzw. des MDStV ist als Träger der Dualen Hochschule das Land Baden-Württemberg vertreten durch die Ministerin für Wissenschaft, Forschung und Kunst Theresia Bauer, MdL.'
              : 'Service provider in the sense of the TDG or the MDStV is the state of Baden-Württemberg, represented by the Minister for Science, Research and Art Theresia Bauer, MdL.'}
            {'\n'}
            {'\n'}
            {language === 'de'
              ? 'Zuständige Aufsichtsbehörde:'
              : 'Responsible supervisory authority:'}
            {'\n'}
            {language === 'de'
              ? 'Ministerium für Wissenschaft, Forschung und Kunst'
              : 'Ministry of Science, Research and Art'}
            {'\n'}
            {language === 'de' ? 'Baden-Württemberg' : 'Baden-Württemberg'}
            {'\n'}
            {language === 'de' ? 'Königstraße 46' : 'Königstraße 46'}
            {'\n'}
            {language === 'de' ? '70173 Stuttgart' : '70173 Stuttgart\nGermany'}
            {'\n'}
            {language === 'de'
              ? 'Telefon: +49 711 279 - 0'
              : 'Phone: +49 711 279 - 0'}
            {'\n'}
            {language === 'de'
              ? 'Telefax: +49 711 279 - 3081'
              : 'Fax: +49 711 279 - 3081'}
            {'\n'}
            {language === 'de'
              ? 'poststelle@mwk.bwl.de'
              : 'poststelle@mwk.bwl.de'}
            {'\n'}
            {language === 'de'
              ? 'http://www.mwk.bwl.de'
              : 'http://www.mwk.bwl.de'}
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text
            style={[
              globalStyles.imprintStyles.texts.headline,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {language === 'de' ? 'Externe Links' : 'External links'}
          </Text>
          <Text
            style={{
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            }}
          >
            {language === 'de'
              ? 'Die Campus App enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben und für welche die DHBW Lörrach keine Gewähr übernehmen kann. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Es ist nicht auszuschließen, dass die Inhalte im Nachhinein von den jeweiligen Anbietern verändert werden. Sollten Sie der Ansicht sein, dass die verlinkten externen Seiten gegen geltendes Recht verstoßen oder sonst unangemessene Inhalte enthalten, teilen Sie uns dies bitte mit.'
              : 'The Campus App contains links to external third-party websites, over whose content we have no influence and for which DHBW Lörrach cannot assume any liability. The respective provider or operator of the pages is always responsible for the content of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognizable at the time of linking. It cannot be ruled out that the content will be changed by the respective providers afterwards. If you believe that the linked external pages violate applicable law or contain otherwise inappropriate content, please let us know.'}
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text
            style={[
              globalStyles.imprintStyles.texts.headline,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {language === 'de' ? 'Urheberrecht' : 'Copyright'}
          </Text>
          <Text
            style={{
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            }}
          >
            {language === 'de'
              ? 'Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden einer Urheberrechtsverletzung wird der Inhalte umgehend entfernt bzw. mit dem entsprechenden Urheberrechts-Vermerk kenntlich gemacht.'
              : 'Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. If you still become aware of a copyright infringement, please let us know. If we become aware of a copyright infringement, we will remove the content immediately or mark it with the appropriate copyright notice.'}
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text
            style={[
              globalStyles.imprintStyles.texts.headline,
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
            ]}
          >
            {language === 'de' ? 'Quellcode' : 'Source code'}
          </Text>
          <Text
            style={{
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
            }}
          >
            {language === 'de'
              ? 'Der Quellcode dieser App wurde als Open Source Projekt angelegt'
              : 'The source code of this app was created as an open source project'}
          </Text>
          <Text
            style={{ color: Colors.dhbwRed }}
            onPress={() =>
              Linking.openURL('https://github.com/DHBWLoerrach/CampusRallyeApp')
            }
          >
            https://github.com/DHBWLoerrach/CampusRallyeApp
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
