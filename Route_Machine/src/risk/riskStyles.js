// How each risk level looks, everywhere in the app (route line, risk card,
// and the map legend). Every level differs in at least three ways besides
// hue, so it reads with colour blindness or in greyscale:
//   - line pattern and width on the map
//   - icon shape on the badge
//   - lightness: low -> moderate -> high gets steadily darker
// Badge text colours meet WCAG AA contrast (4.5:1) on their backgrounds.

export const RISK_STYLES = {
  clear: {
    label: 'Clear',
    color: '#2563eb',
    textColor: '#ffffff',
    icon: 'circle',
    weight: 5,
    dashArray: null,
    pattern: 'thin solid line',
  },
  low: {
    label: 'Low risk',
    color: '#facc15',
    textColor: '#111111',
    icon: 'triangle',
    weight: 6,
    dashArray: '14 9',
    pattern: 'dashed line',
  },
  moderate: {
    label: 'Moderate risk',
    color: '#ea580c',
    textColor: '#111111',
    icon: 'diamond',
    weight: 7,
    dashArray: '1 11',
    pattern: 'dotted line',
  },
  high: {
    label: 'High risk',
    color: '#991b1b',
    textColor: '#ffffff',
    icon: 'octagon',
    weight: 9,
    dashArray: null,
    pattern: 'thick solid line',
  },
};

// WCAG relative luminance of a #rrggbb colour, 0 (black) to 1 (white).
export function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio between two colours, from 1 to 21.
export function contrastRatio(a, b) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
