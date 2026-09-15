import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const houstonCenter = [29.7604, -95.3698];

  const [userLocation, setUserLocation] = useState(null);
  const [destinationText, setDestinationText] = useState('');
  const [destinationPin, setDestinationPin] = useState(null);
  const [routePoints, setRoutePoints] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          alert(
            'Could not get your location, using default Houston center instead.'
          );
          setUserLocation(houstonCenter);
        }
      );
    } else {
      setUserLocation(houstonCenter);
    }
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
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map((point) => [
        point[1],
        point[0],
      ]);
      setRoutePoints(coords);
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
          <Marker position={userLocation} />
          {destinationPin && <Marker position={destinationPin} />}
          {routePoints && (
            <Polyline positions={routePoints} color="blue" weight={5} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
