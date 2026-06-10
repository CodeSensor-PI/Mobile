import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomAlert } from '../CustomAlert';
import { ThemedView } from '../themed-view';
import { getCurrentSession } from '../../services/authService';
import {
  getAgendamentos,
  getDashboardKpis,
  getDashboardTrends,
  getDashboardInsights,
  listClientes,
} from '../../services/dashboardService';

const PRIMARY_COLOR = '#1B66A4';
const ACCENT_GREEN = '#16a34a';
const ACCENT_RED = '#ef4444';
const ACCENT_ORANGE = '#f59e0b';
const ACCENT_PURPLE = '#7c3aed';

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function renderMarkdownText(text, expanded) {
  if (!text) return null;
  const rawLines = text.split('\n').filter(Boolean);
  const lines = expanded ? rawLines : rawLines.slice(0, 3);
  
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <Text key={i} style={styles.insightHeading}>{line.replace('### ', '')}</Text>;
        } else if (line.startsWith('## ')) {
          return <Text key={i} style={styles.insightHeadingLg}>{line.replace('## ', '')}</Text>;
        }
        
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <Text key={i} style={styles.insightText}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <Text key={j} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
              }
              return part;
            })}
          </Text>
        );
      })}
      {!expanded && rawLines.length > 3 && <Text style={styles.insightText}>...</Text>}
    </>
  );
}

// ==========================================
// Insight Card (Expandable)
// ==========================================
function InsightCard({ title, icon, iconColor, content, loading }) {
  const [expanded, setExpanded] = useState(false);

  const lines = String(content || '').split('\n').filter(Boolean);
  const preview = lines.slice(0, 3).join('\n');

  return (
    <View style={[styles.insightCard, { borderLeftColor: iconColor }]}>
      <Pressable style={styles.insightHeader} onPress={() => !loading && setExpanded((v) => !v)}>
        <View style={[styles.insightIconCircle, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.insightTitleWrap}>
          <Text style={styles.insightTitle}>{title}</Text>
          {loading ? (
            <Text style={styles.insightSubLabel}>Gerando insight com IA...</Text>
          ) : (
            <Text style={styles.insightSubLabel}>{expanded ? 'Toque para colapsar' : 'Toque para expandir'}</Text>
          )}
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
        )}
      </Pressable>

      {!loading && (
        <View style={styles.insightBody}>
          {renderMarkdownText(content, expanded)}
        </View>
      )}
    </View>
  );
}

