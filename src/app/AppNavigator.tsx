import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Routes } from './routes';
import { Home } from './Home';
import { Checkout, Credits, Detail, Listing, Settings } from './ProductScreens';
import { colors as c } from '../shared/theme';
const Stack = createNativeStackNavigator<Routes>();
export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: c.background,
          card: c.background,
          text: c.text,
          primary: c.lime,
          border: c.line,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: c.text,
          headerTitleStyle: { fontSize: 16 },
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Detail"
          component={Detail}
          options={{ title: 'Detail karya' }}
        />
        <Stack.Screen
          name="Checkout"
          component={Checkout}
          options={{ title: 'Tinjau koleksi', gestureEnabled: false }}
        />
        <Stack.Screen
          name="Listing"
          component={Listing}
          options={{ title: 'Listing lokal' }}
        />
        <Stack.Screen
          name="Credits"
          component={Credits}
          options={{ title: 'Kredit demo' }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ title: 'Pengaturan' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
