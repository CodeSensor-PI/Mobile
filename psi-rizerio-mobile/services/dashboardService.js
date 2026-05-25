import { requestJson } from './apiClient';

export async function getPsicologos() {
  const data = await requestJson('/psicologos', { credentials: 'include' });
  return Array.isArray(data) ? data : [];
}

export async function getPsicologoPorId(id) {
  return await requestJson(`/psicologos/${id}`, { credentials: 'include' });
}

export async function postPsicologo(psicologo) {
  return await requestJson('/psicologos', {
    method: 'POST',
    body: psicologo,
    credentials: 'include',
  });
}

export async function putPsicologo(id, psicologo) {
  return await requestJson(`/psicologos/${id}`, {
    method: 'PUT',
    body: psicologo,
    credentials: 'include',
  });
}

export async function putAtualizarSenhaPsicologo(id, senha) {
  return await requestJson(`/psicologos/${id}/senha`, {
    method: 'PUT',
    body: senha,
    credentials: 'include',
  });
}

export async function getAgendamentosPorId(id) {
  return await requestJson(`/sessoes/${id}`, { credentials: 'include' });
}

export async function getAgendamentos() {
  const data = await requestJson('/sessoes', { credentials: 'include' });
  return Array.isArray(data) ? data : [];
}

export async function getAgendamentosPorPaciente(id) {
  return await requestJson(`/sessoes/pacientes/${id}`, { credentials: 'include' });
}

export async function postAgendamento(agendamento) {
  return await requestJson('/sessoes', {
    method: 'POST',
    body: agendamento,
    credentials: 'include',
  });
}

export async function putAgendamento(id, agendamento) {
  return await requestJson(`/sessoes/${id}`, {
    method: 'PUT',
    body: agendamento,
    credentials: 'include',
  });
}

export async function getAgendamentosPorStatus(status) {
  return await requestJson(`/sessoes/status?status=${encodeURIComponent(status)}`, {
    credentials: 'include',
  });
}

export async function cancelAgendamento(id) {
  return await requestJson(`/sessoes/cancelar/${id}`, {
    method: 'PUT',
    credentials: 'include',
  });
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

  return await requestJson(`/sessoes/semana?${params.toString()}`, { credentials: 'include' });
}

export async function getPacientes() {
  const data = await requestJson('/clientes', { credentials: 'include' });
  return Array.isArray(data) ? data : [];
}

export async function postPaciente(paciente) {
  return await requestJson('/clientes', {
    method: 'POST',
    body: paciente,
    credentials: 'include',
  });
}

export async function putPaciente(id, paciente) {
  return await requestJson(`/clientes/${id}`, {
    method: 'PUT',
    body: paciente,
    credentials: 'include',
  });
}

export async function listClientes() {
  const data = await requestJson('/clientes', { credentials: 'include' });
  return Array.isArray(data) ? data : [];
}

export async function findClienteById(id) {
  return await requestJson(`/clientes/${id}`, { credentials: 'include' });
}

// =====================================================
// Dashboard de Inteligência Clínica (IA-Driven)
// =====================================================

export async function getDashboardKpis() {
  return await requestJson('/api/v1/dashboard/kpis', { credentials: 'include' });
}

export async function getDashboardTrends() {
  const data = await requestJson('/api/v1/dashboard/trends', { credentials: 'include' });
  return Array.isArray(data) ? data : [];
}

export async function getDashboardInsights() {
  return await requestJson('/api/v1/dashboard/insights', { credentials: 'include' });
}

// =====================================================
// Gestão de Usuários
// =====================================================

export async function getAllUsers() {
  const data = await requestJson('/api/v1/users', { credentials: 'include' });
  return Array.isArray(data) ? data : [];
}

export async function updateUserRole(userId, newRole) {
  return await requestJson(`/api/v1/users/${userId}/role`, {
    method: 'PUT',
    body: newRole,
    credentials: 'include',
  });
}
