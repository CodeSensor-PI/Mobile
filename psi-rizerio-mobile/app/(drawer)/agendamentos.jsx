import React from 'react';
import { Redirect } from 'expo-router';

import { AgendamentosCliente } from '../../components/agendamentos/AgendamentosCliente';
import AgendamentosProfissional from '../../components/agendamentos/AgendamentosProfissional';
import { isPsicologoRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';

export default function AgendamentosIndexScreen() {
  const session = getCurrentSession();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = session?.usuario?.role || session?.usuario?.fkRoles;

  if (isPsicologoRole(role)) {
    return <AgendamentosProfissional />;
  }

  return <AgendamentosCliente />;
}
