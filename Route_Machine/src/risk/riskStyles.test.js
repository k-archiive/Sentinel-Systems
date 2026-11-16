import { describe, expect, it } from 'vitest';
import { LEVELS } from './scoreRoute.js';
import { contrastRatio, relativeLuminance, RISK_STYLES } from './riskStyles.js';

describe('contrast helpers', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(relativeLuminance('#ffffff')).toBe(1);
  });
});

describe('RISK_STYLES', () => {
  it('has a style for every risk level', () => {
    expect(Object.keys(RISK_STYLES).sort()).toEqual([...LEVELS].sort());
  });

  it('gives every level its own icon shape', () => {
    const icons = LEVELS.map((level) => RISK_STYLES[level].icon);
    expect(new Set(icons).size).toBe(LEVELS.length);
  });

  it('gives every level its own line pattern and width', () => {
    const lines = LEVELS.map((level) => `${RISK_STYLES[level].dashArray}|${RISK_STYLES[level].weight}`);
    expect(new Set(lines).size).toBe(LEVELS.length);
  });

  it('gets darker as risk rises, so levels read without colour', () => {
    const [low, moderate, high] = ['low', 'moderate', 'high'].map((l) => relativeLuminance(RISK_STYLES[l].color));
    expect(low).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(high);
    // Clearly different steps, not near-identical shades.
    expect(contrastRatio(RISK_STYLES.low.color, RISK_STYLES.moderate.color)).toBeGreaterThan(1.8);
    expect(contrastRatio(RISK_STYLES.moderate.color, RISK_STYLES.high.color)).toBeGreaterThan(1.8);
  });

  it('meets WCAG AA contrast (4.5:1) for badge text', () => {
    for (const level of LEVELS) {
      const { color, textColor } = RISK_STYLES[level];
      expect(contrastRatio(color, textColor), level).toBeGreaterThanOrEqual(4.5);
    }
  });
});
