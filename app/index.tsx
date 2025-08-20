import { Redirect } from 'expo-router';
import { observer } from '@legendapp/state/react';
import { store$ } from '@/services/storage/Store';

const App = observer(function App() {
  const enabled = store$.enabled.get();
  console.log('enabled', enabled);
  return enabled ? <Redirect href="/(tabs)" /> : <Redirect href="/welcome" />;
});

export default App;
