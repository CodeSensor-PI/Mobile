import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { FormInput } from './ui/input';
import { useThemeColor } from '../hooks/use-theme-color';
import { maskCEP } from '../utils/masks';

export default function LocaleStep({ values, onChange }) {
  const activeColor = useThemeColor({}, 'purpleStrong');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Localidade:</ThemedText>

      <FormInput
        label="CEP"
        placeholder="00000-000"
        keyboardType="numeric"
        value={values.cep}
        onChangeText={(t) => onChange('cep', maskCEP(t))}
      />
      <FormInput
        label="Logradouro"
        placeholder="Rua X"
        value={values.address}
        onChangeText={(t) => onChange('address', (t))}
      />
      <FormInput
        label="Bairro"
        placeholder="Bairro Y"
        value={values.neighborhood}
        onChangeText={(t) => onChange('neighborhood', (t))}
      />
      <FormInput
        label="Cidade"
        placeholder="Cidade Z"
        value={values.city}
        onChangeText={(t) => onChange('city', (t))}
      />
      <FormInput
        label="Estado"
        placeholder="XX"
        maxLength={2}
        value={values.state}
        onChangeText={(t) => onChange('state', t.replace(/[^a-zA-Z]/g, ""))}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FormInput
            label="Número"
            placeholder="0"
            value={values.number}
            onChangeText={(t) => onChange('number', t)}
          />
        </View>
        <View style={{ flex: 2, marginLeft: 15 }}>
          <FormInput
            label="Complemento"
            placeholder="Casa, AP"
            value={values.complement}
            onChangeText={(t) => onChange('complement', t)}
            editable={!values.noComplement}
            inputStyle={values.noComplement ? { opacity: 0.5 } : {}}
          />
        </View>
      </View>

      <Pressable
        style={styles.checkboxContainer}
        onPress={() => onChange('noComplement', !values.noComplement)}
      >
        <View style={[styles.checkbox, { borderColor: activeColor }, values.noComplement && { backgroundColor: activeColor }]}>
          {values.noComplement && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <ThemedText style={[styles.checkboxLabel, { color: activeColor }]}>Sem complemento</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  row: { flexDirection: 'row' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: -10, marginBottom: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 2, borderRadius: 4, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  checkboxLabel: { fontSize: 14, fontWeight: '500' },
});