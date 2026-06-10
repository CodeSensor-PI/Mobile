import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, useColorScheme } from 'react-native';
import { ThemedText } from './../../components/themed-text';
import { ThemedView } from './../../components/themed-view';
import { Colors } from './../../constants/theme';
import { IconSymbol } from './../../components/ui/icon-symbol';
import { CustomAlert } from './../../components/CustomAlert';
import { useRouter } from 'expo-router';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);

  const handleSave = () => {
    setAlertVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Senha Atual</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Digite sua senha atual"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Nova Senha</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Digite a nova senha"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Confirmar Nova Senha</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirme a nova senha"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]} 
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>Alterar Senha</ThemedText>
        </TouchableOpacity>
      </View>

      <CustomAlert 
        visible={alertVisible}
        title="Sucesso"
        message="Sua senha foi alterada com sucesso!"
        onClose={() => {
          setAlertVisible(false);
          router.back();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  saveButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
