// What the app tells the user while a search runs, and how long it took.
// Matches the README's non-functional requirement: a route in under 5 seconds.

export const SPEED_GOAL_MS = 5000;

// The real steps of a search. Picking a suggestion skips the address step
// because the place is already known.
export const PHASES = ['address', 'route'];

export function phaseLabel(phase, query) {
  if (phase === 'address') return query ? `Finding "${query}"…` : 'Finding the address…';
  return 'Planning the route and checking flood risk…';
}

export function phaseStep(phase) {
  return { step: PHASES.indexOf(phase) + 1, total: PHASES.length };
}

// 0.94 -> "0.9 s", 12.3 -> "12 s"
export function formatElapsed(ms) {
  const seconds = ms / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)} s` : `${Math.round(seconds)} s`;
}

export function doneMessage(ms) {
  const base = `Route and flood risk ready in ${formatElapsed(ms)}`;
  return ms > SPEED_GOAL_MS ? `${base} (slower than our 5-second goal)` : base;
}
