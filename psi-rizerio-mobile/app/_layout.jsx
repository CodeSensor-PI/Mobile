import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { isPsicologoRole } from './../constants/role-theme';
import { useColorScheme } from './../hooks/use-color-scheme';
import { getCurrentSession } from './../services/authService';

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
