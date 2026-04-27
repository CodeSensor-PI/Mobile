import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isPsicologoRole } from './../constants/role-theme';
import { useColorScheme } from './../hooks/use-color-scheme';
import { getCurrentSession, restoreAuthSession } from './../services/authService';

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      await restoreAuthSession();
      setIsReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const session = getCurrentSession();
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(drawer)');
    }
  }, [isReady, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const session = getCurrentSession();
  const role = session?.usuario?.role || session?.usuario?.fkRoles;
  const isPsicologo = isPsicologoRole(role);
  const selectedTheme = isPsicologo || colorScheme !== 'dark' ? DefaultTheme : DarkTheme;

  return (
    <ThemeProvider value={selectedTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isPsicologo ? 'dark' : 'auto'} />
    </ThemeProvider>
  );
}
