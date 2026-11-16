import { useState } from 'react';
import PlaceField from './PlaceField.jsx';

const StartMarker = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <circle cx="7" cy="7" r="5" fill="#fff" stroke="#16a34a" strokeWidth="3" />
  </svg>
);
const EndMarker = (
  <svg width="14" height="18" viewBox="0 0 14 18">
    <path d="M7 17s6-6.2 6-10A6 6 0 0 0 1 7c0 3.8 6 10 6 10z" fill="#dc2626" />
    <circle cx="7" cy="7" r="2.2" fill="#fff" />
  </svg>
);

// "From" and "To" fields, a swap button and Search. From starts as the
// user's live location; To is focused so typing a destination + Enter
// still gets a route in 2 steps.
export default function RouteForm({ from, to, onFromChange, onToChange, onPickFrom, onPickTo, onSwap, onSubmit, searching, toInputRef }) {
  const [closeSignal, setCloseSignal] = useState(0);

  function handleSubmit(e) {
    e.preventDefault();
    if (searching) return;
    setCloseSignal((n) => n + 1);
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '10px',
        background: '#222',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
        zIndex: 1100,
      }}
    >
      <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <PlaceField
          id="from"
          label="Starting point"
          placeholder="Your location, or type a starting point"
          value={from}
          onChange={onFromChange}
          onPick={onPickFrom}
          offerCurrent
          marker={StartMarker}
          closeSignal={closeSignal}
        />
        <PlaceField
          id="to"
          label="Destination"
          placeholder="Destination, or long-press the map"
          value={to}
          onChange={onToChange}
          onPick={onPickTo}
          inputRef={toInputRef}
          autoFocus
          offerCurrent
          marker={EndMarker}
          closeSignal={closeSignal}
        />
      </div>
      <button
        type="button"
        onClick={onSwap}
        aria-label="Swap starting point and destination"
        title="Swap starting point and destination"
        style={{ padding: '8px 10px', fontSize: '18px', lineHeight: 1, cursor: 'pointer' }}
      >
        ⇅
      </button>
      <button type="submit" disabled={searching} style={{ padding: '8px 16px', fontSize: '16px', minWidth: '130px' }}>
        {searching ? 'Finding route…' : 'Search'}
      </button>
    </form>
  );
}