// ==========================================
// Main Dashboard
// ==========================================
export function DashboardProfissional() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
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
        const [sessionsData, kpisData, trendsData] = await Promise.all([
          getAgendamentos(),
          getDashboardKpis(),
          getDashboardTrends(),
        ]);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setKpis(kpisData);
        setTrends(Array.isArray(trendsData) ? trendsData : []);
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

      // Load insights separately (they may be slow due to AI)
      setInsightsLoading(true);
      try {
        const insightsData = await getDashboardInsights();
        setInsights(insightsData);
      } catch (_e) {
        // Insights will be null, cards will show a message
      } finally {
        setInsightsLoading(false);
      }
    };

    load();
  }, [router]);

  const todaySessions = useMemo(() => {
    return [...sessions]
      .filter((item) => sameDay(new Date(`${item.data}T00:00:00`), new Date()))
      .sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')));
  }, [sessions]);

  const maxTrendSessions = useMemo(() => {
    if (!trends.length) return 1;
    return Math.max(...trends.map((t) => t.sessionCount), 1);
  }, [trends]);

  const noShowDays = useMemo(() => {
    if (!kpis?.presence?.noShowByDayOfWeek) return [];
    const days = kpis.presence.noShowByDayOfWeek;
    const max = Math.max(...Object.values(days), 1);
    return Object.entries(days).map(([day, count]) => ({ day, count, percent: (count / max) * 100 }));
  }, [kpis]);

  const closeAlert = () => setAlert((prev) => ({ ...prev, visible: false }));
  const headerName = getCurrentSession()?.usuario?.nome || 'Usuario';

  // -- KPI Data --
  const financial = kpis?.financial || { paid: 0, pending: 0, projected: 0 };
  const presence = kpis?.presence || { total: 0, noShow: 0, noShowRate: 0 };
  const engagement = kpis?.engagement || { active: 0, inactive: 0, atRisk: 0 };
  const workload = kpis?.workload || { currentHours: 0, maxHours: 40 };
  const workloadPercent = workload.maxHours > 0 ? Math.min((workload.currentHours / workload.maxHours) * 100, 100) : 0;

  return (
    <ThemedView style={styles.container} lightColor="#F8F9FB" darkColor="#F8F9FB">
      <ScrollView contentContainerStyle={styles.content}>
        {/* ===== HEADER ===== */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.subtitle}>Olá, {headerName}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(drawer)/agendamentos')}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* ===== KPI CARDS - SAÚDE FINANCEIRA ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="wallet-outline" size={20} color={ACCENT_GREEN} />
              <Text style={styles.sectionTitle}>Saúde Financeira</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Projeção baseada nas sessões</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={PRIMARY_COLOR} />
            </View>
          ) : (
            <View style={styles.financialRow}>
              <View style={[styles.financialItem, { borderLeftColor: ACCENT_GREEN }]}>
                <Text style={styles.financialLabel}>Pago</Text>
                <Text style={[styles.financialValue, { color: ACCENT_GREEN }]}>{formatCurrency(financial.paid)}</Text>
              </View>
              <View style={[styles.financialItem, { borderLeftColor: ACCENT_ORANGE }]}>
                <Text style={styles.financialLabel}>Pendente</Text>
                <Text style={[styles.financialValue, { color: ACCENT_ORANGE }]}>{formatCurrency(financial.pending)}</Text>
              </View>
              <View style={[styles.financialItem, { borderLeftColor: PRIMARY_COLOR }]}>
                <Text style={styles.financialLabel}>Projetado</Text>
                <Text style={[styles.financialValue, { color: PRIMARY_COLOR }]}>{formatCurrency(financial.projected)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ===== KPI CARDS - GESTÃO DE PRESENÇA ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="pie-chart-outline" size={20} color={ACCENT_RED} />
              <Text style={styles.sectionTitle}>Gestão de Presença</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Taxa de No-Show por dia da semana</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={PRIMARY_COLOR} />
            </View>
          ) : (
            <>
              <View style={styles.presenceTopRow}>
                <View style={styles.presenceStat}>
                  <Text style={styles.presenceStatValue}>{presence.total}</Text>
                  <Text style={styles.presenceStatLabel}>Total</Text>
                </View>
                <View style={styles.presenceStat}>
                  <Text style={[styles.presenceStatValue, { color: ACCENT_RED }]}>{presence.noShow}</Text>
                  <Text style={styles.presenceStatLabel}>No-Show</Text>
                </View>
                <View style={styles.presenceStat}>
                  <Text style={[styles.presenceStatValue, { color: ACCENT_ORANGE }]}>
                    {Math.round(presence.noShowRate)}%
                  </Text>
                  <Text style={styles.presenceStatLabel}>Taxa</Text>
                </View>
              </View>

              {noShowDays.length > 0 && (
                <View style={styles.noShowBars}>
                  {noShowDays.map((item) => (
                    <View key={item.day} style={styles.noShowBarRow}>
                      <Text style={styles.noShowDayLabel}>{item.day.slice(0, 3)}</Text>
                      <View style={styles.noShowTrack}>
                        <View
                          style={[
                            styles.noShowFill,
                            {
                              width: `${Math.max(item.percent, 4)}%`,
                              backgroundColor: item.count > 0 ? ACCENT_RED : '#e2e8f0',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.noShowCount}>{item.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* ===== KPI CARDS - ENGAJAMENTO + CARGA HORÁRIA ===== */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderColor: ACCENT_PURPLE }]}>
            <Ionicons name="people-outline" size={22} color={ACCENT_PURPLE} />
            <Text style={styles.metricLabel}>Engajamento</Text>
            {loading ? (
              <ActivityIndicator size="small" color={ACCENT_PURPLE} />
            ) : (
              <View style={styles.engagementRow}>
                <View style={styles.engagementItem}>
                  <Text style={[styles.engagementValue, { color: ACCENT_GREEN }]}>{engagement.active}</Text>
                  <Text style={styles.engagementLabel}>Ativos</Text>
                </View>
                <View style={styles.engagementItem}>
                  <Text style={[styles.engagementValue, { color: '#94a3b8' }]}>{engagement.inactive}</Text>
                  <Text style={styles.engagementLabel}>Inativos</Text>
                </View>
                <View style={styles.engagementItem}>
                  <Text style={[styles.engagementValue, { color: ACCENT_RED }]}>{engagement.atRisk}</Text>
                  <Text style={styles.engagementLabel}>Risco</Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.metricCard, { borderColor: ACCENT_ORANGE }]}>
            <Ionicons name="time-outline" size={22} color={ACCENT_ORANGE} />
            <Text style={styles.metricLabel}>Carga Horária</Text>
            {loading ? (
              <ActivityIndicator size="small" color={ACCENT_ORANGE} />
            ) : (
              <>
                <Text style={styles.workloadText}>
                  {workload.currentHours}h / {workload.maxHours}h
                </Text>
                <View style={styles.workloadTrack}>
                  <View
                    style={[
                      styles.workloadFill,
                      {
                        width: `${workloadPercent}%`,
                        backgroundColor: workloadPercent > 80 ? ACCENT_RED : workloadPercent > 50 ? ACCENT_ORANGE : ACCENT_GREEN,
                      },
                    ]}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* ===== PACIENTES DO DIA ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="today-outline" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Pacientes do dia</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Atualizado automaticamente</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : todaySessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-clear-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhuma sessão marcada para hoje.</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: PRIMARY_COLOR }]} onPress={() => router.push('/(drawer)/agendamentos')}>
                <Text style={styles.primaryButtonText}>Ver agenda</Text>
              </Pressable>
            </View>
          ) : (
            todaySessions.map((item) => (
              <View key={item.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{item.fkPaciente?.nome || 'Paciente'}</Text>
                  <Text style={styles.sessionMeta}>{item.hora?.slice(0, 5) || item.hora}</Text>
                </View>
                <Text
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.statusSessao === 'CANCELADA'
                          ? ACCENT_RED
                          : item.statusSessao === 'CONCLUIDA'
                            ? ACCENT_GREEN
                            : ACCENT_PURPLE,
                    },
                  ]}
                >
                  {statusLabel(item.statusSessao)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* ===== GRÁFICO DE TENDÊNCIAS ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trending-up-outline" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Tendências (6 meses)</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Sessões e receita por período</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={PRIMARY_COLOR} />
            </View>
          ) : (
            <View style={styles.trendChart}>
              {trends.map((t, idx) => {
                const barHeight = maxTrendSessions > 0 ? (t.sessionCount / maxTrendSessions) * 100 : 0;
                return (
                  <View key={t.period || idx} style={styles.trendBarGroup}>
                    <Text style={styles.trendBarValue}>{t.sessionCount}</Text>
                    <View style={styles.trendBarTrack}>
                      <View
                        style={[
                          styles.trendBarFill,
                          {
                            height: `${Math.max(barHeight, 4)}%`,
                            backgroundColor: idx === trends.length - 1 ? PRIMARY_COLOR : '#93c5fd',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendBarLabel}>{t.period}</Text>
                    <Text style={styles.trendBarRevenue}>{formatCurrency(t.revenue)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ===== INSIGHTS IA ===== */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bulb-outline" size={20} color={ACCENT_ORANGE} />
            <Text style={styles.sectionTitle}>Insights de IA</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Análise inteligente do seu dataset clínico</Text>
        </View>

        <InsightCard
          title="Predição de Evasão"
          icon="warning-outline"
          iconColor={ACCENT_RED}
          content={insights?.insightRetencao || 'Nenhum insight disponível no momento.'}
          loading={insightsLoading}
        />
        <InsightCard
          title="Otimização de Agenda"
          icon="cash-outline"
          iconColor={ACCENT_ORANGE}
          content={insights?.insightFinanceiro || 'Nenhum insight disponível no momento.'}
          loading={insightsLoading}
        />
        <InsightCard
          title="Nicho de Especialização"
          icon="analytics-outline"
          iconColor={ACCENT_GREEN}
          content={insights?.insightPosicionamento || 'Nenhum insight disponível no momento.'}
          loading={insightsLoading}
        />

        {/* ===== AÇÕES RÁPIDAS ===== */}
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

  // -- Section Card --
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 28,
  },

  // -- Financial --
  financialRow: {
    flexDirection: 'row',
    gap: 8,
  },
  financialItem: {
    flex: 1,
    backgroundColor: '#f8fbff',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
  },
  financialLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },

  // -- Presence --
  presenceTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presenceStat: {
    flex: 1,
    backgroundColor: '#f8fbff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  presenceStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  presenceStatLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  noShowBars: {
    gap: 6,
    marginTop: 4,
  },
  noShowBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noShowDayLabel: {
    width: 30,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  noShowTrack: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  noShowFill: {
    height: '100%',
    borderRadius: 999,
  },
  noShowCount: {
    width: 20,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },

  // -- Metrics Row (Engajamento + Carga) --
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
    gap: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  engagementItem: {
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  engagementLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  workloadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  workloadTrack: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  workloadFill: {
    height: '100%',
    borderRadius: 999,
  },

  // -- Today sessions --
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

  // -- Trend Chart --
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    gap: 4,
  },
  trendBarGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trendBarValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  trendBarTrack: {
    width: '70%',
    height: 90,
    backgroundColor: '#eef2f7',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  trendBarLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  trendBarRevenue: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // -- Insight Cards --
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  insightIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitleWrap: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  insightSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  insightBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  insightHeadingLg: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginVertical: 4,
  },
  insightHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginVertical: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginVertical: 2,
  },

  // -- Quick Actions --
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
