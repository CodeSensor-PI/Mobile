const clone = (value) => JSON.parse(JSON.stringify(value));

const state = {
  currentSession: null,
  pendingRecoveryEmail: null,
  psicologos: [
    {
      id: '1',
      nome: 'Helena Oliveira',
      email: 'teste@email.com',
      senha: '123456',
      crp: '06123456',
      telefone: '11999991111',
      role: { id: 1, role: 'PSICOLOGO' },
      ativo: true,
    },
    {
      id: '2',
      nome: 'Marcos Alves',
      email: 'marcos.psico@agendfy.com',
      senha: 'Psico@1234',
      crp: '06654321',
      telefone: '11999992222',
      role: { id: 3, role: 'PSICOLOGO_ASSISTENTE' },
      ativo: true,
    },
    {
      id: 'Duy8tx5AsDw',
      nome: 'teste',
      email: 'testeee@email.com',
      senha: '123456',
      crp: '31231231',
      telefone: '11999999999',
      fkRoles: { id: 3, role: 'PSICOLOGO' },
      status: 'ATIVO',
      ativo: true,
    },
  ],
  clientes: [
    {
      id: '101',
      nome: 'Ana Souza',
      email: 'ana.cliente@agendfy.com',
      senha: 'Cliente@1234',
      telefone: '11988881010',
      psicologoId: 1,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
    },
    {
      id: '102',
      nome: 'Carlos Lima',
      email: 'carlos.cliente@agendfy.com',
      senha: 'Cliente@1234',
      telefone: '11988882020',
      psicologoId: 2,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
    },
  ],
  sessoes: [
    {
      id: '1001',
      clienteId: 101,
      psicologoId: 1,
      data: '2026-04-10',
      hora: '09:00',
      status: 'AGENDADA',
    },
    {
      id: '1002',
      clienteId: 102,
      psicologoId: 2,
      data: '2026-04-11',
      hora: '14:30',
      status: 'AGENDADA',
    },
  ],
};

const formatRole = (entry) => entry.role || entry.fkRoles || { id: 0, role: 'DESCONHECIDO' };

const asPsicologoResponse = (entry) => ({
  ...clone(entry),
  role: formatRole(entry),
  fkRoles: entry.fkRoles || { id: formatRole(entry).id, role: formatRole(entry).role },
});

const asClienteResponse = (entry) => ({
  ...clone(entry),
  role: entry.role || { id: 2, role: 'CLIENTE' },
  dadosPaciente: {
    nome: entry?.dadosPaciente?.nome || entry?.nome || '',
    sobrenome: entry?.dadosPaciente?.sobrenome || '',
    email: entry?.dadosPaciente?.email || entry?.email || '',
    diaConsultas: entry?.dadosPaciente?.diaConsultas || 'Quinta-Feira',
    horarioConsultas: entry?.dadosPaciente?.horarioConsultas || '16:00',
    contatoEmergencia: entry?.dadosPaciente?.contatoEmergencia || '',
    telefoneEmergencia: entry?.dadosPaciente?.telefoneEmergencia || '',
  },
  endereco: {
    cep: entry?.endereco?.cep || '',
    cidade: entry?.endereco?.cidade || '',
    bairro: entry?.endereco?.bairro || '',
    numero: entry?.endereco?.numero || '',
    logradouro: entry?.endereco?.logradouro || '',
    complemento: entry?.endereco?.complemento || '',
    semComplemento: Boolean(entry?.endereco?.semComplemento),
  },
  planos: {
    mensal: entry?.planos?.mensal !== false,
    anual: Boolean(entry?.planos?.anual),
  },
});

const asSessaoResponse = (entry) => {
  const paciente = state.clientes.find((item) => String(item.id) === String(entry.clienteId));
  const psicologo = state.psicologos.find((item) => String(item.id) === String(entry.psicologoId));

  return {
    ...clone(entry),
    statusSessao: entry.status,
    fkPaciente: paciente
      ? {
          id: paciente.id,
          nome: paciente.nome,
          email: paciente.email,
          telefone: paciente.telefone,
        }
      : null,
    fkPsicologo: psicologo
      ? {
          id: psicologo.id,
          nome: psicologo.nome,
          email: psicologo.email,
          telefone: psicologo.telefone,
        }
      : null,
  };
};

const getPrimaryPassword = (entry) => entry.senha || '';

const getPersonList = (type) => clone(state[type]);

const setSession = (session) => {
  state.currentSession = session ? clone(session) : null;
};

