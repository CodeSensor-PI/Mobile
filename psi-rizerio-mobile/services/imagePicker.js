import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

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
/**
 * Captura via webcam no navegador (PC). Cria um overlay com <video> ao vivo
 * e um botão para capturar o frame. Resolve com um data URI JPEG.
 */
function captureFromWebcam() {
  return new Promise(async (resolve) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      resolve({ ok: false, reason: 'Webcam não disponível neste navegador.' });
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    } catch (_e) {
      resolve({ ok: false, reason: 'Não foi possível acessar a webcam. Verifique as permissões.' });
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.cssText = 'max-width:90vw;max-height:60vh;border-radius:12px;transform:scaleX(-1);';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;';

    const mkBtn = (label, bg) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = `padding:12px 22px;border:none;border-radius:24px;font-weight:700;font-size:15px;color:#fff;cursor:pointer;background:${bg};`;
      return b;
    };
    const capture = mkBtn('Capturar', '#16a34a');
    const cancel = mkBtn('Cancelar', '#64748b');

    btnRow.appendChild(capture);
    btnRow.appendChild(cancel);
    overlay.appendChild(video);
    overlay.appendChild(btnRow);
    document.body.appendChild(overlay);

    const cleanup = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    capture.onclick = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const uri = canvas.toDataURL('image/jpeg', 0.7);
      cleanup();
      resolve({ ok: true, uri });
    };
    cancel.onclick = () => {
      cleanup();
      resolve({ ok: false, reason: 'canceled' });
    };
  });
}

export async function pickFromCamera() {
  // Na web, usa a webcam do PC (expo-image-picker não abre câmera no navegador).
  if (Platform.OS === 'web') {
    return captureFromWebcam();
  }

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
