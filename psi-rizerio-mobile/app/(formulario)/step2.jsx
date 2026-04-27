import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from './_layout';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { AuthButton } from '../../components/ui/AuthButton';
import { ProgressBar } from '../../components/ui/progress-bar';
import { ThemedText } from '../../components/themed-text';
import { maskCEP } from '../../utils/masks';

export default function Step2() {
  const { data, updateData } = useForm();
  const router = useRouter();

  const canContinue = 
    data.cep.length === 9 && 
    data.address.length > 2 && 
    data.city.length > 2 && 
    data.state.length === 2;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ProgressBar steps={4} currentStep={2} activeColor="#6366f1" inactiveColor="#e2e8f0" />
          
          <ThemedText type="title" style={styles.title}>Endereço</ThemedText>
          <ThemedText style={styles.subtitle}>Onde você mora?</ThemedText>

          <AuthTextInput
            label="CEP"
            value={data.cep}
            onChangeText={(val) => updateData({ cep: maskCEP(val) })}
            placeholder="00000-000"
            keyboardType="number-pad"
          />
          
          <AuthTextInput
            label="Logradouro"
            value={data.address}
            onChangeText={(val) => updateData({ address: val })}
            placeholder="Rua, Avenida, etc."
          />

          <AuthTextInput
            label="Bairro"
            value={data.neighborhood}
            onChangeText={(val) => updateData({ neighborhood: val })}
            placeholder="Seu bairro"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AuthTextInput
                label="Cidade"
                value={data.city}
                onChangeText={(val) => updateData({ city: val })}
                placeholder="Cidade"
              />
            </View>
            <View style={{ width: 80 }}>
              <AuthTextInput
                label="UF"
                value={data.state}
                onChangeText={(val) => updateData({ state: val.toUpperCase().slice(0, 2) })}
                placeholder="UF"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <AuthButton 
              label="Próximo" 
              onPress={() => router.push('/(formulario)/step3')} 
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
