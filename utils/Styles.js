import { StyleSheet } from 'react-native';
import Colors from './Colors';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  bigText: {
    color: Colors.dhbwGray,
    fontSize: 30,
    textAlign: 'center',
  },
  refreshContainer: {
    flexGrow: 1,
  },
});
