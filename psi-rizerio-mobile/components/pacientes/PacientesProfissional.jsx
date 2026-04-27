import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../CustomAlert';
import { MobileSearchAndActionBar } from '../mobile/MobileSearchAndActionBar';
import { PacienteCard } from './PacienteCard';
import { PacienteModal } from './PacienteModal';
import { getPrimaryColorForRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';
import { getPacientes, postPaciente, putPaciente } from '../../services/dashboardService';

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
  return {
    id: paciente?.id || null,
    nome: paciente?.dadosPaciente?.nome || '',
    sobrenome: paciente?.dadosPaciente?.sobrenome || '',
    email: paciente?.dadosPaciente?.email || paciente?.email || '',
    diaConsultas: paciente?.dadosPaciente?.diaConsultas || 'Quinta-Feira',
    horarioConsultas: paciente?.dadosPaciente?.horarioConsultas || '16:00',
    contatoEmergencia: paciente?.dadosPaciente?.contatoEmergencia || '',
    telefoneEmergencia: paciente?.dadosPaciente?.telefoneEmergencia || '',
    cep: paciente?.endereco?.cep || '',
    cidade: paciente?.endereco?.cidade || '',
    bairro: paciente?.endereco?.bairro || '',
    numero: paciente?.endereco?.numero || '',
    logradouro: paciente?.endereco?.logradouro || '',
    complemento: paciente?.endereco?.complemento || '',
    semComplemento: Boolean(paciente?.endereco?.semComplemento),
    planoMensal: paciente?.planos?.mensal !== false,
    planoAnual: Boolean(paciente?.planos?.anual),
  };
}

function validateModalForm(values) {
  if (!values.nome || values.nome.trim().length < 2) {
    return 'Nome é obrigatório.';
  }

  if (!values.sobrenome || values.sobrenome.trim().length < 2) {
    return 'Sobrenome é obrigatório.';
  }

  if (!values.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(values.email)) {
    return 'Informe um e-mail válido.';
  }

  if (!values.diaConsultas || !values.horarioConsultas) {
    return 'Dia e horário de consultas são obrigatórios.';
  }

  if (!values.planoMensal && !values.planoAnual) {
    return 'Selecione pelo menos um plano.';
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

    const payload = {
      name: `${values.nome.trim()} ${values.sobrenome.trim()}`.trim(),
      email: values.email.trim(),
      phone: values.telefoneEmergencia || '',
      psicologoId: Number(session?.usuario?.id) || 1,
      role: { id: 2, role: 'CLIENTE' },
      ativo: true,
      dadosPaciente: {
        nome: values.nome.trim(),
        sobrenome: values.sobrenome.trim(),
        email: values.email.trim(),
        diaConsultas: values.diaConsultas.trim(),
        horarioConsultas: values.horarioConsultas.trim(),
        contatoEmergencia: values.contatoEmergencia.trim(),
        telefoneEmergencia: values.telefoneEmergencia.trim(),
      },
      endereco: {
        cep: values.cep.trim(),
        cidade: values.cidade.trim(),
        bairro: values.bairro.trim(),
        numero: values.numero.trim(),
        logradouro: values.logradouro.trim(),
        complemento: values.semComplemento ? '' : values.complemento.trim(),
        semComplemento: Boolean(values.semComplemento),
      },
      planos: {
        mensal: Boolean(values.planoMensal),
        anual: Boolean(values.planoAnual),
      },
    };

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

  const handleReports = (paciente) => {
    router.push({
      pathname: '/(drawer)/relatorios-ia',
      params: { patientId: paciente.id, patientName: paciente.nomeCompleto }
    });
  };

  const handleOpenPatientDashboard = () => {
    setAlert({
      visible: true,
      title: 'Em breve',
      message: 'A navegação para o dashboard do paciente será integrada à API real.',
      type: 'warning',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MobileSearchAndActionBar
        query={query}
        onChangeQuery={setQuery}
        onPressAction={openCreate}
        actionLabel="Adicionar Paciente"
        placeholder="Pesquisar pacientes..."
        primaryColor={primaryColor}
      />

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
              onDashboard={handleOpenPatientDashboard}
              onReports={() => handleReports(paciente)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e5e7eb',
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
});
