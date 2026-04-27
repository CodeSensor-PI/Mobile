import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { MobileSearchAndActionBar } from '../../components/mobile/MobileSearchAndActionBar';
import { MobileSectionTitle } from '../../components/mobile/MobileSectionTitle';
import { PsicologoListCard } from '../../components/mobile/PsicologoListCard';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { getPrimaryColorForRole } from '../../constants/role-theme';
import { getCurrentSession } from '../../services/authService';
import { getPsicologos, postPsicologo, putPsicologo } from '../../services/dashboardService';
import { digitsOnly, formatTelefone, formatCrp } from '../../utils/formatters';

const INITIAL_FORM = {
  id: null,
  nome: '',
  crp: '',
  email: '',
  telefone: '',
  status: true,
  senha: '123456',
  fkRoles: {
    id: 3,
    role: 'PSICOLOGO',
  },
};


function normalizeEntry(item) {
  const role = item?.role || item?.fkRoles || { id: 3, role: 'PSICOLOGO' };
  return {
    ...item,
    role,
    fkRoles: item?.fkRoles || role,
    telefone: formatTelefone(item?.telefone || ''),
    crp: formatCrp(item?.crp || ''),
    status: item?.status ? item.status : item?.ativo === false ? 'INATIVO' : 'ATIVO',
  };
}

function validateForm(form) {
  if (!form.nome || form.nome.trim().length < 3) {
    return 'Nome deve ter pelo menos 3 caracteres.';
  }

  const crpDigits = digitsOnly(form.crp);
  if (!crpDigits || !/^\d{6,8}$/.test(crpDigits)) {
    return 'CRP deve conter apenas números e ter entre 6 e 8 dígitos.';
  }

  if (!form.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
    return 'E-mail inválido.';
  }

  const telefoneDigits = digitsOnly(form.telefone);
  if (!telefoneDigits || !/^\d{10,11}$/.test(telefoneDigits)) {
    return 'Telefone deve conter 10 ou 11 dígitos.';
  }

  if (!form.fkRoles?.id) {
    return 'Role do psicólogo não encontrada.';
  }

  return '';
}

export default function PsicologosScreen() {
  const router = useRouter();
  const session = getCurrentSession();
  const primaryColor = getPrimaryColorForRole(session?.usuario?.role);
  const [psicologos, setPsicologos] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMode, setEditingMode] = useState('create');
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedId, setSelectedId] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    if (!getCurrentSession()) {
      router.replace('/(auth)/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPsicologos();
        setPsicologos(Array.isArray(data) ? data.map(normalizeEntry) : []);
      } catch (error) {
        setAlert({
          visible: true,
          title: 'Erro',
          message: error.message || 'Não foi possível carregar os psicólogos.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return psicologos;
    }

    return psicologos.filter((item) => item.nome?.toLowerCase().startsWith(normalizedQuery));
  }, [psicologos, query]);

  const openCreate = () => {
    setEditingMode('create');
    setSelectedId(null);
    setForm(INITIAL_FORM);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditingMode('edit');
    setSelectedId(item.id);
    setForm({
      id: item.id,
      nome: item.nome || '',
      crp: item.crp || '',
      email: item.email || '',
      telefone: item.telefone || '',
      status: item.status !== 'INATIVO',
      senha: item.senha || '123456',
      fkRoles: item.fkRoles || item.role || INITIAL_FORM.fkRoles,
    });
    setModalVisible(true);
  };

  const openError = (message) => {
    setAlert({ visible: true, title: 'Atenção', message, type: 'error' });
  };

  const openSuccess = (message) => {
    setAlert({ visible: true, title: 'Sucesso', message, type: 'success' });
  };

  const handleSave = async () => {
    const validationMessage = validateForm(form);
    if (validationMessage) {
      openError(validationMessage);
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      nome: form.nome.trim(),
      crp: digitsOnly(form.crp),
      telefone: digitsOnly(form.telefone),
      ativo: Boolean(form.status),
      status: form.status ? 'ATIVO' : 'INATIVO',
      fkRoles: form.fkRoles || INITIAL_FORM.fkRoles,
    };

    try {
      if (editingMode === 'create') {
        await postPsicologo(payload);
        openSuccess('Psicólogo adicionado com sucesso!');
      } else {
        await putPsicologo(selectedId, payload);
        openSuccess('Psicólogo atualizado com sucesso!');
      }

      const refreshed = await getPsicologos();
      setPsicologos(Array.isArray(refreshed) ? refreshed.map(normalizeEntry) : []);
      setModalVisible(false);
      setForm(INITIAL_FORM);
    } catch (error) {
      openError(error.message || 'Erro ao salvar psicólogo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MobileSectionTitle />

      <MobileSearchAndActionBar
        query={query}
        onChangeQuery={setQuery}
        onPressAction={openCreate}
        actionLabel="Cadastrar Psicólogo"
        placeholder="Pesquisar psicólogos..."
        primaryColor={primaryColor}
      />

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Carregando psicólogos...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Nenhum psicólogo encontrado.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filtered.map((item) => (
            <PsicologoListCard
              key={item.id}
              psicologo={item}
              onPressEdit={() => openEdit(item)}
              primaryColor={primaryColor}
            />
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, { backgroundColor: primaryColor }]}>
              <Text style={styles.modalTitle}>{editingMode === 'create' ? 'Dados do psicólogo' : 'Editar psicólogo'}</Text>
              <Pressable onPress={() => setModalVisible(false)} accessibilityRole="button">
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <AuthTextInput
                label="Nome Completo"
                value={form.nome}
                onChangeText={(value) => setForm((prev) => ({ ...prev, nome: value }))}
                placeholder="Informe o nome completo"
              />
              <AuthTextInput
                label="CRP"
                value={form.crp}
                onChangeText={(value) => setForm((prev) => ({ ...prev, crp: formatCrp(value) }))}
                placeholder="Informe o CRP"
                keyboardType="number-pad"
              />
              <AuthTextInput
                label="Endereço de Email"
                value={form.email}
                onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                placeholder="Informe seu e-mail"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <AuthTextInput
                label="Telefone"
                value={form.telefone}
                onChangeText={(value) => setForm((prev) => ({ ...prev, telefone: formatTelefone(value) }))}
                placeholder="(11) 98877-6655"
                keyboardType="phone-pad"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Status</Text>
                <View style={styles.switchWrap}>
                  <Text style={styles.switchText}>{form.status ? 'Ativo' : 'Inativo'}</Text>
                  <Switch value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))} />
                </View>
              </View>

              <View style={styles.modalActions}>
                <AuthButton
                  label={saving ? 'Salvando...' : editingMode === 'create' ? 'Adicionar Psicólogo' : 'Salvar Alterações'}
                  loading={saving}
                  onPress={handleSave}
                  style={styles.modalPrimaryButton}
                />
                <AuthButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalSecondaryButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={handleCloseAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
    fontSize: 14,
  },
  toolbar: {
    paddingHorizontal: 16,
    gap: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    color: '#475569',
    fontSize: 16,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#eef4fb',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  modalHeader: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalContent: {
    padding: 16,
    gap: 4,
  },
  switchRow: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9dee7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '700',
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: 8,
    gap: 10,
  },
  modalPrimaryButton: {
    width: '100%',
  },
  modalSecondaryButton: {
    width: '100%',
  },
});
