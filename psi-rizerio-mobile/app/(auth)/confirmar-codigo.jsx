import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { CodeInput } from '../../components/ui/CodeInput';
import { solicitarCodigoRecuperacao, validarCodigoRecuperacao } from '../../services/authService';

export default function ConfirmarCodigoScreen() {
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
      title: 'Codigo invalido',
      message,
      type: 'error',
    });
  };

  const handleConfirm = async () => {
    if (!email) {
      openError('Email nao informado. Retorne e solicite um novo codigo.', 'empty');
      return;
    }

    if (codigo.length !== 6) {
      openError('Digite os 6 digitos para continuar.', 'empty');
      return;
    }

    setStatus('loading');

    try {
      await validarCodigoRecuperacao(email, codigo, 'psicologo');
      setStatus('success');
      setAlert({
        visible: true,
        title: 'Codigo confirmado',
        message: 'Agora voce pode cadastrar sua nova senha.',
        type: 'success',
      });
    } catch (error) {
      openError(error.message || 'Falha ao validar codigo.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      openError('Email nao informado para reenvio.', 'empty');
      return;
    }

    setStatus('loading');

    try {
      await solicitarCodigoRecuperacao(email, 'psicologo');
      setStatus('success');
      setAlert({
        visible: true,
        title: 'Codigo reenviado',
        message: 'Confira seu e-mail e tente novamente.',
        type: 'success',
      });
    } catch (error) {
      openError(error.message || 'Nao foi possivel reenviar o codigo.');
    }
  };

  const handleCloseAlert = () => {
    const currentStatus = status;
    closeAlert();

    if (currentStatus === 'success' && codigo.length === 6) {
      router.push({
        pathname: '/(auth)/alterar-senha',
        params: {
          email,
          codigo,
        },
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

          <Text style={styles.title}>Confirme o Codigo</Text>
          <Text style={styles.subtitle}>Digite o codigo de 6 digitos enviado para {email || 'seu e-mail'}.</Text>

          <CodeInput value={codigo} onChange={setCodigo} editable={status !== 'loading'} />

          <AuthButton
            label={status === 'loading' ? 'Confirmando...' : 'Confirmar'}
            loading={status === 'loading'}
            onPress={handleConfirm}
            style={styles.button}
          />

          <Pressable onPress={handleResend}>
            <Text style={styles.reSendText}>Nao recebi o codigo</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(auth)/confirmar-codigo-new',
                params: email ? { email } : {},
              })
            }
          >
            <Text style={styles.altFlowText}>Abrir fluxo ConfirmarCodigoNew</Text>
          </Pressable>
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
    fontSize: 36,
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
    marginTop: 18,
  },
  reSendText: {
    marginTop: 14,
    color: '#24408f',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 17,
  },
  altFlowText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
});
