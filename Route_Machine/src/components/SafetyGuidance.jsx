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

        <h3 style={{ margin: '0 0 6px', fontSize: '15px' }}>Turn around, don't drown</h3>
        <ul style={{ margin: '0 0 14px', paddingLeft: '20px' }}>
          <li>Never drive into water covering the road. You can't tell how deep it is or if the road underneath is gone.</li>
          <li>Just 12 inches of moving water can carry away most cars, and 2 feet can carry away SUVs and trucks.</li>
          <li>If you can, wait until the water goes down, or stay where you are.</li>
          <li>If your car stalls in rising water, get out and move to higher ground if it's safe to.</li>
          <li><strong>Call 911</strong> if you're trapped or in danger. Call 311 to report flooded streets.</li>
        </ul>

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
