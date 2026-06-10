import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { CodeInput } from '../../components/ui/CodeInput';
import { validarCodigoRecuperacao } from '../../services/authService';

export default function ConfirmarCodigoNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = useMemo(() => (typeof params.email === 'string' ? params.email : ''), [params.email]);

  const [codigo, setCodigo] = useState('');
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

  const handleValidate = async () => {
    if (!email) {
      openError('Email nao informado para validacao.', 'empty');
      return;
    }

    if (codigo.length !== 6) {
      openError('Digite o codigo completo para continuar.', 'empty');
      return;
    }

    setStatus('loading');

    try {
      await validarCodigoRecuperacao(email, codigo, 'psicologo');
      setStatus('success');
      setAlert({
        visible: true,
        title: 'Sucesso',
        message: 'Codigo validado com sucesso!',
        type: 'success',
      });
    } catch (error) {
      openError(error.message || 'Falha na validacao.');
    }
  };

  const handleCloseAlert = () => {
    const currentStatus = status;
    closeAlert();

    if (currentStatus === 'success') {
      router.push({
        pathname: '/(auth)/alterar-senha',
        params: { email, codigo },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <Text style={styles.title}>Confirmar Codigo New</Text>
          <Text style={styles.subtitle}>Fluxo alternativo para validacao de codigo de recuperacao.</Text>

          <CodeInput value={codigo} onChange={setCodigo} editable={status !== 'loading'} />

          <AuthButton
            label={status === 'loading' ? 'Validando...' : 'Validar Codigo'}
            loading={status === 'loading'}
            onPress={handleValidate}
            style={styles.button}
          />

          <Text style={styles.statusText}>Estado atual: {status === 'empty' ? 'vazio' : status}</Text>
        </View>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  backText: {
    color: '#24408f',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#20262f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#5e6470',
    marginBottom: 24,
  },
  button: {
    marginTop: 20,
  },
  statusText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#7b8190',
  },
});
