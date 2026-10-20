import { describe, expect, it } from 'vitest';
import { haversineMeters, pointToSegmentMeters } from './geo.js';
import { depthWeight, levelForScore, rankRoutes, scoreRoute } from './scoreRoute.js';

// A straight east-west road in downtown Houston, about 960 m long.
const ROAD = [
  [29.76, -95.37],
  [29.76, -95.365],
  [29.76, -95.36],
];
// 0.001 degrees of latitude is about 111 m.
const north = (metres) => 29.76 + metres / 111320;

describe('geo', () => {
  it('measures a known distance', () => {
    // 0.01 degrees of latitude is about 1.11 km anywhere on Earth.
    expect(haversineMeters([29.76, -95.37], [29.77, -95.37])).toBeCloseTo(1112, -1);
  });

  it('measures distance to the nearest point of a segment', () => {
    expect(pointToSegmentMeters([north(100), -95.365], ROAD[0], ROAD[2])).toBeCloseTo(100, 0);
  });

  it('measures to the end point when the point is past the segment', () => {
    const d = pointToSegmentMeters([29.76, -95.355], ROAD[0], ROAD[2]);
    expect(d).toBeCloseTo(haversineMeters([29.76, -95.355], ROAD[2]), 0);
  });
});

describe('depthWeight', () => {
  it('treats 2 ft or more as maximum danger', () => {
    expect(depthWeight(2)).toBe(1);
    expect(depthWeight(6)).toBe(1);
  });
  it('never drops below 0.2 for shallow water', () => {
    expect(depthWeight(0.1)).toBe(0.2);
  });
  it('uses a middle value when depth is unknown', () => {
    expect(depthWeight(undefined)).toBe(0.5);
  });
});

describe('scoreRoute', () => {
  it('scores a route with no nearby flooding as clear', () => {
    const far = [{ lat: north(1000), lng: -95.365, depthFt: 5 }];
    const result = scoreRoute(ROAD, far);
    expect(result.score).toBe(0);
    expect(result.level).toBe('clear');
    expect(result.segments.every((s) => s.level === 'clear')).toBe(true);
  });

  it('scores deep water right on the road as high risk', () => {
    const result = scoreRoute(ROAD, [{ lat: 29.76, lng: -95.3675, depthFt: 4 }]);
    expect(result.score).toBe(100);
    expect(result.level).toBe('high');
    expect(result.maxDepthFt).toBe(4);
  });

  it('gives lower risk to points farther from the road', () => {
    const near = scoreRoute(ROAD, [{ lat: north(30), lng: -95.365, depthFt: 3 }]);
    const farther = scoreRoute(ROAD, [{ lat: north(120), lng: -95.365, depthFt: 3 }]);
    expect(near.score).toBeGreaterThan(farther.score);
    expect(farther.score).toBeGreaterThan(0);
  });

  it('ignores points just outside the 150 m radius', () => {
    expect(scoreRoute(ROAD, [{ lat: north(160), lng: -95.365, depthFt: 6 }]).score).toBe(0);
  });

  it('colours only the segment next to the flooding', () => {
    const result = scoreRoute(ROAD, [{ lat: north(20), lng: -95.369, depthFt: 3 }]);
    expect(result.segments[0].level).not.toBe('clear');
    expect(result.segments[1].level).toBe('clear');
    expect(result.exposedMeters).toBeGreaterThan(400);
  });

  it('adds risk for more flood points but never passes 100', () => {
    const one = scoreRoute(ROAD, [{ lat: north(75), lng: -95.368, depthFt: 1 }]);
    const many = scoreRoute(ROAD, Array.from({ length: 20 }, (_, i) => ({ lat: north(75), lng: -95.369 + i * 0.0004, depthFt: 1 })));
    expect(many.score).toBeGreaterThan(one.score);
    expect(many.score).toBeLessThanOrEqual(100);
  });

  it('handles an empty route or no flood data', () => {
    expect(scoreRoute([], [{ lat: 29.76, lng: -95.37, depthFt: 3 }]).score).toBe(0);
    expect(scoreRoute(ROAD, []).segments).toHaveLength(2);
  });
});

describe('levelForScore', () => {
  it('maps scores to levels', () => {
    expect([0, 10, 45, 80].map(levelForScore)).toEqual(['clear', 'low', 'moderate', 'high']);
  });
});

describe('rankRoutes', () => {
  it('puts the safest route first and breaks ties by travel time', () => {
    const flooded = { coords: ROAD, durationS: 300 };
    const detour = { coords: ROAD.map(([lat, lng]) => [lat + 0.01, lng]), durationS: 420 };
    const alsoClear = { coords: ROAD.map(([lat, lng]) => [lat - 0.01, lng]), durationS: 360 };
    const points = [{ lat: 29.76, lng: -95.3675, depthFt: 4 }];
    const ranked = rankRoutes([flooded, detour, alsoClear], points);
    expect(ranked.map((r) => r.index)).toEqual([2, 1, 0]);
  });
});
