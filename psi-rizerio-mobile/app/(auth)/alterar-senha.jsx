import React, { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { redefinirSenha } from '../../services/authService';

export default function AlterarSenhaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = useMemo(() => (typeof params.email === 'string' ? params.email : ''), [params.email]);
  const codigo = useMemo(() => (typeof params.codigo === 'string' ? params.codigo : ''), [params.codigo]);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [status, setStatus] = useState('normal');
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const checks = useMemo(() => {
    const source = novaSenha || '';
    return {
      length: source.length >= 12,
      lower: /[a-z]/.test(source),
      upper: /[A-Z]/.test(source),
      number: /[0-9]/.test(source),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(source),
    };
  }, [novaSenha]);

  const score = useMemo(() => {
    let total = 0;
    if (checks.length) total += 2;
    if (checks.lower) total += 1;
    if (checks.upper) total += 1;
    if (checks.number) total += 1;
    if (checks.special) total += 1;
    return Math.min(total, 5);
  }, [checks]);

  const strength = useMemo(() => {
    if (score >= 5) return 'forte';
    if (score >= 3) return 'media';
    if (score > 0) return 'fraca';
    return '';
  }, [score]);

  const passwordsMatch = useMemo(() => {
    return Boolean(novaSenha && confirmarSenha && novaSenha === confirmarSenha);
  }, [novaSenha, confirmarSenha]);

  const canSave = strength === 'forte' && passwordsMatch && status !== 'loading';

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const openError = (message, state = 'error') => {
    setStatus(state);
    setAlert({
      visible: true,
      title: 'Falha na alteracao',
      message,
      type: 'error',
    });
  };

  const handleSave = async () => {
    if (!email || !codigo) {
      openError('Informacoes incompletas. Volte e solicite novo codigo.', 'empty');
      return;
    }

    if (!novaSenha || !confirmarSenha) {
      openError('Preencha os dois campos de senha.', 'empty');
      return;
    }

    if (strength !== 'forte') {
      openError('A senha precisa ser forte para continuar.');
      return;
    }

    if (!passwordsMatch) {
      openError('As senhas nao coincidem.');
      return;
    }

    setStatus('loading');

    try {
      await redefinirSenha(codigo, novaSenha, 'psicologo');
      setStatus('success');
      setAlert({
        visible: true,
        title: 'Senha alterada',
        message: 'Senha atualizada com sucesso. Voce sera redirecionado para o login.',
        type: 'success',
      });
    } catch (error) {
      openError(error.message || 'Nao foi possivel redefinir a senha.');
    }
  };

  const handleCloseAlert = () => {
    const currentStatus = status;
    closeAlert();

    if (currentStatus === 'success') {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <Text style={styles.title}>Alterar Senha</Text>
          <Text style={styles.subtitle}>Digite sua nova senha para {email || 'sua conta'}.</Text>

          <AuthTextInput
            label="Nova senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder="Digite a nova senha"
            secureTextEntry
            showToggle
            isVisible={showNovaSenha}
            onToggleVisibility={() => setShowNovaSenha((prev) => !prev)}
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <AuthTextInput
            label="Confirmar senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Confirme a nova senha"
            secureTextEntry
            showToggle
            isVisible={showConfirmarSenha}
            onToggleVisibility={() => setShowConfirmarSenha((prev) => !prev)}
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {confirmarSenha ? (
            <Text style={[styles.matchText, { color: passwordsMatch ? '#16a34a' : '#ef4444' }]}>
              {passwordsMatch ? '✓ Senhas coincidem' : '✗ Senhas nao coincidem'}
            </Text>
          ) : null}

          <PasswordStrengthIndicator password={novaSenha} minLength={12} />

          <AuthButton
            label={status === 'loading' ? 'Alterando...' : 'Alterar Senha'}
            loading={status === 'loading'}
            disabled={!canSave}
            onPress={handleSave}
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
    fontSize: 36,
    fontWeight: '800',
    color: '#20262f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#5e6470',
    marginBottom: 22,
  },
  matchText: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#7b8190',
  },
});
