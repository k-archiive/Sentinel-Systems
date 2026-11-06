import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import RiskRoute, { RISK_COLORS } from './components/RiskRoute.jsx';
import { scoreRoute } from './risk/scoreRoute.js';
import { SAMPLE_FLOOD_POINTS } from './data/sampleFloodPoints.js';
import SafetyGuidance from './components/SafetyGuidance.jsx';
import { guidanceFor } from './risk/safetyGuidance.js';
import DestinationSearch from './components/DestinationSearch.jsx';
import { searchAddress, suggestPlaces } from './geo/places.js';
import GooglePreview from './components/GooglePreview.jsx';
import { getEmbedKey } from './google/embed.js';

const GOOGLE_EMBED_KEY = getEmbedKey();

const RISK_LABELS = { clear: 'Clear', low: 'Low', moderate: 'Moderate', high: 'High' };

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
  const [destinationPin, setDestinationPin] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);
  const [risk, setRisk] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');
  const [didYouMean, setDidYouMean] = useState([]);
  const [googleView, setGoogleView] = useState(null);
  const searchInputRef = useRef(null);
  const floodPoints = SAMPLE_FLOOD_POINTS;

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

  // Runs one search or route request at a time and clears old messages.
  async function withSearching(task) {
    if (searching) return;
    setSearching(true);
    setNotice('');
    setDidYouMean([]);
    try {
      await task();
    } finally {
      setSearching(false);
    }
  }

  async function routeToPlace(place) {
    setDestinationPin([place.lat, place.lng]);
    if (userLocation) {
      await getRoute(userLocation, [place.lat, place.lng]);
    }
  }

  async function searchAndRoute(query) {
    let results;
    try {
      results = await searchAddress(query);
    } catch {
      setGuidance(guidanceFor({ status: 'unreachable' }));
      return;
    }

    if (results.length === 0) {
      const close = await suggestPlaces(query, { limit: 3 }).catch(() => []);
      setNotice(
        close.length
          ? `Couldn't find "${query}" in the Houston area. Did you mean:`
          : `Couldn't find "${query}" in the Houston area. Try adding a street, city or ZIP code.`
      );
      setDidYouMean(close);
      return;
    }

    await routeToPlace(results[0]);
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
      setGoogleView({ mode: 'route' });
      setGuidance(guidanceFor({ status: 'ok', risk: routeRisk }));
    } else {
      setRoutePoints(null);
      setRisk(null);
      setGoogleView(null);
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
      <DestinationSearch
        inputRef={searchInputRef}
        searching={searching}
        onSearchText={(query) => withSearching(() => searchAndRoute(query))}
        onPickPlace={(place) => withSearching(() => routeToPlace(place))}
      />

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
          {didYouMean.map((place) => (
            <button
              key={`${place.label}|${place.detail}`}
              type="button"
              onClick={() => withSearching(() => routeToPlace(place))}
              style={{ padding: '3px 10px', fontSize: '14px', borderRadius: '999px', border: '1px solid #fde68a', background: 'transparent', color: '#fde68a', cursor: 'pointer' }}
            >
              {place.label}
              {place.detail && <span style={{ opacity: 0.75 }}> · {place.detail}</span>}
            </button>
          ))}
        </div>
      )}

      {risk && (
        <div
          style={{
            padding: '8px 12px',
            background: '#111',
            color: '#eee',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px',
          }}
        >
          <span
            style={{
              background: RISK_COLORS[risk.level],
              color: '#fff',
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: '999px',
            }}
          >
            {RISK_LABELS[risk.level]} risk · {risk.score}/100
          </span>
          {risk.hits.length > 0 ? (
            <span>
              {risk.hits.length} flood point{risk.hits.length === 1 ? '' : 's'} within 150 m
              {risk.maxDepthFt != null && ` · deepest ${risk.maxDepthFt} ft`}
              {` · ${risk.exposedMeters} m of route affected`}
            </span>
          ) : (
            <span>No known flooding within 150 m of this route.</span>
          )}
          <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '13px' }}>
            Sample flood data (for testing)
          </span>
        </div>
      )}

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
          <Marker position={userLocation} />
          {destinationPin && <Marker position={destinationPin} />}
          {floodPoints.map((point) => (
            <CircleMarker
              key={`${point.lat},${point.lng}`}
              center={[point.lat, point.lng]}
              radius={6}
              pathOptions={{ color: '#0e7490', fillColor: '#22d3ee', fillOpacity: 0.8 }}
            >
              <Tooltip>Flood point · {point.depthFt} ft deep</Tooltip>
              <Popup>
                <strong>Flood point</strong>
                <div>Water was {point.depthFt} ft deep here.</div>
                <button
                  type="button"
                  style={{ marginTop: '6px', cursor: 'pointer' }}
                  onClick={() =>
                    setGoogleView({
                      mode: 'street',
                      point: [point.lat, point.lng],
                      title: `Flood point · ${point.depthFt} ft deep`,
                    })
                  }
                >
                  See it in Street View
                </button>
              </Popup>
            </CircleMarker>
          ))}
          {risk && routePoints && <RiskRoute segments={risk.segments} />}
          <FitToRoute points={routePoints} />
        </MapContainer>
        {googleView && (googleView.mode === 'street' || routePoints) && (
          <GooglePreview
            apiKey={GOOGLE_EMBED_KEY}
            view={googleView}
            route={routePoints}
            onChangeView={setGoogleView}
            onClose={() => setGoogleView(null)}
          />
        )}
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
