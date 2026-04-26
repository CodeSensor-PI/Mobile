import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export function CodeInput({
  value,
  onChange,
  length = 6,
  editable = true,
}) {
  const refs = useRef([]);

  const digits = useMemo(() => {
    const source = (value || '').replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, index) => source[index] || '');
  }, [length, value]);

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const updateAt = (index, rawValue) => {
    const clean = (rawValue || '').replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = clean;
    const nextValue = nextDigits.join('');
    onChange(nextValue);

    if (clean && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.nativeEvent?.text;
    if (!pasted) {
      return;
    }

    const cleaned = pasted.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    const focusIndex = Math.min(cleaned.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChangeText={(text) => updateAt(index, text)}
          onKeyPress={(event) => handleKeyPress(index, event)}
          onTextInput={index === 0 ? handlePaste : undefined}
          keyboardType="number-pad"
          maxLength={1}
          editable={editable}
          style={[styles.cell, !editable && styles.disabled]}
          textAlign="center"
          accessibilityLabel={`Digito ${index + 1} do codigo`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9dee7',
    backgroundColor: '#eef1f6',
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  disabled: {
    opacity: 0.6,
  },
});
