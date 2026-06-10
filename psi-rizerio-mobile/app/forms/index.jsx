import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../../hooks/use-theme-color';

import PersonalDataStep from '../../components/personal-data';
import LocaleStep from '../../components/locale';
import ContactsStep from '../../components/contacts';
import ConclusionStep from '../../components/conclusion';

import { ProgressBar } from '../../components/ui/progress-bar';
import { Button } from '../../components/ui/button';
import { PhotoPicker } from '../../components/ui/PhotoPicker';
import { ThemedText } from '../../components/themed-text';
import { CustomAlert } from '../../components/CustomAlert';
import { getCurrentSession, updateCurrentUser } from '../../services/authService';
import { atualizarMeuPaciente, getMeuPaciente } from '../../services/dashboardService';
import { getCurrentLocation } from '../../services/locationService';

const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

export default function FormularioIndex() {
  const [step, setStep] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });
  const router = useRouter();

  const [values, setValues] = useState({
    name: '', birthDate: '', cpf: '',
    cep: '', address: '', neighborhood: '', city: '', state: '', number: '', complement: '', noComplement: false,
    phone: '', emergencyPhone: '', emergencyContact: '',
    reason: '',
  });

  const changeValue = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const showAlert = (title, message, type = 'error') =>
    setAlert({ visible: true, title, message, type });

  // dd/mm/aaaa -> yyyy-mm-dd (formato esperado pelo backend)
  const brToIso = (br) => {
    if (!br) return null;
    const [d, m, y] = String(br).split('/');
    if (!d || !m || !y || y.length < 4) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  // Payload no formato plano esperado pelo PatientRequestDTO do backend real.
  const buildPayload = (location, base = {}) => {
    const session = getCurrentSession();
    const email = session?.usuario?.email || base.email || '';
    const addressParts = [values.address.trim(), values.number.trim()].filter(Boolean);

    return {
      ...base,
      name: values.name.trim(),
      email,
      phone: onlyDigits(values.phone),
      cpf: onlyDigits(values.cpf) || null,
      birthDate: brToIso(values.birthDate),
      photo: photo || base.photo || null,
      address: addressParts.join(', ') || null,
      neighborhood: values.neighborhood.trim() || null,
      city: values.city.trim() || null,
      state: values.state.trim() || null,
      cep: values.cep.trim() || null,
      emergencyContact: values.emergencyContact.trim() || null,
      emergencyPhone: onlyDigits(values.emergencyPhone) || null,
      clinicalNotes: values.reason.trim() || base.clinicalNotes || null,
      latitude: location?.latitude ?? base.latitude ?? null,
      longitude: location?.longitude ?? base.longitude ?? null,
    };
  };

  const submitForm = async () => {
    setSubmitting(true);
    try {
      const location = await getCurrentLocation();
      const session = getCurrentSession();
      const userId = session?.usuario?.id;

      // Garante o registro de paciente (cria/vincula) e obtém seu UUID real.
      const paciente = await getMeuPaciente(userId);
      const payload = buildPayload(location, paciente);

      const updated = await atualizarMeuPaciente(paciente.id, payload);

      // Marca o primeiro acesso como concluído para não cair mais no formulário.
      updateCurrentUser({
        patientId: updated?.id || paciente.id,
        nome: payload.name,
        name: payload.name,
        telefone: payload.phone,
        cpf: payload.cpf,
        isFirstAccess: false,
      });

      showAlert('Cadastro concluído', 'Seus dados foram salvos com sucesso!', 'success');
    } catch (error) {
      showAlert('Erro', error?.message || 'Não foi possível concluir o cadastro.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const bgColor = useThemeColor({}, 'background');
  const headerBg = useThemeColor({}, 'purpleLight'); // Lavanda no light, Roxo escuro no dark
  const headerTitleColor = useThemeColor({}, 'purpleStrong');
  const activeBar = useThemeColor({}, 'purpleStrong');
  const inactiveBar = useThemeColor({}, 'secondary');
  const cardBg = useThemeColor({}, 'cardBackground');

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // Retorna uma mensagem de erro específica do campo pendente, ou '' se ok.
  const validateStep = () => {
    switch (step) {
      case 1:
        if (values.name.trim().length < 4) return 'Informe seu nome completo.';
        if (values.birthDate.length !== 10) return 'Informe a data de nascimento (dd/mm/aaaa).';
        if (values.cpf.length !== 14) return 'Informe um CPF válido (000.000.000-00).';
        return '';
      case 2:
        if (values.cep.length !== 9) return 'Informe o CEP completo (00000-000).';
        if (values.address.trim().length < 3) return 'Informe o logradouro (rua/avenida).';
        if (values.neighborhood.trim().length < 3) return 'Informe o bairro.';
        if (values.city.trim().length < 3) return 'Informe a cidade.';
        if (values.state.trim().length !== 2) return 'Informe a UF (2 letras).';
        if (!values.number.trim()) return 'Informe o número do endereço.';
        if (!values.noComplement && values.complement.trim().length === 0)
          return 'Informe o complemento ou marque "Sem complemento".';
        return '';
      case 3:
        if (values.phone.length < 14) return 'Informe um telefone pessoal válido.';
        if (values.emergencyContact.trim().length < 4) return 'Informe o nome do contato de emergência.';
        if (values.emergencyPhone.length < 14) return 'Informe o telefone do contato de emergência.';
        return '';
      case 4:
        if (values.reason.trim().length < 3) return 'Descreva o motivo da consulta (mínimo 3 caracteres).';
        return '';
      default:
        return 'Etapa inválida.';
    }
  };

  const handleNext = () => {
    if (submitting) return;

    const error = validateStep();
    if (error) {
      showAlert('Campo obrigatório', error, 'warning');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      submitForm();
    }
  };

  const handleAlertClose = () => {
    const wasSuccess = alert.type === 'success';
    setAlert((prev) => ({ ...prev, visible: false }));
    if (wasSuccess) {
      router.replace('/(drawer)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={{ backgroundColor: headerBg }} edges={['top']}>
        <View style={styles.customHeader}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText style={[styles.backIcon, { color: headerTitleColor }]}>←</ThemedText>
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: headerTitleColor }]}>
            Conte-nos sobre você
          </ThemedText>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ProgressBar
            steps={4}
            currentStep={step}
            activeColor={activeBar}
            inactiveColor={inactiveBar}
          />

          {step === 1 && (
            <View style={styles.photoSection}>
              <PhotoPicker value={photo} onChange={setPhoto} primaryColor={activeBar} size={104} />
              <ThemedText style={styles.photoLabel}>Foto de perfil (opcional)</ThemedText>
            </View>
          )}

          <View style={styles.stepContainer}>
            {step === 1 && <PersonalDataStep values={values} onChange={changeValue} />}
            {step === 2 && <LocaleStep values={values} onChange={changeValue} />}
            {step === 3 && <ContactsStep values={values} onChange={changeValue} />}
            {step === 4 && <ConclusionStep values={values} onChange={changeValue} />}
          </View>

          <View style={styles.actions}>
            <Button
              title={step < 4 ? 'Prosseguir' : submitting ? 'Salvando...' : 'Finalizar'}
              onPress={handleNext}
            />
            <Button
              title='Cancelar'
              variant='outline'
              onPress={() => setShowCancelModal(true)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent visible={showCancelModal} animationType='fade'>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <Pressable onPress={() => setShowCancelModal(false)} style={styles.closeModal}>
              <Ionicons name='close' size={28} color={activeBar} />
            </Pressable>

            <ThemedText type='subtitle' style={styles.modalTitle}>
              Tem certeza que deseja cancelar seu cadastro?
            </ThemedText>

            <ThemedText style={styles.modalSubtitle}>
              Todas as informações já cadastradas serão perdidas.
            </ThemedText>

            <View style={{ gap: 12, width: '100%' }}>
              <Button
                title='Sim, desejo cancelar'
                onPress={() => router.replace('/')}
              />
              <Button
                title='Seguir com cadastro'
                variant='outline'
                onPress={() => setShowCancelModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={handleAlertClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoSection: { alignItems: 'center', marginBottom: 20, gap: 8 },
  photoLabel: { fontSize: 13, opacity: 0.7 },
  customHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: { position: 'absolute', left: 20 },
  backIcon: { fontSize: 28 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  stepContainer: { marginBottom: 20 },
  actions: { gap: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: { borderRadius: 24, padding: 24 },
  closeModal: { alignSelf: 'flex-end', marginBottom: 5 },
  modalTitle: { marginBottom: 15 },
  modalSubtitle: { marginBottom: 30, opacity: 0.7 },
});