import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AuthTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  showToggle = false,
  isVisible = false,
  onToggleVisibility,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  maxLength,
  editable = true,
}) {
  const shouldShowToggle = showToggle && Platform.OS !== 'web';

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8f93a1"
          secureTextEntry={secureTextEntry && !isVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          editable={editable}
          accessibilityLabel={label || placeholder}
        />

        {shouldShowToggle ? (
          <TouchableOpacity
            onPress={onToggleVisibility}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9dee7',
    backgroundColor: '#eef1f6',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
});
