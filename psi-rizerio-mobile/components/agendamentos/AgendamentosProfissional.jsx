import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { getPrimaryColorForRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';
import {
  cancelAgendamento,
  findClienteById,
  listClientes,
  paginacaoGetAgendamentos,
  postAgendamento,
  putAgendamento,
} from '../../services/dashboardService';

function getMonday(offset = 0) {
  const today = new Date();
  const currentDay = today.getDay();

  if (currentDay === 6) today.setDate(today.getDate() + 2);
  else if (currentDay === 0) today.setDate(today.getDate() + 1);
  else today.setDate(today.getDate() - (currentDay - 1));

  today.setDate(today.getDate() + offset * 7);
  return today;
}

function getCurrentWeekDays(offset = 0) {
  const start = getMonday(offset);
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);

    const dayOfMonth = String(day.getDate()).padStart(2, '0');
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const year = day.getFullYear();

    return {
      dayName: daysOfWeek[day.getDay()],
      date: `${dayOfMonth}/${month}/${year}`,
      iso: `${year}-${month}-${dayOfMonth}`,
    };
  });
}

function getWeekRange(offset = 0) {
  const start = getMonday(offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);

  const format = (date) =>
    date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return `${format(start)} - ${format(end)}`;
}

function getMonthLabel(date) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function getMonthDaysWithSessions(sessions) {
  const daysMap = {};
  sessions.forEach(s => {
    if (!daysMap[s.data]) {
      const parts = s.data.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      daysMap[s.data] = {
        dayName: daysOfWeek[d.getDay()],
        date: `${parts[2]}/${parts[1]}/${parts[0]}`,
        iso: s.data,
      };
    }
  });
  return Object.values(daysMap).sort((a, b) => a.iso.localeCompare(b.iso));
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function isPastDateTime(isoDate, hour) {
  if (!isoDate || !hour) return false;
  const [year, month, day] = isoDate.split('-').map(Number);
  const [hh, mm] = hour.split(':').map(Number);
  const scheduled = new Date(year, month - 1, day, hh, mm, 0, 0);
  return scheduled < new Date();
}

function normalizeSession(session) {
  let data = session.data;
  let hora = session.hora;

  if (!data && session.startTime) {
    const parts = session.startTime.split('T');
    data = parts[0];
    hora = parts[1];
  }

  return {
    ...session,
    data: data,
    hora: hora,
    statusSessao: session.statusSessao || session.status || 'PENDENTE',
    patientName: session.fkPaciente?.nome || session.patient?.name || 'Desconhecido',
    patientEmail: session.fkPaciente?.email || session.patient?.email || '',
    timeSlot: hora ? hora.slice(0, 5) : '00:00',
  };
}

function statusColor(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDENTE') return '#f59e0b';
  if (normalized === 'CONFIRMADA') return '#16a34a';
  if (normalized === 'CANCELADA') return '#ef4444';
  if (normalized === 'CONCLUIDA') return '#2563eb';
  if (normalized === 'AGENDADA') return '#7c3aed';
  return '#94a3b8';
}

export default function AgendamentosScreen() {
  const router = useRouter();
  const session = getCurrentSession();
  const primaryColor = getPrimaryColorForRole(session?.usuario?.role || session?.usuario?.fkRoles);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [offsetSemana, setOffsetSemana] = useState(0);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [form, setForm] = useState({
    date: '',
    hour: '',
    status: 'PENDENTE',
    tipo: 'AVULSO',
  });
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });

  const weekDays = useMemo(() => getCurrentWeekDays(offsetSemana), [offsetSemana]);
  const monthDays = useMemo(() => getMonthDaysWithSessions(agendamentos), [agendamentos]);
  const displayDays = viewMode === 'week' ? weekDays : monthDays;
  const clientes = useMemo(() => listClientes(), []);

  useEffect(() => {
    if (!getCurrentSession()) {
      router.replace('/(auth)/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        let data;
        if (viewMode === 'week') {
          const segunda = weekDays[0]?.iso;
          data = await paginacaoGetAgendamentos({ segunda, size: 40 });
        } else {
          const mes = currentMonthDate.getMonth() + 1;
          const ano = currentMonthDate.getFullYear();
          data = await paginacaoGetAgendamentos({ mes, ano, size: 100 });
        }
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        const normalized = list.map(normalizeSession);
        setAgendamentos(normalized);
        setExpandedDate(viewMode === 'week' ? weekDays[0]?.iso || '' : '');
      } catch (error) {
        setAlert({
          visible: true,
          title: 'Erro',
          message: error.message || 'Não foi possível carregar os agendamentos.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [offsetSemana, currentMonthDate, viewMode, router, weekDays]);

  const sessionsByDate = useMemo(() => {
    return agendamentos.reduce((accumulator, session) => {
      const key = session.data;
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(session);
      return accumulator;
    }, {});
  }, [agendamentos]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = clientQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return clientes;
    }

    return clientes.filter((client) =>
      `${client.nome} ${client.email}`.toLowerCase().includes(normalizedQuery)
    );
  }, [clientQuery, clientes]);

  const openCreate = (prefill = {}) => {
    setEditingId(null);
    setSelectedClientId('');
    setClientQuery('');
    setForm({
      date: prefill.date || weekDays[0]?.iso || '',
      hour: prefill.hour || '08:00',
      status: 'PENDENTE',
      tipo: 'AVULSO',
    });
    setModalVisible(true);
  };

  const openEdit = (session) => {
    setEditingId(session.id);
    setSelectedClientId(String(session.fkPaciente?.id || session.clienteId || ''));
    setClientQuery(session.fkPaciente?.nome || session.patientName || '');
    setForm({
      date: session.data || '',
      hour: session.hora ? session.hora.slice(0, 5) : session.timeSlot || '',
      status: session.statusSessao || session.status || 'PENDENTE',
      tipo: session.tipo || 'AVULSO',
    });
    setModalVisible(true);
  };

  const openError = (message) => {
    setAlert({ visible: true, title: 'Atenção', message, type: 'error' });
  };

  const openSuccess = (message) => {
    setAlert({ visible: true, title: 'Sucesso', message, type: 'success' });
  };

  const refresh = async () => {
      try {
        let data;
        if (viewMode === 'week') {
          const segunda = weekDays[0]?.iso;
          data = await paginacaoGetAgendamentos({ segunda, size: 40 });
        } else {
          const mes = currentMonthDate.getMonth() + 1;
          const ano = currentMonthDate.getFullYear();
          data = await paginacaoGetAgendamentos({ mes, ano, size: 100 });
        }
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        setAgendamentos(list.map(normalizeSession));
      } catch (e) {
        console.error(e);
      }
  };

  const handleSave = async () => {
    if (!selectedClientId) {
      openError('Selecione um paciente para continuar.');
      return;
    }

    if (!form.date || !form.hour) {
      openError('Preencha data e horário para continuar.');
      return;
    }

    if (isPastDateTime(form.date, form.hour)) {
      openError('Não é possível agendar para um horário que já passou.');
      return;
    }

    const cliente = findClienteById(selectedClientId);
    if (!cliente) {
      openError('Paciente selecionado não encontrado.');
      return;
    }

    const payload = {
      patientId: cliente.id,
      psychologistId: String(session?.usuario?.id || ''),
      startTime: `${form.date}T${form.hour.length === 5 ? form.hour + ':00' : form.hour}`,
      endTime: `${form.date}T${form.hour.length === 5 ? form.hour + ':00' : form.hour}`,
      status: form.status || 'PENDENTE',
      clinicalNotes: '',
    };

    setSaving(true);

    try {
      if (editingId) {
        await putAgendamento(editingId, payload);
        openSuccess('Agendamento atualizado com sucesso!');
      } else {
        await postAgendamento(payload);
        openSuccess('Agendamento cadastrado com sucesso!');
      }

      await refresh();
      setModalVisible(false);
    } catch (error) {
      openError(error.message || 'Erro ao salvar agendamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSession = (session) => {
    Alert.alert(
      'Cancelar agendamento?',
      'Tem certeza que deseja cancelar esta sessão?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAgendamento(session.id);
              openSuccess('Agendamento cancelado com sucesso!');
              await refresh();
              setModalVisible(false);
            } catch (error) {
              openError(error.message || 'Erro ao cancelar agendamento.');
            }
          },
        },
      ]
    );
  };

  const handleCloseAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}></Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.viewToggle}>
          <Pressable style={[styles.toggleBtn, viewMode === 'week' && { backgroundColor: primaryColor }]} onPress={() => setViewMode('week')}>
            <Text style={[styles.toggleBtnText, viewMode === 'week' && { color: '#fff' }]}>Semana</Text>
          </Pressable>
          <Pressable style={[styles.toggleBtn, viewMode === 'month' && { backgroundColor: primaryColor }]} onPress={() => setViewMode('month')}>
            <Text style={[styles.toggleBtnText, viewMode === 'month' && { color: '#fff' }]}>Mês</Text>
          </Pressable>
        </View>

        {viewMode === 'week' ? (
          <View style={[styles.weekNav, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Pressable style={[styles.weekButton, { backgroundColor: primaryColor }]} onPress={() => setOffsetSemana(o => o - 1)}>
              <Ionicons name="chevron-back" size={16} color="#ffffff" />
            </Pressable>
            <Text style={{ fontWeight: '700' }}>{getWeekRange(offsetSemana)}</Text>
            <Pressable style={[styles.weekButton, { backgroundColor: primaryColor }]} onPress={() => setOffsetSemana(o => o + 1)}>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.weekNav, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Pressable style={[styles.weekButton, { backgroundColor: primaryColor }]} onPress={() => {
              const d = new Date(currentMonthDate);
              d.setMonth(d.getMonth() - 1);
              setCurrentMonthDate(d);
            }}>
              <Ionicons name="chevron-back" size={16} color="#ffffff" />
            </Pressable>
            <Text style={{ fontWeight: '700' }}>{getMonthLabel(currentMonthDate)}</Text>
            <Pressable style={[styles.weekButton, { backgroundColor: primaryColor }]} onPress={() => {
              const d = new Date(currentMonthDate);
              d.setMonth(d.getMonth() + 1);
              setCurrentMonthDate(d);
            }}>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </Pressable>
          </View>
        )}

        <Pressable style={[styles.addButton, { backgroundColor: primaryColor, width: '100%', marginTop: 8 }]} onPress={() => openCreate()}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Agendar consulta</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Carregando agendamentos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {displayDays.length === 0 && viewMode === 'month' ? (
            <View style={styles.centerState}>
               <Text style={styles.stateText}>Nenhum agendamento neste mês.</Text>
            </View>
          ) : null}

          {displayDays.map((day) => {
            const daySessions = sessionsByDate[day.iso] || [];
            const expanded = expandedDate === day.iso;

            return (
              <View key={day.iso} style={styles.dayBlock}>
                <Pressable style={[styles.dayHeader, { backgroundColor: primaryColor }]} onPress={() => setExpandedDate(expanded ? '' : day.iso)}>
                  <Text style={styles.dayHeaderText}>{`${day.dayName} - ${formatDisplayDate(day.iso)}`}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#ffffff" />
                </Pressable>

                {expanded && (
                  <View style={styles.dayBody}>
                    {daySessions.length === 0 ? (
                      <View style={styles.emptyBlock}>
                        <Text style={styles.emptyText}>Nenhum agendamento nesta data.</Text>
                        <AuthButton label="Agendar consulta" onPress={() => openCreate({ date: day.iso })} style={styles.emptyButton} />
                      </View>
                    ) : (
                      daySessions.map((session) => (
                        <View key={session.id} style={styles.sessionCard}>
                          <View style={styles.sessionHeader}>
                            <View style={styles.sessionInfo}>
                              <Text style={styles.sessionLabel}>Nome: <Text style={styles.sessionValue}>{session.patientName}</Text></Text>
                              <Text style={styles.sessionLabel}>Horário: <Text style={styles.sessionValue}>{session.timeSlot}</Text></Text>
                              <Text style={styles.sessionLabel}>Data: <Text style={styles.sessionValue}>{formatDisplayDate(session.data)}</Text></Text>
                            </View>
                            <Text style={[styles.statusChip, { backgroundColor: statusColor(session.statusSessao) }]}>
                              {session.statusSessao}
                            </Text>
                          </View>

                          <View style={styles.sessionActions}>
                            <AuthButton label="Editar" onPress={() => openEdit(session)} style={styles.actionButton} />
                            {String(session.statusSessao).toUpperCase() !== 'CANCELADA' && String(session.statusSessao).toUpperCase() !== 'CONCLUIDA' ? (
                              <AuthButton label="Cancelar" variant="secondary" onPress={() => handleCancelSession(session)} style={styles.actionButton} />
                            ) : null}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, { backgroundColor: primaryColor }]}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar agendamento' : 'Cadastrar agendamento'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <AuthTextInput
                label="Buscar paciente"
                value={clientQuery}
                onChangeText={setClientQuery}
                placeholder="Digite o nome ou email"
              />

              {clientQuery ? (
                <View style={styles.clientList}>
                  {filteredClients.slice(0, 5).map((client) => (
                    <Pressable
                      key={client.id}
                      style={[styles.clientItem, String(selectedClientId) === String(client.id) && styles.clientItemSelected]}
                      onPress={() => {
                        setSelectedClientId(String(client.id));
                        setClientQuery(client.nome);
                      }}
                    >
                      <Text style={styles.clientName}>{client.nome}</Text>
                      <Text style={styles.clientEmail}>{client.email}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <AuthTextInput
                label="Data (YYYY-MM-DD)"
                value={form.date}
                onChangeText={(value) => setForm((prev) => ({ ...prev, date: value }))}
                placeholder="2026-04-10"
              />

              <AuthTextInput
                label="Horário"
                value={form.hour}
                onChangeText={(value) => setForm((prev) => ({ ...prev, hour: value }))}
                placeholder="09:00"
              />

              <View style={styles.statusPicker}>
                <Text style={styles.statusPickerLabel}>Status</Text>
                <View style={styles.statusChoices}>
                  {['PENDENTE', 'CONFIRMADA', 'CANCELADA', 'CONCLUIDA'].map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusChoice,
                        form.status === status && styles.statusChoiceSelected,
                        form.status === status && { backgroundColor: primaryColor, borderColor: primaryColor },
                      ]}
                      onPress={() => setForm((prev) => ({ ...prev, status }))}
                    >
                      <Text style={[styles.statusChoiceText, form.status === status && styles.statusChoiceTextSelected]}>{status}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <AuthButton
                  label={saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar consulta'}
                  loading={saving}
                  onPress={handleSave}
                  style={styles.modalPrimaryButton}
                />
                <AuthButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalSecondaryButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} type={alert.type} onClose={handleCloseAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
    fontSize: 14,
  },
  toolbar: {
    paddingHorizontal: 16,
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontWeight: '600',
    color: '#475569',
  },
  weekNav: {
    gap: 8,
  },
  weekButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  weekButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 18,
    width: 217,
    height: 35,
    minHeight: 35,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: '#475569',
    fontSize: 16,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  dayBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dbe4f0',
  },
  dayHeader: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayHeaderText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  dayBody: {
    padding: 12,
    gap: 10,
  },
  emptyBlock: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyButton: {
    width: 217,
    height: 35,
    minHeight: 35,
    borderRadius: 18,
  },
  sessionCard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    gap: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
    gap: 4,
  },
  sessionLabel: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  sessionValue: {
    fontWeight: '400',
  },
  statusChip: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 150,
    height: 35,
    minHeight: 35,
    borderRadius: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#eef4fb',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalContent: {
    padding: 16,
    gap: 4,
  },
  clientList: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9dee7',
    overflow: 'hidden',
    marginBottom: 8,
  },
  clientItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  clientItemSelected: {
    backgroundColor: '#dbeafe',
  },
  clientName: {
    color: '#0f172a',
    fontWeight: '700',
  },
  clientEmail: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  statusPicker: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9dee7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  statusPickerLabel: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '700',
  },
  statusChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChoice: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChoiceSelected: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  statusChoiceText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  statusChoiceTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    marginTop: 8,
    gap: 10,
  },
  modalPrimaryButton: {
    width: '100%',
  },
  modalSecondaryButton: {
    width: '100%',
  },
});
