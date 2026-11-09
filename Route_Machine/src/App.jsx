import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import RiskRoute, { RISK_COLORS } from './components/RiskRoute.jsx';
import { scoreRoute } from './risk/scoreRoute.js';
import { SAMPLE_FLOOD_POINTS } from './data/sampleFloodPoints.js';


const RISK_LABELS = { clear: 'Clear', low: 'Low', moderate: 'Moderate', high: 'High' };

function App() {
  const houstonCenter = [29.7604, -95.3698];

  const [userLocation, setUserLocation] = useState(null);
  const [destinationText, setDestinationText] = useState('');
  const [destinationPin, setDestinationPin] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);
  const [risk, setRisk] = useState(null);
  const [directions, setDirections] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const floodPoints = SAMPLE_FLOOD_POINTS;

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(houstonCenter);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      () => {
        setUserLocation(houstonCenter);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function handleSearch() {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      destinationText
    )}, Houston, TX`;
    const response = await fetch(url);
    const results = await response.json();

    if (results.length === 0) {
      alert('Could not find that location. Try being more specific.');
      return;
    }

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);
    setDestinationPin([lat, lon]);

    if (userLocation) {
      await getRoute(userLocation, [lat, lon]);
    }
  }

  async function getRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map((point) => [
        point[1],
        point[0],
      ]);

      const steps = data.routes[0].legs[0].steps;
      setDirections(steps);

      console.log("ROUTE STEPS:", steps);

      setCurrentStep(0);

      setRoutePoints(coords);
      setRisk(scoreRoute(coords, floodPoints));
    } else {
      alert('Could not find a route between those two points.');
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
      <div
        style={{
          padding: '10px',
          background: '#222',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Type a destination in Houston..."
          value={destinationText}
          onChange={(e) => setDestinationText(e.target.value)}
          style={{ flex: 1, padding: '8px', fontSize: '16px' }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: '8px 16px', fontSize: '16px' }}
        >
          Search
        </button>
      </div>

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

      {directions.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px",
            background: "transparent",
          }}
        >
          <div
            style={{
              background: "#0078d4",
              color: "white",
              padding: "15px 30px",
              borderRadius: "9999px",
              fontWeight: "bold",
              fontSize: "18px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              textAlign: "center",
              maxWidth: "90%",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Step {currentStep + 1} of {directions.length}
            </div>

            <div style={{ marginTop: "4px" }}>
              {directions[currentStep]?.maneuver.type}
              {directions[currentStep]?.name &&
                ` onto ${directions[currentStep].name}`}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }}>
        <MapContainer
          center={userLocation}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <Marker position={userLocation}>
            <Tooltip permanent>
              You
            </Tooltip>
          </Marker>

          {destinationPin && (
            <Marker position={destinationPin} />
          )}

          {floodPoints.map((point) => (
            <CircleMarker
              key={`${point.lat},${point.lng}`}
              center={[point.lat, point.lng]}
              radius={6}
              pathOptions={{
                color: '#0e7490',
                fillColor: '#22d3ee',
                fillOpacity: 0.8,
              }}
            >
              <Tooltip>
                Flood point · {point.depthFt} ft deep
              </Tooltip>
            </CircleMarker>
          ))}

          {risk && routePoints && (
            <RiskRoute segments={risk.segments} />
          )}

        </MapContainer>
      </div>
    </div>
  );
}/*  */

      export default App;
