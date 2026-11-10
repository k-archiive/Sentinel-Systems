// Finding places in the Greater Houston area.
//
// searchAddress() uses Nominatim for the final search when the user presses
// Enter. suggestPlaces() uses Photon for suggestions while typing, because
// Nominatim's usage policy doesn't allow search-as-you-type. Both are free
// OpenStreetMap services.

// Katy to Baytown/Kemah, The Woodlands/Spring to Pearland/Sugar Land.
export const HOUSTON_AREA = { west: -95.95, south: 29.45, east: -94.9, north: 30.2 };
const HOUSTON_CENTER = { lat: 29.7604, lng: -95.3698 };

export const MIN_SUGGEST_LENGTH = 3;

// "Pizza Hut, 1600, Holcombe Boulevard, Texas Medical Center, Houston, ..."
// -> label "Pizza Hut", detail "1600 Holcombe Boulevard, Texas Medical Center"
export function formatNominatimPlace(result) {
  const parts = result.display_name.split(',').map((s) => s.trim());
  const address = result.address || {};
  const street = [address.house_number, address.road].filter(Boolean).join(' ');
  const label = result.name || street || parts[0];
  const area = address.city || address.town || address.suburb || address.county;
  return {
    label,
    detail: [street !== label ? street : '', area].filter(Boolean).join(', '),
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  };
}

export function formatPhotonPlace(feature) {
  const p = feature.properties;
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const label = p.name || street;
  const area = p.city || p.district || p.county;
  return {
    label,
    detail: [street !== label ? street : '', area, p.postcode].filter(Boolean).join(', '),
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
  };
}

// Drops places with no name and repeats of the same label + detail.
export function uniquePlaces(places) {
  const seen = new Set();
  return places.filter((place) => {
    const key = `${place.label}|${place.detail}`.toLowerCase();
    if (!place.label || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Best matches for a typed address or place name, inside the Houston area. */
export async function searchAddress(query, { signal } = {}) {
  const { west, south, east, north } = HOUSTON_AREA;
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    viewbox: `${west},${north},${east},${south}`,
    bounded: '1',
    countrycodes: 'us',
    addressdetails: '1',
    limit: '5',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  const results = await response.json();
  return uniquePlaces(results.map(formatNominatimPlace));
}

/** Suggestions for a partly typed place, nearest Houston first. */
export async function suggestPlaces(query, { signal, limit = 5 } = {}) {
  if (query.trim().length < MIN_SUGGEST_LENGTH) return [];
  const { west, south, east, north } = HOUSTON_AREA;
  const params = new URLSearchParams({
    q: query,
    limit: String(limit + 3),
    bbox: `${west},${south},${east},${north}`,
    lat: String(HOUSTON_CENTER.lat),
    lon: String(HOUSTON_CENTER.lng),
    lang: 'en',
  });
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  const data = await response.json();
  return uniquePlaces(data.features.map(formatPhotonPlace)).slice(0, limit);
}
