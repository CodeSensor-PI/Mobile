import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  type?: 'success' | 'error' | 'warning';
}

export function CustomAlert({ 
  visible, 
  title, 
  message, 
  onClose, 
  onSecondaryAction,
  primaryLabel = 'OK',
  secondaryLabel = 'Cancelar',
  type = 'success' 
}: CustomAlertProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getHeaderColor = () => {
    if (type === 'success') return '#4CAF50';
    if (type === 'error') return '#FF5252';
    if (type === 'warning') return '#FFD740';
    return colors.primary;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertBox, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
            <ThemedText style={styles.headerText}>{title}</ThemedText>
          </View>
          <View style={styles.content}>
            <ThemedText style={styles.message}>{message}</ThemedText>
          </View>
          
          <View style={styles.buttonContainer}>
            {onSecondaryAction && (
              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.primary }]} 
                onPress={onSecondaryAction}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: colors.primary }]}>{secondaryLabel}</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                { backgroundColor: colors.primary },
                !onSecondaryAction && { width: '80%' }
              ]} 
              onPress={onClose}
            >
              <ThemedText style={styles.primaryButtonText}>{primaryLabel}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
