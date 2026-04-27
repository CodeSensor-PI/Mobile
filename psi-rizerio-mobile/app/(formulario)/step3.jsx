import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from './_layout';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { AuthButton } from '../../components/ui/AuthButton';
import { ProgressBar } from '../../components/ui/progress-bar';
import { ThemedText } from '../../components/themed-text';
import { maskPhone } from '../../utils/masks';

export default function Step3() {
  const { data, updateData } = useForm();
  const router = useRouter();

  const canContinue = 
    data.phone.length >= 14 && 
    data.emergencyContact.trim().length > 3 && 
    data.emergencyPhone.length >= 14;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ProgressBar steps={4} currentStep={3} activeColor="#6366f1" inactiveColor="#e2e8f0" />
          
          <ThemedText type="title" style={styles.title}>Contatos</ThemedText>
          <ThemedText style={styles.subtitle}>Como podemos falar com você?</ThemedText>

          <AuthTextInput
            label="Seu Telefone"
            value={data.phone}
            onChangeText={(val) => updateData({ phone: maskPhone(val) })}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
          />
          
          <AuthTextInput
            label="Contato de Emergência (Nome)"
            value={data.emergencyContact}
            onChangeText={(val) => updateData({ emergencyContact: val })}
            placeholder="Nome de um contato próximo"
          />

          <AuthTextInput
            label="Telefone de Emergência"
            value={data.emergencyPhone}
            onChangeText={(val) => updateData({ emergencyPhone: maskPhone(val) })}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
          />

          <View style={styles.actions}>
            <AuthButton 
              label="Próximo" 
              onPress={() => router.push('/(formulario)/step4')} 
              disabled={!canContinue}
            />
            <AuthButton 
              label="Voltar" 
              variant="secondary" 
              onPress={() => router.back()} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, gap: 16 },
  title: { marginTop: 16 },
  subtitle: { color: '#64748b', marginBottom: 12 },
  actions: { marginTop: 24, gap: 12 },
});
