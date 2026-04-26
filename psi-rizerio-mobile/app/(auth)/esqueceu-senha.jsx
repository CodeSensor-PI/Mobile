import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { solicitarCodigoRecuperacao } from '../../services/authService';

export default function EsqueceuSenhaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [status, setStatus] = useState('normal');
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const openError = (message, state = 'error') => {
    setStatus(state);
    setAlert({
      visible: true,
      title: 'Erro',
      message,
      type: 'error',
    });
  };

  const handleSendCode = async () => {
    if (!email) {
      openError('Informe seu e-mail para receber o codigo.', 'empty');
      return;
    }

    setStatus('loading');

    try {
      await solicitarCodigoRecuperacao(email.trim(), 'psicologo');
      setStatus('success');
      setAlert({
        visible: true,
        title: 'Codigo enviado',
        message: 'Enviamos um codigo de 6 digitos para seu e-mail.',
        type: 'success',
      });
    } catch (error) {
      openError(error.message || 'Nao foi possivel enviar o codigo.');
    }
  };

  const handleCloseAlert = () => {
    const currentStatus = status;
    closeAlert();

    if (currentStatus === 'success') {
      router.push({
        pathname: '/(auth)/confirmar-codigo',
        params: { email },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>

            <Text style={styles.title}>Esqueceu a Senha?</Text>
            <Text style={styles.subtitle}>Digite seu e-mail para receber o codigo de recuperacao.</Text>

            <AuthTextInput
              label="Endereco de Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <AuthButton
              label={status === 'loading' ? 'Enviando...' : 'Enviar Codigo'}
              loading={status === 'loading'}
              onPress={handleSendCode}
              style={styles.button}
            />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={handleCloseAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f3f7',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  backText: {
    color: '#24408f',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 18,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#20262f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#5e6470',
    marginBottom: 24,
  },
  button: {
    marginTop: 10,
  },
  footerHint: {
    marginTop: 16,
    textAlign: 'center',
    color: '#7b8190',
  },
});
