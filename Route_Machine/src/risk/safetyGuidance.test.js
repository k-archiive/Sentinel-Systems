import { describe, expect, it } from 'vitest';
import { guidanceFor, HIGH_RISK_SCORE } from './safetyGuidance.js';

describe('guidanceFor', () => {
  it('shows nothing for a route below high risk', () => {
    expect(guidanceFor({ status: 'ok', risk: { score: 0 } })).toBeNull();
    expect(guidanceFor({ status: 'ok', risk: { score: HIGH_RISK_SCORE - 1 } })).toBeNull();
  });

  it('warns when the route is high risk', () => {
    expect(guidanceFor({ status: 'ok', risk: { score: HIGH_RISK_SCORE } })).toEqual({ reason: 'high-risk' });
    expect(guidanceFor({ status: 'ok', risk: { score: 100 } })).toEqual({ reason: 'high-risk' });
  });

  it('shows guidance when no route was found', () => {
    expect(guidanceFor({ status: 'no-route' })).toEqual({ reason: 'no-route' });
  });

  it('shows guidance when the routing service could not be reached', () => {
    expect(guidanceFor({ status: 'unreachable' })).toEqual({ reason: 'unreachable' });
  });
});
