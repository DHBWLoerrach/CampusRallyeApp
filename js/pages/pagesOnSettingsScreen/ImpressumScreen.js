import React from 'react';
import {Linking, ScrollView, View, Text, StyleSheet } from 'react-native';
import Colors from '../../styles/Colors';

export default function ImpressumScreen() {
  return (
    <ScrollView>
      <View style={Styles.Texts.container}>
        <View style={Styles.Texts.block}>
          <Text>
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
        <View style={Styles.Texts.block}>
          <Text style={Styles.Texts.headline}>
            Rechtsform und zuständige Aufsichtsbehörde
          </Text>
          <Text>
            Die Duale Hochschule Baden-Württemberg ist nach § 1 Abs. 1
            DH-ErrichtG vom 12.12.2008 eine rechtsfähige Körperschaft
            des öffentlichen Rechts und zugleich staatliche Einrichtung.
            Die Duale Hochschule Baden-Württemberg Lörrach ist nach § 1
            Abs. 2 DH-ErrichtG vom 12.12.2008 eine rechtlich
            unselbständige Untereinheit dieser Hochschule.
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
        <View style={Styles.Texts.block}>
          <Text style={Styles.Texts.headline}>Externe Links</Text>
          <Text>
            Die Campus App enthält Links zu externen Webseiten Dritter,
            auf deren Inhalte wir keinen Einfluss haben und für welche
            die DHBW Lörrach keine Gewähr übernehmen kann. Für die
            Inhalte der verlinkten Seiten ist stets der jeweilige
            Anbieter oder Betreiber der Seiten verantwortlich. Die
            verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
            mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte
            waren zum Zeitpunkt der Verlinkung nicht erkennbar. Es ist
            nicht auszuschließen, dass die Inhalte im Nachhinein von den
            jeweiligen Anbietern verändert werden. Sollten Sie der
            Ansicht sein, dass die verlinkten externen Seiten gegen
            geltendes Recht verstoßen oder sonst unangemessene Inhalte
            enthalten, teilen Sie uns dies bitte mit.
          </Text>
        </View>
        <View style={Styles.Texts.block}>
          <Text style={Styles.Texts.headline}>Urheberrecht</Text>
          <Text>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber
            erstellt wurden, werden die Urheberrechte Dritter beachtet.
            Insbesondere werden Inhalte Dritter als solche
            gekennzeichnet. Sollten Sie trotzdem auf eine
            Urheberrechtsverletzung aufmerksam werden, bitten wir um
            einen entsprechenden Hinweis. Bei Bekanntwerden einer
            Urheberrechtsverletzung wird der Inhalte umgehend entfernt
            bzw. mit dem entsprechenden Urheberrechts-Vermerk kenntlich
            gemacht.
          </Text>
        </View>
        <View style={Styles.Texts.block}>
          <Text style={Styles.Texts.headline}>Quellcode</Text>
          <Text>
            Der Quellcode dieser App wurde als Open Source Projekt angelegt
          </Text>
          <Text
            style={{color: Colors.dhbwRed}}
            onPress={() =>
              Linking.openURL(
                'https://github.com/sophieStrittti/DHBW_CampusRallyeApp'
              )
            }
          >
            https://github.com/sophieStrittti/DHBW_CampusRallyeApp
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const Styles = StyleSheet.create({
  //New Styles
  textSizes: {
    small: {
      fontSize: 15,
    },
    medium: {
      fontSize: 25,
    },
    dialog: {
      fontSize: 18,
    },
  },
  button: {
    container: {
      backgroundColor: Colors.dhbwRed,
      alignItems: 'center',
    },
    text: {
      color: 'white',
    },
    disabled: {
      backgroundColor: 'grey',
    },
    sizes: {
      small: {
        padding: 10,
        borderRadius: 5,
      },
      medium: {
        padding: 10,
        borderRadius: 5,
      },
      dialog: {
        padding: 10,
        borderRadius: 3,
        marginLeft: 7,
      },
    },
  },
  Texts: {
    container: {
      padding: 15,
    },
    block: {
      marginBottom: 20,
    },
    quote: {
      fontStyle: 'italic',
      marginHorizontal: 15,
    },
    headline: {
      fontSize: 20,
    },
    link: {
      color: Colors.link,
    },
  },
});