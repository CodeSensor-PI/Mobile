import * as Location from 'expo-location';

/**
 * Solicita permissão de localização e retorna as coordenadas atuais.
 * @returns {{ latitude: number, longitude: number } | null}
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (_error) {
    return null;
  }
}

/**
 * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371; // Raio da Terra em km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // arredonda para 1 casa decimal
}

/**
 * Formata distância para exibição.
 */
export function formatDistance(km) {
  if (km == null) return 'N/A';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km}km`;
}
