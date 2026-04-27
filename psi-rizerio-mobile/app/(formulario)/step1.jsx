import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from './_layout';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { AuthButton } from '../../components/ui/AuthButton';
import { ProgressBar } from '../../components/ui/progress-bar';
import { ThemedText } from '../../components/themed-text';
import { maskCPF, maskDate } from '../../utils/masks';

export default function Step1() {
  const { data, updateData } = useForm();
  const router = useRouter();

  const canContinue = 
    data.name.trim().length > 3 && 
    data.birthDate.length === 10 && 
    data.cpf.length === 14;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ProgressBar steps={4} currentStep={1} activeColor="#6366f1" inactiveColor="#e2e8f0" />
          
          <ThemedText type="title" style={styles.title}>Dados Pessoais</ThemedText>
          <ThemedText style={styles.subtitle}>Comece preenchendo seus dados básicos.</ThemedText>

          <AuthTextInput
            label="Nome Completo"
            value={data.name}
            onChangeText={(val) => updateData({ name: val })}
            placeholder="Seu nome completo"
          />
          
          <AuthTextInput
            label="Data de Nascimento"
            value={data.birthDate}
            onChangeText={(val) => updateData({ birthDate: maskDate(val) })}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
          />

          <AuthTextInput
            label="CPF"
            value={data.cpf}
            onChangeText={(val) => updateData({ cpf: maskCPF(val) })}
            placeholder="000.000.000-00"
            keyboardType="number-pad"
          />

          <View style={styles.actions}>
            <AuthButton 
              label="Próximo" 
              onPress={() => router.push('/(formulario)/step2')} 
              disabled={!canContinue}
            />
            <AuthButton 
              label="Cancelar" 
              variant="secondary" 
              onPress={() => router.replace('/(auth)/login')} 
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
