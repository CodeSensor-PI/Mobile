import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppointmentCard } from '../AppointmentCard';
import { CustomAlert } from '../CustomAlert';
import { getCurrentSession } from '../../services/authService';
import { getAgendamentosPorPaciente } from '../../services/dashboardService';

function formatDate(iso) {
  if (!iso) return '';
  const [year, month, day] = String(iso).split('-');
  return `${day}/${month}/${year}`;
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

export function AgendamentosCliente() {
  const session = getCurrentSession();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const [items, setItems] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const userId = session?.usuario?.id;
        const data = await getAgendamentosPorPaciente(userId);
        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (_error) {
        if (isMounted) {
          setItems([]);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [session?.usuario?.id]);

  const cards = useMemo(() => {
    return items.map((item) => {
      const datePart = item.data || (item.startTime ? item.startTime.split('T')[0] : '');
      const timePart = item.hora || (item.startTime ? item.startTime.split('T')[1].slice(0,5) : '');
      return {
        id: item.id,
        date: formatDate(datePart),
        time: timePart?.slice(0, 5) || timePart || '',
        location: 'Online',
        status: statusToCard(item.statusSessao || item.status),
        feedback: feedbackByStatus(item.statusSessao || item.status),
      };
    });
  }, [items]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meus Agendamentos</Text>

        {cards.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Voce ainda nao possui agendamentos.</Text>
          </View>
        ) : (
          cards.map((card) => (
            <AppointmentCard
              key={card.id}
              date={card.date}
              time={card.time}
              location={card.location}
              status={card.status}
              feedback={card.feedback}
              onAction={() => {
                setAlertMsg('Solicitacao de cancelamento enviada.');
                setAlertVisible(true);
              }}
              onFeedbackAction={() => {
                setAlertMsg('Fluxo de feedback em breve.');
                setAlertVisible(true);
              }}
            />
          ))
        )}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title="Atencao"
        message={alertMsg}
        type="warning"
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f3f7',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#20262f',
    marginBottom: 16,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },
});
