import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getPrimaryColorForRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;
  const session = getCurrentSession();
  const primaryColor = getPrimaryColorForRole(session?.usuario?.role);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'secondary' ? styles.secondary : styles.primary,
        variant === 'primary' ? { backgroundColor: primaryColor } : null,
        variant === 'secondary' ? { borderColor: primaryColor } : null,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? primaryColor : '#ffffff'} size="small" />
      ) : (
        <Text
          style={[
            styles.baseText,
            variant === 'secondary' ? styles.secondaryText : styles.primaryText,
            variant === 'secondary' ? { color: primaryColor } : null,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: '#6B4EB8',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#1f4ed8',
  },
  disabled: {
    opacity: 0.6,
  },
  baseText: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#1f4ed8',
  },
});
