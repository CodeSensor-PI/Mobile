import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WINDOW_WIDTH = Dimensions.get('window').width;
const MODAL_WIDTH = WINDOW_WIDTH < 330 ? WINDOW_WIDTH - 20 : Math.min(WINDOW_WIDTH * 0.9, 520);

const INITIAL_FORM = {
  nome: '',
  email: '',
  senha: '',
  role: 'CLIENTE', // ou 'PSICOLOGO'
};

function Field({ label, value, onChangeText, placeholder, secureTextEntry = false }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

export function RegistroModal({ visible, primaryColor = '#1B66A4', saving, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);

  // We use simple touchable buttons for role selection to avoid installing Picker if not present
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { width: MODAL_WIDTH }]}>
          <View style={[styles.header, { backgroundColor: primaryColor }]}>
            <Text style={styles.title}>Cadastrar Novo Usuário</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
            <Field
              label="Nome"
              value={form.nome}
              onChangeText={(value) => setForm((prev) => ({ ...prev, nome: value }))}
              placeholder="Nome completo"
            />
            <Field
              label="E-mail"
              value={form.email}
              onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              placeholder="E-mail de acesso"
            />
            <Field
              label="Senha Inicial"
              value={form.senha}
              onChangeText={(value) => setForm((prev) => ({ ...prev, senha: value }))}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
            />

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Perfil de Acesso</Text>
              <View style={styles.roleSelection}>
                <Pressable
                  style={[styles.roleButton, form.role === 'CLIENTE' && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  onPress={() => setForm((prev) => ({ ...prev, role: 'CLIENTE' }))}
                >
                  <Text style={[styles.roleButtonText, form.role === 'CLIENTE' && { color: '#fff' }]}>Paciente (Cliente)</Text>
                </Pressable>
                <Pressable
                  style={[styles.roleButton, form.role === 'PSICOLOGO' && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                  onPress={() => setForm((prev) => ({ ...prev, role: 'PSICOLOGO' }))}
                >
                  <Text style={[styles.roleButtonText, form.role === 'PSICOLOGO' && { color: '#fff' }]}>Psicólogo (Admin)</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: primaryColor }]}
              onPress={() => {
                if (!form.nome || !form.email || !form.senha) {
                  alert('Preencha todos os campos!');
                  return;
                }
                onSave(form);
                setForm(INITIAL_FORM);
              }}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Cadastrando...' : 'Cadastrar Usuário'}</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: primaryColor }]}
              onPress={onClose}
              disabled={saving}
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
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 12,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    color: '#111827',
    fontSize: 15,
  },
  roleSelection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
