import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../risk/riskStyles.js';
import { ALERT_LEVELS, alertLevel, alertsToShow, formatUntil, isFloodRelated, sortAlerts } from './alerts.js';

const NOW = new Date('2026-11-16T18:00:00Z'); // 12:00 PM in Houston

const alert = (event, severity = 'Moderate', ends = '2026-11-17T03:00:00Z') => ({ id: event, event, severity, ends });

describe('alertLevel', () => {
  it('sorts NWS event names into warning, watch and advisory', () => {
    expect(alertLevel('Flash Flood Warning')).toBe('warning');
    expect(alertLevel('Flash Flood Emergency')).toBe('warning');
    expect(alertLevel('Flood Watch')).toBe('watch');
    expect(alertLevel('Flood Advisory')).toBe('advisory');
    expect(alertLevel('Hydrologic Outlook')).toBe('advisory');
  });
});

describe('isFloodRelated', () => {
  it('keeps flood and tropical alerts, drops unrelated ones', () => {
    expect(isFloodRelated(alert('Flash Flood Warning'))).toBe(true);
    expect(isFloodRelated(alert('Tropical Storm Warning'))).toBe(true);
    expect(isFloodRelated(alert('Heat Advisory'))).toBe(false);
  });
});

describe('sortAlerts', () => {
  it('puts warnings first, then watches, then advisories', () => {
    const sorted = sortAlerts([alert('Flood Advisory'), alert('Flash Flood Warning'), alert('Flood Watch')]);
    expect(sorted.map((a) => a.event)).toEqual(['Flash Flood Warning', 'Flood Watch', 'Flood Advisory']);
  });

  it('breaks ties by severity', () => {
    const sorted = sortAlerts([alert('Flood Warning', 'Moderate'), alert('Flash Flood Warning', 'Extreme')]);
    expect(sorted[0].event).toBe('Flash Flood Warning');
  });
});

describe('formatUntil', () => {
  it('shows just the time for an alert ending today', () => {
    expect(formatUntil('2026-11-17T03:00:00Z', NOW)).toBe('until 9:00 PM');
  });
  it('adds the day for an alert ending another day', () => {
    expect(formatUntil('2026-11-18T15:00:00Z', NOW)).toBe('until Wed 9:00 AM');
  });
  it('returns nothing when the end time is unknown', () => {
    expect(formatUntil(null, NOW)).toBe('');
    expect(formatUntil('not a date', NOW)).toBe('');
  });
});

describe('alertsToShow', () => {
  it('drops expired and unrelated alerts and sorts the rest', () => {
    const shown = alertsToShow(
      [alert('Flood Watch'), alert('Heat Advisory'), alert('Flash Flood Warning', 'Severe', '2026-11-16T12:00:00Z'), alert('Flood Warning')],
      NOW,
    );
    expect(shown.map((a) => a.event)).toEqual(['Flood Warning', 'Flood Watch']);
  });
});

describe('ALERT_LEVELS', () => {
  it('meets WCAG AA contrast (4.5:1) for banner text', () => {
    for (const [level, style] of Object.entries(ALERT_LEVELS)) {
      expect(contrastRatio(style.background, style.color), level).toBeGreaterThanOrEqual(4.5);
    }
  });
});
