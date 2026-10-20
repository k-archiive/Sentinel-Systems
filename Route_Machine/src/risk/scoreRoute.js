// Flood-risk scoring for a driving route. See docs/risk-score.md for the
// reasoning behind each number.
import { haversineMeters, pointToSegmentMeters } from './geo.js';

export const DEFAULT_RADIUS_M = 150;
// About 2 ft of water is enough to float most vehicles (NWS "Turn Around, Don't Drown").
const DANGEROUS_DEPTH_FT = 2;
const MIN_DEPTH_WEIGHT = 0.2;
const UNKNOWN_DEPTH_WEIGHT = 0.5;

export const LEVELS = ['clear', 'low', 'moderate', 'high'];

// How much a flood point's water depth matters, from 0.2 to 1.
export function depthWeight(depthFt) {
  if (depthFt == null || Number.isNaN(depthFt)) return UNKNOWN_DEPTH_WEIGHT;
  return Math.min(1, Math.max(MIN_DEPTH_WEIGHT, depthFt / DANGEROUS_DEPTH_FT));
}

// 1 when the point is on the road, falling to 0 at the edge of the radius.
export function proximityWeight(distanceM, radiusM = DEFAULT_RADIUS_M) {
  return distanceM > radiusM ? 0 : 1 - distanceM / radiusM;
}

export function levelForScore(score) {
  if (score <= 0) return 'clear';
  if (score < 30) return 'low';
  if (score < 60) return 'moderate';
  return 'high';
}

function levelForRisk(risk) {
  return levelForScore(Math.round(risk * 100));
}

// Degrees of latitude/longitude that cover radiusM around a latitude,
// used to skip far-away points and segments cheaply.
function degreePadding(lat, radiusM) {
  const latPad = radiusM / 111320;
  return { latPad, lngPad: latPad / Math.cos((lat * Math.PI) / 180) };
}

function boundsOf(coords) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of coords) {
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
  }
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Score one route against flood points.
 * @param {Array<[number, number]>} route  route line as [lat, lng] points, in driving order
 * @param {Array<{lat: number, lng: number, depthFt?: number}>} floodPoints
 * @param {{radiusM?: number}} [options]
 * @returns {{score: number, level: string, hits: Array, maxDepthFt: number|null,
 *   exposedMeters: number, segments: Array<{from: number[], to: number[], risk: number, level: string}>}}
 */
export function scoreRoute(route, floodPoints, { radiusM = DEFAULT_RADIUS_M } = {}) {
  const segments = [];
  for (let i = 0; i < route.length - 1; i++) {
    segments.push({ from: route[i], to: route[i + 1], risk: 0, level: 'clear' });
  }
  if (segments.length === 0 || floodPoints.length === 0) {
    return { score: 0, level: 'clear', hits: [], maxDepthFt: null, exposedMeters: 0, segments };
  }

  const box = boundsOf(route);
  const { latPad, lngPad } = degreePadding((box.minLat + box.maxLat) / 2, radiusM);
  const hits = [];

  for (const point of floodPoints) {
    const p = [point.lat, point.lng];
    if (p[0] < box.minLat - latPad || p[0] > box.maxLat + latPad ||
        p[1] < box.minLng - lngPad || p[1] > box.maxLng + lngPad) continue;

    const weight = depthWeight(point.depthFt);
    let closest = Infinity;
    for (const seg of segments) {
      // Skip segments whose bounding box is clearly out of range.
      if (p[0] < Math.min(seg.from[0], seg.to[0]) - latPad || p[0] > Math.max(seg.from[0], seg.to[0]) + latPad ||
          p[1] < Math.min(seg.from[1], seg.to[1]) - lngPad || p[1] > Math.max(seg.from[1], seg.to[1]) + lngPad) continue;
      const d = pointToSegmentMeters(p, seg.from, seg.to);
      if (d > radiusM) continue;
      closest = Math.min(closest, d);
      seg.risk = Math.max(seg.risk, proximityWeight(d, radiusM) * weight);
    }
    if (closest <= radiusM) {
      hits.push({ point, distanceM: closest, contribution: proximityWeight(closest, radiusM) * weight });
    }
  }

  // Combine hits like independent chances of trouble: one deep, close point
  // dominates, and each extra point adds less. Always stays within 0-100.
  const safeChance = hits.reduce((acc, h) => acc * (1 - h.contribution), 1);
  const score = Math.round(100 * (1 - safeChance));

  let exposedMeters = 0;
  for (const seg of segments) {
    seg.level = levelForRisk(seg.risk);
    if (seg.risk > 0) exposedMeters += haversineMeters(seg.from, seg.to);
  }
  const depths = hits.map((h) => h.point.depthFt).filter((d) => d != null);

  return {
    score,
    level: levelForScore(score),
    hits: hits.sort((a, b) => b.contribution - a.contribution),
    maxDepthFt: depths.length ? Math.max(...depths) : null,
    exposedMeters: Math.round(exposedMeters),
    segments,
  };
}

/**
 * Score several candidate routes and order them safest first; ties go to
 * the faster route. Each route is {coords, durationS?}.
 */
export function rankRoutes(routes, floodPoints, options) {
  return routes
    .map((route, index) => ({ ...route, index, risk: scoreRoute(route.coords, floodPoints, options) }))
    .sort((a, b) => a.risk.score - b.risk.score || (a.durationS ?? 0) - (b.durationS ?? 0));
}
