import { requestJson } from './apiClient';
import {
  createCliente,
  createPsicologo,
  createSessao,
  findClienteResponseById,
  findPsicologoResponseById,
  getDashboardInsights as mockInsights,
  getDashboardKpis as mockKpis,
  getDashboardTrends as mockTrends,
  listAllUsers,
  listClientesResponse,
  listPsicologos,
  listSessoes,
  listSessoesPorPaciente,
  listSessoesPorStatus,
  listSessoesSemana,
  removeSessao,
  updateCliente,
  updatePsicologo,
  updateSessao,
} from './mockDatabase';

/**
 * Executa a chamada à API real. O app usa exclusivamente o backend real
 * (sem banco mock). O segundo parâmetro é ignorado e mantido apenas para
 * compatibilidade com as chamadas existentes.
 */
async function withFallback(remote, _fallback) {
  return await remote();
}

// O backend real usa `name`/`phone`; a UI espera `nome`/`telefone` e a forma
// aninhada `dadosPaciente`. Normalizamos aqui para os dois mundos conviverem.
export function normalizePaciente(p) {
  if (!p || typeof p !== 'object') return p;
  return {
    ...p,
    nome: p.nome || p.name,
    nomeCompleto: p.nomeCompleto || p.name || p.nome,
    name: p.name || p.nome,
    telefone: p.telefone || p.phone,
    dadosPaciente: {
      ...(p.dadosPaciente || {}),
      contatoEmergencia: p.dadosPaciente?.contatoEmergencia || p.emergencyContact,
      telefoneEmergencia: p.dadosPaciente?.telefoneEmergencia || p.emergencyPhone,
    },
  };
}

export function normalizePsicologo(u) {
  if (!u || typeof u !== 'object') return u;
  return {
    ...u,
    nome: u.nome || u.name,
    name: u.name || u.nome,
    telefone: u.telefone || u.phone,
  };
}

// =====================================================
// Paciente (perfil do próprio usuário) e Feedback
// =====================================================

/**
 * Busca o perfil de paciente vinculado ao usuário logado.
 * Retorna o registro de /clientes (com UUID real) usado para edição.
 */
export async function getMeuPaciente(userId) {
  return requestJson(`/clientes/user/${userId}`, { credentials: 'include' });
}

/**
 * Atualiza o perfil de paciente (dados pessoais + foto em base64).
 */
export async function atualizarMeuPaciente(patientId, dados) {
  return requestJson(`/clientes/${patientId}`, {
    method: 'PUT',
    body: dados,
    credentials: 'include',
  });
}

/**
 * Envia um feedback (com localização opcional) para o backend.
 */
export async function postFeedback(feedback) {
  return requestJson('/api/v1/feedbacks', {
    method: 'POST',
    body: feedback,
    credentials: 'include',
  });
}

export async function getPsicologos() {
  return withFallback(
    async () => {
      const data = await requestJson('/psicologos', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data?.content;
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('empty');
      }
      return list.map(normalizePsicologo);
    },
    () => listPsicologos(),
  );
}

export async function getPsicologoPorId(id) {
  return withFallback(
    async () => normalizePsicologo(await requestJson(`/psicologos/${id}`, { credentials: 'include' })),
    () => findPsicologoResponseById(id),
  );
}

export async function postPsicologo(psicologo) {
  return withFallback(
    () => requestJson('/psicologos', { method: 'POST', body: psicologo, credentials: 'include' }),
    () => createPsicologo(psicologo),
  );
}

export async function putPsicologo(id, psicologo) {
  return withFallback(
    () => requestJson(`/psicologos/${id}`, { method: 'PUT', body: psicologo, credentials: 'include' }),
    () => updatePsicologo(id, psicologo),
  );
}

export async function putAtualizarSenhaPsicologo(id, senha) {
  return await requestJson(`/psicologos/${id}/senha`, {
    method: 'PUT',
    body: senha,
    credentials: 'include',
  });
}

export async function getAgendamentosPorId(id) {
  return withFallback(
    () => requestJson(`/sessoes/${id}`, { credentials: 'include' }),
    () => listSessoesPorPaciente(id),
  );
}

