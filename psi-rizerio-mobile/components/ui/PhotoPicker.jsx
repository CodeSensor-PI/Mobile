import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { pickFromCamera, pickFromGallery } from '../../services/imagePicker';

const DEFAULT_AVATAR = require('../../assets/images/profile.png');

/**
 * Avatar editável. Ao tocar, pergunta se o usuário deseja usar a
 * Câmera ou a Galeria (arquivos), solicita as permissões necessárias
 * e devolve a imagem (data URI) via onChange.
 */
export function PhotoPicker({
  value,
  onChange,
  onError,
  size = 96,
  primaryColor = '#1B66A4',
  editable = true,
  shape = 'circle',
}) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const borderRadius = shape === 'circle' ? size / 2 : 12;

  const handleOpen = () => {
    if (!editable) return;
    setSheetVisible(true);
  };

  const runPicker = async (picker) => {
    setSheetVisible(false);
    try {
      const result = await picker();
      if (result.ok && result.uri) {
        onChange?.(result.uri);
      } else if (!result.ok && result.reason && result.reason !== 'canceled') {
        onError?.(result.reason);
      }
    } catch (_error) {
      onError?.('Não foi possível selecionar a imagem.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handleOpen} accessibilityRole="button" accessibilityLabel="Selecionar foto">
        <Image
          source={value ? { uri: value } : DEFAULT_AVATAR}
          style={{ width: size, height: size, borderRadius, backgroundColor: '#e2e8f0' }}
        />
        {editable && (
          <View style={[styles.badge, { backgroundColor: primaryColor }]}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        )}
      </Pressable>

      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Foto de perfil</Text>
            <Text style={styles.sheetSubtitle}>De onde você quer selecionar a imagem?</Text>

            <Pressable style={[styles.option, { borderColor: primaryColor }]} onPress={() => runPicker(pickFromCamera)}>
              <Ionicons name="camera-outline" size={22} color={primaryColor} />
              <Text style={[styles.optionText, { color: primaryColor }]}>Tirar foto (Câmera)</Text>
            </Pressable>

            <Pressable style={[styles.option, { borderColor: primaryColor }]} onPress={() => runPicker(pickFromGallery)}>
              <Ionicons name="images-outline" size={22} color={primaryColor} />
              <Text style={[styles.optionText, { color: primaryColor }]}>Escolher da galeria / arquivos</Text>
            </Pressable>

            <Pressable style={styles.cancel} onPress={() => setSheetVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
});
