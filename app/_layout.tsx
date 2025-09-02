import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '../contexts/AppContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        // On web, we don't need to load fonts the same way
        if (Platform.OS === 'web') {
          // Just hide splash screen immediately for web
          setTimeout(() => {
            SplashScreen.hideAsync();
          }, 100);
        } else {
          // For mobile, you could load fonts here if needed
          SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn('Error in layout preparation:', e);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AppProvider>
  );
}
