import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';

const linking = {
  prefixes: ['barsapp://'],
  config: {
    screens: {
      Home: 'home',
      Profile: 'profile',
      Challenge: 'challenge',
      BattleRoom: 'battleroom',
      Voting: 'voting/:battleId',
      // add others if needed
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
