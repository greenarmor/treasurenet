import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapScreen } from '../screens/MapScreen';
import { HuntsScreen } from '../screens/HuntsScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1E293B',
            borderTopColor: '#334155',
          },
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: '#94A3B8',
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{ tabBarLabel: 'Map', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="Hunts"
          component={HuntsScreen}
          options={{ tabBarLabel: 'Hunts', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="Wallet"
          component={WalletScreen}
          options={{ tabBarLabel: 'Wallet', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ tabBarLabel: 'Rank', tabBarIcon: () => null }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: 'Profile', tabBarIcon: () => null }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
