import { getSession } from './mockDatabase';

export const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
};

export async function requestJson(path, options = {}) {
  const { method = 'GET', body, headers = {}, credentials = 'include' } = options;
  
  const session = getSession();
  const authHeaders = session?.token ? { Authorization: `Bearer ${session.token}` } : {};

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
        : payload?.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}
