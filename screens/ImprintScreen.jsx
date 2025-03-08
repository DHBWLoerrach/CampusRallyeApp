import {
  Linking,
  ScrollView,
  View,
  Text,
} from 'react-native';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';
import { useContext } from 'react';
import { ThemeContext } from '../utils/ThemeContext';

export default function ImprintScreen() {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView style={{ backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background }}>
      <View style={[
        globalStyles.imprintStyles.texts.container,
        { backgroundColor: isDarkMode ? Colors.darkMode.background : Colors.lightMode.background },
      ]}>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text style={{ color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }}>
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
            Umsatzsteuer-Identifikationsnummer gemäß §27a
            Umsatzsteuergesetz: DE287664832
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text style={[
            globalStyles.imprintStyles.texts.headline,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            Rechtsform und zuständige Aufsichtsbehörde
          </Text>
          <Text style={{ color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }}>
            Die Duale Hochschule Baden-Württemberg ist nach § 1 Abs. 1
            DH-ErrichtG vom 12.12.2008 eine rechtsfähige Körperschaft
            des öffentlichen Rechts und zugleich staatliche
            Einrichtung. Die Duale Hochschule Baden-Württemberg
            Lörrach ist nach § 1 Abs. 2 DH-ErrichtG vom 12.12.2008
            eine rechtlich unselbständige Untereinheit dieser
            Hochschule.
            {'\n'}
            {'\n'}
            Dienstanbieter im Sinne des TDG bzw. des MDStV ist als
            Träger der Dualen Hochschule das Land Baden-Württemberg
            vertreten durch die Ministerin für Wissenschaft, Forschung
            und Kunst Theresia Bauer, MdL.
            {'\n'}
            {'\n'}
            Zuständige Aufsichtsbehörde:
            {'\n'}
            Ministerium für Wissenschaft, Forschung und Kunst
            {'\n'}
            Baden-Württemberg
            {'\n'}
            Königstraße 46
            {'\n'}
            70173 Stuttgart
            {'\n'}
            Telefon: +49 711 279 - 0{'\n'}
            Telefax: +49 711 279 - 3081
            {'\n'}
            poststelle@mwk.bwl.de
            {'\n'}
            http://www.mwk.bwl.de
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text style={[
            globalStyles.imprintStyles.texts.headline,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            Externe Links
          </Text>
          <Text style={{ color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }}>
            Die Campus App enthält Links zu externen Webseiten
            Dritter, auf deren Inhalte wir keinen Einfluss haben und
            für welche die DHBW Lörrach keine Gewähr übernehmen kann.
            Für die Inhalte der verlinkten Seiten ist stets der
            jeweilige Anbieter oder Betreiber der Seiten
            verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt
            der Verlinkung auf mögliche Rechtsverstöße überprüft.
            Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung
            nicht erkennbar. Es ist nicht auszuschließen, dass die
            Inhalte im Nachhinein von den jeweiligen Anbietern
            verändert werden. Sollten Sie der Ansicht sein, dass die
            verlinkten externen Seiten gegen geltendes Recht verstoßen
            oder sonst unangemessene Inhalte enthalten, teilen Sie uns
            dies bitte mit.
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text style={[
            globalStyles.imprintStyles.texts.headline,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            Urheberrecht
          </Text>
          <Text style={{ color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }}>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber
            erstellt wurden, werden die Urheberrechte Dritter
            beachtet. Insbesondere werden Inhalte Dritter als solche
            gekennzeichnet. Sollten Sie trotzdem auf eine
            Urheberrechtsverletzung aufmerksam werden, bitten wir um
            einen entsprechenden Hinweis. Bei Bekanntwerden einer
            Urheberrechtsverletzung wird der Inhalte umgehend entfernt
            bzw. mit dem entsprechenden Urheberrechts-Vermerk
            kenntlich gemacht.
          </Text>
        </View>
        <View style={globalStyles.imprintStyles.texts.block}>
          <Text style={[
            globalStyles.imprintStyles.texts.headline,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}>
            Quellcode
          </Text>
          <Text style={{ color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text }}>
            Der Quellcode dieser App wurde als Open Source Projekt
            angelegt
          </Text>
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
        </View>
      </View>
    </ScrollView>
  );
}
