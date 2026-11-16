import { Fragment } from 'react';
import { Polyline } from 'react-leaflet';
import { RISK_STYLES } from '../risk/riskStyles.js';

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

// Draws a route stretch by stretch by flood risk. Each level has its own
// colour, line pattern and width (see riskStyles.js), on a white outline so
// it stands out from the red and pink highways on the map.
export default function RiskRoute({ segments }) {
  return groupByLevel(segments).map((run, i) => {
    const style = RISK_STYLES[run.level];
    return (
      <Fragment key={`${i}-${run.level}`}>
        <Polyline
          positions={run.positions}
          interactive={false}
          pathOptions={{ color: '#ffffff', weight: style.weight + 4, opacity: 0.9, lineCap: 'round' }}
        />
        <Polyline
          positions={run.positions}
          pathOptions={{
            color: style.color,
            weight: style.weight,
            opacity: 1,
            dashArray: style.dashArray,
            lineCap: 'round',
          }}
        />
      </Fragment>
    );
  });
}
