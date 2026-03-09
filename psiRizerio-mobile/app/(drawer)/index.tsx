import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, PanResponder } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppointmentCard } from '@/components/AppointmentCard';
import { Colors } from '@/constants/theme';
import { CustomAlert } from '@/components/CustomAlert';
import { useRouter } from 'expo-router';

const MOCK_APPOINTMENTS: { 
  id: string; 
  date: string; 
  time: string; 
  location: string; 
  status: 'Agendado' | 'Concluído'; 
  feedback?: 'Pendente' | 'Em andamento' | 'Finalizado' 
}[] = [
  { id: '1', date: "14/02/2025", time: '10:30', location: 'Online', status: 'Agendado' },
  { id: '2', date: "10/02/2025", time: '10:30', location: 'Online', status: 'Concluído', feedback: 'Pendente' },
  { id: '3', date: "10/01/2025", time: '10:30', location: 'Online', status: 'Concluído', feedback: 'Em andamento' },
  { id: '4', date: "10/01/2025", time: '10:30', location: 'Online', status: 'Concluído', feedback: 'Finalizado' },
];

export default function HomeScreen() {
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
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const generateDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, currentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
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
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > 50) {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
          } else {
            setCurrentMonth(m => m - 1);
          }
        } else if (gestureState.dx < -50) {
          if (currentMonth === 11) {
            setCurrentMonth(0);
                setCurrentYear((y: number) => y + 1);
          } else {
            setCurrentMonth(m => m + 1);
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
            Já fazem <ThemedText style={{ fontWeight: 'bold' }}>X meses</ThemedText> desde sua <ThemedText style={{ fontWeight: 'bold' }}>última</ThemedText> consulta.
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
            <TouchableOpacity onPress={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear((y: number) => y - 1);
              } else {
                setCurrentMonth(m => m - 1);
              }
            }}>
              <ThemedText style={styles.calendarHeaderText}>{"<"}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.calendarHeaderText}>{months[currentMonth]} {currentYear}</ThemedText>
            <TouchableOpacity onPress={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear((y: number) => y + 1);
              } else {
                setCurrentMonth(m => m + 1);
              }
            }}>
              <ThemedText style={styles.calendarHeaderText}>{">"}</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarPlaceholder}>
            <ThemedText style={{ color: colorScheme === 'dark' ? '#AAA' : '#666', fontSize: 12, marginBottom: 10 }}>dom  seg  ter  qua  qui  sex  sáb</ThemedText>
            {dynamicWeeks.map((week, wIdx) => (
              <View key={wIdx} style={styles.calendarRow}>
                {week.map((item, dIdx) => {
                  const isSelected = selectedDay === item.day && item.currentMonth;
                  return (
                    <TouchableOpacity 
                      key={dIdx} 
                      onPress={() => item.currentMonth && setSelectedDay(item.day)}
                      style={[
                        styles.dayButton, 
                        isSelected && { backgroundColor: colors.purpleLight }
                      ]}
                    >
                      <ThemedText style={[
                        styles.dayText, 
                        isSelected && { color: '#FFF', fontWeight: 'bold' },
                        !item.currentMonth && { color: '#AAA' }
                      ]}>
                        {item.day}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {MOCK_APPOINTMENTS.map((apt) => (
          <AppointmentCard
            key={apt.id}
            date={apt.date}
            time={apt.time}
            location={apt.location}
            status={apt.status}
            feedback={apt.feedback}
            onAction={handleCancelAction}
            onFeedbackAction={() => router.push('/feedback')}
          />
        ))}

        <CustomAlert 
          visible={alertVisible}
          title="Atenção"
          message={alertMsg}
          onClose={() => setAlertVisible(false)}
          onSecondaryAction={() => setAlertVisible(false)}
          primaryLabel="Sim"
          secondaryLabel="Não"
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
    borderColor: '#6B4EB8',
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
    borderColor: '#6B4EB8',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 5,
  },
  bannerButtonText: {
    fontWeight: 'bold',
  },
  calendarContainer: {
    borderWidth: 2,
    borderColor: '#6B4EB8',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  calendarHeader: {
    backgroundColor: '#6B4EB8',
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
  selectedDay: {
    backgroundColor: '#C0ADEF',
    color: '#FFF',
    fontWeight: 'bold',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
});
