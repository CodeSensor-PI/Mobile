import { getCurrentSession } from './authService';
import { requestJson } from './apiClient';

let cachedPacientes = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRole(role) {
  if (!role) {
    return { id: 0, role: 'DESCONHECIDO' };
  }

  if (typeof role === 'string') {
    return { id: 0, role };
  }

  return {
    id: role.id ?? 0,
    role: role.role ?? role.name ?? 'DESCONHECIDO',
  };
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeBirthDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/');
    return `${year}-${month}-${day}`;
  }

  return raw;
}

function toIsoDateTime(date, hour) {
  if (!date) {
    return null;
  }

  const timePart = hour ? (hour.length === 5 ? `${hour}:00` : hour) : '00:00:00';
  return `${date}T${timePart}`;
}

function fromIsoDateTime(iso) {
  if (!iso) {
    return { data: '', hora: '', datetime: null };
  }

  const normalized = String(iso).replace(' ', 'T');
  const [datePart, timePart] = normalized.split('T');
  return {
    data: datePart || '',
    hora: timePart ? timePart.slice(0, 5) : '',
    datetime: normalized,
  };
}

function addMinutesToIso(iso, minutes) {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function mapPsychologist(user) {
  return {
    id: user?.id,
    nome: user?.name || user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    crp: user?.crp || '',
    photo: user?.photo || '',
    status: 'ATIVO',
    ativo: true,
    role: normalizeRole(user?.role || { role: 'PSYCHOLOGIST' }),
    fkRoles: normalizeRole(user?.role || { role: 'PSYCHOLOGIST' }),
  };
}

function mapPatient(patient) {
  const fullName = patient?.name || '';

  return {
    id: patient?.id,
    nome: fullName,
    nomeCompleto: fullName,
    email: patient?.email || '',
    telefone: patient?.phone || '',
    cpf: patient?.cpf || '',
    birthDate: patient?.birthDate || '',
    photo: patient?.photo || '',
    clinicalNotes: patient?.clinicalNotes || '',
    userId: patient?.userId || null,
    ativo: true,
    role: { id: 2, role: 'CLIENTE' },
    dadosPaciente: {
      nome: fullName,
      sobrenome: '',
      email: patient?.email || '',
      diaConsultas: 'Quinta-Feira',
      horarioConsultas: '16:00',
      contatoEmergencia: patient?.emergencyContact || '',
      telefoneEmergencia: patient?.emergencyPhone || '',
    },
    endereco: {
      cep: patient?.cep || '',
      cidade: patient?.city || '',
      bairro: patient?.neighborhood || '',
      numero: '',
      logradouro: patient?.address || '',
      complemento: '',
      semComplemento: true,
    },
    planos: {
      mensal: true,
      anual: false,
    },
  };
}

function mapSession(session) {
  const dateTime = fromIsoDateTime(session?.startTime);
  const patient = session?.patient || {};
  const psychologist = session?.psychologist || {};

  return {
    id: session?.id,
    patientId: patient?.id || null,
    psychologistId: psychologist?.id || null,
    data: dateTime.data,
    hora: dateTime.hora,
    startTime: session?.startTime || null,
    endTime: session?.endTime || null,
    status: session?.status || 'AGENDADA',
    statusSessao: session?.status || 'AGENDADA',
    clinicalNotes: session?.clinicalNotes || '',
    patientName: patient?.name || 'Paciente',
    timeSlot: dateTime.hora,
    fkPaciente: patient?.id
      ? {
          id: patient.id,
          nome: patient.name || '',
          email: patient.email || '',
          telefone: patient.phone || '',
        }
      : null,
    fkPsicologo: psychologist?.id
      ? {
          id: psychologist.id,
          nome: psychologist.name || '',
          email: psychologist.email || '',
          telefone: psychologist.telefone || '',
        }
      : null,
  };
}

function mapPacientePayload(payload) {
  const dadosPaciente = payload?.dadosPaciente || {};
  const endereco = payload?.endereco || {};

  return {
    name: payload?.name || `${dadosPaciente.nome || ''} ${dadosPaciente.sobrenome || ''}`.trim(),
    email: payload?.email || dadosPaciente.email || '',
    phone: onlyDigits(payload?.phone || payload?.telefone || ''),
    birthDate: normalizeBirthDate(payload?.birthDate || payload?.dataNascimento),
    cpf: onlyDigits(payload?.cpf || ''),
    address: endereco.logradouro || payload?.address || '',
    neighborhood: endereco.bairro || payload?.neighborhood || '',
    city: endereco.cidade || payload?.city || '',
    state: endereco.state || payload?.state || '',
    cep: onlyDigits(endereco.cep || payload?.cep || ''),
    emergencyContact: dadosPaciente.contatoEmergencia || payload?.emergencyContact || '',
    emergencyPhone: onlyDigits(dadosPaciente.telefoneEmergencia || payload?.emergencyPhone || ''),
    photo: payload?.photo || '',
    clinicalNotes: payload?.clinicalNotes || payload?.consultation?.reason || payload?.reason || '',
  };
}


function mapPsicologoPayload(payload) {
  return {
    name: payload?.name || payload?.nome || '',
    email: payload?.email || '',
    password: payload?.password || payload?.senha || 'senha123',
    crp: payload?.crp || '',
    telefone: payload?.telefone || payload?.phone || '',
    photo: payload?.photo || '',
  };
}

function mapSessaoPayload(payload) {
  const patientId = payload?.patientId || payload?.fkPaciente?.id || payload?.clienteId;
  const sessionDate = payload?.data || payload?.date;
  const sessionHour = payload?.hora || payload?.hour;
  const startTime = payload?.startTime || toIsoDateTime(sessionDate, sessionHour);
  const sessionUser = getCurrentSession()?.usuario;

  return {
    patientId,
    psychologistId: payload?.psychologistId || sessionUser?.id,
    startTime,
    endTime: payload?.endTime || addMinutesToIso(startTime, 50),
    status: payload?.statusSessao || payload?.status || 'AGENDADA',
    clinicalNotes: payload?.clinicalNotes || payload?.anotacao || '',
  };
}

export async function getPsicologos() {
  const data = await requestJson('/psicologos', { credentials: 'include' });
  return Array.isArray(data) ? data.map(mapPsychologist) : [];
}

export async function getPsicologoPorId(id) {
  const data = await requestJson(`/psicologos/${id}`, { credentials: 'include' });
  return data ? mapPsychologist(data) : null;
}

export async function postPsicologo(psicologo) {
  const data = await requestJson('/psicologos', {
    method: 'POST',
    body: mapPsicologoPayload(psicologo),
    credentials: 'include',
  });
  return mapPsychologist(data);
}

export async function putPsicologo(id, psicologo) {
  const data = await requestJson(`/psicologos/${id}`, {
    method: 'PUT',
    body: mapPsicologoPayload(psicologo),
    credentials: 'include',
  });
  return mapPsychologist(data);
}

export async function putAtualizarSenhaPsicologo(id, senha) {
  return requestJson(`/psicologos/${id}/alterar-senha`, {
    method: 'PUT',
    body: typeof senha === 'object' ? senha : { novaSenha: senha },
    credentials: 'include',
  });
}

export async function getAgendamentosPorId(id) {
  const data = await requestJson(`/sessoes/${id}`, { credentials: 'include' });
  return data ? mapSession(data) : null;
}

export async function getAgendamentos() {
  const data = await requestJson('/sessoes', { credentials: 'include' });
  return Array.isArray(data) ? data.map(mapSession) : [];
}

export async function getAgendamentosPorPaciente(id) {
  const data = await requestJson('/sessoes', { credentials: 'include' });
  return Array.isArray(data)
    ? data.filter((item) => String(item?.patient?.id || item?.patientId) === String(id)).map(mapSession)
    : [];
}

export async function postAgendamento(agendamento) {
  const data = await requestJson('/sessoes', {
    method: 'POST',
    body: mapSessaoPayload(agendamento),
    credentials: 'include',
  });
  return mapSession(data);
}

export async function putAgendamento(id, agendamento) {
  const data = await requestJson(`/sessoes/${id}`, {
    method: 'PUT',
    body: mapSessaoPayload(agendamento),
    credentials: 'include',
  });
  return mapSession(data);
}

export async function getAgendamentosPorStatus(status) {
  const data = await requestJson('/sessoes', { credentials: 'include' });
  return Array.isArray(data)
    ? data.filter((item) => String(item?.status || '').toUpperCase() === String(status).toUpperCase()).map(mapSession)
    : [];
}

export async function cancelAgendamento(id) {
  const data = await requestJson(`/sessoes/cancelar/${id}`, {
    method: 'PUT',
    credentials: 'include',
  });
  return mapSession(data);
}

export async function paginacaoGetAgendamentos({ segunda, page, size = 40 }) {
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
  return Array.isArray(data) ? data.map(mapSession) : [];
}

export function listClientes() {
  return cachedPacientes.map((item) => clone(item));
}

export function findClienteById(id) {
  return cachedPacientes.find((item) => String(item.id) === String(id)) || null;
}

export async function getPacientes() {
  const data = await requestJson('/clientes', { credentials: 'include' });
  const list = Array.isArray(data) ? data.map(mapPatient) : [];
  cachedPacientes = list;
  return list;
}

export async function getPacientePorUserId(userId) {
  const data = await requestJson(`/clientes/user/${userId}`, { credentials: 'include' });
  return data ? mapPatient(data) : null;
}

export async function postPaciente(paciente) {
  const data = await requestJson('/clientes', {
    method: 'POST',
    body: mapPacientePayload(paciente),
    credentials: 'include',
  });
  return mapPatient(data);
}

export async function putPaciente(id, paciente) {
  const data = await requestJson(`/clientes/${id}`, {
    method: 'PUT',
    body: mapPacientePayload(paciente),
    credentials: 'include',
  });
  return mapPatient(data);
}

export async function postFeedback(feedback) {
  const data = await requestJson('/api/v1/feedbacks', {
    method: 'POST',
    body: feedback,
    credentials: 'include',
  });
  return data;
}

export async function getFeedbacksByPatient(patientId) {
  const data = await requestJson(`/api/v1/feedbacks/patient/${patientId}`, {
    credentials: 'include',
  });

  return Array.isArray(data) ? data : [];
}

export async function getFeedbackBySession(sessionId) {
  return requestJson(`/api/v1/feedbacks/session/${sessionId}`, {
    credentials: 'include',
  });
}
