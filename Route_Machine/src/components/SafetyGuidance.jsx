import { useEffect, useRef } from 'react';

const HEADINGS = {
  'high-risk': 'This route passes through dangerous flooding',
  'no-route': "We couldn't find a route to that destination",
  unreachable: "We couldn't reach the routing service",
};

const RESOURCES = [
  { name: 'Houston TranStar', note: 'road conditions and high-water locations', url: 'https://traffic.houstontranstar.org' },
  { name: 'Harris County Flood Warning System', note: 'live rainfall and bayou levels', url: 'https://www.harriscountyfws.org' },
  { name: 'National Weather Service Houston', note: 'flood watches and warnings', url: 'https://www.weather.gov/hgx' },
];

// Simple line icons (24x24, drawn with the current text colour).
const ICON_PATHS = {
  water: 'M2 15c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M12 3v7m-3-3 3 3 3-3',
  depth: 'M4 3v18M4 7h3M4 11h5M4 15h3M4 19h5M14 6c2 3 4 5 4 8a4 4 0 0 1-8 0c0-3 2-5 4-8z',
  wait: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  higher: 'M3 20h18M7 20l5-9 5 9M12 3v6m-3-3 3-3 3 3',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
};

function Icon({ name, size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const TIPS = [
  { icon: 'water', title: 'Never drive into water on the road', text: "You can't tell how deep it is, or whether the road underneath is gone." },
  { icon: 'depth', title: '12 inches can carry your car away', text: 'Moving water that deep can sweep away most cars; 2 feet can carry away SUVs and trucks.' },
  { icon: 'wait', title: 'Wait it out if you can', text: 'Let the water go down, or stay where you are until roads are clear.' },
  { icon: 'higher', title: 'Stalled in rising water? Get out', text: 'Leave the car and move to higher ground if it is safe to do so.' },
];

function CallButton({ number, label, note, primary }) {
  return (
    <a
      href={`tel:${number}`}
      style={{
        flex: '1 1 180px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '10px',
        textDecoration: 'none',
        background: primary ? '#b91c1c' : '#fff',
        color: primary ? '#fff' : '#7f1d1d',
        border: '2px solid #b91c1c',
      }}
    >
      <Icon name="phone" size={26} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <strong style={{ fontSize: '18px' }}>{label}</strong>
        <span style={{ fontSize: '13px' }}>{note}</span>
      </span>
    </a>
  );
}

function summary(reason, risk) {
  if (reason === 'high-risk') {
    const depth = risk.maxDepthFt != null ? ` Water near your route was up to ${risk.maxDepthFt} ft deep.` : '';
    return `Flood risk ${risk.score}/100 with ${risk.hits.length} flood point${risk.hits.length === 1 ? '' : 's'} along the way.${depth}`;
  }
  if (reason === 'no-route') {
    return 'Roads to this destination may be closed, or it may not be reachable by car.';
  }
  return "Check your connection and try again. Don't set out until you can check road conditions.";
}

// Shown instead of (or over) the route when driving it isn't safe or no
// route could be found. Escape or the buttons close it.
export default function SafetyGuidance({ reason, risk, onShowRoute, onClose }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const danger = reason === 'high-risk';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="alertdialog"
        aria-labelledby="safety-heading"
        aria-describedby="safety-summary"
        style={{
          background: '#fff',
          color: '#111',
          borderRadius: '12px',
          borderTop: `6px solid ${danger ? '#dc2626' : '#f97316'}`,
          maxWidth: '520px',
          width: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          padding: '20px 22px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          fontSize: '15px',
          lineHeight: 1.45,
          textAlign: 'left',
        }}
      >
        <h2
          id="safety-heading"
          ref={headingRef}
          tabIndex={-1}
          style={{ margin: '0 0 6px', fontSize: '20px', color: danger ? '#b91c1c' : '#9a3412', outline: 'none' }}
        >
          {HEADINGS[reason]}
        </h2>
        <p id="safety-summary" style={{ margin: '0 0 14px' }}>
          {summary(reason, risk)}
        </p>

        <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>Turn around, don't drown</h3>
        <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'grid', gap: '10px' }}>
          {TIPS.map((tip) => (
            <li key={tip.icon} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span
                style={{
                  color: '#1e3a5f',
                  background: '#e0ecf7',
                  borderRadius: '10px',
                  padding: '6px',
                  display: 'flex',
                }}
              >
                <Icon name={tip.icon} />
              </span>
              <span>
                <strong style={{ display: 'block' }}>{tip.title}</strong>
                <span style={{ color: '#374151' }}>{tip.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '0 0 16px' }}>
          <CallButton number="911" label="Call 911" note="Trapped or in danger" primary />
          <CallButton number="311" label="Call 311" note="Report a flooded street" />
        </div>

        <h3 style={{ margin: '0 0 6px', fontSize: '15px' }}>Check conditions before you go</h3>
        <ul style={{ margin: '0 0 18px', paddingLeft: '20px' }}>
          {RESOURCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">{r.name}</a>: {r.note}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
          {danger && (
            <button type="button" onClick={onShowRoute} style={{ padding: '8px 14px', fontSize: '15px' }}>
              Show route anyway
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 14px', fontSize: '15px', background: '#111', color: '#fff', border: 0, borderRadius: '6px' }}
          >
            {danger ? 'Choose another destination' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
