import { RISK_STYLES } from '../risk/riskStyles.js';
import RiskIcon from './RiskIcon.jsx';

// What each level means for the driver, in plain words.
export const RISK_ADVICE = {
  clear: 'No known flooding near this route.',
  low: 'Some flooding has been recorded nearby. Stay alert in heavy rain.',
  moderate: 'Flooding has been recorded along this route. Check road conditions before you go.',
  high: 'Deep flooding has been recorded on this route. Avoid it in heavy rain.',
};

function Fact({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '80px' }}>
      <strong style={{ fontSize: '17px', fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      <span style={{ fontSize: '12px', opacity: 0.7 }}>{label}</span>
    </div>
  );
}

// The route's flood risk: level, score bar, advice and key numbers.
// Self-contained so it can move into a side panel without changes.
export default function RiskSummary({ risk, sampleData = true }) {
  const style = RISK_STYLES[risk.level];
  const { color } = style;
  return (
    <section
      aria-label="Route flood risk"
      style={{
        padding: '10px 12px',
        background: '#111',
        color: '#eee',
        borderLeft: `6px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            background: color,
            color: style.textColor,
            fontWeight: 700,
            padding: '3px 12px 3px 8px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RiskIcon level={risk.level} color={style.textColor} />
          {style.label}
        </span>
        <span style={{ fontSize: '15px', fontVariantNumeric: 'tabular-nums' }}>{risk.score}/100</span>
        <div
          role="meter"
          aria-label="Flood risk score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={risk.score}
          style={{ flex: '1 1 120px', height: '10px', background: '#4b5563', borderRadius: '5px', overflow: 'hidden' }}
        >
          {/* Light edge keeps the darker levels visible on the dark track. */}
          <div
            style={{
              width: `${risk.score}%`,
              height: '100%',
              background: color,
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.7)',
              borderRadius: '5px',
            }}
          />
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '15px' }}>{RISK_ADVICE[risk.level]}</p>

      {risk.hits.length > 0 && (
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          <Fact value={risk.hits.length} label={`flood point${risk.hits.length === 1 ? '' : 's'} within 150 m`} />
          {risk.maxDepthFt != null && <Fact value={`${risk.maxDepthFt} ft`} label="deepest water" />}
          <Fact value={`${risk.exposedMeters} m`} label="of route affected" />
        </div>
      )}

      {sampleData && <span style={{ fontSize: '12px', opacity: 0.6 }}>Sample flood data (for testing)</span>}
    </section>
  );
}
