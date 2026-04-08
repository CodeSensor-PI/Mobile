import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { loginPsicologo } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('normal');
  const [successRoute, setSuccessRoute] = useState('');
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
    setSuccessRoute('');
    setAlert({
      visible: true,
      title: 'Nao foi possivel entrar',
      message,
      type: 'error',
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      openError('Preencha e-mail e senha para continuar.', 'empty');
      return;
    }

    setStatus('loading');

    try {
      const session = await loginPsicologo(email.trim(), password);
      const role = session?.usuario?.role || session?.usuario?.fkRoles || {};
      const roleId = Number(role?.id);
      const roleName = String(role?.role || role || '').trim().toUpperCase();

      const nextRoute =
        roleId === 1 || roleName === 'PSICOLOGO'
          ? '/(drawer)'
          : roleId === 3 || roleName === 'PSICOLOGO_ASSISTENTE'
            ? '/(drawer)'
            : roleId === 2 || roleName === 'CLIENTE'
              ? '/(drawer)'
            : '';

      if (!nextRoute) {
        openError('Perfil sem acesso ao aplicativo.', 'error');
        return;
      }

      setStatus('success');
      setSuccessRoute(nextRoute);
      setAlert({
        visible: true,
        title: 'Sucesso',
        message: `Bem-vindo, ${session?.usuario?.nome || 'usuário'}!`,
        type: 'success',
      });
    } catch (error) {
      openError(error.message || 'Falha no login. Tente novamente.');
    }
  };

  const handleAlertClose = () => {
    const currentStatus = status;
    const route = successRoute;
    closeAlert();

    if (currentStatus === 'success' && route) {
      router.replace(route);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Bem vindo de Volta!</Text>
            <Text style={styles.subtitle}>Por favor, entre para continuar.</Text>

            <View style={styles.form}>
              <AuthTextInput
                label="Endereco de Email"
                value={email}
                onChangeText={setEmail}
                placeholder="exemplo@exemplo.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <AuthTextInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder=" "
                secureTextEntry
                showToggle
                isVisible={showPassword}
                onToggleVisibility={() => setShowPassword((prev) => !prev)}
                autoComplete="password"
                textContentType="password"
              />

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/esqueceu-senha',
                    params: email ? { email } : {},
                  })
                }
              >
                <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
              </Pressable>

              <AuthButton
                label={status === 'loading' ? 'Entrando...' : 'Entrar'}
                loading={status === 'loading'}
                onPress={handleLogin}
                style={styles.primaryButton}
              />

              <View style={styles.divider} />
              <Text style={styles.altText}>Ou entre com:</Text>

              <AuthButton
                label="Google"
                variant="secondary"
                onPress={() => openError('Login social ainda nao esta disponivel.', 'error')}
                style={styles.googleButton}
                textStyle={styles.googleText}
              />

              <Pressable onPress={() => router.push('/(auth)/esqueceu-senha')}>
                <Text style={styles.signUpText}>Nao possui conta ainda? Cadastre-se</Text>
              </Pressable>
            </View>

            <View style={styles.decorativeWrap} pointerEvents="none">
              <View style={styles.decorativeCircle} />
              <View style={styles.decorativeCircleMirror} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={handleAlertClose}
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#20262f',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    textAlign: 'center',
    fontSize: 22,
    color: '#5e6470',
  },
  form: {
    position: 'relative',
  },
  hint: {
    marginTop: -2,
    color: '#737986',
    fontSize: 14,
  },
  forgotPassword: {
    marginTop: 8,
    alignSelf: 'flex-end',
    color: '#24408f',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 14,
  },
  divider: {
    marginTop: 24,
    height: 1,
    backgroundColor: '#d9dce5',
  },
  altText: {
    marginTop: 22,
    marginBottom: 12,
    color: '#4b5563',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  googleButton: {
    borderRadius: 4,
    minHeight: 52,
  },
  googleText: {
    fontWeight: '600',
  },
  signUpText: {
    marginTop: 26,
    textAlign: 'center',
    color: '#24408f',
    fontSize: 18,
    fontWeight: '500',
  },
  decorativeWrap: {
    position: 'absolute',
    top: 380,
    right: 108,
    width: 120,
    height: 96,
    opacity: 0.42,
  },
  decorativeCircle: {
    width: 64,
    height: 90,
    borderWidth: 2,
    borderColor: '#9b7cf2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    transform: [{ rotate: '-22deg' }],
  },
  decorativeCircleMirror: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 64,
    height: 90,
    borderWidth: 2,
    borderColor: '#9b7cf2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    transform: [{ rotate: '22deg' }],
  },
});
