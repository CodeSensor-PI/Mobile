import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="esqueceu-senha" />
      <Stack.Screen name="confirmar-codigo" />
      <Stack.Screen name="confirmar-codigo-new" />
      <Stack.Screen name="alterar-senha" />
    </Stack>
  );
}
