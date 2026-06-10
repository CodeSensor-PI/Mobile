import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../CustomAlert';
import { MobileSearchAndActionBar } from '../mobile/MobileSearchAndActionBar';
import { PacienteCard } from './PacienteCard';
import { PacienteModal } from './PacienteModal';
import { getPrimaryColorForRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';
import { getPacientes, postPaciente, putPaciente } from '../../services/dashboardService';
import { getCurrentLocation, calculateDistance, formatDistance } from '../../services/locationService';

function normalizePaciente(item) {
  const dados = item?.dadosPaciente || {};
  const endereco = item?.endereco || {};
  const planos = item?.planos || {};

  const nome = String(dados.nome || item?.nome || '').trim();
  const sobrenome = String(dados.sobrenome || '').trim();
  const nomeCompleto = `${nome} ${sobrenome}`.trim() || item?.nome || 'Paciente';

  return {
    ...item,
    nomeCompleto,
    telefone: item?.telefone || dados.telefoneEmergencia || '',
    dadosPaciente: {
      nome,
      sobrenome,
      email: dados.email || item?.email || '',
      diaConsultas: dados.diaConsultas || 'Quinta-Feira',
      horarioConsultas: dados.horarioConsultas || '16:00',
      contatoEmergencia: dados.contatoEmergencia || '',
      telefoneEmergencia: dados.telefoneEmergencia || '',
    },
    endereco: {
      cep: endereco.cep || '',
      cidade: endereco.cidade || '',
      bairro: endereco.bairro || '',
      numero: endereco.numero || '',
      logradouro: endereco.logradouro || '',
      complemento: endereco.complemento || '',
      semComplemento: Boolean(endereco.semComplemento),
    },
    planos: {
      mensal: planos.mensal !== false,
      anual: Boolean(planos.anual),
    },
  };
}

function toModalPayload(paciente) {
  const fullName = String(paciente?.name || paciente?.nome || '').trim();
  const [nome, ...rest] = fullName.split(/\s+/);
  return {
    id: paciente?.id || null,
    nome: nome || '',
    sobrenome: rest.join(' '),
    email: paciente?.email || '',
    telefone: paciente?.phone || paciente?.telefone || '',
    diaConsultas: 'Quinta-Feira',
    horarioConsultas: '16:00',
    contatoEmergencia: paciente?.emergencyContact || paciente?.dadosPaciente?.contatoEmergencia || '',
    telefoneEmergencia: paciente?.emergencyPhone || paciente?.dadosPaciente?.telefoneEmergencia || '',
    cep: paciente?.cep || '',
    cidade: paciente?.city || '',
    bairro: paciente?.neighborhood || '',
    numero: '',
    logradouro: paciente?.address || '',
    complemento: '',
    semComplemento: false,
    planoMensal: true,
    planoAnual: false,
    photo: paciente?.photo || null,
  };
}

function validateModalForm(values) {
  if (!values.nome || values.nome.trim().length < 2) {
    return 'Nome é obrigatório.';
  }

  if (!values.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(values.email)) {
    return 'Informe um e-mail válido.';
  }

  return '';
}

export function PacientesProfissional() {
  const router = useRouter();
  const session = getCurrentSession();
  const role = session?.usuario?.role || session?.usuario?.fkRoles;
  const primaryColor = getPrimaryColorForRole(role);

  const [pacientes, setPacientes] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorState, setErrorState] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('edit');
  const [selectedPaciente, setSelectedPaciente] = useState(null);

  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });

  // -- Geolocalização --
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const loadPacientes = async () => {
    setLoading(true);
    setErrorState('');

    try {
      const data = await getPacientes();
      const list = Array.isArray(data) ? data : [];
      setPacientes(list.map(normalizePaciente));
    } catch (error) {
      setErrorState(error.message || 'Não foi possível carregar os pacientes.');
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getCurrentSession()) {
      router.replace('/(auth)/login');
      return;
    }

    loadPacientes();
  }, [router]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return pacientes;
    }

    return pacientes.filter((item) => {
      const byName = String(item.nomeCompleto || '').toLowerCase().includes(normalizedQuery);
      const byEmail = String(item.email || item.dadosPaciente?.email || '').toLowerCase().includes(normalizedQuery);
      const byPhone = String(item.telefone || '').toLowerCase().includes(normalizedQuery);
      return byName || byEmail || byPhone;
    });
  }, [pacientes, query]);

  const openCreate = () => {
    setModalMode('create');
    setSelectedPaciente(null);
    setModalVisible(true);
  };

  const openEdit = (paciente) => {
    setModalMode('edit');
    setSelectedPaciente(paciente);
    setModalVisible(true);
  };

  const closeAlert = () => setAlert((prev) => ({ ...prev, visible: false }));

  const openErrorAlert = (message) => {
    setAlert({ visible: true, title: 'Atenção', message, type: 'error' });
  };

  const openSuccessAlert = (message) => {
    setAlert({ visible: true, title: 'Sucesso', message, type: 'success' });
  };

  const handleSave = async (values) => {
    const validationMessage = validateModalForm(values);
    if (validationMessage) {
      openErrorAlert(validationMessage);
      return;
    }

    const enderecoCompleto = [values.logradouro.trim(), values.numero.trim()].filter(Boolean).join(', ');
    // Payload plano no formato do PatientRequestDTO; em edição, mescla com o
    // registro atual para não apagar campos não exibidos no modal.
    const payload = {
      ...(modalMode === 'edit' ? selectedPaciente : {}),
      name: `${values.nome.trim()} ${values.sobrenome.trim()}`.trim(),
      email: values.email.trim(),
      phone: values.telefone?.trim() || selectedPaciente?.phone || values.telefoneEmergencia?.trim() || '00000000000',
      emergencyContact: values.contatoEmergencia.trim() || null,
      emergencyPhone: values.telefoneEmergencia.trim() || null,
      cep: values.cep.trim() || null,
      city: values.cidade.trim() || null,
      neighborhood: values.bairro.trim() || null,
      address: enderecoCompleto || null,
      photo: values.photo ?? selectedPaciente?.photo ?? null,
    };
    // Remove aliases de UI que não existem no DTO do backend.
    delete payload.nome;
    delete payload.telefone;
    delete payload.dadosPaciente;

    setSaving(true);

    try {
      if (modalMode === 'create') {
        await postPaciente(payload);
        openSuccessAlert('Paciente adicionado com sucesso!');
      } else {
        await putPaciente(selectedPaciente?.id, payload);
        openSuccessAlert('Dados do paciente atualizados com sucesso!');
      }

      await loadPacientes();
      setModalVisible(false);
    } catch (error) {
      openErrorAlert(error.message || 'Erro ao salvar dados do paciente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = () => {
    router.push('/(drawer)/agendamentos');
  };

  const handleOpenPatientDashboard = (paciente) => {
    if (!paciente?.id) {
      setAlert({ visible: true, title: 'Atenção', message: 'Paciente sem cadastro completo.', type: 'warning' });
      return;
    }
    router.push({
      pathname: '/paciente-relatorio',
      params: { patientId: String(paciente.id), nome: paciente.name || paciente.nome || 'Paciente' },
    });
  };

  const openMapModal = async () => {
    setMapModalVisible(true);
    setLocationLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc || { latitude: -23.5505, longitude: -46.6333 }); // fallback São Paulo centro
    } catch (_e) {
      setUserLocation({ latitude: -23.5505, longitude: -46.6333 });
    } finally {
      setLocationLoading(false);
    }
  };

  const patientsWithDistance = useMemo(() => {
    if (!userLocation) return [];
    return pacientes
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        ...p,
        distance: calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude),
      }))
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }, [pacientes, userLocation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchRow}>
        <View style={styles.searchBarFlex}>
          <MobileSearchAndActionBar
            query={query}
            onChangeQuery={setQuery}
            onPressAction={openCreate}
            actionLabel="Adicionar Paciente"
            placeholder="Pesquisar pacientes..."
            primaryColor={primaryColor}
          />
        </View>
        <Pressable style={[styles.mapButton, { backgroundColor: primaryColor }]} onPress={openMapModal}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={styles.mapButtonText}>Mapa</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Carregando pacientes...</Text>
        </View>
      ) : errorState ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Erro ao carregar pacientes.</Text>
          <Text style={styles.errorMessage}>{errorState}</Text>
          <Text style={[styles.retryText, { color: primaryColor }]} onPress={loadPacientes}>
            Tentar novamente
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Nenhum paciente encontrado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filtered.map((paciente) => (
            <PacienteCard
              key={paciente.id}
              paciente={paciente}
              primaryColor={primaryColor}
              onEdit={() => openEdit(paciente)}
              onSchedule={handleSchedule}
              onDashboard={() => handleOpenPatientDashboard(paciente)}
            />
          ))}
        </ScrollView>
      )}

      <PacienteModal
        visible={modalVisible}
        mode={modalMode}
        initialData={toModalPayload(selectedPaciente)}
        primaryColor={primaryColor}
        saving={saving}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />

      {/* Modal de Proximidade Geográfica */}
      <Modal visible={mapModalVisible} animationType="slide" transparent onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <View style={styles.mapModalTitleRow}>
                <Ionicons name="navigate-outline" size={22} color={primaryColor} />
                <Text style={styles.mapModalTitle}>Proximidade dos Pacientes</Text>
              </View>
              <Pressable onPress={() => setMapModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            {locationLoading ? (
              <View style={styles.mapModalLoading}>
                <ActivityIndicator size="large" color={primaryColor} />
                <Text style={styles.mapModalLoadingText}>Obtendo localização...</Text>
              </View>
            ) : patientsWithDistance.length === 0 ? (
              <View style={styles.mapModalLoading}>
                <Ionicons name="location-outline" size={48} color="#cbd5e1" />
                <Text style={styles.mapModalLoadingText}>Nenhum paciente com coordenadas disponíveis.</Text>
              </View>
            ) : (
              <ScrollView style={styles.mapModalList} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
                {patientsWithDistance.map((p, idx) => (
                  <View key={p.id} style={styles.proximityCard}>
                    <View style={[styles.proximityRank, { backgroundColor: idx === 0 ? primaryColor : '#e2e8f0' }]}>
                      <Text style={[styles.proximityRankText, { color: idx === 0 ? '#fff' : '#475569' }]}>{idx + 1}</Text>
                    </View>
                    <View style={styles.proximityInfo}>
                      <Text style={styles.proximityName}>{p.nomeCompleto}</Text>
                      <Text style={styles.proximityEmail}>{p.dadosPaciente?.email || p.email || ''}</Text>
                    </View>
                    <View style={styles.proximityDistBadge}>
                      <Ionicons name="navigate" size={14} color={primaryColor} />
                      <Text style={[styles.proximityDist, { color: primaryColor }]}>{formatDistance(p.distance)}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  searchBarFlex: {
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 10,
    gap: 10,
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  stateText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // -- Map Modal --
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  mapModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 16,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  mapModalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  mapModalLoadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  mapModalList: {
    padding: 16,
  },
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  proximityRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximityRankText: {
    fontSize: 14,
    fontWeight: '800',
  },
  proximityInfo: {
    flex: 1,
  },
  proximityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  proximityEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  proximityDistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2f7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  proximityDist: {
    fontSize: 13,
    fontWeight: '700',
  },
});
