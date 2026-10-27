// Distance helpers for city-scale geometry. Points are [lat, lng] in degrees.

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance between two points, in metres.
export function haversineMeters(a, b) {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Shortest distance from point p to the segment a-b, in metres.
// Projects onto a flat plane centred on p, which is accurate to well under
// a metre over the few hundred metres we care about.
export function pointToSegmentMeters(p, a, b) {
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_M;
  const metersPerDegLng = metersPerDegLat * Math.cos(toRad(p[0]));
  const ax = (a[1] - p[1]) * metersPerDegLng;
  const ay = (a[0] - p[0]) * metersPerDegLat;
  const bx = (b[1] - p[1]) * metersPerDegLng;
  const by = (b[0] - p[0]) * metersPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  // Fraction along a-b of the point closest to p, clamped to the segment.
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSq));
  return Math.hypot(ax + t * dx, ay + t * dy);
}
