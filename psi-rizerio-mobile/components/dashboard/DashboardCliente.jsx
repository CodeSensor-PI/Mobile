import React, { useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppointmentCard } from '../AppointmentCard';
import { CustomAlert } from '../CustomAlert';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

const MOCK_APPOINTMENTS = [
  { id: '1', date: '14/02/2025', time: '10:30', location: 'Online', status: 'Agendado' },
  { id: '2', date: '10/02/2025', time: '10:30', location: 'Online', status: 'Concluido', feedback: 'Pendente' },
  { id: '3', date: '10/01/2025', time: '10:30', location: 'Online', status: 'Concluido', feedback: 'Em andamento' },
  { id: '4', date: '10/01/2025', time: '10:30', location: 'Online', status: 'Concluido', feedback: 'Finalizado' },
];

export function DashboardCliente() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const handleCancelAction = () => {
    setAlertMsg('Deseja realmente cancelar este agendamento?');
    setAlertVisible(true);
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

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
            Ja fazem <ThemedText style={{ fontWeight: 'bold' }}>X meses</ThemedText> desde sua <ThemedText style={{ fontWeight: 'bold' }}>ultima</ThemedText> consulta.
          </ThemedText>
          <TouchableOpacity style={[styles.bannerButton, { borderColor: colors.primary }]}> 
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

                  return (
                    <TouchableOpacity
                      key={`${weekIndex}-${dayIndex}`}
                      onPress={() => item.currentMonth && setSelectedDay(item.day)}
                      style={[
                        styles.dayButton,
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
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {MOCK_APPOINTMENTS.map((appointment) => (
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
        ))}

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
});
