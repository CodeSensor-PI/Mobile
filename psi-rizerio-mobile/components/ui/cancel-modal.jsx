import React from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '../themed-text';
import { Button } from './button';
import { Ionicons } from '@expo/vector-icons';

export function CancelModal({ visible, onClose, onConfirm }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Botão X para fechar */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="#643BA1" />
          </Pressable>

          <ThemedText style={styles.title}>
            Tem certeza que deseja cancelar seu cadastro?
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Todas as informações já cadastradas serão perdidas.
          </ThemedText>

          <View style={styles.buttonContainer}>
            <Button 
              title="Sim, desejo cancelar o cadastro" 
              onPress={onConfirm} 
              style={styles.btnPrimary}
            />
            <Button 
              title="Seguir com cadastro" 
              variant="outline" 
              onPress={onClose} 
              style={styles.btnOutline}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escurecido atrás do modal
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'flex-start',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  btnPrimary: { padding: 14 },
  btnOutline: { padding: 14 },
});