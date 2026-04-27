import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'psi_session';
const isWeb = Platform.OS === 'web';

let currentSession = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function setSession(session) {
  currentSession = session ? clone(session) : null;
  const sessionStr = JSON.stringify(session);

  if (isWeb) {
    if (session) {
      localStorage.setItem(SESSION_KEY, sessionStr);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    return;
  }

  if (session) {
    SecureStore.setItemAsync(SESSION_KEY, sessionStr).catch((error) => {
      console.error('[SecureStore] Erro ao salvar sessão:', error);
    });
    return;
  }

  SecureStore.deleteItemAsync(SESSION_KEY).catch((error) => {
    console.error('[SecureStore] Erro ao remover sessão:', error);
  });
}

export function clearSession() {
  setSession(null);
}

export function getSession() {
  return currentSession ? clone(currentSession) : null;
}

export async function restoreSession() {
  try {
    let data;
    if (isWeb) {
      data = localStorage.getItem(SESSION_KEY);
    } else {
      data = await SecureStore.getItemAsync(SESSION_KEY);
    }

    currentSession = data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[SecureStore] Falha ao restaurar sessão:', error);
    currentSession = null;
  }
}
