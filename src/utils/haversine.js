/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 in decimal degrees
 * @param {number} lon1 Longitude of point 1 in decimal degrees
 * @param {number} lat2 Latitude of point 2 in decimal degrees
 * @param {number} lon2 Longitude of point 2 in decimal degrees
 * @returns {number} Distance in meters
 */
export function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    lat1 === null || lon1 === null ||
    lat2 === null || lon2 === null
  ) {
    return 0;
  }

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if a given coordinate is within the campus geofence radius.
 *
 * @param {number} lat Bus latitude
 * @param {number} lon Bus longitude
 * @param {number} campusLat Campus center latitude
 * @param {number} campusLon Campus center longitude
 * @param {number} radiusMeters Geofence radius in meters (default 200m)
 * @returns {boolean} True if inside geofence
 */
export function isInsideGeofence(lat, lon, campusLat = 12.9716, campusLon = 77.5946, radiusMeters = 200) {
  const dist = calculateHaversineDistanceMeters(lat, lon, campusLat, campusLon);
  return dist <= radiusMeters;
}

/**
 * Determines whether the bus has moved at least 100 meters since the last published point
 * (Adhering strictly to the 100-Meter Distance Movement Rule)
 *
 * @param {Object} lastCoord { lat, lon }
 * @param {Object} currentCoord { lat, lon }
 * @param {number} thresholdMeters Default 100 meters
 * @returns {boolean}
 */
export function hasMovedBeyondThreshold(lastCoord, currentCoord, thresholdMeters = 100) {
  if (!lastCoord || !currentCoord) return true;
  const dist = calculateHaversineDistanceMeters(
    lastCoord.lat,
    lastCoord.lon,
    currentCoord.lat,
    currentCoord.lon
  );
  return dist >= thresholdMeters;
}

