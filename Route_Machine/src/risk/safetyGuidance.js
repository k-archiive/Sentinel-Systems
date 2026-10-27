// Decides when the app should stop and show safety guidance instead of
// just drawing the route (flowchart: "Route found? No -> Display safety guidance").

// Scores at or above this are "high" risk (see levelForScore in scoreRoute.js).
export const HIGH_RISK_SCORE = 60;

/**
 * @param {{status: 'ok'|'no-route'|'unreachable', risk?: {score: number}}} result
 * @returns {null | {reason: 'high-risk'|'no-route'|'unreachable'}}
 */
export function guidanceFor({ status, risk }) {
  if (status === 'unreachable') return { reason: 'unreachable' };
  if (status === 'no-route') return { reason: 'no-route' };
  if (risk && risk.score >= HIGH_RISK_SCORE) return { reason: 'high-risk' };
  return null;
}
