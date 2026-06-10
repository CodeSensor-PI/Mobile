import React from 'react';
import { Redirect } from 'expo-router';

import { DashboardCliente } from '../../components/dashboard/DashboardCliente';
import { DashboardProfissional } from '../../components/dashboard/DashboardProfissional';
import { isPsicologoRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';

export default function DashboardIndexScreen() {
  const session = getCurrentSession();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = session?.usuario?.role || session?.usuario?.fkRoles;

  if (isPsicologoRole(role)) {
    return <DashboardProfissional />;
  }

  return <DashboardCliente />;
}
