import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { FormInput } from './ui/input';
import { useThemeColor } from '../hooks/use-theme-color';
import { maskCEP } from '../utils/masks';
import { getAddressByCep } from '../services/viaCEP';

export default function LocaleStep({ values, onChange }) {
  const activeColor = useThemeColor({}, 'purpleStrong');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const buscarCep = async () => {
      const cleanCep = values.cep.replace(/\D/g, '');

      if (cleanCep.length === 8) {
        setLoading(true);
        try {
          const data = await getAddressByCep(cleanCep);

          onChange('address', data.logradouro);
          onChange('neighborhood', data.bairro);
          onChange('city', data.localidade);
          onChange('state', data.uf);

        } catch (error) {
          Alert.alert('Erro', error.message || 'Não foi possível buscar o CEP.');
        } finally {
          setLoading(false);
        }
      }
    };

    buscarCep();
  }, [values.cep]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.sectionTitle}>Localidade:</ThemedText>
        {loading && <ActivityIndicator color={activeColor} size="small" />}
      </View>

      <FormInput
        label="CEP"
        placeholder="00000-000"
        keyboardType="numeric"
        value={values.cep}
        onChangeText={(t) => onChange('cep', maskCEP(t))}
        maxLength={9} // 8 números + 1 traço da máscara
      />

      <FormInput
        label="Logradouro"
        placeholder={loading ? "Buscando..." : "Rua X"}
        value={values.address}
        onChangeText={(t) => onChange('address', t)}
        editable={!loading} // Bloqueia edição enquanto busca
      />

      <FormInput
        label="Bairro"
        placeholder={loading ? "Buscando..." : "Bairro Y"}
        value={values.neighborhood}
        onChangeText={(t) => onChange('neighborhood', t)}
        editable={!loading}
      />

      <View style={styles.row}>
        <View style={{ flex: 3 }}>
          <FormInput
            label="Cidade"
            placeholder="Cidade Z"
            value={values.city}
            onChangeText={(t) => onChange('city', t)}
            editable={!loading}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <FormInput
            label="UF"
            placeholder="XX"
            maxLength={2}
            value={values.state}
            onChangeText={(t) => onChange('state', t.toUpperCase().replace(/[^A-Z]/g, ""))}
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FormInput
            label="Número"
            placeholder="0"
            value={values.number}
            keyboardType="numeric"
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
        <View style={[
          styles.checkbox,
          { borderColor: activeColor },
          values.noComplement && { backgroundColor: activeColor }
        ]}>
          {values.noComplement && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <ThemedText style={[styles.checkboxLabel, { color: activeColor }]}>
          Sem complemento
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25
  },
  sectionTitle: { fontSize: 22, fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 10
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxLabel: { fontSize: 14, fontWeight: '500' },
});