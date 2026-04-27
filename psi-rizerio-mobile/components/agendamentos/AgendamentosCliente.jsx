import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppointmentCard } from '../AppointmentCard';
import { CustomAlert } from '../CustomAlert';
import { getCurrentSession } from '../../services/authService';
import {
  getAgendamentosPorPaciente,
  getFeedbacksByPatient,
  getPacientePorUserId,
} from '../../services/dashboardService';

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

function feedbackByStatus(status, hasFeedback) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'CONCLUIDA') return hasFeedback ? 'Finalizado' : 'Pendente';
  if (normalized === 'CANCELADA') return 'Finalizado';
  return undefined;
}

export function AgendamentosCliente() {
  const session = getCurrentSession();
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const patient = await getPacientePorUserId(session?.usuario?.id);
        const [data, feedbacks] = patient?.id
          ? await Promise.all([
              getAgendamentosPorPaciente(patient.id),
              getFeedbacksByPatient(patient.id),
            ])
          : [[], []];

        const feedbackSessionIds = new Set(
          (Array.isArray(feedbacks) ? feedbacks : [])
            .map((item) => item?.sessaoId)
            .filter(Boolean)
            .map((id) => String(id))
        );

        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          ...item,
          hasFeedback: feedbackSessionIds.has(String(item?.id)),
        }));

        if (isMounted) {
          setItems(mapped);
        }
      } catch (_error) {
        if (isMounted) {
          setItems([]);
          setAlertMsg('Não foi possível carregar seus agendamentos. Verifique sua conexão.');
          setAlertVisible(true);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [session?.usuario?.id]);

  const cards = useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      date: formatDate(item.data),
      time: item.hora?.slice(0, 5) || item.hora || '',
      location: 'Online',
      status: statusToCard(item.statusSessao || item.status),
      feedback: feedbackByStatus(item.statusSessao || item.status, item.hasFeedback),
    }));
  }, [items]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meus Agendamentos</Text>

        {cards.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Você ainda não possui agendamentos.</Text>
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
                setAlertMsg('Solicitação de cancelamento enviada.');
                setAlertVisible(true);
              }}
              onFeedbackAction={() => {
                router.push({
                  pathname: '/(drawer)/feedback',
                  params: {
                    sessionId: card.id,
                    sessionDate: card.date,
                    sessionTime: card.time,
                  },
                });
              }}
            />
          ))
        )}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title="Atenção"
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
