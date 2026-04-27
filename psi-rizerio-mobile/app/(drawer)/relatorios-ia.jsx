import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ROLE_PRIMARY_COLOR, isClienteRole } from '../../constants/role-theme';
import { requestJson } from '../../services/apiClient';
import { getCurrentSession } from '../../services/authService';
import { getPacientePorUserId, getPacientes } from '../../services/dashboardService';

export default function RelatoriosIAScreen() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});
  const { patientId: paramPatientId, patientName } = useLocalSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId || null);
  const session = getCurrentSession();
  const isCliente = isClienteRole(session?.usuario?.role || session?.usuario?.fkRoles);

  const fetchReports = async (patientId) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await requestJson(`/api/v1/patients/${patientId}/reports`);
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    try {
      await requestJson(`/api/v1/patients/${selectedPatientId}/reports/generate`, { method: 'POST' });
      await fetchReports(selectedPatientId);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('feedback')) {
        alert('Para gerar um relatório, o paciente precisa enviar ao menos um feedback de sessão.');
      } else {
        alert('Não foi possível gerar o relatório. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedReports((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteReport = async (reportId) => {
    if (!selectedPatientId) return;
    try {
      await requestJson(`/api/v1/patients/${selectedPatientId}/reports/${reportId}`, { method: 'DELETE' });
      await fetchReports(selectedPatientId);
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      alert('Não foi possível deletar o relatório.');
    }
  };

  useEffect(() => {
    const init = async () => {
      if (paramPatientId) {
        setSelectedPatientId(paramPatientId);
        fetchReports(paramPatientId);
        return;
      }

      if (isCliente) {
        const patientData = await getPacientePorUserId(session.usuario.id);
        if (patientData?.id) {
          setSelectedPatientId(patientData.id);
          fetchReports(patientData.id);
        }
      }
    };
    init();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Relatórios de IA {patientName ? `- ${patientName}` : ''}</Text>
          <TouchableOpacity style={styles.headerButton} onPress={generateReport} disabled={loading || !selectedPatientId}>
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            <Text style={styles.headerButtonText}>Gerar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Acompanhe as análises geradas automaticamente</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ROLE_PRIMARY_COLOR} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {reports.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="robot-confused" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum relatório gerado ainda.</Text>
              <TouchableOpacity style={styles.generateButton} onPress={() => fetchReports(selectedPatientId)}>
                <Text style={styles.generateButtonText}>Atualizar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            reports.map((report) => {
              const isExpanded = expandedReports[report.id];
              return (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportDate}>
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </Text>
                    <MaterialCommunityIcons name="brain" size={24} color={ROLE_PRIMARY_COLOR} />
                  </View>
                  <Text style={styles.reportContent} numberOfLines={isExpanded ? undefined : 3}>
                    {report.aiAnalysisContent}
                  </Text>
                  <View style={styles.reportActions}>
                    <TouchableOpacity style={styles.viewMore} onPress={() => toggleExpand(report.id)}>
                      <Text style={styles.viewMoreText}>{isExpanded ? 'Ver menos' : 'Ver mais'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteReport(report.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROLE_PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  generateButton: {
    marginTop: 24,
    backgroundColor: ROLE_PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderBottomColor: '#F3F4F6',
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  reportContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  viewMore: {
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    color: ROLE_PRIMARY_COLOR,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
});
