import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import Swipe from '../screens/Swipe';
import BattleRoom from '../screens/BattleRoom';
import SupabaseTest from '../screens/SupabaseTest';
import VotingScreen from '../screens/VotingScreen';
import Profile from '../screens/Profile';

export type RootStackParamList = {
  Tabs: undefined;
  Swipe: { mode: 'freestyle' | 'longform' };
  BattleRoom: { mode: 'freestyle' | 'longform'; opponent: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen name="Swipe" component={Swipe} />
      <Stack.Screen name="BattleRoom" component={BattleRoom} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}