const clearSession = () => {
  state.currentSession = null;
};

const getSession = () => (state.currentSession ? clone(state.currentSession) : null);

const setPendingRecoveryEmail = (email) => {
  state.pendingRecoveryEmail = email || null;
};

const getPendingRecoveryEmail = () => state.pendingRecoveryEmail;

const findLoginRecord = (email) => {
  const psicologo = state.psicologos.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
  if (psicologo) {
    return { kind: 'psicologo', data: psicologo };
  }

  const cliente = state.clientes.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
  if (cliente) {
    return { kind: 'cliente', data: cliente };
  }

  return null;
};

const updatePsicologo = (id, patch) => {
  const index = state.psicologos.findIndex((item) => String(item.id) === String(id));
  if (index < 0) {
    return null;
  }

  state.psicologos[index] = {
    ...state.psicologos[index],
    ...clone(patch),
  };

  return asPsicologoResponse(state.psicologos[index]);
};

const createPsicologo = (payload) => {
  const newItem = {
    id: String(Date.now()),
    ativo: true,
    role: payload.role || { id: 1, role: 'PSICOLOGO' },
    ...clone(payload),
  };
  state.psicologos.unshift(newItem);
  return asPsicologoResponse(newItem);
};

const updateCliente = (id, patch) => {
  const index = state.clientes.findIndex((item) => String(item.id) === String(id));
  if (index < 0) {
    return null;
  }

  state.clientes[index] = {
    ...state.clientes[index],
    ...clone(patch),
  };

  return asClienteResponse(state.clientes[index]);
};

const createCliente = (payload) => {
  const newItem = {
    id: String(Date.now()),
    ativo: true,
    role: payload.role || { id: 2, role: 'CLIENTE' },
    psicologoId: payload.psicologoId || 1,
    ...clone(payload),
  };
  state.clientes.unshift(newItem);
  return asClienteResponse(newItem);
};

const updateSessao = (id, patch) => {
  const index = state.sessoes.findIndex((item) => String(item.id) === String(id));
  if (index < 0) {
    return null;
  }

  state.sessoes[index] = {
    ...state.sessoes[index],
    ...clone(patch),
  };

  return asSessaoResponse(state.sessoes[index]);
};

const createSessao = (payload) => {
  const newItem = {
    id: String(Date.now()),
    status: payload.status || 'AGENDADA',
    ...clone(payload),
  };
  state.sessoes.unshift(newItem);
  return asSessaoResponse(newItem);
};

const removeSessao = (id) => {
  const index = state.sessoes.findIndex((item) => String(item.id) === String(id));
  if (index < 0) {
    return null;
  }

  const current = state.sessoes[index];
  state.sessoes[index] = {
    ...current,
    status: 'CANCELADA',
  };
  return asSessaoResponse(state.sessoes[index]);
};

const updatePassword = (id, senhaAtual, novaSenha) => {
  const index = state.psicologos.findIndex((item) => String(item.id) === String(id));
  if (index < 0) {
    return null;
  }

  const current = state.psicologos[index];
  if (current.senha !== senhaAtual) {
    const error = new Error('Senha atual invalida.');
    error.code = 'INVALID_CURRENT_PASSWORD';
    throw error;
  }

  state.psicologos[index] = {
    ...current,
    senha: novaSenha,
  };

  return asPsicologoResponse(state.psicologos[index]);
};

const findPsicologoByEmail = (email) => state.psicologos.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

const findClienteByEmail = (email) => state.clientes.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

const listSessoesSemana = (segunda) => {
  if (!segunda) {
    return state.sessoes.map(asSessaoResponse);
  }

  const start = new Date(`${segunda}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);

  return state.sessoes
    .filter((item) => {
      const currentDate = new Date(`${item.data}T00:00:00`);
      return currentDate >= start && currentDate <= end;
    })
    .map(asSessaoResponse);
};

export {
  asClienteResponse,
  asPsicologoResponse,
  asSessaoResponse,
  clearSession,
  createCliente,
  createPsicologo,
  createSessao,
  findClienteByEmail,
  findLoginRecord,
  findPsicologoByEmail,
  getPendingRecoveryEmail,
  getPersonList,
  getPrimaryPassword,
  getSession,
  listSessoesSemana,
  removeSessao,
  setPendingRecoveryEmail,
  setSession,
  state,
  updateCliente,
  updatePassword,
  updatePsicologo,
  updateSessao,
};
