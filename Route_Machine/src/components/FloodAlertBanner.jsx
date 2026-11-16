import { useState } from 'react';
import { ALERT_LEVELS, alertLevel, alertsToShow, formatUntil } from '../alerts/alerts.js';

function AlertIcon({ level }) {
  // Warning: filled triangle. Watch: outlined triangle. Advisory: info circle.
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false', style: { flex: 'none' } };
  if (level === 'advisory') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5v.5" />
      </svg>
    );
  }
  return (
    <svg {...common} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 3 22 20H2z" fill={level === 'warning' ? 'currentColor' : 'none'} />
      <path d="M12 10v4M12 17v.5" stroke={level === 'warning' ? ALERT_LEVELS.warning.background : 'currentColor'} />
    </svg>
  );
}

function AlertRow({ alert }) {
  const level = alertLevel(alert.event);
  const style = ALERT_LEVELS[level];
  const until = formatUntil(alert.ends);
  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        padding: '8px 12px',
        background: style.background,
        color: style.color,
        borderLeft: `6px solid ${style.border}`,
        textAlign: 'left',
      }}
    >
      <AlertIcon level={level} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '15px' }}>
          {alert.event}
          {until && <span style={{ fontWeight: 400 }}> · {until}</span>}
          {alert.sample && <span style={{ fontWeight: 400, fontSize: '12px', opacity: 0.8 }}> · sample alert (for testing)</span>}
        </div>
        <div style={{ fontSize: '14px' }}>{alert.headline}</div>
      </div>
      {alert.url && (
        <a href={alert.url} target="_blank" rel="noreferrer" style={{ color: style.color, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Details ↗
        </a>
      )}
    </div>
  );
}

// Active flood-related weather alerts, most urgent first. Shows the top
// alert; the rest open with "+N more". Hidden when there are none.
export default function FloodAlertBanner({ alerts }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const shown = alertsToShow(alerts);
  if (shown.length === 0 || dismissed) return null;

  const [top, ...rest] = shown;
  const urgent = alertLevel(top.event) === 'warning';

  return (
    <section aria-label="Weather alerts" role={urgent ? 'alert' : 'status'} style={{ position: 'relative' }}>
      <AlertRow alert={top} />
      {expanded && rest.map((a) => <AlertRow key={a.id} alert={a} />)}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '4px 12px', background: '#1a1a1a', fontSize: '13px' }}>
        {rest.length > 0 && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            style={{ background: 'none', border: 0, color: '#cbd5e1', cursor: 'pointer', padding: 0, fontSize: '13px' }}
          >
            {expanded ? 'Show less' : `+${rest.length} more alert${rest.length === 1 ? '' : 's'}`}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 0, color: '#cbd5e1', cursor: 'pointer', padding: 0, fontSize: '13px' }}
        >
          Hide alerts
        </button>
      </div>
    </section>
  );
}
