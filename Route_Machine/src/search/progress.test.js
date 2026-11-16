import { describe, expect, it } from 'vitest';
import { doneMessage, formatElapsed, phaseLabel, phaseStep, SPEED_GOAL_MS } from './progress.js';

describe('phaseLabel', () => {
  it('names the place being looked up', () => {
    expect(phaseLabel('address', 'NRG Stadium')).toBe('Finding "NRG Stadium"…');
  });
  it('describes the routing step', () => {
    expect(phaseLabel('route')).toBe('Planning the route and checking flood risk…');
  });
});

describe('phaseStep', () => {
  it('numbers the steps', () => {
    expect(phaseStep('address')).toEqual({ step: 1, total: 2 });
    expect(phaseStep('route')).toEqual({ step: 2, total: 2 });
  });
});

describe('formatElapsed', () => {
  it('shows one decimal under 10 seconds', () => {
    expect(formatElapsed(940)).toBe('0.9 s');
    expect(formatElapsed(4999)).toBe('5.0 s');
  });
  it('rounds to whole seconds from 10 seconds', () => {
    expect(formatElapsed(12300)).toBe('12 s');
  });
});

describe('doneMessage', () => {
  it('reports the time when within the 5-second goal', () => {
    expect(doneMessage(1200)).toBe('Route and flood risk ready in 1.2 s');
    expect(doneMessage(SPEED_GOAL_MS)).not.toContain('slower');
  });
  it('flags searches slower than the goal', () => {
    expect(doneMessage(6200)).toBe('Route and flood risk ready in 6.2 s (slower than our 5-second goal)');
  });
});
