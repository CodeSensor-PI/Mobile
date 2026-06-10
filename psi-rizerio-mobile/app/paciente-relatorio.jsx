import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';

import { getPrimaryColorForRole } from '../constants/role-theme';
import { getCurrentSession } from '../services/authService';
import { IconSymbol } from '../components/ui/icon-symbol';
import { SimpleMarkdown } from '../components/ui/SimpleMarkdown';
import { CustomAlert } from '../components/CustomAlert';
import { getFeedbacksPaciente, gerarRelatorioPaciente, getRelatoriosPaciente } from '../services/dashboardService';

// Tela acessada pelo psicólogo/admin: usa paleta clara fixa (como o restante
// da área profissional), independente do tema escuro do dispositivo.
const C = {
  bg: '#f2f3f7',
  card: '#ffffff',
  border: '#d1d5db',
  text: '#111827',
  textSecondary: '#6b7280',
};

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PacienteRelatorioScreen() {
  const params = useLocalSearchParams();
  const patientId = params.patientId;
  const nome = params.nome || 'Paciente';

  const session = getCurrentSession();
  const primaryColor = getPrimaryColorForRole(session?.usuario?.role || session?.usuario?.fkRoles);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  const load = async () => {
    try {
      const [rep, fb] = await Promise.all([
        getRelatoriosPaciente(patientId).catch(() => []),
        getFeedbacksPaciente(patientId).catch(() => []),
      ]);
      setReports(Array.isArray(rep) ? rep : []);
      setFeedbacks(Array.isArray(fb) ? fb : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleGenerate = async () => {
    if (feedbacks.length === 0) {
      setAlert({
        visible: true,
        title: 'Sem feedbacks',
        message: 'Este paciente ainda não enviou nenhum feedback de sessão. Não é possível gerar o relatório.',
      });
      return;
    }
    setGenerating(true);
    try {
      const novo = await gerarRelatorioPaciente(patientId);
      setReports((prev) => [novo, ...prev]);
    } catch (e) {
      setAlert({
        visible: true,
        title: 'Não foi possível gerar',
        message: e?.message?.includes('feedback')
          ? 'Este paciente ainda não enviou nenhum feedback de sessão. Peça que ele responda um feedback para gerar o relatório.'
          : (e?.message || 'Erro ao gerar o relatório com IA.'),
      });
    } finally {
      setGenerating(false);
    }
  };

  const avgMood = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + (Number(f.moodScore) || 0), 0) / feedbacks.length).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]} edges={['bottom']}>
      <Stack.Screen options={{ title: `Dashboard de ${nome}` }} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={primaryColor} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: primaryColor, backgroundColor: C.card }]}>
              <Text style={[styles.statValue, { color: C.text }]}>{feedbacks.length}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Feedbacks</Text>
            </View>
            <View style={[styles.statCard, { borderColor: primaryColor, backgroundColor: C.card }]}>
              <Text style={[styles.statValue, { color: C.text }]}>{avgMood}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Humor médio (1-5)</Text>
            </View>
            <View style={[styles.statCard, { borderColor: primaryColor, backgroundColor: C.card }]}>
              <Text style={[styles.statValue, { color: C.text }]}>{reports.length}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>Relatórios IA</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: primaryColor, opacity: feedbacks.length === 0 ? 0.5 : 1 }]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <IconSymbol name="sparkles" size={18} color="#FFF" />
                <Text style={styles.generateBtnText}>Gerar relatório com IA</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.hint, { color: C.textSecondary }]}>
            {feedbacks.length === 0
              ? 'Este paciente ainda não enviou feedbacks — não é possível gerar relatório.'
              : 'A IA analisa os feedbacks de sessão deste paciente e gera um relatório clínico.'}
          </Text>

          {reports.length === 0 ? (
            <Text style={[styles.empty, { color: C.textSecondary }]}>Nenhum relatório gerado ainda.</Text>
          ) : (
            reports.map((r, idx) => (
              <View key={r.id || idx} style={[styles.reportCard, { borderColor: primaryColor, backgroundColor: C.card }]}>
                <Text style={[styles.reportDate, { color: primaryColor }]}>
                  Gerado em {formatDateTime(r.generatedAt)}
                </Text>
                <SimpleMarkdown content={r.aiAnalysisContent} color={C.text} />
              </View>
            ))
          )}
        </ScrollView>
      )}

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert((p) => ({ ...p, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  generateBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: -6 },
  empty: { textAlign: 'center', marginTop: 20 },
  reportCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  reportDate: { fontSize: 12, fontWeight: '700' },
  reportText: { fontSize: 14, lineHeight: 20 },
});
