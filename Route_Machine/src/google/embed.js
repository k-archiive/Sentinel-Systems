// Google Maps Embed API links. The API is free with no usage limits, but it
// needs a key (see docs/google-embed.md). Without a key, the app still
// offers a plain "Open in Google Maps" link, which needs no key.

const EMBED_BASE = 'https://www.google.com/maps/embed/v1';
// Embed directions accept up to 20 waypoints; fewer keeps the URL short
// while still pinning Google to our route.
export const MAX_EMBED_WAYPOINTS = 8;
// Google Maps URLs (no key) accept fewer waypoints than the Embed API.
const MAX_LINK_WAYPOINTS = 3;

export function getEmbedKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || '';
}

const fmt = ([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

/**
 * Evenly spaced points from inside a route (not the start or end), so
 * Google's directions follow the same roads as our flood-aware route.
 */
export function pickWaypoints(route, max = MAX_EMBED_WAYPOINTS) {
  if (!route || route.length < 3 || max <= 0) return [];
  const inner = route.slice(1, -1);
  if (inner.length <= max) return inner;
  const step = inner.length / (max + 1);
  return Array.from({ length: max }, (_, i) => inner[Math.round(step * (i + 1))]);
}

export function streetViewEmbedUrl(key, point) {
  const params = new URLSearchParams({ key, location: fmt(point), fov: '80' });
  return `${EMBED_BASE}/streetview?${params}`;
}

export function directionsEmbedUrl(key, route) {
  const params = new URLSearchParams({
    key,
    origin: fmt(route[0]),
    destination: fmt(route[route.length - 1]),
    mode: 'driving',
  });
  const waypoints = pickWaypoints(route);
  if (waypoints.length) params.set('waypoints', waypoints.map(fmt).join('|'));
  return `${EMBED_BASE}/directions?${params}`;
}

// Opens Google Maps in a new tab (or the app on phones). No key needed.
export function googleMapsDirectionsLink(route) {
  const params = new URLSearchParams({
    api: '1',
    origin: fmt(route[0]),
    destination: fmt(route[route.length - 1]),
    travelmode: 'driving',
  });
  const waypoints = pickWaypoints(route, MAX_LINK_WAYPOINTS);
  if (waypoints.length) params.set('waypoints', waypoints.map(fmt).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

export function googleStreetViewLink(point) {
  const params = new URLSearchParams({ api: '1', map_action: 'pano', viewpoint: fmt(point) });
  return `https://www.google.com/maps/@?${params}`;
}
