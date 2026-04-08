import { requestJson } from './apiClient';
import {
  asClienteResponse,
  asPsicologoResponse,
  asSessaoResponse,
  createCliente,
  createPsicologo,
  createSessao,
  getPersonList,
  listSessoesSemana,
  removeSessao,
  updateCliente,
  updatePsicologo,
  updateSessao,
  state,
} from './mockDatabase';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getPsicologos() {
  try {
    const data = await requestJson('/psicologos', { credentials: 'include' });
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return getPersonList('psicologos').map(asPsicologoResponse);
  }
}

export async function getPsicologoPorId(id) {
  try {
    const data = await requestJson(`/psicologos/${id}`, { credentials: 'include' });
    return data;
  } catch (_error) {
    const found = state.psicologos.find((item) => String(item.id) === String(id));
    return found ? asPsicologoResponse(found) : null;
  }
}

export async function postPsicologo(psicologo) {
  try {
    const data = await requestJson('/psicologos', {
      method: 'POST',
      body: psicologo,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    return createPsicologo(psicologo);
  }
}

export async function putPsicologo(id, psicologo) {
  try {
    const data = await requestJson(`/psicologos/${id}`, {
      method: 'PUT',
      body: psicologo,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    const updated = updatePsicologo(id, psicologo);
    if (!updated) {
      throw _error;
    }
    return updated;
  }
}

export async function putAtualizarSenhaPsicologo(id, senha) {
  try {
    const data = await requestJson(`/psicologos/${id}/senha`, {
      method: 'PUT',
      body: senha,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    return updatePsicologo(id, { senha });
  }
}

export async function getAgendamentosPorId(id) {
  try {
    const data = await requestJson(`/sessoes/${id}`, { credentials: 'include' });
    return data;
  } catch (_error) {
    const found = state.sessoes.find((item) => String(item.id) === String(id));
    return found ? asSessaoResponse(found) : null;
  }
}

export async function getAgendamentos() {
  try {
    const data = await requestJson('/sessoes', { credentials: 'include' });
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return clone(state.sessoes).map(asSessaoResponse);
  }
}

export async function getAgendamentosPorPaciente(id) {
  try {
    const data = await requestJson(`/sessoes/pacientes/${id}`, { credentials: 'include' });
    return data;
  } catch (_error) {
    return clone(state.sessoes)
      .filter((item) => String(item.clienteId) === String(id))
      .map(asSessaoResponse);
  }
}

export async function postAgendamento(agendamento) {
  try {
    const data = await requestJson('/sessoes', {
      method: 'POST',
      body: agendamento,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    return createSessao(agendamento);
  }
}

export async function putAgendamento(id, agendamento) {
  try {
    const data = await requestJson(`/sessoes/${id}`, {
      method: 'PUT',
      body: agendamento,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    const updated = updateSessao(id, agendamento);
    if (!updated) {
      throw _error;
    }
    return updated;
  }
}

export async function getAgendamentosPorStatus(status) {
  try {
    const data = await requestJson(`/sessoes/status?status=${encodeURIComponent(status)}`, {
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    return clone(state.sessoes)
      .filter((item) => String(item.status).toUpperCase() === String(status).toUpperCase())
      .map(asSessaoResponse);
  }
}

export async function cancelAgendamento(id) {
  try {
    const data = await requestJson(`/sessoes/cancelar/${id}`, {
      method: 'PUT',
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    const updated = removeSessao(id);
    if (!updated) {
      throw _error;
    }
    return updated;
  }
}

export async function paginacaoGetAgendamentos({ segunda, page, size = 40 }) {
  try {
    if (!segunda) {
      throw new Error('Parâmetro "segunda" (YYYY-MM-DD) é obrigatório');
    }

    const params = new URLSearchParams();
    params.append('segunda', segunda);
    if (typeof size === 'number' && size > 0) {
      params.append('size', String(size));
    }
    if (typeof page === 'number') {
      const pageApi = Math.max(0, parseInt(page, 10) - 1 || 0);
      params.append('page', String(pageApi));
    }

    const data = await requestJson(`/sessoes/semana?${params.toString()}`, { credentials: 'include' });
    return data;
  } catch (_error) {
    return listSessoesSemana(segunda);
  }
}

export function listClientes() {
  return getPersonList('clientes').map((item) => {
    const response = asClienteResponse(item);
    return {
      id: response.id,
      nome: response.nome,
      email: response.email,
      telefone: response.telefone,
      psicologoId: response.psicologoId,
      role: response.role,
      ativo: response.ativo,
      dadosPaciente: response.dadosPaciente,
      endereco: response.endereco,
      planos: response.planos,
    };
  });
}

export function findClienteById(id) {
  return listClientes().find((item) => String(item.id) === String(id)) || null;
}

export async function getPacientes() {
  try {
    const data = await requestJson('/clientes', { credentials: 'include' });
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return getPersonList('clientes').map(asClienteResponse);
  }
}

export async function postPaciente(paciente) {
  try {
    const data = await requestJson('/clientes', {
      method: 'POST',
      body: paciente,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    return createCliente(paciente);
  }
}

export async function putPaciente(id, paciente) {
  try {
    const data = await requestJson(`/clientes/${id}`, {
      method: 'PUT',
      body: paciente,
      credentials: 'include',
    });
    return data;
  } catch (_error) {
    const updated = updateCliente(id, paciente);
    if (!updated) {
      throw _error;
    }
    return updated;
  }
}
