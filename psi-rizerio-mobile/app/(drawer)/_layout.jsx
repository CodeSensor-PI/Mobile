import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { CustomDrawerContent } from './../../components/CustomDrawerContent';
import { Colors } from './../../constants/theme';
import { useColorScheme } from './../../hooks/use-color-scheme';
import { IconSymbol } from './../../components/ui/icon-symbol';

export default function DrawerLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#C0ADEF',
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: '#FFF',
        headerTitleAlign: 'center',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Meus Agendamentos',
          drawerLabel: 'Home',
          drawerIcon: ({ size, color }) => <IconSymbol name="house" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Configurações',
          drawerLabel: 'Configurações',
          drawerIcon: ({ size, color }) => <IconSymbol name="gear" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="feedback"
        options={{
          title: 'Feedbacks',
          drawerLabel: 'Feedbacks',
          drawerIcon: ({ size, color }) => <IconSymbol name="doc.text" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="change-password"
        options={{
          title: 'Alterar Senha',
          drawerLabel: 'Alterar Senha',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="logout"
        options={{
          title: 'Sair',
          drawerLabel: 'Sair',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
