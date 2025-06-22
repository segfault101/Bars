// RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import BattleRoom from '../screens/BattleRoom';
import VotingScreen from '../screens/VotingScreen';
import ResetPassword from '../screens/ResetPassword';
import NewPassword from '../screens/NewPassword';
import Swipe from '../screens/Swipe';
import ChallengeConfirmScreen from '../screens/ChallengeConfirmScreen';
import Battles from "../screens/Battles";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main app with bottom tabs */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* Special screens that sit outside tabs */}
      <Stack.Screen name="BattleRoom" component={BattleRoom} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="NewPassword" component={NewPassword} />
      <Stack.Screen name="Swipe" component={Swipe} />
      <Stack.Screen name="ChallengeConfirm" component={ChallengeConfirmScreen} />
      <Stack.Screen name="Battles" component={Battles} />

    </Stack.Navigator>
  );
}
