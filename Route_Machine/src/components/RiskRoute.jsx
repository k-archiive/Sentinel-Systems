import { Polyline } from 'react-leaflet';

export const RISK_COLORS = {
  clear: '#2563eb',
  low: '#eab308',
  moderate: '#f97316',
  high: '#dc2626',
};

// Joins neighbouring segments of the same risk level into one line, so the
// map draws a few polylines instead of one per route point.
function groupByLevel(segments) {
  const runs = [];
  for (const seg of segments) {
    const last = runs[runs.length - 1];
    if (last && last.level === seg.level) {
      last.positions.push(seg.to);
    } else {
      runs.push({ level: seg.level, positions: [seg.from, seg.to] });
    }
  }
  return runs;
}

// Draws a route coloured stretch by stretch by flood risk.
export default function RiskRoute({ segments }) {
  return groupByLevel(segments).map((run, i) => (
    <Polyline
      key={`${i}-${run.level}`}
      positions={run.positions}
      pathOptions={{ color: RISK_COLORS[run.level], weight: run.level === 'clear' ? 5 : 7 }}
    />
  ));
}
