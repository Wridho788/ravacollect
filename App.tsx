/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from './src/app/Store';
import { AppNavigator } from './src/app/AppNavigator';
import { RavaRepository } from './src/data/repository';

function App({
  repository,
  controls,
}: { repository?: RavaRepository; controls?: ReactNode } = {}) {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <StoreProvider suppliedRepository={repository}>
        <AppNavigator />
        {controls}
      </StoreProvider>
    </SafeAreaProvider>
  );
}

export default App;
