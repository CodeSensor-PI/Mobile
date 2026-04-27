import { clearSession, getSession, restoreSession, setSession } from './sessionStore';
import { requestJson } from './apiClient';

function buildError(message, code = 'UNKNOWN') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function buildUserPayload(record) {
  const roleValue = record?.role || record?.fkRoles || { id: 0, role: 'DESCONHECIDO' };
  const role = typeof roleValue === 'string' ? { role: roleValue } : roleValue;

  return {
    id: record?.id,
    nome: record?.name || record?.nome || '',
    name: record?.name || record?.nome || '',
    email: record?.email || '',
    telefone: record?.telefone || record?.phone || '',
    role,
    fkRoles: record?.fkRoles || role,
  };
}

function persistSessionFromUser(user, token) {
  const session = {
    token: token || null,
    usuario: buildUserPayload(user),
  };

  setSession(session);
  return session;
}

async function requestRecoveryFeature() {
  throw buildError('Recuperação de senha ainda não está disponível no backend.', 'NOT_IMPLEMENTED');
}

export async function postLogin(login) {
  const email = String(login?.email || '').trim();
  const senha = String(login?.senha || '');

  if (!email || !senha) {
    throw buildError('Preencha e-mail e senha para continuar.', 'EMPTY_FIELDS');
  }

  try {
    const data = await requestJson('/api/v1/auth/authenticate', {
      method: 'POST',
      body: { email, password: senha },
    });

    return persistSessionFromUser(
      {
        id: data?.id,
        name: data?.name || email,
        email: data?.email || email,
        role: data?.role || 'USER',
      },
      data?.token
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      throw buildError('Usuário ou senha inválidos.', 'INVALID_CREDENTIALS');
    }

    throw buildError(error?.message || 'Erro ao conectar com o servidor.', 'API_ERROR');
  }
}

export async function loginPsicologo(email, senha) {
  return postLogin({ email, senha });
}

export async function registerPatient(patientData) {
  try {
    const data = await requestJson('/api/v1/auth/register-patient', {
      method: 'POST',
      body: patientData,
      credentials: 'include',
    });

    return persistSessionFromUser(
      {
        id: data?.id,
        name: data?.name || patientData.name,
        email: data?.email || patientData.email,
        role: data?.role || 'USER',
      },
      data?.token
    );
  } catch (error) {
    throw buildError(error?.message || 'Erro ao realizar cadastro.', 'REGISTER_ERROR');
  }
}

export async function postLogout() {
  clearSession();
  return { ok: true };
}

export async function validateSession() {
  return getSession();
}

export function getCurrentSession() {
  return getSession();
}

export async function restoreAuthSession() {
  await restoreSession();
}

export async function solicitarRecuperacaoSenha() {
  return requestRecoveryFeature();
}

export async function solicitarCodigoRecuperacao() {
  return requestRecoveryFeature();
}

export async function validarCodigoRecuperacao() {
  return requestRecoveryFeature();
}

export async function redefinirSenha() {
  return requestRecoveryFeature();
}

export async function alterarSenha(id, senhaAtual, novaSenha) {
  if (!id) {
    throw buildError('ID do usuário não informado.', 'MISSING_ID');
  }

  try {
    return await requestJson(`/psicologos/${id}/alterar-senha`, {
      method: 'PUT',
      body: { senha: senhaAtual, novaSenha },
      credentials: 'include',
    });
  } catch (error) {
    if (error?.status === 400) {
      throw buildError('Senha atual inválida.', 'INVALID_CURRENT_PASSWORD');
    }

    throw buildError(error?.message || 'Não foi possível alterar a senha.', 'API_ERROR');
  }
}

export { clearSession };
