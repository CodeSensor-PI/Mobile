import React, { useCallback, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { CustomDrawerContent } from './../../components/CustomDrawerContent';
import { getDrawerColorForRole, isClienteRole } from './../../constants/role-theme';
import { IconSymbol } from './../../components/ui/icon-symbol';
import { getCurrentSession } from './../../services/authService';
import { getAgendamentosPorPaciente, getFeedbacksByPatient, getPacientePorUserId } from './../../services/dashboardService';

export default function DrawerLayout() {
  const session = getCurrentSession();
  const role = session?.usuario?.role || session?.usuario?.fkRoles;
  const primaryColor = getDrawerColorForRole(role);
  const isCliente = isClienteRole(role);
  const [showFeedbackTab, setShowFeedbackTab] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadFeedbackAvailability = async () => {
        if (!isCliente || !session?.usuario?.id) {
          if (mounted) {
            setShowFeedbackTab(false);
          }
          return;
        }

        try {
          const patient = await getPacientePorUserId(session.usuario.id);
          if (!patient?.id) {
            if (mounted) {
              setShowFeedbackTab(false);
            }
            return;
          }

          const [sessoes, feedbacks] = await Promise.all([
            getAgendamentosPorPaciente(patient.id),
            getFeedbacksByPatient(patient.id),
          ]);

          const sessoesComFeedback = new Set(
            feedbacks
              .map((item) => item?.sessaoId)
              .filter(Boolean)
              .map((id) => String(id))
          );

          const hasPendingFeedback = (Array.isArray(sessoes) ? sessoes : []).some((sessao) => {
            const status = String(sessao?.statusSessao || sessao?.status || '').toUpperCase();
            return status === 'CONCLUIDA' && !sessoesComFeedback.has(String(sessao?.id));
          });

          if (mounted) {
            setShowFeedbackTab(hasPendingFeedback);
          }
        } catch (_error) {
          if (mounted) {
            setShowFeedbackTab(false);
          }
        }
      };

      loadFeedbackAvailability();

      return () => {
        mounted = false;
      };
    }, [isCliente, session?.usuario?.id])
  );

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} primaryColor={primaryColor} role={role} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: primaryColor,
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        drawerActiveTintColor: primaryColor,
        drawerInactiveTintColor: '#FFF',
        headerTitleAlign: 'center',
        // Fix: impede que o overlay do drawer bloqueie o foco de elementos filhos
        // causando o erro "Blocked aria-hidden on an element because its descendant retained focus"
        overlayColor: 'rgba(0,0,0,0.4)',
        drawerStatusBarAnimation: 'none',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: isCliente ? 'Home' : 'Dashboard',
          drawerLabel: isCliente ? 'Home' : 'Dashboard',
          drawerIcon: ({ size, color }) => <IconSymbol name="house" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="agendamentos"
        options={{
          title: isCliente ? 'Meus Agendamentos' : 'Agendamentos',
          drawerLabel: isCliente ? 'Meus Agendamentos' : 'Agendamentos',
          drawerIcon: ({ size, color }) => <IconSymbol name="calendar" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="pacientes"
        options={{
          title: 'Meus Pacientes',
          drawerLabel: 'Meus Pacientes',
          drawerItemStyle: isCliente ? { display: 'none' } : undefined,
          drawerIcon: ({ size, color }) => <IconSymbol name="person.2" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="psicologos"
        options={{
          title: 'Psicólogos',
          drawerLabel: 'Psicólogos',
          drawerItemStyle: isCliente ? { display: 'none' } : undefined,
          drawerIcon: ({ size, color }) => <IconSymbol name="person.3" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="relatorios-ia"
        options={{
          title: 'Relatórios IA',
          drawerLabel: 'Relatórios IA',
          drawerItemStyle: isCliente ? { display: 'none' } : undefined,
          drawerIcon: ({ size, color }) => <IconSymbol name="brain" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="administracao"
        options={{
          title: 'Administração',
          drawerLabel: 'Administração',
          drawerItemStyle: isCliente ? { display: 'none' } : undefined,
          drawerIcon: ({ size, color }) => <IconSymbol name="gear" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Configurações',
          drawerLabel: 'Configurações',
          drawerIcon: ({ size, color }) => <IconSymbol name="gear" size={size} color={color} />,
          drawerItemStyle: isCliente ? undefined : { display: 'none' },
          headerShown: isCliente,
        }}
      />
      <Drawer.Screen
        name="feedback"
        options={{
          title: 'Feedbacks',
          drawerLabel: 'Feedbacks',
          drawerIcon: ({ size, color }) => <IconSymbol name="bubble.left.and.bubble.right" size={size} color={color} />,
          drawerItemStyle: isCliente && showFeedbackTab ? undefined : { display: 'none' },
          headerShown: isCliente,
        }}
      />
      <Drawer.Screen
        name="change-password"
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }}
      />
      <Drawer.Screen
        name="logout"
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }}
      />
    </Drawer>
  );
}
