import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;
// Responsiva: 90% em mobile, máximo 520px em tablets. Em <330px usa 100%-20px padding
const MODAL_WIDTH = WINDOW_WIDTH < 330 ? WINDOW_WIDTH - 20 : Math.min(WINDOW_WIDTH * 0.9, 520);

const INITIAL_FORM = {
  id: null,
  nome: '',
  sobrenome: '',
  email: '',
  diaConsultas: 'Quinta-Feira',
  horarioConsultas: '16:00',
  contatoEmergencia: '',
  telefoneEmergencia: '',
  cep: '',
  cidade: '',
  bairro: '',
  numero: '',
  logradouro: '',
  complemento: '',
  semComplemento: false,
  planoMensal: true,
  planoAnual: false,
};

function CheckboxRow({ checked, label, onPress, primaryColor }) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.checkbox, { borderColor: primaryColor, backgroundColor: checked ? primaryColor : '#ffffff' }]}>
        {checked ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', editable = true }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        editable={editable}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function PacienteModal({ visible, mode = 'edit', initialData, primaryColor = '#1B66A4', saving, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!visible) return;

    setForm({
      ...INITIAL_FORM,
      ...initialData,
    });
  }, [visible, initialData]);

  const title = useMemo(() => (mode === 'create' ? 'Dados do Paciente:' : 'Editar Dados do Paciente:'), [mode]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { width: MODAL_WIDTH }]}>
          <View style={[styles.header, { backgroundColor: primaryColor }]}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar modal">
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
            <Field
              label="Nome"
              value={form.nome}
              onChangeText={(value) => setForm((prev) => ({ ...prev, nome: value }))}
              placeholder="Nome"
            />
            <Field
              label="Sobrenome"
              value={form.sobrenome}
              onChangeText={(value) => setForm((prev) => ({ ...prev, sobrenome: value }))}
              placeholder="Sobrenome"
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              placeholder="Email"
              keyboardType="email-address"
            />
            <Field
              label="Dia de consultas"
              value={form.diaConsultas}
              onChangeText={(value) => setForm((prev) => ({ ...prev, diaConsultas: value }))}
              placeholder="Ex.: Quinta-Feira"
            />
            <Field
              label="Horário de consultas"
              value={form.horarioConsultas}
              onChangeText={(value) => setForm((prev) => ({ ...prev, horarioConsultas: value }))}
              placeholder="Ex.: 16:00"
            />
            <Field
              label="Contato de emergência"
              value={form.contatoEmergencia}
              onChangeText={(value) => setForm((prev) => ({ ...prev, contatoEmergencia: value }))}
              placeholder="Nome do contato"
            />
            <Field
              label="Telefone de emergência"
              value={form.telefoneEmergencia}
              onChangeText={(value) => setForm((prev) => ({ ...prev, telefoneEmergencia: value }))}
              placeholder="(11) 91234-5678"
              keyboardType="phone-pad"
            />

            <Text style={styles.sectionTitle}>Endereço</Text>

            <Field
              label="CEP"
              value={form.cep}
              onChangeText={(value) => setForm((prev) => ({ ...prev, cep: value }))}
              placeholder="00000-000"
              keyboardType="number-pad"
            />
            <Field
              label="Cidade"
              value={form.cidade}
              onChangeText={(value) => setForm((prev) => ({ ...prev, cidade: value }))}
              placeholder="Cidade"
            />
            <Field
              label="Bairro"
              value={form.bairro}
              onChangeText={(value) => setForm((prev) => ({ ...prev, bairro: value }))}
              placeholder="Bairro"
            />
            <Field
              label="Número"
              value={form.numero}
              onChangeText={(value) => setForm((prev) => ({ ...prev, numero: value }))}
              placeholder="Número"
              keyboardType="number-pad"
            />
            <Field
              label="Logradouro"
              value={form.logradouro}
              onChangeText={(value) => setForm((prev) => ({ ...prev, logradouro: value }))}
              placeholder="Rua / Avenida"
            />

            <Field
              label="Complemento"
              value={form.complemento}
              onChangeText={(value) => setForm((prev) => ({ ...prev, complemento: value }))}
              placeholder="Apto / Bloco / Referência"
              editable={!form.semComplemento}
            />

              <CheckboxRow
                checked={Boolean(form.semComplemento)}
                label="Sem complemento"
                onPress={() =>
                  setForm((prev) => ({
                    ...prev,
                    semComplemento: !prev.semComplemento,
                    complemento: prev.semComplemento ? prev.complemento : '',
                  }))
                }
                primaryColor={primaryColor}
              />

              <View style={styles.checkboxGroup}>
                <CheckboxRow
                  checked={Boolean(form.planoMensal)}
                  label="Plano Mensal"
                  onPress={() => setForm((prev) => ({ ...prev, planoMensal: !prev.planoMensal }))}
                  primaryColor={primaryColor}
                />
                <CheckboxRow
                  checked={Boolean(form.planoAnual)}
                  label="Plano Anual"
                  onPress={() => setForm((prev) => ({ ...prev, planoAnual: !prev.planoAnual }))}
                  primaryColor={primaryColor}
                />
              </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: primaryColor }]}
              onPress={() => onSave(form)}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Salvar alterações"
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: primaryColor }]}
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Cancelar edição"
            >
              <Text style={[styles.secondaryBtnText, { color: primaryColor }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  card: {
    maxHeight: Math.min(WINDOW_HEIGHT * 0.82, 520),
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  header: {
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  pageContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  fieldWrap: {
    gap: 3,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: '#111827',
    fontWeight: '600',
  },
  input: {
    minHeight: 38,
    borderRadius: 0,
    paddingHorizontal: 8,
    backgroundColor: '#e5e7eb',
    color: '#111827',
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  checkboxGroup: {
     paddingTop: 4,
     flexDirection: 'row',
     justifyContent: 'space-between',
    gap: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: '#1f2937',
  },
  footer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  primaryBtn: {
    minHeight: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    backgroundColor: '#ffffff',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
