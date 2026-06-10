import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { useThemeColor } from '../../hooks/use-theme-color';

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  style 
}) {
  const isPrimary = variant === 'primary';

  // Buscando as cores semânticas do tema
  const primaryBg = useThemeColor({}, 'buttonPrimary');
  const primaryText = useThemeColor({}, 'buttonPrimaryText');
  const outlineBorder = useThemeColor({}, 'buttonOutline');
  const outlineText = useThemeColor({}, 'buttonOutlineText');

  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.base, 
        isPrimary 
          ? { backgroundColor: primaryBg } 
          : { backgroundColor: 'transparent', borderWidth: 2, borderColor: outlineBorder },
        style
      ]}
    >
      <ThemedText style={[
        styles.text, 
        { color: isPrimary ? primaryText : outlineText }
      ]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});