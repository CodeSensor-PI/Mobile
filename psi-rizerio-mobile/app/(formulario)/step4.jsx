import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from './_layout';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { AuthButton } from '../../components/ui/AuthButton';
import { ProgressBar } from '../../components/ui/progress-bar';
import { ThemedText } from '../../components/themed-text';
import { registerPatient } from '../../services/authService';

export default function Step4() {
  const { data, updateData } = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canContinue = data.reason.trim().length > 5;

  const handleFinish = async () => {
    setLoading(true);
    try {
      const registrationData = {
        name: data.name,
        email: `${data.cpf.replace(/\D/g, '')}@psirizerio.com`,
        password: 'Senha@123', 
        birthDate: data.birthDate.split('/').reverse().join('-'),
        cpf: data.cpf,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        cep: data.cep,
      };

      await registerPatient(registrationData);
      Alert.alert(
        'Sucesso!', 
        'Cadastro realizado com sucesso! Use seu CPF para logar com a senha Senha@123',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ProgressBar steps={4} currentStep={4} activeColor="#6366f1" inactiveColor="#e2e8f0" />
          
          <ThemedText type="title" style={styles.title}>Motivo da Consulta</ThemedText>
          <ThemedText style={styles.subtitle}>O que te trouxe até aqui hoje?</ThemedText>

          <AuthTextInput
            label="Descreva brevemente"
            value={data.reason}
            onChangeText={(val) => updateData({ reason: val })}
            placeholder="Ex: Gostaria de tratar ansiedade..."
            multiline
            numberOfLines={4}
            style={{ height: 120, textAlignVertical: 'top' }}
          />

          <View style={styles.actions}>
            <AuthButton 
              label={loading ? "Finalizando..." : "Finalizar Cadastro"} 
              onPress={handleFinish} 
              disabled={!canContinue || loading}
              loading={loading}
            />
            <AuthButton 
              label="Voltar" 
              variant="secondary" 
              onPress={() => router.back()} 
              disabled={loading}
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
