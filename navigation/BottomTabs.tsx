import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Home from '../screens/Home';
import Challenge from '../screens/Challenge';
import Battles from '../screens/Battles';
import Profile from '../screens/Profile';
import SupabaseTest from '../screens/SupabaseTest';


const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Challenge') iconName = 'flame';
            else if (route.name === 'Battles') iconName = 'list';
            else iconName = 'person';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Challenge" component={Challenge} />
        <Tab.Screen name="Battles" component={Battles} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
  );
}
