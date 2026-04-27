import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from './../constants/theme';
import { useColorScheme } from './../hooks/use-color-scheme';
export function AppointmentCard({
  date,
  time,
  location,
  status,
  feedback,
  onAction,
  onFeedbackAction,
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getStatusColor = () => {
    return status === 'Agendado' ? colors.statusScheduled : colors.statusCompleted;
  };

  const getFeedbackIconColor = () => {
    if (feedback === 'Pendente') return '#FF5252';
    if (feedback === 'Em andamento') return '#FFD740';
    if (feedback === 'Concluido') return '#4CAF50';
    return 'transparent';
  };

  return (
    <View style={[styles.container, { borderColor: colors.primary }]}>
      <View style={styles.header}>
        <View style={styles.info}>
          <ThemedText style={styles.label}>Dia: <ThemedText style={styles.value}>{date}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Horário: <ThemedText style={styles.value}>{time}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Local: <ThemedText style={styles.value}>{location}</ThemedText></ThemedText>
          {feedback && (
            <View style={styles.feedbackRow}>
              <ThemedText style={styles.label}>Feedback: <ThemedText style={styles.value}>{feedback}</ThemedText></ThemedText>
              <View style={[styles.dot, { backgroundColor: getFeedbackIconColor() }]} />
            </View>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
          <ThemedText style={styles.badgeText}>{status}</ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { borderColor: colors.primary }]}
        onPress={status === 'Agendado' ? onAction : onFeedbackAction}
      >
        <ThemedText style={[styles.buttonText, { color: colors.primary }]}>
          {status === 'Agendado' ? 'Cancelar Agendamento' : (feedback === 'Pendente' ? 'Enviar Feedback' : (feedback === 'Em andamento' ? 'Continuar Feedback' : 'Revisar Feedback'))}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'normal',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  button: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
