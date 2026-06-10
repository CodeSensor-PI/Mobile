import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppointmentCard } from '../AppointmentCard';
import { CustomAlert } from '../CustomAlert';
import { getCurrentSession } from '../../services/authService';
import { getAgendamentosPorPaciente, getFeedbacksPaciente, getMeuPaciente } from '../../services/dashboardService';

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

export function AgendamentosCliente() {
  const router = useRouter();
  const session = getCurrentSession();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const [items, setItems] = useState([]);
  const [feedbackIds, setFeedbackIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        let patientId = session?.usuario?.patientId;
        if (!patientId) {
          const paciente = await getMeuPaciente(session?.usuario?.id);
          patientId = paciente?.id;
        }
        const [data, fbs] = await Promise.all([
          getAgendamentosPorPaciente(patientId),
          getFeedbacksPaciente(patientId).catch(() => []),
        ]);
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        const ids = new Set((Array.isArray(fbs) ? fbs : []).map((f) => String(f.sessaoId)).filter(Boolean));
        if (isMounted) {
          setItems(list);
          setFeedbackIds(ids);
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
    const ordenados = [...items].sort((a, b) => {
      const da = a.startTime || a.data || '';
      const db = b.startTime || b.data || '';
      return String(db).localeCompare(String(da)); // mais recente primeiro
    });
    return ordenados.map((item) => {
      const datePart = item.data || (item.startTime ? item.startTime.split('T')[0] : '');
      const timePart = item.hora || (item.startTime ? item.startTime.split('T')[1].slice(0,5) : '');
      const st = String(item.statusSessao || item.status || '').toUpperCase();
      // Para sessões concluídas: marca conforme já existe feedback enviado.
      let feedback;
      if (st === 'CONCLUIDA') {
        feedback = feedbackIds.has(String(item.id)) ? 'Finalizado' : 'Pendente';
      } else if (st === 'CANCELADA') {
        feedback = 'Finalizado';
      }
      return {
        id: item.id,
        date: formatDate(datePart),
        time: timePart?.slice(0, 5) || timePart || '',
        location: 'Online',
        status: statusToCard(item.statusSessao || item.status),
        feedback,
        hasFeedback: feedbackIds.has(String(item.id)) || st === 'CANCELADA',
      };
    });
  }, [items, feedbackIds]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Agendamentos</Text>

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
              onFeedbackAction={() => router.push({ pathname: '/(drawer)/feedback', params: { sessaoId: String(card.id) } })}
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
    backgroundColor: '#FAF7F2',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
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
