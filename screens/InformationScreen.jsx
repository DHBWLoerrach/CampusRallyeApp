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
          Die Idee zu dieser Campus Rallye App entstand als Idee von
          Ulrike Menke, Managerin Studienzentrum IT-Management und
          Informatik der DHBW Lörrach (SZI). Die Konzeption und
          Umsetzung erfolgte an der DHBW Lörrach durch Studierende im
          Rahmen von Studienarbeiten und Projekten am SZI unter
          Betreuung und Leitung von Ulrike Menke und Selina Quade
          (Konzeptgestaltung und Projektbetreuung) und Prof. Dr. Erik
          Behrends (technische Umsetzung).
          {'\n\n'}
          Bisher haben folgende Studierende an der Entwicklung dieser
          App mitgewirkt:
          {'\n'}
          Patrick Furtwängler, Marvin Obert (TIF21)
          {'\n'}
          Fabian Kaiser, Sophie Strittmatter (TIF20)
          {'\n\n'}
          Die Campus Rallye App wird kontinuierlich weiterentwickelt.
          {'\n\n'}
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
