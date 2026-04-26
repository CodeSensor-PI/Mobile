import { Tabs } from 'expo-router';

import { IconSymbol } from './../../components/ui/icon-symbol';
import { Colors } from './../../constants/theme';
import { useColorScheme } from './../../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="paperplane.fill" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
