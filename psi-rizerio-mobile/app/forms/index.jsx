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
import { ThemedText } from '../../components/themed-text';

export default function FormularioIndex() {
  const [step, setStep] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  const canProgress = () => {
    switch (step) {
      case 1:
        return (
          values.name.trim().length > 3 &&
          values.birthDate.length === 10 &&
          values.cpf.length === 14
        );
      case 2:
        const basicLocale =
          values.cep.length === 9 &&
          values.address.length > 2 &&
          values.neighborhood.length > 2 &&
          values.city.length > 2 &&
          values.state.length === 2;

        const complementOk = values.noComplement ||
          (values.complement && values.complement.trim().length > 0);

        return basicLocale && complementOk;
      case 3:
        return (
          values.phone.length >= 14 &&
          values.emergencyContact.trim().length > 3 &&
          values.emergencyPhone.length >= 14
        );
      case 4:
        return values.reason.trim().length > 5;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProgress()) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        alert('Formulário enviado!');
        router.replace('/(drawer)');
      }
    } else {
      alert('Por favor, preencha todos os campos corretamente.');
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

          <View style={styles.stepContainer}>
            {step === 1 && <PersonalDataStep values={values} onChange={changeValue} />}
            {step === 2 && <LocaleStep values={values} onChange={changeValue} />}
            {step === 3 && <ContactsStep values={values} onChange={changeValue} />}
            {step === 4 && <ConclusionStep values={values} onChange={changeValue} />}
          </View>

          <View style={styles.actions}>
            <Button
              title={step < 4 ? 'Prosseguir' : 'Finalizar'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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