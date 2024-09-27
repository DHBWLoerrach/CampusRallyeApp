import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './ui/MainTabs';
import ImprintScreen from './screens/ImprintScreen';
import InformationScreen from './screens/InformationScreen';
import SkillQuestions from './screens/questions/SkillQuestions';
import UploadQuestions from './screens/questions/UploadQuestions';
import QRCodeQuestions from './screens/questions/QRCodeQuestions';
import Color from './utils/Colors';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Color.dhbwRed },
        headerTintColor: Color.tabHeader,
      }}
    >
      <Stack.Screen
        name="Rallye"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Impressum" component={ImprintScreen} />
      <Stack.Screen
        name="Informationen"
        component={InformationScreen}
      />
      <Stack.Screen name="Wissensfragen" component={SkillQuestions} />
      <Stack.Screen
        name="ImageQuestions"
        component={UploadQuestions}
      />
      <Stack.Screen
        name="QRCodeQuestions"
        component={QRCodeQuestions}
      />
    </Stack.Navigator>
  );
}
