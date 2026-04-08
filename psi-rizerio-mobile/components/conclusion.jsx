import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { FormInput } from './ui/input';

export default function ConclusionStep({ values, onChange }) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Motivo da consulta:</ThemedText>
      
      <FormInput 
        label="Descrição" 
        placeholder="Explique o motivo da sua consulta" 
        multiline
        numberOfLines={6}
        inputStyle={styles.textArea}
        value={values.reason}
        onChangeText={(t) => onChange('reason', t)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 16,
  }
});