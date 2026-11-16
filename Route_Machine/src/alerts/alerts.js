// Display rules for weather alerts (README feature 5: weather forecast and
// emergency alerts). This file only decides how alerts are shown. Fetching
// live alerts from the National Weather Service is #32.
//
// Each alert the banner shows looks like this (NWS alert properties):
//   { id, event, severity, headline, ends, url }
//   event:    "Flash Flood Warning", "Flood Watch", "Flood Advisory", ...
//   severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown"
//   ends:     ISO time the alert ends, or null
//   url:      link to the full alert on weather.gov

export const ALERT_LEVELS = {
  warning: { label: 'Warning', background: '#7f1d1d', color: '#ffffff', border: '#fca5a5', rank: 3 },
  watch: { label: 'Watch', background: '#fde68a', color: '#111111', border: '#b45309', rank: 2 },
  advisory: { label: 'Advisory', background: '#dbeafe', color: '#111111', border: '#1d4ed8', rank: 1 },
};

const SEVERITY_RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };

// "Flash Flood Warning" -> warning, "Flood Watch" -> watch, anything else -> advisory.
export function alertLevel(event = '') {
  const e = event.toLowerCase();
  if (e.includes('warning') || e.includes('emergency')) return 'warning';
  if (e.includes('watch')) return 'watch';
  return 'advisory';
}

// Only the alerts that matter for driving through flooding.
export function isFloodRelated(alert) {
  return /flood|hurricane|tropical storm|storm surge/i.test(alert.event || '');
}

// Most urgent first: warnings before watches before advisories, then by severity.
export function sortAlerts(alerts) {
  return [...alerts].sort((a, b) => {
    const level = ALERT_LEVELS[alertLevel(b.event)].rank - ALERT_LEVELS[alertLevel(a.event)].rank;
    return level || (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
  });
}

// "until 9:00 PM" today, "until Tue 9:00 PM" on another day, or "" if unknown.
export function formatUntil(endsIso, now = new Date()) {
  if (!endsIso) return '';
  const ends = new Date(endsIso);
  if (Number.isNaN(ends.getTime())) return '';
  const time = ends.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });
  const day = (d) => d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Chicago' });
  const sameDay = ends.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }) ===
    now.toLocaleDateString('en-US', { timeZone: 'America/Chicago' });
  return sameDay ? `until ${time}` : `until ${day(ends)} ${time}`;
}

// Alerts still in effect, flood-related, most urgent first.
export function alertsToShow(alerts, now = new Date()) {
  return sortAlerts(
    alerts.filter((a) => isFloodRelated(a) && (!a.ends || new Date(a.ends) > now)),
  );
}
