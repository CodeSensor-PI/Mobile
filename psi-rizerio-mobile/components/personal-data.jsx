import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { FormInput } from './ui/input';
import { maskDate, maskCPF } from '../utils/masks';

export default function PersonalData({ values, onChange }) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Dados Pessoais</ThemedText>

      <FormInput
        label='Nome Completo'
        placeholder='Nome Completo'
        value={values.name}
        onChangeText={(text) => onChange('name', text)}
      />

      <FormInput
        label='Data de Nascimento'
        placeholder='dd/mm/aaaa'
        keyboardType='numeric'
        value={values.birthDate}
        onChangeText={(text) => onChange('birthDate', maskDate(text))}
      />

      <FormInput 
        label='CPF'
        placeholder='000.000.000-00'
        keyboardType='numeric'
        value={values.cpf}
        onChangeText={(text) => onChange('cpf', maskCPF(text))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
});