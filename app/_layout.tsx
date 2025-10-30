import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

// --- NEW FONT IMPORT METHOD ---
// This imports the font file directly as a module, which is a more robust
// loading method that can bypass stubborn caching issues.
// This requires the declarations.d.ts file to be present in your project root.
import OrbitronBlackFont from '../assets/fonts/Orbitron-Black.ttf';
// --- END NEW ---

import GigiSplashScreen from './components/GigiSplashScreen'; // Make sure this path is correct

// Prevent the native splash screen from auto-hiding before fonts and assets are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // This section is now updated to use the imported font module
  const [fontsLoaded, fontError] = useFonts({
    'Orbitron-Black': OrbitronBlackFont,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
    if (fontError) {
      console.error('FONT LOADING ERROR:', fontError);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Your existing splash screen logic remains the same.
  if (showCustomSplash) {
    return (
      <GigiSplashScreen
        onAnimationComplete={() => setShowCustomSplash(false)}
      />
    );
  }

  // After the splash animation is complete, render the main app.
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

