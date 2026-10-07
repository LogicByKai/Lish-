import { ref, computed } from 'vue';

// Lish AI Labs default Security Desk coordinates (configurable)
export const SECURITY_DESK_COORDS = {
  lat: -1.2921,
  lng: 36.8219,
  maxDistanceMeters: 300,
};

// Haversine formula to compute distance in meters between two lat/lng coordinates
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const userLat = ref<number | null>(null);
const userLng = ref<number | null>(null);
const distanceMeters = ref<number | null>(18); // Default to realistic 18m inside desk for smooth start
const geoStatus = ref<'idle' | 'checking' | 'granted' | 'denied' | 'simulated'>('simulated');
const geoError = ref<string | null>(null);
const isSimulated = ref<boolean>(true);

export function useGeolocation() {
  const isInRange = computed(() => {
    if (distanceMeters.value === null) return false;
    return distanceMeters.value <= SECURITY_DESK_COORDS.maxDistanceMeters;
  });

  function requestLocation() {
    if (!navigator.geolocation) {
      geoStatus.value = 'denied';
      geoError.value = 'Geolocation is not supported by your browser.';
      // Fallback to simulated
      isSimulated.value = true;
      distanceMeters.value = 24;
      return;
    }

    geoStatus.value = 'checking';
    geoError.value = null;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat.value = pos.coords.latitude;
        userLng.value = pos.coords.longitude;
        distanceMeters.value = calculateDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          SECURITY_DESK_COORDS.lat,
          SECURITY_DESK_COORDS.lng
        );
        geoStatus.value = 'granted';
        isSimulated.value = false;
      },
      (err) => {
        geoStatus.value = 'denied';
        geoError.value = err.message || 'Location access denied or unavailable.';
        // Auto fallback to demo mode so the user can test easily
        isSimulated.value = true;
        distanceMeters.value = 24;
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }

  function setSimulatedDistance(dist: number) {
    isSimulated.value = true;
    geoStatus.value = 'simulated';
    distanceMeters.value = dist;
    geoError.value = null;
  }

  return {
    userLat,
    userLng,
    distanceMeters,
    isInRange,
    geoStatus,
    geoError,
    isSimulated,
    maxAllowedMeters: SECURITY_DESK_COORDS.maxDistanceMeters,
    requestLocation,
    setSimulatedDistance,
  };
}
