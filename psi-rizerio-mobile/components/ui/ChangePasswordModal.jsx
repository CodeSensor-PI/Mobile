import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  overlay: 'rgba(15,23,42,0.55)',
  card: '#ffffff',
  label: '#0f172a',
  border: '#cbd5e1',
  placeholder: '#94a3b8',
  error: '#dc2626',
};

export function ChangePasswordModal({ visible, onClose, onSuccess, accent = '#643BA1' }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState('');

  const reset = () => {
    setAtual('');
    setNova('');
    setConfirma('');
    setErro('');
  };

  const fechar = () => {
    reset();
    onClose?.();
  };

  const salvar = () => {
    if (!atual || !nova || !confirma) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (nova.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (nova !== confirma) {
      setErro('A nova senha e a confirmação não coincidem.');
      return;
    }
    reset();
    onSuccess?.();
  };

  const field = (label, value, setter, placeholder) => (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(v) => { setter(v); setErro(''); }}
        secureTextEntry
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={fechar}>
      <Pressable style={styles.overlay} onPress={fechar}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Alterar Senha</Text>
            <Pressable onPress={fechar} hitSlop={10}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          {field('Senha atual', atual, setAtual, 'Digite sua senha atual')}
          {field('Nova senha', nova, setNova, 'Digite a nova senha')}
          {field('Confirmar nova senha', confirma, setConfirma, 'Confirme a nova senha')}

          {erro ? <Text style={styles.error}>{erro}</Text> : null}

          <Pressable style={[styles.saveBtn, { backgroundColor: accent }]} onPress={salvar}>
            <Text style={styles.saveText}>Salvar nova senha</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'center', padding: 22 },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: C.label },
  group: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: C.label, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.label,
    backgroundColor: '#f8fafc',
  },
  error: { color: C.error, fontSize: 13, marginBottom: 8 },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
