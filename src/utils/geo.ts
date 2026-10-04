import { GeoCoordinate } from '../types';

export const PRESET_BANOS_LOCATIONS: GeoCoordinate[] = [
  { name: 'Parque Central Sebastián Acosta (Centro)', latitude: -1.3964, longitude: -78.4247 },
  { name: 'Termas de la Virgen (Al pie de la Cascada)', latitude: -1.3962, longitude: -78.4218 },
  { name: 'Terminal Terrestre de Baños', latitude: -1.3948, longitude: -78.4285 },
  { name: 'Entrada al Pailón del Diablo (Río Verde)', latitude: -1.4022, longitude: -78.2983 },
  { name: 'Casa del Árbol (Runtún)', latitude: -1.4168, longitude: -78.4239 },
  { name: 'Mirador Bellavista', latitude: -1.4055, longitude: -78.4225 },
];

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal point
}
