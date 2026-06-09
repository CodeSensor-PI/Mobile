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
 * Executa a chamada à API real e, caso ela falhe (backend offline,
 * sem rede, rodando no celular, etc.), usa o banco de dados mock local
 * para que o app continue funcional e populado com dados de teste.
 */
async function withFallback(remote, fallback) {
  try {
    return await remote();
  } catch (_error) {
    return fallback();
  }
}

export async function getPsicologos() {
  return withFallback(
    async () => {
      const data = await requestJson('/psicologos', { credentials: 'include' });
      const list = Array.isArray(data) ? data : data?.content;
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('empty');
      }
      return list;
    },
    () => listPsicologos(),
  );
}

export async function getPsicologoPorId(id) {
  return withFallback(
    () => requestJson(`/psicologos/${id}`, { credentials: 'include' }),
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
      return list;
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
    () => requestJson(`/clientes/${id}`, { credentials: 'include' }),
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
