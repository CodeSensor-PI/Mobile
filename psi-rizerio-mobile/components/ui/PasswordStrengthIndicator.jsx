import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function getStrength(score) {
  if (score >= 5) {
    return { label: 'Forte', color: '#16a34a' };
  }

  if (score >= 3) {
    return { label: 'Media', color: '#f59e0b' };
  }

  if (score > 0) {
    return { label: 'Fraca', color: '#ef4444' };
  }

  return { label: '', color: '#e5e7eb' };
}

export function PasswordStrengthIndicator({ password, minLength = 12 }) {
  const checks = useMemo(() => {
    const source = password || '';
    return {
      length: source.length >= minLength,
      lower: /[a-z]/.test(source),
      upper: /[A-Z]/.test(source),
      number: /[0-9]/.test(source),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(source),
    };
  }, [minLength, password]);

  const score = useMemo(() => {
    let total = 0;
    if (checks.length) total += 2;
    if (checks.lower) total += 1;
    if (checks.upper) total += 1;
    if (checks.number) total += 1;
    if (checks.special) total += 1;
    return Math.min(total, 5);
  }, [checks]);

  const strength = useMemo(() => getStrength(score), [score]);

  return (
    <View style={styles.container}>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${(score / 5) * 100}%`, backgroundColor: strength.color }]} />
      </View>

      <Text style={[styles.strengthText, { color: strength.color }]}>
        {strength.label || 'Digite sua senha'}
      </Text>

      <View style={styles.list}>
        <Text style={[styles.item, checks.length ? styles.ok : styles.pending]}>{checks.length ? '✓' : '○'} Minimo de {minLength} caracteres</Text>
        <Text style={[styles.item, checks.upper ? styles.ok : styles.pending]}>{checks.upper ? '✓' : '○'} Uma letra maiuscula</Text>
        <Text style={[styles.item, checks.lower ? styles.ok : styles.pending]}>{checks.lower ? '✓' : '○'} Uma letra minuscula</Text>
        <Text style={[styles.item, checks.number ? styles.ok : styles.pending]}>{checks.number ? '✓' : '○'} Um numero</Text>
        <Text style={[styles.item, checks.special ? styles.ok : styles.pending]}>{checks.special ? '✓' : '○'} Um caractere especial</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 14,
  },
  meterTrack: {
    width: '100%',
    height: 9,
    borderRadius: 99,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 99,
  },
  strengthText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    marginTop: 8,
    gap: 3,
  },
  item: {
    fontSize: 13,
  },
  ok: {
    color: '#16a34a',
  },
  pending: {
    color: '#6b7280',
  },
});
