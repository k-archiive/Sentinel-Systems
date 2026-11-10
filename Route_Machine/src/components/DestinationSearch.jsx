import { useEffect, useRef, useState } from 'react';
import { MIN_SUGGEST_LENGTH, suggestPlaces } from '../geo/places.js';

const SUGGEST_DELAY_MS = 350;

// Search box with a suggestions dropdown. Picking a suggestion routes there
// straight away; pressing Enter without one searches the typed text.
export default function DestinationSearch({ inputRef, searching, onSearchText, onPickPlace }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Only fetch suggestions after the user types, not after picking one.
  const typedRef = useRef(false);

  useEffect(() => {
    const query = text.trim();
    if (!typedRef.current || query.length < MIN_SUGGEST_LENGTH) {
      setSuggestions([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestPlaces(query, { signal: controller.signal })
        .then((places) => {
          // The user searched or picked something while this was loading.
          if (!typedRef.current) return;
          setSuggestions(places);
          setActive(-1);
          setOpen(true);
        })
        // Suggestions are a convenience: if they fail, Enter still searches.
        .catch(() => {});
    }, SUGGEST_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  function pick(place) {
    typedRef.current = false;
    setText(place.label);
    setOpen(false);
    setSuggestions([]);
    onPickPlace(place);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (open && active >= 0 && suggestions[active]) {
      pick(suggestions[active]);
      return;
    }
    const query = text.trim();
    if (!query || searching) return;
    typedRef.current = false;
    setOpen(false);
    setSuggestions([]);
    onSearchText(query);
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: '10px', background: '#222', display: 'flex', gap: '8px', position: 'relative', zIndex: 1100 }}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          ref={inputRef}
          autoFocus
          type="text"
          role="combobox"
          aria-label="Destination"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls="destination-suggestions"
          aria-activedescendant={showList && active >= 0 ? `suggestion-${active}` : undefined}
          autoComplete="off"
          placeholder="Type a destination in the Houston area..."
          value={text}
          onChange={(e) => {
            typedRef.current = true;
            setText(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setOpen(false)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '16px' }}
        />
        {showList && (
          <ul
            id="destination-suggestions"
            role="listbox"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              margin: '4px 0 0',
              padding: '4px 0',
              listStyle: 'none',
              background: '#fff',
              color: '#111',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              textAlign: 'left',
            }}
          >
            {suggestions.map((place, i) => (
              <li
                key={`${place.label}|${place.detail}`}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === active}
                // Keep focus in the input so the click registers before blur closes the list.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(place)}
                onMouseEnter={() => setActive(i)}
                style={{ padding: '7px 10px', cursor: 'pointer', background: i === active ? '#e0f2fe' : 'transparent' }}
              >
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{place.label}</div>
                {place.detail && <div style={{ fontSize: '13px', color: '#555' }}>{place.detail}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={searching} style={{ padding: '8px 16px', fontSize: '16px', minWidth: '130px' }}>
        {searching ? 'Finding route…' : 'Search'}
      </button>
    </form>
  );
}
