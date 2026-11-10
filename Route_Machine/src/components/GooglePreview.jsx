import {
  directionsEmbedUrl,
  googleMapsDirectionsLink,
  googleStreetViewLink,
  streetViewEmbedUrl,
} from '../google/embed.js';

const tabStyle = (selected) => ({
  flex: 1,
  padding: '6px 8px',
  fontSize: '13px',
  fontWeight: 600,
  border: 0,
  borderBottom: `3px solid ${selected ? '#0b6e8a' : 'transparent'}`,
  background: 'transparent',
  color: selected ? '#0b6e8a' : '#555',
  cursor: 'pointer',
});

// Google Maps preview in the corner of the map: our route in Google's
// directions, or Street View of the destination or a flood point.
// view is {mode: 'route'} or {mode: 'street', point: [lat, lng], title}.
export default function GooglePreview({ apiKey, view, route, onChangeView, onClose }) {
  const destination = route ? route[route.length - 1] : null;
  const isRoute = view.mode === 'route';
  const embedUrl = isRoute ? directionsEmbedUrl(apiKey, route) : streetViewEmbedUrl(apiKey, view.point);
  const openUrl = isRoute ? googleMapsDirectionsLink(route) : googleStreetViewLink(view.point);

  return (
    <section
      aria-label="Google Maps preview"
      style={{
        position: 'absolute',
        left: '10px',
        bottom: '24px',
        zIndex: 1000,
        width: 'min(360px, calc(100% - 20px))',
        background: '#fff',
        color: '#111',
        borderRadius: '10px',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        textAlign: 'left',
        fontSize: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        {route && (
          <>
            <button type="button" style={tabStyle(isRoute)} onClick={() => onChangeView({ mode: 'route' })}>
              Route in Google
            </button>
            <button
              type="button"
              style={tabStyle(!isRoute && view.title === 'Destination')}
              onClick={() => onChangeView({ mode: 'street', point: destination, title: 'Destination' })}
            >
              Destination Street View
            </button>
          </>
        )}
        {!route && <strong style={{ flex: 1, padding: '8px 10px' }}>{view.title}</strong>}
        <button
          type="button"
          aria-label="Close Google preview"
          onClick={onClose}
          style={{ border: 0, background: 'transparent', fontSize: '20px', lineHeight: 1, padding: '4px 10px', cursor: 'pointer', color: '#555' }}
        >
          ×
        </button>
      </div>

      {route && !isRoute && view.title !== 'Destination' && (
        <div style={{ padding: '6px 10px 0', fontWeight: 600 }}>{view.title}</div>
      )}

      {apiKey ? (
        <iframe
          key={embedUrl}
          title={isRoute ? 'Route in Google Maps' : `Street View: ${view.title}`}
          src={embedUrl}
          width="100%"
          height="220"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          allowFullScreen
          // Lets Google check the key's website restriction.
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div style={{ height: '140px', display: 'grid', placeItems: 'center', padding: '12px', background: '#f3f4f6', color: '#444', textAlign: 'center' }}>
          <div>
            <strong>Google preview needs an API key.</strong>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Add <code>VITE_GOOGLE_MAPS_EMBED_KEY</code> to <code>Route_Machine/.env.local</code> (see docs/google-embed.md).
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {!isRoute && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            Street View photos can be months or years old. They don't show flooding right now.
          </span>
        )}
        <a href={openUrl} target="_blank" rel="noreferrer" style={{ color: '#0b6e8a', fontWeight: 600 }}>
          Open in Google Maps ↗
        </a>
      </div>
    </section>
  );
}
