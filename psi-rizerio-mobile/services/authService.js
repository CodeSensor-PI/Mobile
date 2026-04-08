import {
  findClienteByEmail,
  findPsicologoByEmail,
  getPendingRecoveryEmail,
  getSession,
  setPendingRecoveryEmail,
  setSession,
  updatePassword,
} from './mockDatabase';
import { requestJson } from './apiClient';

const MOCK_RECOVERY_CODE = '123456';

function buildError(message, code = 'UNKNOWN') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function buildUserPayload(record) {
  const role = record.role || record.fkRoles || { id: 0, role: 'DESCONHECIDO' };

  return {
    id: record.id,
    nome: record.nome,
    email: record.email,
    telefone: record.telefone,
    role,
  };
}

function persistSessionFromUser(user, token = 'mock-token-mobile') {
  const session = {
    token,
    usuario: buildUserPayload(user),
  };
  setSession(session);
  return session;
}

export async function postLogin(login) {
  const email = String(login?.email || '').trim();
  const senha = String(login?.senha || '');

  if (!email || !senha) {
    throw buildError('Preencha e-mail e senha para continuar.', 'EMPTY_FIELDS');
  }

  try {
    const data = await requestJson('/login', {
      method: 'POST',
      body: { email, senha },
      credentials: 'include',
    });

    const payload = data?.usuario || data?.user || data || {};
    const user = {
      ...payload,
      role: payload.role || payload.fkRoles || login?.role,
      email: payload.email || email,
    };

    return persistSessionFromUser(user, data?.token || 'token-backend');
  } catch (_error) {
    const record = findPsicologoByEmail(email) || findClienteByEmail(email);

    if (!record) {
      throw buildError('Usuário ou senha inválidos.', 'INVALID_CREDENTIALS');
    }

    const role = record.role || record.fkRoles || {};
    const allowedRole =
      role.id === 1 ||
      role.role === 'PSICOLOGO' ||
      role.id === 3 ||
      role.role === 'PSICOLOGO_ASSISTENTE' ||
      role.id === 2 ||
      role.role === 'CLIENTE';

    if (!allowedRole) {
      throw buildError('Perfil sem acesso ao aplicativo.', 'ROLE_NOT_ALLOWED');
    }

    if (record.senha !== senha || record.ativo === false || record.status === 'INATIVO') {
      throw buildError('Usuário ou senha inválidos.', 'INVALID_CREDENTIALS');
    }

    return persistSessionFromUser(record);
  }
}

export async function loginPsicologo(email, senha) {
  return postLogin({ email, senha });
}

export async function postLogout() {
  try {
    await requestJson('/auth/logout', {
      method: 'POST',
      body: {},
      credentials: 'include',
    });
  } catch (_error) {
    // Mantém logout local funcionando mesmo sem backend.
  } finally {
    setSession(null);
  }

  return { ok: true };
}

export async function validateSession() {
  try {
    const data = await requestJson('/auth/validate', { credentials: 'include' });
    return data;
  } catch (_error) {
    return getSession();
  }
}

export function getCurrentSession() {
  return getSession();
}

export async function solicitarRecuperacaoSenha(email, tipoUsuario = 'psicologo') {
  if (!email) {
    throw buildError('Informe um e-mail para receber o código.', 'EMPTY_EMAIL');
  }

  try {
    const endpoint = `/password-reset/psicologo/request?email=${encodeURIComponent(email)}`;

    const data = await requestJson(endpoint, { method: 'POST', credentials: 'include' });
    setPendingRecoveryEmail(email);
    return data;
  } catch (_error) {
    const record = findPsicologoByEmail(email);
    if (!record) {
      throw buildError('E-mail não encontrado.', 'EMAIL_NOT_FOUND');
    }

    setPendingRecoveryEmail(email);
    return {
      email,
      tipoUsuario,
      message: 'Código enviado com sucesso.',
    };
  }
}

export async function solicitarCodigoRecuperacao(email, perfil = 'psicologo') {
  return solicitarRecuperacaoSenha(email, perfil);
}

export async function validarCodigoRecuperacao(email, codigo, tipoUsuario = 'psicologo') {
  if (!email) {
    throw buildError('Email não informado para validação.', 'EMPTY_EMAIL');
  }

  if (!/^\d{6}$/.test(String(codigo || ''))) {
    throw buildError('Código deve ter exatamente 6 dígitos numéricos.', 'INVALID_FORMAT');
  }

  try {
    const endpoint = `/password-reset/psicologo/validate?codigo=${encodeURIComponent(codigo)}`;

    const data = await requestJson(endpoint, { method: 'POST', credentials: 'include' });
    setPendingRecoveryEmail(email);
    return data;
  } catch (_error) {
    if (String(codigo) !== MOCK_RECOVERY_CODE) {
      throw buildError('Código inválido ou expirado.', 'INVALID_CODE');
    }

    setPendingRecoveryEmail(email);
    return {
      email,
      codigo,
      tipoUsuario,
      valido: true,
    };
  }
}

export async function redefinirSenha(codigo, novaSenha, tipoUsuario = 'psicologo') {
  if (!/^\d{6}$/.test(String(codigo || ''))) {
    throw buildError('Código inválido para redefinição.', 'INVALID_CODE');
  }

  if (!novaSenha || novaSenha.length < 12) {
    throw buildError('A nova senha deve ter pelo menos 12 caracteres.', 'WEAK_PASSWORD');
  }

  const email = getPendingRecoveryEmail();

  try {
    const endpoint = `/password-reset/psicologo/confirm?codigo=${encodeURIComponent(codigo)}&novaSenha=${encodeURIComponent(novaSenha)}`;

    const data = await requestJson(endpoint, { method: 'POST', credentials: 'include' });
    if (email) {
      const localRecord = findPsicologoByEmail(email);
      if (localRecord && localRecord.id) {
        updatePassword(localRecord.id, localRecord.senha, novaSenha);
      }
    }
    return data;
  } catch (_error) {
    if (!email) {
      throw buildError('Nenhum e-mail de recuperação foi encontrado.', 'MISSING_RECOVERY_CONTEXT');
    }

    const localRecord = findPsicologoByEmail(email);
    if (!localRecord) {
      throw buildError('Não foi possível localizar o usuário da recuperação.', 'USER_NOT_FOUND');
    }

    if (localRecord.senha && localRecord.senha === novaSenha) {
      throw buildError('A nova senha precisa ser diferente da atual.', 'PASSWORD_NOT_CHANGED');
    }

    if (String(codigo) !== MOCK_RECOVERY_CODE) {
      throw buildError('Código inválido ou expirado.', 'INVALID_CODE');
    }

    if (localRecord.id) {
      updatePassword(localRecord.id, localRecord.senha, novaSenha);
    }

    return {
      email,
      codigo,
      tipoUsuario,
      changed: true,
    };
  }
}

export async function alterarSenha(id, senhaAtual, novaSenha) {
  if (!id) {
    throw buildError('ID do usuário não informado.', 'MISSING_ID');
  }

  try {
    const data = await requestJson(`/psicologos/${id}/alterar-senha`, {
      method: 'PUT',
      body: { senha: senhaAtual, novaSenha },
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    const updated = updatePassword(id, senhaAtual, novaSenha);
    if (!updated) {
      throw buildError('Usuário não encontrado.', 'USER_NOT_FOUND');
    }
    return updated;
  }
}

export function clearSession() {
  setSession(null);
}
