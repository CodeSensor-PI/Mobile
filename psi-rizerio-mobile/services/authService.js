import {
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
    // O backend real devolve `name`; mantemos compatibilidade com `nome`.
    nome: record.nome || record.name,
    name: record.name || record.nome,
    email: record.email,
    telefone: record.telefone,
    role,
    isFirstAccess: record.isFirstAccess ?? !record.cpf,
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
    const data = await requestJson('/api/v1/auth/authenticate', {
      method: 'POST',
      body: { email, password: senha },
      credentials: 'include',
    });

    const payload = data?.usuario || data?.user || data || {};
    const user = {
      ...payload,
      role: payload.role || payload.fkRoles || login?.role,
      email: payload.email || email,
    };

    const session = persistSessionFromUser(user, data?.token);

    // Para pacientes (USER/CLIENTE), determina o primeiro acesso a partir do
    // perfil real: sem CPF cadastrado => abre o formulário inicial.
    const roleName = String(session?.usuario?.role?.role || session?.usuario?.role || '').toUpperCase();
    if (roleName === 'USER' || roleName === 'CLIENTE') {
      try {
        const { getMeuPaciente } = await import('./dashboardService');
        const paciente = await getMeuPaciente(session.usuario.id);
        return updateCurrentUser({
          patientId: paciente?.id,
          isFirstAccess: !paciente?.cpf,
        });
      } catch (_e) {
        // Sem perfil ainda => primeiro acesso.
        return updateCurrentUser({ isFirstAccess: true });
      }
    }

    return session;
  } catch (error) {
    // Sem fallback mock: o app usa exclusivamente o backend real.
    if (error?.status === 403 || error?.status === 401) {
      throw buildError('Usuário ou senha inválidos.', 'INVALID_CREDENTIALS');
    }
    throw buildError(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      'NETWORK_ERROR',
    );
  }
}

export async function loginPsicologo(email, senha) {
  return postLogin({ email, senha });
}

export async function postLogout() {
  try {
    await requestJson('/api/v1/auth/logout', {
      method: 'POST',
      body: {},
      credentials: 'include',
    });
  } catch (_error) {
    console.error(_error);
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

/**
 * Atualiza os dados do usuário logado na sessão atual (ex.: após concluir
 * o formulário de primeiro acesso) e persiste a sessão.
 */
export function updateCurrentUser(patch = {}) {
  const session = getSession();
  if (!session) {
    return null;
  }

  const updated = {
    ...session,
    usuario: {
      ...session.usuario,
      ...patch,
    },
  };
  setSession(updated);
  return updated;
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
