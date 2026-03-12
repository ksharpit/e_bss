// Geolocation + Haversine distance utility

// Haversine formula: distance in km between two lat/lng points
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(lat1 * Math.PI / 180)
          * Math.cos(lat2 * Math.PI / 180)
          * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get user's current position (returns { lat, lng } or null)
let cachedPosition = null;

export function getUserLocation() {
  return new Promise((resolve) => {
    if (cachedPosition) {
      resolve(cachedPosition);
      return;
    }
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        resolve(cachedPosition);
      },
      () => resolve(null),
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
}

// Calculate distance from user to a station, returns formatted string or null
export function stationDistance(userLat, userLng, station) {
  if (!userLat || !userLng || !station.lat || !station.lng) return null;
  const km = haversineKm(userLat, userLng, Number(station.lat), Number(station.lng));
  return km < 10 ? km.toFixed(1) : Math.round(km).toString();
}