export async function getAgendamentos() {
  return withFallback(
    async () => {
      const data = await requestJson('/sessoes', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data?.content;
      if (!Array.isArray(list)) {
        throw new Error('empty');
      }
      return list;
    },
    () => listSessoes(),
  );
}

export async function getAgendamentosPorPaciente(id) {
  return withFallback(
    () => requestJson(`/sessoes/pacientes/${id}`, { credentials: 'include' }),
    () => listSessoesPorPaciente(id),
  );
}

export async function postAgendamento(agendamento) {
  return withFallback(
    () => requestJson('/sessoes', { method: 'POST', body: agendamento, credentials: 'include' }),
    () => createSessao(agendamento),
  );
}

export async function putAgendamento(id, agendamento) {
  return withFallback(
    () => requestJson(`/sessoes/${id}`, { method: 'PUT', body: agendamento, credentials: 'include' }),
    () => updateSessao(id, agendamento),
  );
}

export async function getAgendamentosPorStatus(status) {
  return withFallback(
    () => requestJson(`/sessoes/status?status=${encodeURIComponent(status)}`, { credentials: 'include' }),
    () => listSessoesPorStatus(status),
  );
}

export async function cancelAgendamento(id) {
  return withFallback(
    () => requestJson(`/sessoes/cancelar/${id}`, { method: 'PUT', credentials: 'include' }),
    () => removeSessao(id),
  );
}

export async function paginacaoGetAgendamentos({ segunda, mes, ano, page, size = 40 }) {
  const params = new URLSearchParams();
  if (segunda) {
    params.append('segunda', segunda);
  } else if (mes && ano) {
    params.append('mes', mes);
    params.append('ano', ano);
  } else {
    throw new Error('É necessário fornecer "segunda" ou "mes" e "ano"');
  }

  if (typeof size === 'number' && size > 0) {
    params.append('size', String(size));
  }
  if (typeof page === 'number') {
    const pageApi = Math.max(0, parseInt(page, 10) - 1 || 0);
    params.append('page', String(pageApi));
  }

  return withFallback(
    () => requestJson(`/sessoes/semana?${params.toString()}`, { credentials: 'include' }),
    () => ({ content: listSessoesSemana(segunda), totalPages: 1, totalElements: listSessoesSemana(segunda).length }),
  );
}

export async function getPacientes() {
  return withFallback(
    async () => {
      const data = await requestJson('/clientes', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data?.content;
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('empty');
      }
      return list.map(normalizePaciente);
    },
    () => listClientesResponse(),
  );
}

export async function postPaciente(paciente) {
  return withFallback(
    () => requestJson('/clientes', { method: 'POST', body: paciente, credentials: 'include' }),
    () => createCliente(paciente),
  );
}

export async function putPaciente(id, paciente) {
  return withFallback(
    () => requestJson(`/clientes/${id}`, { method: 'PUT', body: paciente, credentials: 'include' }),
    () => updateCliente(id, paciente),
  );
}

export async function listClientes() {
  return getPacientes();
}

export async function findClienteById(id) {
  return withFallback(
    async () => normalizePaciente(await requestJson(`/clientes/${id}`, { credentials: 'include' })),
    () => findClienteResponseById(id),
  );
}

// =====================================================
// Dashboard de Inteligência Clínica (IA-Driven)
// =====================================================

export async function getDashboardKpis() {
  return withFallback(
    () => requestJson('/api/v1/dashboard/kpis', { credentials: 'include' }),
    () => mockKpis(),
  );
}

export async function getDashboardTrends() {
  return withFallback(
    async () => {
      const data = await requestJson('/api/v1/dashboard/trends', { credentials: 'include' });
      if (!Array.isArray(data)) {
        throw new Error('empty');
      }
      return data;
    },
    () => mockTrends(),
  );
}

export async function getDashboardInsights() {
  return withFallback(
    () => requestJson('/api/v1/dashboard/insights', { credentials: 'include' }),
    () => mockInsights(),
  );
}

// =====================================================
// Gestão de Usuários
// =====================================================

export async function getAllUsers() {
  return withFallback(
    async () => {
      const data = await requestJson('/api/v1/users', { credentials: 'include' });
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('empty');
      }
      return data;
    },
    () => listAllUsers(),
  );
}

export async function updateUserRole(userId, newRole) {
  return await requestJson(`/api/v1/users/${userId}/role`, {
    method: 'PUT',
    body: newRole,
    credentials: 'include',
  });
}
