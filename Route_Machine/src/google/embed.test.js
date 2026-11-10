import { describe, expect, it } from 'vitest';
import {
  directionsEmbedUrl,
  googleMapsDirectionsLink,
  googleStreetViewLink,
  MAX_EMBED_WAYPOINTS,
  pickWaypoints,
  streetViewEmbedUrl,
} from './embed.js';

const route = Array.from({ length: 101 }, (_, i) => [29.7 + i * 0.001, -95.4 + i * 0.001]);

describe('pickWaypoints', () => {
  it('returns nothing for a route with no middle points', () => {
    expect(pickWaypoints([[29.7, -95.4], [29.8, -95.3]])).toEqual([]);
  });

  it('never includes the start or the end', () => {
    const points = pickWaypoints(route);
    expect(points).not.toContainEqual(route[0]);
    expect(points).not.toContainEqual(route[route.length - 1]);
  });

  it('caps the number of waypoints and keeps them in driving order', () => {
    const points = pickWaypoints(route, 4);
    expect(points).toHaveLength(4);
    const lats = points.map((p) => p[0]);
    expect([...lats].sort((a, b) => a - b)).toEqual(lats);
  });

  it('uses every middle point when there are only a few', () => {
    expect(pickWaypoints(route.slice(0, 4))).toEqual(route.slice(1, 3));
  });
});

describe('embed URLs', () => {
  it('builds a Street View embed for a point', () => {
    const url = new URL(streetViewEmbedUrl('KEY', [29.76, -95.37]));
    expect(url.pathname).toBe('/maps/embed/v1/streetview');
    expect(url.searchParams.get('key')).toBe('KEY');
    expect(url.searchParams.get('location')).toBe('29.76000,-95.37000');
  });

  it('builds directions that follow our route with waypoints', () => {
    const url = new URL(directionsEmbedUrl('KEY', route));
    expect(url.pathname).toBe('/maps/embed/v1/directions');
    expect(url.searchParams.get('origin')).toBe('29.70000,-95.40000');
    expect(url.searchParams.get('destination')).toBe('29.80000,-95.30000');
    expect(url.searchParams.get('waypoints').split('|')).toHaveLength(MAX_EMBED_WAYPOINTS);
  });
});

describe('Google Maps links (no key)', () => {
  it('opens directions with up to 3 waypoints', () => {
    const url = new URL(googleMapsDirectionsLink(route));
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('waypoints').split('|')).toHaveLength(3);
  });

  it('opens Street View at a point', () => {
    const url = new URL(googleStreetViewLink([29.76, -95.37]));
    expect(url.searchParams.get('map_action')).toBe('pano');
    expect(url.searchParams.get('viewpoint')).toBe('29.76000,-95.37000');
  });
});
