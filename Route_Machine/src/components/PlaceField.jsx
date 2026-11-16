import { useEffect, useRef, useState } from 'react';
import { MIN_SUGGEST_LENGTH, suggestPlaces } from '../geo/places.js';
import { CURRENT_LOCATION, endpointText, placeEndpoint, textEndpoint } from '../route/endpoints.js';

const SUGGEST_DELAY_MS = 350;
const YOUR_LOCATION_OPTION = { label: '📍 Your location', detail: 'Use where you are now', current: true };

// One place input with a suggestions dropdown (used for both From and To).
// Picking an option calls onPick; typing calls onChange; Enter with no
// option highlighted submits the surrounding form.
export default function PlaceField({ id, label, placeholder, value, onChange, onPick, inputRef, autoFocus, offerCurrent, marker, closeSignal }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Only fetch suggestions after the user types, not after picking one.
  const typedRef = useRef(false);
  const text = endpointText(value);
  const isCurrent = value.kind === 'current';

  useEffect(() => {
    const query = value.kind === 'text' ? value.text.trim() : '';
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
  }, [value]);

  const options = [...(offerCurrent && !isCurrent ? [YOUR_LOCATION_OPTION] : []), ...suggestions];
  const showList = open && options.length > 0;

  function pick(option) {
    typedRef.current = false;
    setOpen(false);
    setSuggestions([]);
    onPick(option.current ? CURRENT_LOCATION : placeEndpoint(option));
  }

  function handleKeyDown(e) {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && active >= 0 && options[active]) {
      // Pick the highlighted option instead of submitting the form.
      e.preventDefault();
      pick(options[active]);
    }
  }

  // The form bumps closeSignal on submit, so a pending suggestions request
  // can't reopen the list over the results.
  useEffect(() => {
    typedRef.current = false;
    setOpen(false);
    setSuggestions([]);
  }, [closeSignal]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
      <span aria-hidden="true" style={{ width: '18px', display: 'flex', justifyContent: 'center', flex: 'none' }}>
        {marker}
      </span>
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <input
          ref={inputRef}
          id={`${id}-input`}
          autoFocus={autoFocus}
          type="text"
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={`${id}-suggestions`}
          aria-activedescendant={showList && active >= 0 ? `${id}-option-${active}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            typedRef.current = true;
            onChange(textEndpoint(e.target.value));
          }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            // "Your location" is replaced by typing, like in map apps.
            if (isCurrent) e.target.select();
            if (options.length > 0) setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px',
            fontSize: '16px',
            color: isCurrent ? '#1d4ed8' : undefined,
            fontWeight: isCurrent ? 600 : undefined,
          }}
        />
        {showList && (
          <ul
            id={`${id}-suggestions`}
            role="listbox"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1200,
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
            {options.map((option, i) => (
              <li
                key={`${option.label}|${option.detail}`}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === active}
                // Keep focus in the input so the click registers before blur closes the list.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(option)}
                onMouseEnter={() => setActive(i)}
                style={{ padding: '7px 10px', cursor: 'pointer', background: i === active ? '#e0f2fe' : 'transparent' }}
              >
                <div style={{ fontWeight: 600, fontSize: '15px', color: option.current ? '#1d4ed8' : undefined }}>{option.label}</div>
                {option.detail && <div style={{ fontSize: '13px', color: '#555' }}>{option.detail}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
