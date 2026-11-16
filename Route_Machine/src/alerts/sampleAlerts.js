// MADE-UP TEST ALERTS, NOT REAL WEATHER ALERTS.
// Shown only when the app is opened with ?sampleAlerts=1, so the banner can
// be designed and demoed on a dry day. Live alerts from the National Weather
// Service replace these in #32 (same shape: see alerts.js).

const hoursFromNow = (now, h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

export function sampleAlerts(now = new Date()) {
  return [
    {
      id: 'sample-flash-flood-warning',
      event: 'Flash Flood Warning',
      severity: 'Severe',
      headline: 'Flash Flood Warning for central Harris County. Avoid underpasses and low-water crossings.',
      ends: hoursFromNow(now, 3),
      url: 'https://www.weather.gov/hgx',
      sample: true,
    },
    {
      id: 'sample-flood-watch',
      event: 'Flood Watch',
      severity: 'Moderate',
      headline: 'Flood Watch for the Houston area. 3 to 5 inches of rain possible.',
      ends: hoursFromNow(now, 30),
      url: 'https://www.weather.gov/hgx',
      sample: true,
    },
  ];
}

// True when the page was opened with ?sampleAlerts=1.
export function sampleAlertsRequested(search = window.location.search) {
  return new URLSearchParams(search).get('sampleAlerts') === '1';
}
