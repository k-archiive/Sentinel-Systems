import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import RiskRoute from './components/RiskRoute.jsx';
import RiskSummary from './components/RiskSummary.jsx';
import { scoreRoute } from './risk/scoreRoute.js';
import { SAMPLE_FLOOD_POINTS } from './data/sampleFloodPoints.js';
import SafetyGuidance from './components/SafetyGuidance.jsx';
import { guidanceFor } from './risk/safetyGuidance.js';
import RouteForm from './components/RouteForm.jsx';
import MapLongPress from './components/MapLongPress.jsx';
import SearchProgress from './components/SearchProgress.jsx';
import FloodAlertBanner from './components/FloodAlertBanner.jsx';
import { sampleAlerts, sampleAlertsRequested } from './alerts/sampleAlerts.js';
import { reverseGeocode, searchAddress, suggestPlaces } from './geo/places.js';
import {
  canRoute,
  CURRENT_LOCATION,
  EMPTY,
  isEmpty,
  pinDetail,
  pinEndpoint,
  placeEndpoint,
  resolveEndpoint,
} from './route/endpoints.js';


// Zooms the map to show the whole route whenever a new one is drawn.
function FitToRoute({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function App() {
  const houstonCenter = [29.7604, -95.3698];

  const [userLocation, setUserLocation] = useState(null);
  const [from, setFrom] = useState(CURRENT_LOCATION);
  const [to, setTo] = useState(EMPTY);
  const [startPin, setStartPin] = useState(null);
  const [destinationPin, setDestinationPin] = useState(null);
  // A long-pressed point waiting for "Start here" / "Go here".
  const [pinMenu, setPinMenu] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);
  const [risk, setRisk] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');
  // {field: 'from' | 'to', places} when a typed place wasn't found.
  const [didYouMean, setDidYouMean] = useState(null);
  // {phase, query} while searching, {doneMs} once a route is ready.
  const [progress, setProgress] = useState(null);
  const searchStartRef = useRef(0);
  const searchInputRef = useRef(null);
  const floodPoints = SAMPLE_FLOOD_POINTS;
  // Live NWS alerts plug in here (#32). Until then, sample alerts show only with ?sampleAlerts=1.
  const [weatherAlerts] = useState(() => (sampleAlertsRequested() ? sampleAlerts() : []));

  const closeGuidance = useCallback(() => {
    setGuidance(null);
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        () => {
          setNotice("Couldn't get your location, so routes start from downtown Houston.");
          setUserLocation(houstonCenter);
        }
      );
    } else {
      setUserLocation(houstonCenter);
    }
  }, []);

  // Runs one search or route request at a time, clears old messages and
  // times it. firstStep is where the progress line starts.
  async function withSearching(task, firstStep) {
    if (searching) return;
    setSearching(true);
    setNotice('');
    setDidYouMean(null);
    setProgress(firstStep);
    searchStartRef.current = performance.now();
    try {
      await task();
    } finally {
      setSearching(false);
      // Keep the "ready in …" message; clear the line if the search stopped early.
      setProgress((p) => (p && p.doneMs != null ? p : null));
    }
  }

  async function showNotFound(field, query) {
    const close = await suggestPlaces(query, { limit: 3 }).catch(() => []);
    const what = field === 'from' ? `the starting point "${query}"` : `"${query}"`;
    setNotice(
      close.length
        ? `Couldn't find ${what} in the Houston area. Did you mean:`
        : `Couldn't find ${what} in the Houston area. Try adding a street, city or ZIP code.`
    );
    setDidYouMean({ field, places: close });
  }

  // Looks up From and To (searching any typed text), then draws the route.
  function planRoute(fromEp, toEp) {
    const typed = [fromEp, toEp].find((e) => e.kind === 'text' && e.text.trim());
    const firstStep = typed ? { phase: 'address', query: typed.text.trim() } : { phase: 'route' };
    return withSearching(async () => {
      let start;
      let end;
      try {
        start = await resolveEndpoint(fromEp, { userLocation, search: searchAddress, emptyMeansCurrent: true });
        if (start.ok) end = await resolveEndpoint(toEp, { userLocation, search: searchAddress });
      } catch {
        setGuidance(guidanceFor({ status: 'unreachable' }));
        return;
      }
      if (!start.ok) {
        await showNotFound('from', start.query);
        return;
      }
      if (!end.ok) {
        if (end.reason === 'not-found') await showNotFound('to', end.query);
        else setNotice('Choose a destination: type a place, or long-press the map to drop a pin.');
        return;
      }
      // Show the names that were found, like map apps do.
      if (start.place) setFrom(placeEndpoint(start.place));
      if (end.place) setTo(placeEndpoint(end.place));
      const fromIsYou = fromEp.kind === 'current' || isEmpty(fromEp);
      setProgress({ phase: 'route' });
      setStartPin(fromIsYou ? null : [start.point.lat, start.point.lng]);
      setDestinationPin([end.point.lat, end.point.lng]);
      await getRoute([start.point.lat, start.point.lng], [end.point.lat, end.point.lng]);
    }, firstStep);
  }

  function pickFrom(endpoint) {
    setFrom(endpoint);
    if (canRoute(endpoint, to)) planRoute(endpoint, to);
  }

  function pickTo(endpoint) {
    setTo(endpoint);
    if (canRoute(from, endpoint)) planRoute(from, endpoint);
  }

  function swapEnds() {
    setFrom(to);
    setTo(from);
    if (canRoute(to, from)) planRoute(to, from);
  }

  function pickSuggestion(field, place) {
    const endpoint = placeEndpoint(place);
    if (field === 'from') pickFrom(endpoint);
    else pickTo(endpoint);
  }

  const openPinMenu = useCallback(({ lat, lng }) => {
    setPinMenu({ lat, lng, address: null, loading: true });
    const settle = (address) =>
      setPinMenu((m) => (m && m.lat === lat && m.lng === lng ? { ...m, address, loading: false } : m));
    reverseGeocode(lat, lng).then(settle, () => settle(null));
  }, []);

  function choosePin(field) {
    const endpoint = pinEndpoint(pinMenu.lat, pinMenu.lng, pinMenu.address);
    setPinMenu(null);
    if (field === 'from') pickFrom(endpoint);
    else pickTo(endpoint);
  }

  async function getRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch {
      setGuidance(guidanceFor({ status: 'unreachable' }));
      return;
    }

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map((point) => [
        point[1],
        point[0],
      ]);
      setRoutePoints(coords);
      const routeRisk = scoreRoute(coords, floodPoints);
      setRisk(routeRisk);
      setProgress({ doneMs: performance.now() - searchStartRef.current });
      setGuidance(guidanceFor({ status: 'ok', risk: routeRisk }));
    } else {
      setRoutePoints(null);
      setRisk(null);
      setGuidance(guidanceFor({ status: 'no-route' }));
    }
  }

  if (!userLocation) {
    return (
      <div style={{ padding: '20px', fontSize: '18px' }}>
        Getting your location...
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <RouteForm
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onPickFrom={pickFrom}
        onPickTo={pickTo}
        onSwap={swapEnds}
        onSubmit={() => planRoute(from, to)}
        searching={searching}
        toInputRef={searchInputRef}
      />
      <SearchProgress progress={progress} />
      <FloodAlertBanner alerts={weatherAlerts} />

      {notice && (
        <div
          role="status"
          style={{
            padding: '8px 12px',
            background: '#3a2e05',
            color: '#fde68a',
            fontSize: '15px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
          }}
        >
          <span>{notice}</span>
          {didYouMean?.places.map((place) => (
            <button
              key={`${place.label}|${place.detail}`}
              type="button"
              onClick={() => pickSuggestion(didYouMean.field, place)}
              style={{ padding: '3px 10px', fontSize: '14px', borderRadius: '999px', border: '1px solid #fde68a', background: 'transparent', color: '#fde68a', cursor: 'pointer' }}
            >
              {place.label}
              {place.detail && <span style={{ opacity: 0.75 }}> · {place.detail}</span>}
            </button>
          ))}
        </div>
      )}

      {risk && <RiskSummary risk={risk} />}

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={userLocation}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <CircleMarker
            center={userLocation}
            radius={8}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
          >
            <Tooltip>Your location</Tooltip>
          </CircleMarker>
          {startPin && (
            <Marker position={startPin}>
              <Tooltip permanent direction="top" offset={[-15, -15]}>Start</Tooltip>
            </Marker>
          )}
          {destinationPin && (
            <Marker position={destinationPin}>
              <Tooltip permanent direction="top" offset={[-15, -15]}>Destination</Tooltip>
            </Marker>
          )}
          {floodPoints.map((point) => (
            <CircleMarker
              key={`${point.lat},${point.lng}`}
              center={[point.lat, point.lng]}
              radius={6}
              pathOptions={{ color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.8 }}
            >
              <Tooltip>Flood point · {point.depthFt} ft deep</Tooltip>
            </CircleMarker>
          ))}
          {risk && routePoints && <RiskRoute segments={risk.segments} />}
          <FitToRoute points={routePoints} />
          <MapLongPress onPick={openPinMenu} />
          {pinMenu && (
            <Popup position={[pinMenu.lat, pinMenu.lng]} eventHandlers={{ remove: () => setPinMenu(null) }}>
              <div style={{ minWidth: '190px' }}>
                <strong>{pinMenu.address?.label || 'Dropped pin'}</strong>
                <div style={{ fontSize: '12px', color: '#555', margin: '2px 0 8px' }}>
                  {pinMenu.loading ? 'Finding address…' : pinMenu.address?.detail || pinDetail(pinMenu.lat, pinMenu.lng)}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => choosePin('from')} style={{ flex: 1, padding: '6px 8px', cursor: 'pointer' }}>
                    Start here
                  </button>
                  <button
                    type="button"
                    onClick={() => choosePin('to')}
                    style={{ flex: 1, padding: '6px 8px', cursor: 'pointer', background: '#111', color: '#fff', border: 0, borderRadius: '4px' }}
                  >
                    Go here
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </MapContainer>
        {guidance && (
          <SafetyGuidance
            reason={guidance.reason}
            risk={risk}
            onShowRoute={() => setGuidance(null)}
            onClose={closeGuidance}
          />
        )}
      </div>
    </div>
  );
}

export default App;
