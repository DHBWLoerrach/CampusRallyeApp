import {
  View,
  Text,
  Linking,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Colors from '../utils/Colors';

export default function InformationScreen() {
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text>
          Die Idee zu dieser Campus Rallye App entstand als Idee der
          Managerin des Studienzentrums IT-Management und Informatik
          der DHBW Lörrach Ulrike Menke. Die Konzeption und Umsetzung
          erfolgte an der DHBW Lörrach im Rahmen eines Projekts für
          die Studienarbeit des Studiengangs Informatik durch
          Studierende unter Betreuung und Leitung von Ulrike Menke
          (Konzeptgestaltung und Projektbetreuung) und Prof. Dr. Erik
          Behrends (technische Umsetzung).
          {'\n'}
          {'\n'}
          Die Campus Rallye App soll kontinuierlich weiterentwickelt
          werden.
          {'\n'}
          {'\n'}
          Die App ist ein Open Source Projekt:
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
        <Text>
          {'\n'}
          Version (App): 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
});
