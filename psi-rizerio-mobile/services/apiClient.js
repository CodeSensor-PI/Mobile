import Constants from 'expo-constants';
import { getSession } from './sessionStore';

/**
 * Retorna a URL base da API.
 *
 * Lógica de prioridade:
 * 1. Variável de ambiente EXPO_PUBLIC_API_URL (ideal para produção)
 * 2. IP detectado automaticamente via Expo hostUri (celular físico via QR Code)
 * 3. Fallback para localhost:8081
 */
export const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // expo-constants expõe o IP do servidor de desenvolvimento do Expo
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    // hostUri tem o formato "192.168.x.x:EXPO_PORT" — extraímos só o IP
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8080`;
    }
  }

  return 'http://localhost:8080';
};

export async function requestJson(path, options = {}) {
  const { method = 'GET', body, headers = {}, credentials = 'include' } = options;

  const session = getSession();
  const authHeaders = session?.token ? { Authorization: `Bearer ${session.token}` } : {};

  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    credentials,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof payload === 'string'
        ? payload
        : payload?.message || `Requisição falhou com status ${response.status}`
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}
