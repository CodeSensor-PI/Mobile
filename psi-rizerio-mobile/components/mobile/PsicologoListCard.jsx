import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function safeText(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function PsicologoListCard({ psicologo, onPressEdit, primaryColor = '#1B66A4' }) {
  return (
    <View style={styles.card}>
      <View style={styles.infoRow}>
        <Image
          source={psicologo.photo ? { uri: psicologo.photo } : require('../../assets/images/profile.png')}
          style={styles.avatar}
          accessibilityLabel={`Avatar de ${safeText(psicologo.nome, 'psicólogo')}`}
        />

        <View style={styles.infoWrap}>
          <Text style={styles.label}>
            Nome: <Text style={styles.value}>{safeText(psicologo.nome)}</Text>
          </Text>
          <Text style={styles.label}>
            Telefone: <Text style={styles.value}>{safeText(psicologo.telefone)}</Text>
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.editButton, { borderColor: primaryColor }]}
        onPress={onPressEdit}
        accessibilityRole="button"
        accessibilityLabel={`Editar psicólogo ${safeText(psicologo.nome, '')}`.trim()}
      >
        <Ionicons name="pencil" size={14} color={primaryColor} />
        <Text style={[styles.editButtonText, { color: primaryColor }]}>Editar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  infoWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    fontWeight: '500',
  },
  editButton: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  editButtonText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '700',
  },
});
