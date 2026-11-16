// The start ("From") and destination ("To") of a route.
//
// An endpoint is one of:
//   { kind: 'current' }                          the user's live location
//   { kind: 'place', label, detail, lat, lng }   a chosen place or dropped pin
//   { kind: 'text', text }                       typed but not looked up yet

export const CURRENT_LOCATION = { kind: 'current' };
export const EMPTY = { kind: 'text', text: '' };

export function placeEndpoint(place) {
  return { kind: 'place', label: place.label, detail: place.detail || '', lat: place.lat, lng: place.lng };
}

export function textEndpoint(text) {
  return { kind: 'text', text };
}

// What the field shows.
export function endpointText(endpoint) {
  if (endpoint.kind === 'current') return 'Your location';
  if (endpoint.kind === 'place') return endpoint.label;
  return endpoint.text;
}

export function isEmpty(endpoint) {
  return endpoint.kind === 'text' && endpoint.text.trim() === '';
}

export const pinDetail = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

// A dropped pin; address is the nearest place found for it, if any.
export function pinEndpoint(lat, lng, address) {
  return {
    kind: 'place',
    label: address?.label || 'Dropped pin',
    detail: address?.detail || pinDetail(lat, lng),
    lat,
    lng,
  };
}

/**
 * Turns an endpoint into a point on the map.
 * search(query) returns matching places (best first), like searchAddress().
 * Resolves to {ok: true, point: {label, lat, lng}} or {ok: false, reason, query}.
 * An empty "From" means the user's location; an empty "To" is an error.
 */
export async function resolveEndpoint(endpoint, { userLocation, search, emptyMeansCurrent = false }) {
  if (endpoint.kind === 'current' || (emptyMeansCurrent && isEmpty(endpoint))) {
    if (!userLocation) return { ok: false, reason: 'no-location' };
    return { ok: true, point: { label: 'Your location', lat: userLocation[0], lng: userLocation[1] } };
  }
  if (endpoint.kind === 'place') {
    return { ok: true, point: { label: endpoint.label, lat: endpoint.lat, lng: endpoint.lng } };
  }
  const query = endpoint.text.trim();
  if (!query) return { ok: false, reason: 'empty' };
  const results = await search(query);
  if (results.length === 0) return { ok: false, reason: 'not-found', query };
  const best = results[0];
  return { ok: true, point: { label: best.label, lat: best.lat, lng: best.lng }, place: best };
}

// True when From and To are set and not both the user's location.
export function canRoute(from, to) {
  if (isEmpty(to)) return false;
  const fromIsCurrent = from.kind === 'current' || isEmpty(from);
  return !(fromIsCurrent && to.kind === 'current');
}
