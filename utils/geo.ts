/** Radius of the Earth in metres (WGS-84 mean radius). */
const EARTH_RADIUS_M = 6_371_000;

/** Convert degrees to radians. */
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Calculate the great-circle distance between two WGS-84 coordinates
 * using the Haversine formula.
 *
 * @returns Distance in **metres**.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate the initial bearing from point 1 to point 2.
 *
 * @returns Bearing in **degrees** (0–360, where 0 = North, 90 = East).
 */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Format a distance for human-readable display.
 *
 * - ≥ 1 000 m → "1.2 km"
 * - < 1 000 m → "342 m"
 */
export function formatDistance(metres: number): string {
  if (metres >= 1_000) {
    return `${(metres / 1_000).toFixed(1)} km`;
  }
  return `${Math.round(metres)} m`;
}
