import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function MobileSearchAndActionBar({
  query,
  onChangeQuery,
  onPressAction,
  actionLabel,
  placeholder,
  primaryColor = '#1B66A4',
}) {
  return (
    <View style={styles.toolbar}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={14} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            accessibilityLabel="Pesquisar psicólogos"
            returnKeyType="search"
          />
        </View>

        <Pressable
          style={[styles.filterButton, { borderColor: primaryColor }]}
          accessibilityRole="button"
          accessibilityLabel="Filtrar lista"
        >
          <Ionicons name="funnel-outline" size={16} color={primaryColor} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.actionButton, { backgroundColor: primaryColor }]}
        onPress={onPressAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Ionicons name="add" size={16} color="#ffffff" />
        <Text style={styles.actionButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 12,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 8,
  },
  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  actionButton: {
    alignSelf: 'flex-start',
    minHeight: 26,
    borderRadius: 14,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
