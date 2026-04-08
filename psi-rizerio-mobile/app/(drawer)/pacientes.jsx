import React from 'react';
import { Redirect } from 'expo-router';

import { PacientesProfissional } from '../../components/pacientes/PacientesProfissional';
import { isPsicologoRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';

export default function PacientesScreen() {
  const session = getCurrentSession();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = session?.usuario?.role || session?.usuario?.fkRoles;

  if (!isPsicologoRole(role)) {
    return <Redirect href="/(drawer)/index" />;
  }

  return <PacientesProfissional />;
}
