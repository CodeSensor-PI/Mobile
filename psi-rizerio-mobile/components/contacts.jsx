import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { FormInput } from './ui/input';
import { maskPhone } from '../utils/masks';

export default function ContactsStep({ values, onChange }) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Contatos:</ThemedText>
      
      <FormInput 
        label="Telefone pessoal" 
        placeholder="(00) 00000-0000" 
        keyboardType="phone-pad"
        value={values.phone}
        onChangeText={(t) => onChange('phone', maskPhone(t))}
      />
      
      <FormInput 
        label="Nome do contato de emergência" 
        placeholder="Nome Completo" 
        value={values.emergencyContact}
        onChangeText={(t) => onChange('emergencyContact', t)}
      />
      
      <FormInput 
        label="Telefone do contato de emergência" 
        placeholder="(00) 00000-0000" 
        keyboardType="phone-pad"
        value={values.emergencyPhone}
        onChangeText={(t) => onChange('emergencyPhone', maskPhone(t))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
});