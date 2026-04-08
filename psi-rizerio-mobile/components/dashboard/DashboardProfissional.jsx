import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomAlert } from '../CustomAlert';
import { ThemedView } from '../themed-view';
import { getCurrentSession } from '../../services/authService';
import { getAgendamentos, listClientes } from '../../services/dashboardService';

const PRIMARY_COLOR = '#1B66A4';

function getMonday(date = new Date()) {
  const current = new Date(date);
  const currentDay = current.getDay();

  if (currentDay === 6) current.setDate(current.getDate() + 2);
  else if (currentDay === 0) current.setDate(current.getDate() + 1);
  else current.setDate(current.getDate() - (currentDay - 1));

  return current;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toPercent(partial, total) {
  if (!total) return 0;
  return Math.round((partial / total) * 100);
}

function statusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDENTE') return 'Pendente';
  if (normalized === 'CONFIRMADA') return 'Confirmada';
  if (normalized === 'CANCELADA') return 'Cancelada';
  if (normalized === 'CONCLUIDA') return 'Concluida';
  if (normalized === 'AGENDADA') return 'Agendada';
  return 'Indefinido';
}

export function DashboardProfissional() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    const session = getCurrentSession();
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await getAgendamentos();
        setSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        setAlert({
          visible: true,
          title: 'Erro',
          message: error.message || 'Nao foi possivel carregar o dashboard.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const metrics = useMemo(() => {
    const total = sessions.length;
    const canceladas = sessions.filter((item) => String(item.statusSessao || item.status).toUpperCase() === 'CANCELADA').length;
    const inativos = listClientes().filter((item) => item.ativo === false).length;
    const weekStart = getMonday();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);

    const weeklySessions = sessions.filter((item) => {
      const sessionDate = new Date(`${item.data}T00:00:00`);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    }).length;

    return {
      total,
      canceladas,
      inativos,
      weeklySessions,
      inactivePercent: toPercent(inativos, Math.max(listClientes().length, 1)),
      cancelPercent: toPercent(canceladas, Math.max(total, 1)),
    };
  }, [sessions]);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')) || String(a.hora || '').localeCompare(String(b.hora || '')))
      .slice(0, 5);
  }, [sessions]);

  const chartRows = useMemo(() => {
    const counts = sessions.reduce(
      (accumulator, session) => {
        const status = String(session.statusSessao || session.status).toUpperCase();
        if (status === 'CANCELADA') accumulator.canceladas += 1;
        if (status === 'CONCLUIDA') accumulator.concluidas += 1;
        if (status === 'PENDENTE' || status === 'AGENDADA' || status === 'CONFIRMADA') accumulator.agendadas += 1;
        return accumulator;
      },
      { canceladas: 0, concluidas: 0, agendadas: 0 }
    );

    return [
      { label: 'Agendadas', value: counts.agendadas, color: PRIMARY_COLOR },
      { label: 'Concluidas', value: counts.concluidas, color: '#16a34a' },
      { label: 'Canceladas', value: counts.canceladas, color: '#ef4444' },
    ];
  }, [sessions]);

  const closeAlert = () => setAlert((prev) => ({ ...prev, visible: false }));
  const headerName = getCurrentSession()?.usuario?.nome || 'Usuario';

  return (
    <ThemedView style={styles.container} lightColor="#F8F9FB" darkColor="#F8F9FB">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.subtitle}>,Olá, {headerName}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(drawer)/agendamentos')}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          {[
            { label: 'Pacientes agendados na semana', value: loading ? '...' : String(metrics.weeklySessions) },
            { label: 'Cancelamentos na semana', value: loading ? '...' : `${metrics.cancelPercent}%` },
            { label: 'Pacientes inativos', value: loading ? '...' : `${metrics.inactivePercent}%` },
          ].map((item) => (
            <View key={item.label} style={[styles.metricCard, { borderColor: PRIMARY_COLOR }]}> 
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pacientes do dia</Text>
            <Text style={styles.sectionSubtitle}>Atualizado automaticamente</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : recentSessions.filter((item) => sameDay(new Date(`${item.data}T00:00:00`), new Date())).length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma sessao marcada para hoje.</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: PRIMARY_COLOR }]} onPress={() => router.push('/(drawer)/agendamentos')}>
                <Text style={styles.primaryButtonText}>Ver agenda</Text>
              </Pressable>
            </View>
          ) : (
            recentSessions
              .filter((item) => sameDay(new Date(`${item.data}T00:00:00`), new Date()))
              .map((item) => (
                <View key={item.id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{item.fkPaciente?.nome || 'Paciente'}</Text>
                    <Text style={styles.sessionMeta}>{item.hora?.slice(0, 5) || item.hora}</Text>
                  </View>
                  <Text style={[styles.statusBadge, { backgroundColor: item.statusSessao === 'CANCELADA' ? '#ef4444' : item.statusSessao === 'CONCLUIDA' ? '#16a34a' : '#7c3aed' }]}>
                    {statusLabel(item.statusSessao)}
                  </Text>
                </View>
              ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Indice de cancelados / concluidos</Text>
            <Text style={styles.sectionSubtitle}>Resumo do periodo</Text>
          </View>

          {chartRows.map((row) => (
            <View key={row.label} style={styles.chartRow}>
              <View style={styles.chartLabelRow}>
                <Text style={styles.chartLabel}>{row.label}</Text>
                <Text style={styles.chartValue}>{row.value}</Text>
              </View>
              <View style={styles.chartTrack}>
                <View style={[styles.chartFill, { width: `${Math.min(row.value * 20, 100)}%`, backgroundColor: row.color }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.quickActionsRow}>
          <Pressable style={[styles.quickActionCard, { borderColor: PRIMARY_COLOR }]} onPress={() => router.push('/(drawer)/administracao')}>
            <Ionicons name="settings-outline" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.quickActionText}>Administracao</Text>
          </Pressable>
          <Pressable style={[styles.quickActionCard, { borderColor: PRIMARY_COLOR }]} onPress={() => router.push('/(drawer)/psicologos')}>
            <Ionicons name="people-outline" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.quickActionText}>Psicologos</Text>
          </Pressable>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 32,
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
    fontSize: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyBox: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  emptyText: {
    color: '#475569',
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1d4ed8',
  },
  sessionInfo: {
    flex: 1,
    paddingRight: 10,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  sessionMeta: {
    marginTop: 2,
    color: '#64748b',
  },
  statusBadge: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chartRow: {
    gap: 6,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    color: '#334155',
    fontWeight: '600',
  },
  chartValue: {
    color: '#0f172a',
    fontWeight: '800',
  },
  chartTrack: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 999,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});
