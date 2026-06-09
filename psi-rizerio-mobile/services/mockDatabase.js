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
      cpf: '12345678901',
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
      cpf: '23456789012',
      role: { id: 3, role: 'PSICOLOGO_ASSISTENTE' },
      ativo: true,
    },
    {
      id: '3',
      nome: 'Beatriz Santos',
      email: 'beatriz.psico@agendfy.com',
      senha: '123456',
      crp: '06112233',
      telefone: '11988887777',
      cpf: '34567890123',
      role: { id: 1, role: 'PSICOLOGO' },
      ativo: true,
    },
    {
      id: '4',
      nome: 'Rafael Costa',
      email: 'rafael.psico@agendfy.com',
      senha: '123456',
      crp: '06445566',
      telefone: '11977776666',
      cpf: '45678901234',
      role: { id: 1, role: 'PSICOLOGO' },
      ativo: true,
    },
    {
      id: '5',
      nome: 'Juliana Pereira',
      email: 'juliana.psico@agendfy.com',
      senha: '123456',
      crp: '06778899',
      telefone: '11966665555',
      cpf: '56789012345',
      role: { id: 3, role: 'PSICOLOGO_ASSISTENTE' },
      ativo: false,
    },
    {
      id: '6',
      nome: 'Admin Geral',
      email: 'admin@agendfy.com',
      senha: 'Admin@1234',
      crp: '06000000',
      telefone: '11900000000',
      cpf: '67890123456',
      role: { id: 4, role: 'ADMIN' },
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
      cpf: '98765432101',
      psicologoId: 1,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: -23.55052,
      longitude: -46.633308,
      dadosPaciente: {
        nome: 'Ana',
        sobrenome: 'Souza',
        email: 'ana.cliente@agendfy.com',
        diaConsultas: 'Segunda-Feira',
        horarioConsultas: '09:00',
        contatoEmergencia: 'Pedro Souza',
        telefoneEmergencia: '11988881011',
      },
      endereco: {
        cep: '01310-100',
        cidade: 'São Paulo',
        bairro: 'Bela Vista',
        numero: '1578',
        logradouro: 'Avenida Paulista',
        complemento: 'Apto 52',
        semComplemento: false,
      },
      planos: { mensal: true, anual: false },
    },
    {
      id: '102',
      nome: 'Carlos Lima',
      email: 'carlos.cliente@agendfy.com',
      senha: 'Cliente@1234',
      telefone: '11988882020',
      cpf: '87654321012',
      psicologoId: 2,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: -23.559616,
      longitude: -46.658027,
      dadosPaciente: {
        nome: 'Carlos',
        sobrenome: 'Lima',
        email: 'carlos.cliente@agendfy.com',
        diaConsultas: 'Quarta-Feira',
        horarioConsultas: '14:30',
        contatoEmergencia: 'Marta Lima',
        telefoneEmergencia: '11988882021',
      },
      endereco: {
        cep: '05402-000',
        cidade: 'São Paulo',
        bairro: 'Pinheiros',
        numero: '300',
        logradouro: 'Rua dos Pinheiros',
        complemento: '',
        semComplemento: true,
      },
      planos: { mensal: false, anual: true },
    },
    {
      id: '103',
      nome: 'Mariana Rocha',
      email: 'mariana.cliente@agendfy.com',
      senha: '123456',
      telefone: '11988883030',
      cpf: '76543210123',
      psicologoId: 1,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: -23.5605,
      longitude: -46.6605,
      dadosPaciente: {
        nome: 'Mariana',
        sobrenome: 'Rocha',
        email: 'mariana.cliente@agendfy.com',
        diaConsultas: 'Quinta-Feira',
        horarioConsultas: '16:00',
        contatoEmergencia: 'Lucas Rocha',
        telefoneEmergencia: '11988883031',
      },
      endereco: {
        cep: '04094-050',
        cidade: 'São Paulo',
        bairro: 'Vila Mariana',
        numero: '120',
        logradouro: 'Rua Domingos de Morais',
        complemento: 'Bloco B',
        semComplemento: false,
      },
      planos: { mensal: true, anual: false },
    },
    {
      id: '104',
      nome: 'João Mendes',
      email: 'joao.cliente@agendfy.com',
      senha: '123456',
      telefone: '11988884040',
      cpf: '65432101234',
      psicologoId: 3,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: -23.5489,
      longitude: -46.6388,
      dadosPaciente: {
        nome: 'João',
        sobrenome: 'Mendes',
        email: 'joao.cliente@agendfy.com',
        diaConsultas: 'Terça-Feira',
        horarioConsultas: '10:00',
        contatoEmergencia: 'Sandra Mendes',
        telefoneEmergencia: '11988884041',
      },
      endereco: {
        cep: '01001-000',
        cidade: 'São Paulo',
        bairro: 'Sé',
        numero: '10',
        logradouro: 'Praça da Sé',
        complemento: '',
        semComplemento: true,
      },
      planos: { mensal: true, anual: true },
    },
    {
      id: '105',
      nome: 'Fernanda Dias',
      email: 'fernanda.cliente@agendfy.com',
      senha: '123456',
      telefone: '11988885050',
      cpf: '54321012345',
      psicologoId: 1,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: -23.5712,
      longitude: -46.6919,
      dadosPaciente: {
        nome: 'Fernanda',
        sobrenome: 'Dias',
        email: 'fernanda.cliente@agendfy.com',
        diaConsultas: 'Sexta-Feira',
        horarioConsultas: '11:30',
        contatoEmergencia: 'Roberto Dias',
        telefoneEmergencia: '11988885051',
      },
      endereco: {
        cep: '05422-030',
        cidade: 'São Paulo',
        bairro: 'Pinheiros',
        numero: '850',
        logradouro: 'Rua Teodoro Sampaio',
        complemento: 'Casa 2',
        semComplemento: false,
      },
      planos: { mensal: true, anual: false },
    },
    {
      id: '106',
      nome: 'Bruno Carvalho',
      email: 'bruno.cliente@agendfy.com',
      senha: '123456',
      telefone: '11988886060',
      cpf: '43210123456',
      psicologoId: 2,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: -23.5995,
      longitude: -46.6731,
      dadosPaciente: {
        nome: 'Bruno',
        sobrenome: 'Carvalho',
        email: 'bruno.cliente@agendfy.com',
        diaConsultas: 'Segunda-Feira',
        horarioConsultas: '17:00',
        contatoEmergencia: 'Camila Carvalho',
        telefoneEmergencia: '11988886061',
      },
      endereco: {
        cep: '04538-133',
        cidade: 'São Paulo',
        bairro: 'Itaim Bibi',
        numero: '200',
        logradouro: 'Avenida Brigadeiro Faria Lima',
        complemento: 'Conj 1201',
        semComplemento: false,
      },
      planos: { mensal: false, anual: true },
    },
    {
      id: '107',
      nome: 'Paciente Novo',
      email: 'novo.paciente@email.com',
      senha: '123456',
      telefone: '',
      psicologoId: 1,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      latitude: null,
      longitude: null,
    },
  ],
  sessoes: [
    { id: '1001', clienteId: 101, psicologoId: 1, data: '2026-06-08', hora: '09:00', status: 'CONFIRMADA' },
    { id: '1002', clienteId: 102, psicologoId: 2, data: '2026-06-09', hora: '14:30', status: 'AGENDADA' },
    { id: '1003', clienteId: 103, psicologoId: 1, data: '2026-06-09', hora: '16:00', status: 'PENDENTE' },
    { id: '1004', clienteId: 104, psicologoId: 3, data: '2026-06-10', hora: '10:00', status: 'CONFIRMADA' },
    { id: '1005', clienteId: 105, psicologoId: 1, data: '2026-06-11', hora: '11:30', status: 'AGENDADA' },
    { id: '1006', clienteId: 106, psicologoId: 2, data: '2026-06-12', hora: '17:00', status: 'CONCLUIDA' },
    { id: '1007', clienteId: 101, psicologoId: 1, data: '2026-06-01', hora: '09:00', status: 'CONCLUIDA' },
    { id: '1008', clienteId: 103, psicologoId: 1, data: '2026-05-29', hora: '16:00', status: 'CANCELADA' },
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
  latitude: entry?.latitude ?? null,
  longitude: entry?.longitude ?? null,
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

const listPsicologos = () => state.psicologos.map(asPsicologoResponse);

const findPsicologoResponseById = (id) => {
  const entry = state.psicologos.find((item) => String(item.id) === String(id));
  return entry ? asPsicologoResponse(entry) : null;
};

const listClientesResponse = () => state.clientes.map(asClienteResponse);

const findClienteResponseById = (id) => {
  const entry = state.clientes.find((item) => String(item.id) === String(id));
  return entry ? asClienteResponse(entry) : null;
};

const listSessoes = () => state.sessoes.map(asSessaoResponse);

const listSessoesPorPaciente = (id) =>
  state.sessoes.filter((item) => String(item.clienteId) === String(id)).map(asSessaoResponse);

const listSessoesPorStatus = (status) =>
  state.sessoes
    .filter((item) => String(item.status).toUpperCase() === String(status).toUpperCase())
    .map(asSessaoResponse);

const listAllUsers = () => [
  ...state.psicologos.map((item) => ({
    id: item.id,
    nome: item.nome,
    email: item.email,
    telefone: item.telefone,
    role: formatRole(item),
    ativo: item.ativo,
  })),
  ...state.clientes.map((item) => ({
    id: item.id,
    nome: item.nome,
    email: item.email,
    telefone: item.telefone,
    role: item.role || { id: 2, role: 'CLIENTE' },
    ativo: item.ativo,
  })),
];

const getDashboardKpis = () => {
  const total = state.sessoes.length;
  const confirmadas = state.sessoes.filter((s) => ['CONFIRMADA', 'AGENDADA'].includes(s.status)).length;
  const concluidas = state.sessoes.filter((s) => s.status === 'CONCLUIDA').length;
  const canceladas = state.sessoes.filter((s) => s.status === 'CANCELADA').length;
  const pacientesAtivos = state.clientes.filter((c) => c.ativo).length;

  return {
    totalPacientes: pacientesAtivos,
    sessoesAgendadas: confirmadas,
    sessoesConcluidas: concluidas,
    sessoesCanceladas: canceladas,
    totalSessoes: total,
    faturamentoMensal: concluidas * 180,
    taxaComparecimento: total ? Math.round((concluidas / total) * 100) : 0,
  };
};

const getDashboardTrends = () => [
  { mes: 'Jan', sessoes: 18, faturamento: 3240 },
  { mes: 'Fev', sessoes: 22, faturamento: 3960 },
  { mes: 'Mar', sessoes: 25, faturamento: 4500 },
  { mes: 'Abr', sessoes: 21, faturamento: 3780 },
  { mes: 'Mai', sessoes: 28, faturamento: 5040 },
  { mes: 'Jun', sessoes: state.sessoes.length, faturamento: state.sessoes.length * 180 },
];

const getDashboardInsights = () => ({
  resumo:
    '## Visão Geral\nSua agenda está **saudável**. A taxa de comparecimento segue acima da média do setor.\n\n### Destaques\n- **3 pacientes** com consultas confirmadas esta semana\n- Faturamento projetado em alta de **12%** em relação ao mês anterior',
  recomendacoes:
    '### Recomendações\n- Confirme as **sessões pendentes** com 24h de antecedência\n- Considere abrir novos horários nas **quintas-feiras**, alta procura\n- Reative o contato com pacientes inativos há mais de 30 dias',
  alertas:
    '### Alertas\n- **1 sessão cancelada** recentemente — vale acompanhar o motivo\n- Paciente sem dados de endereço cadastrados',
});

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
    role: payload.role || payload.fkRoles || { id: 1, role: 'PSICOLOGO' },
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
  findClienteResponseById,
  findLoginRecord,
  findPsicologoByEmail,
  findPsicologoResponseById,
  getDashboardInsights,
  getDashboardKpis,
  getDashboardTrends,
  getPendingRecoveryEmail,
  getPersonList,
  getPrimaryPassword,
  getSession,
  listAllUsers,
  listClientesResponse,
  listPsicologos,
  listSessoes,
  listSessoesPorPaciente,
  listSessoesPorStatus,
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
