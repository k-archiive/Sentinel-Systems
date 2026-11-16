import { describe, expect, it, vi } from 'vitest';
import {
  canRoute,
  CURRENT_LOCATION,
  EMPTY,
  endpointText,
  isEmpty,
  pinEndpoint,
  placeEndpoint,
  resolveEndpoint,
  textEndpoint,
} from './endpoints.js';

const USER = [29.7604, -95.3698];
const NRG = { label: 'Reliant Stadium', detail: '1 Kirby Drive, Houston', lat: 29.6848, lng: -95.4108 };

describe('endpointText', () => {
  it('shows what the field should display', () => {
    expect(endpointText(CURRENT_LOCATION)).toBe('Your location');
    expect(endpointText(placeEndpoint(NRG))).toBe('Reliant Stadium');
    expect(endpointText(textEndpoint('katy'))).toBe('katy');
  });
});

describe('isEmpty', () => {
  it('treats blank text as empty', () => {
    expect(isEmpty(EMPTY)).toBe(true);
    expect(isEmpty(textEndpoint('   '))).toBe(true);
    expect(isEmpty(CURRENT_LOCATION)).toBe(false);
  });
});

describe('pinEndpoint', () => {
  it('uses the nearest address when there is one', () => {
    const pin = pinEndpoint(29.76, -95.37, { label: 'City Hall', detail: '901 Bagby Street' });
    expect(pin).toEqual({ kind: 'place', label: 'City Hall', detail: '901 Bagby Street', lat: 29.76, lng: -95.37 });
  });
  it('falls back to "Dropped pin" and the coordinates', () => {
    expect(pinEndpoint(29.76, -95.37)).toMatchObject({ label: 'Dropped pin', detail: '29.76000, -95.37000' });
  });
});

describe('resolveEndpoint', () => {
  const search = vi.fn(async (q) => (q === 'nrg' ? [NRG] : []));

  it('uses the live location for "Your location"', async () => {
    const r = await resolveEndpoint(CURRENT_LOCATION, { userLocation: USER, search });
    expect(r).toEqual({ ok: true, point: { label: 'Your location', lat: USER[0], lng: USER[1] } });
  });

  it('treats an empty From as the live location', async () => {
    const r = await resolveEndpoint(EMPTY, { userLocation: USER, search, emptyMeansCurrent: true });
    expect(r.point.label).toBe('Your location');
  });

  it('reports an empty To instead of guessing', async () => {
    expect(await resolveEndpoint(EMPTY, { userLocation: USER, search })).toEqual({ ok: false, reason: 'empty' });
  });

  it('uses a chosen place without searching again', async () => {
    search.mockClear();
    const r = await resolveEndpoint(placeEndpoint(NRG), { userLocation: USER, search });
    expect(r.point).toEqual({ label: 'Reliant Stadium', lat: NRG.lat, lng: NRG.lng });
    expect(search).not.toHaveBeenCalled();
  });

  it('searches typed text and takes the best match', async () => {
    const r = await resolveEndpoint(textEndpoint(' nrg '), { userLocation: USER, search });
    expect(r.ok).toBe(true);
    expect(r.place).toBe(NRG);
  });

  it('reports typed text that matches nothing', async () => {
    expect(await resolveEndpoint(textEndpoint('qwzx'), { userLocation: USER, search })).toEqual({
      ok: false,
      reason: 'not-found',
      query: 'qwzx',
    });
  });
});

describe('canRoute', () => {
  const nrg = placeEndpoint(NRG);
  it('needs a destination', () => {
    expect(canRoute(CURRENT_LOCATION, EMPTY)).toBe(false);
    expect(canRoute(CURRENT_LOCATION, nrg)).toBe(true);
  });
  it('allows routing to your location from somewhere else', () => {
    expect(canRoute(nrg, CURRENT_LOCATION)).toBe(true);
  });
  it('refuses a route from your location to your location', () => {
    expect(canRoute(CURRENT_LOCATION, CURRENT_LOCATION)).toBe(false);
    expect(canRoute(EMPTY, CURRENT_LOCATION)).toBe(false);
  });
});
