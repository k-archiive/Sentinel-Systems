import { RISK_STYLES } from '../risk/riskStyles.js';

// One shape per risk level, so the level reads without relying on colour:
// circle (clear), triangle (low), diamond (moderate), octagon/stop sign (high).
const SHAPES = {
  circle: <circle cx="8" cy="8" r="6.5" />,
  triangle: <polygon points="8,1.5 15,14.5 1,14.5" />,
  diamond: <polygon points="8,0.8 15.2,8 8,15.2 0.8,8" />,
  octagon: <polygon points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5" />,
};

export default function RiskIcon({ level, size = 16, color }) {
  const style = RISK_STYLES[level];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none', display: 'block' }}
    >
      <g fill={color ?? style.color}>{SHAPES[style.icon]}</g>
    </svg>
  );
}
