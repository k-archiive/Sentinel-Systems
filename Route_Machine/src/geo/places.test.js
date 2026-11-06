import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatNominatimPlace,
  formatPhotonPlace,
  HOUSTON_AREA,
  searchAddress,
  suggestPlaces,
  uniquePlaces,
} from './places.js';

const jsonResponse = (body) => Promise.resolve({ json: () => Promise.resolve(body) });

afterEach(() => vi.unstubAllGlobals());

describe('formatNominatimPlace', () => {
  it('uses the place name and puts the street in the detail', () => {
    const place = formatNominatimPlace({
      name: 'Katy Mills',
      display_name: 'Katy Mills, Katy Mills Circle, Katy, Fort Bend County, Texas',
      address: { road: 'Katy Mills Circle', city: 'Katy' },
      lat: '29.7786',
      lon: '-95.8065',
    });
    expect(place).toEqual({ label: 'Katy Mills', detail: 'Katy Mills Circle, Katy', lat: 29.7786, lng: -95.8065 });
  });

  it('falls back to the street address when there is no name', () => {
    const place = formatNominatimPlace({
      display_name: '3100, Main Street, Midtown, Houston',
      address: { house_number: '3100', road: 'Main Street', city: 'Houston' },
      lat: '29.74',
      lon: '-95.38',
    });
    expect(place.label).toBe('3100 Main Street');
    expect(place.detail).toBe('Houston');
  });
});

describe('formatPhotonPlace', () => {
  it('builds a label and detail from Photon properties', () => {
    const place = formatPhotonPlace({
      properties: { name: 'Reliant Stadium', housenumber: '1', street: 'Kirby Drive', city: 'Houston', postcode: '77054' },
      geometry: { coordinates: [-95.4108, 29.6848] },
    });
    expect(place).toEqual({ label: 'Reliant Stadium', detail: '1 Kirby Drive, Houston, 77054', lat: 29.6848, lng: -95.4108 });
  });
});

describe('uniquePlaces', () => {
  it('removes repeats and places without a label', () => {
    const a = { label: 'Katy Mills', detail: 'Katy', lat: 1, lng: 1 };
    expect(uniquePlaces([a, { ...a, lat: 2 }, { label: '', detail: 'x', lat: 0, lng: 0 }])).toEqual([a]);
  });
});

describe('searchAddress', () => {
  it('limits the search to the Houston area instead of adding "Houston, TX"', async () => {
    const fetchMock = vi.fn(() => jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    await searchAddress('Katy Mills');
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('q')).toBe('Katy Mills');
    expect(url.searchParams.get('bounded')).toBe('1');
    expect(url.searchParams.get('viewbox')).toBe(
      `${HOUSTON_AREA.west},${HOUSTON_AREA.north},${HOUSTON_AREA.east},${HOUSTON_AREA.south}`,
    );
  });
});

describe('suggestPlaces', () => {
  it("doesn't call the service for fewer than 3 characters", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await suggestPlaces('ka')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns at most the requested number of unique suggestions', async () => {
    const feature = (name) => ({ properties: { name, city: 'Houston' }, geometry: { coordinates: [-95.4, 29.7] } });
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ features: ['A', 'A', 'B', 'C', 'D'].map(feature) })));
    const places = await suggestPlaces('stadium', { limit: 3 });
    expect(places.map((p) => p.label)).toEqual(['A', 'B', 'C']);
  });
});
