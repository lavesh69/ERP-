/**
 * Geofencing and Distance Verification for Classroom Smart Attendance
 * Uses the Haversine formula to compute great-circle distance between two geographic coordinates.
 */

const EARTH_RADIUS_METERS = 6371000; // Mean radius of Earth in meters

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeofenceVerificationResult {
  inGeofence: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  error?: string;
}

/**
 * Validates that latitude and longitude are valid numbers within global coordinates bounds.
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Computes the distance in meters between two lat/lng coordinates using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error("Invalid geographic coordinates provided to Haversine calculation");
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Verifies if the student's reported geolocation is within the permissible classroom radius.
 * If student GPS accuracy is provided, an uncertainty threshold can be factored in.
 */
export function verifyGeofenceProximity(
  studentCoords: GeoCoordinates,
  targetCoords: GeoCoordinates,
  allowedRadiusMeters: number = 100
): GeofenceVerificationResult {
  if (!isValidCoordinate(studentCoords.latitude, studentCoords.longitude)) {
    return {
      inGeofence: false,
      distanceMeters: Infinity,
      allowedRadiusMeters,
      error: "Invalid student GPS coordinates",
    };
  }

  if (!isValidCoordinate(targetCoords.latitude, targetCoords.longitude)) {
    return {
      inGeofence: false,
      distanceMeters: Infinity,
      allowedRadiusMeters,
      error: "Classroom/Session coordinates are not configured or invalid",
    };
  }

  const distanceMeters = calculateHaversineDistance(
    studentCoords.latitude,
    studentCoords.longitude,
    targetCoords.latitude,
    targetCoords.longitude
  );

  // Allow for GPS accuracy buffer up to 25 meters if provided
  const effectiveRadius = allowedRadiusMeters + Math.min(studentCoords.accuracy || 0, 25);
  const inGeofence = distanceMeters <= effectiveRadius;

  return {
    inGeofence,
    distanceMeters,
    allowedRadiusMeters,
    error: inGeofence
      ? undefined
      : `Location outside allowed radius (${distanceMeters}m away, maximum allowed: ${allowedRadiusMeters}m)`,
  };
}
