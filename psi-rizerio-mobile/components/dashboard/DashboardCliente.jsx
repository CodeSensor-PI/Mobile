import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppointmentCard } from '../AppointmentCard';
import { CustomAlert } from '../CustomAlert';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { getCurrentSession } from '../../services/authService';
import { getAgendamentosPorPaciente, getMeuPaciente } from '../../services/dashboardService';

function isoFromSession(item) {
  if (item?.startTime) return String(item.startTime).split('T')[0];
  if (item?.data) return item.data;
  return '';
}

function statusToCard(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'AGENDADA' || normalized === 'PENDENTE' || normalized === 'CONFIRMADA') return 'Agendado';
  return 'Concluido';
}

function feedbackByStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'CONCLUIDA') return 'Pendente';
  if (normalized === 'CANCELADA') return 'Finalizado';
  return undefined;
}

export function DashboardCliente() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const session = getCurrentSession();

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [sessions, setSessions] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let patientId = session?.usuario?.patientId;
        if (!patientId) {
          const paciente = await getMeuPaciente(session?.usuario?.id);
          patientId = paciente?.id;
        }
        if (!patientId) return;
        const data = await getAgendamentosPorPaciente(patientId);
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        if (mounted) setSessions(list);
      } catch (_e) {
        if (mounted) setSessions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session?.usuario?.id, session?.usuario?.patientId]);

  const handleCancelAction = () => {
    setAlertMsg('Deseja realmente cancelar este agendamento?');
    setAlertVisible(true);
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // Mapa de dias com agendamento por mês: { 'yyyy-mm-dd': [status,...] }
  const sessionsByIso = useMemo(() => {
    return sessions.reduce((acc, item) => {
      const iso = isoFromSession(item);
      if (!iso) return acc;
      if (!acc[iso]) acc[iso] = [];
      acc[iso].push(String(item.status || item.statusSessao || '').toUpperCase());
      return acc;
    }, {});
  }, [sessions]);

  // "X meses desde a última consulta": baseado na sessão CONCLUIDA mais recente.
  const ultimaConsultaInfo = useMemo(() => {
    const concluidas = sessions
      .filter((s) => String(s.status || s.statusSessao || '').toUpperCase() === 'CONCLUIDA')
      .map((s) => new Date(isoFromSession(s)))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b - a);

    if (concluidas.length === 0) return null;
    const last = concluidas[0];
    const now = new Date();
    let months = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
    if (now.getDate() < last.getDate()) months -= 1;
    return { months: Math.max(0, months) };
  }, [sessions]);

  const generateDays = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      days.push({ day: daysInPrevMonth - i, currentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push({ day: i, currentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i += 1) {
      days.push({ day: i, currentMonth: false });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  const dynamicWeeks = generateDays(currentMonth, currentYear);

  // Status do dia (no mês exibido) para colorir: 'futuro' | 'passado' | null
  const dayMarker = (dayNumber) => {
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const statuses = sessionsByIso[iso];
    if (!statuses || statuses.length === 0) return null;
    const hasAgendada = statuses.some((s) => s === 'AGENDADA' || s === 'PENDENTE' || s === 'CONFIRMADA');
    return hasAgendada ? 'futuro' : 'passado';
  };

  const cards = useMemo(() => {
    return sessions.map((item) => {
      const iso = isoFromSession(item);
      const [y, m, d] = iso.split('-');
      const timePart = item.startTime ? String(item.startTime).split('T')[1]?.slice(0, 5) : item.hora?.slice(0, 5);
      const status = item.status || item.statusSessao;
      return {
        id: item.id,
        date: iso ? `${d}/${m}/${y}` : '',
        time: timePart || '',
        location: 'Online',
        status: statusToCard(status),
        feedback: feedbackByStatus(status),
      };
    });
  }, [sessions]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_event, gestureState) => {
        if (gestureState.dx > 50) {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((value) => value - 1);
          } else {
            setCurrentMonth((value) => value - 1);
          }
        } else if (gestureState.dx < -50) {
          if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((value) => value + 1);
          } else {
            setCurrentMonth((value) => value + 1);
          }
        }
      },
    })
  ).current;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.banner, { borderColor: colors.primary }]}>
          <ThemedText style={styles.bannerText}>
            {ultimaConsultaInfo
              ? ultimaConsultaInfo.months === 0
                ? <>Sua <ThemedText style={{ fontWeight: 'bold' }}>última</ThemedText> consulta foi neste mês.</>
                : <>Ja fazem <ThemedText style={{ fontWeight: 'bold' }}>{ultimaConsultaInfo.months} {ultimaConsultaInfo.months === 1 ? 'mês' : 'meses'}</ThemedText> desde sua <ThemedText style={{ fontWeight: 'bold' }}>última</ThemedText> consulta.</>
              : 'Você ainda não realizou consultas concluídas.'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.bannerButton, { borderColor: colors.primary }]}
            onPress={() => router.push('/(drawer)/agendamentos')}
          >
            <ThemedText style={[styles.bannerButtonText, { color: colors.primary }]}>Agendar Retorno</ThemedText>
          </TouchableOpacity>
        </View>

        <View
          {...panResponder.panHandlers}
          style={[styles.calendarContainer, { borderColor: colors.primary }]}
        >
          <View style={[styles.calendarHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity
              onPress={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((value) => value - 1);
                } else {
                  setCurrentMonth((value) => value - 1);
                }
              }}
            >
              <ThemedText style={styles.calendarHeaderText}>{'<'}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.calendarHeaderText}>{months[currentMonth]} {currentYear}</ThemedText>
            <TouchableOpacity
              onPress={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((value) => value + 1);
                } else {
                  setCurrentMonth((value) => value + 1);
                }
              }}
            >
              <ThemedText style={styles.calendarHeaderText}>{'>'}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarPlaceholder}>
            <View style={styles.weekHeader}>
              {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map((weekday) => (
                <View key={weekday} style={styles.weekdayCell}>
                  <ThemedText style={styles.weekdayText}>{weekday}</ThemedText>
                </View>
              ))}
            </View>

            {dynamicWeeks.map((week, weekIndex) => (
              <View key={`${weekIndex}`} style={styles.calendarRow}>
                {week.map((item, dayIndex) => {
                  const isSelected = selectedDay === item.day && item.currentMonth;
                  const marker = item.currentMonth ? dayMarker(item.day) : null;
                  const markerColor = marker === 'futuro' ? '#16a34a' : marker === 'passado' ? '#0e7490' : 'transparent';

                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      onPress={() => item.currentMonth && setSelectedDay(item.day)}
                      style={[
                        styles.dayButton,
                        marker && { borderWidth: 1.5, borderColor: markerColor },
                        isSelected && { backgroundColor: colors.purpleLight },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.dayText,
                          isSelected && { color: '#FFF', fontWeight: 'bold' },
                          !item.currentMonth && { color: '#AAA' },
                        ]}
                      >
                        {item.day}
                      </ThemedText>
                      {marker ? <View style={[styles.dayDot, { backgroundColor: markerColor }]} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dayDot, { backgroundColor: '#16a34a' }]} />
                <ThemedText style={styles.legendText}>Agendada</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dayDot, { backgroundColor: '#0e7490' }]} />
                <ThemedText style={styles.legendText}>Realizada</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {cards.length === 0 ? (
          <ThemedText style={styles.emptyText}>Você ainda não possui agendamentos.</ThemedText>
        ) : (
          cards.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              date={appointment.date}
              time={appointment.time}
              location={appointment.location}
              status={appointment.status}
              feedback={appointment.feedback}
              onAction={handleCancelAction}
              onFeedbackAction={() => router.push('/(drawer)/feedback')}
            />
          ))
        )}

        <CustomAlert
          visible={alertVisible}
          title="Atencao"
          message={alertMsg}
          onClose={() => setAlertVisible(false)}
          onSecondaryAction={() => setAlertVisible(false)}
          primaryLabel="Sim"
          secondaryLabel="Nao"
          type="warning"
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  banner: {
    borderWidth: 2,
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  bannerButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 5,
  },
  bannerButtonText: {
    fontWeight: 'bold',
  },
  calendarContainer: {
    borderWidth: 2,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  calendarHeader: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  calendarHeaderText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  calendarPlaceholder: {
    padding: 15,
    alignItems: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  weekdayCell: {
    width: 30,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 10,
    color: '#888',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
  },
  dayButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  dayText: {
    fontSize: 12,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
  },
});
