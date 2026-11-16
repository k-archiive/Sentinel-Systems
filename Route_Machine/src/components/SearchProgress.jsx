import { doneMessage, phaseLabel, phaseStep, SPEED_GOAL_MS } from '../search/progress.js';

const SPIN_CSS = `
@keyframes sentinel-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .sentinel-spinner { animation: none !important; } }
`;

// One status line under the search box: the current step while searching,
// then how long the search took.
// progress is {phase, query} while searching, or {doneMs} afterwards.
export default function SearchProgress({ progress }) {
  if (!progress) return null;
  const searching = progress.phase != null;
  const slow = !searching && progress.doneMs > SPEED_GOAL_MS;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: '6px 12px',
        background: '#1a1a1a',
        color: slow ? '#fdba74' : '#cbd5e1',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'left',
      }}
    >
      <style>{SPIN_CSS}</style>
      {searching ? (
        <>
          <span
            className="sentinel-spinner"
            aria-hidden="true"
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid #475569',
              borderTopColor: '#e2e8f0',
              borderRadius: '50%',
              animation: 'sentinel-spin 0.8s linear infinite',
              flex: 'none',
            }}
          />
          <span>{phaseLabel(progress.phase, progress.query)}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: '12px' }}>
            Step {phaseStep(progress.phase).step} of {phaseStep(progress.phase).total}
          </span>
        </>
      ) : (
        <span>
          <span aria-hidden="true">{slow ? '⚠ ' : '✓ '}</span>
          {doneMessage(progress.doneMs)}
        </span>
      )}
    </div>
  );
}
