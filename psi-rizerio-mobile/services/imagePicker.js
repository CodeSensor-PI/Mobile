import * as ImagePicker from 'expo-image-picker';

const COMMON_OPTIONS = {
  // SDK 54: 'mediaTypes' aceita array de strings ('images' | 'videos' | 'livePhotos')
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.5,
  base64: true,
};

function toDataUri(asset) {
  if (!asset) return null;
  if (asset.base64) {
    return `data:image/jpeg;base64,${asset.base64}`;
  }
  return asset.uri || null;
}

/**
 * Abre a câmera do dispositivo.
 * @returns {Promise<{ ok: boolean, uri?: string|null, reason?: string }>}
 */
export async function pickFromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, reason: 'Permissão para acessar a câmera é necessária.' };
  }

  const result = await ImagePicker.launchCameraAsync(COMMON_OPTIONS);
  if (result.canceled) {
    return { ok: false, reason: 'canceled' };
  }

  return { ok: true, uri: toDataUri(result.assets?.[0]) };
}

/**
 * Abre a galeria / arquivos do dispositivo (ou seletor de arquivos na web).
 * @returns {Promise<{ ok: boolean, uri?: string|null, reason?: string }>}
 */
export async function pickFromGallery() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, reason: 'Permissão para acessar a galeria é necessária.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync(COMMON_OPTIONS);
  if (result.canceled) {
    return { ok: false, reason: 'canceled' };
  }

  return { ok: true, uri: toDataUri(result.assets?.[0]) };
}
