import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const LONG_PRESS_MS = 600;
const MOVE_TOLERANCE_PX = 10;

// Calls onPick(latlng) when the user long-presses the map on a touch screen,
// or right-clicks it with a mouse. Dragging or zooming cancels a long press.
export default function MapLongPress({ onPick }) {
  const map = useMap();

  useEffect(() => {
    const el = map.getContainer();
    let timer = null;
    let start = null;
    // Some phones also fire a right-click after a long press; ignore that one.
    let lastPress = 0;

    const cancel = () => {
      clearTimeout(timer);
      timer = null;
    };
    const onPointerDown = (e) => {
      if (e.pointerType !== 'touch' || !e.isPrimary) return;
      cancel();
      start = { x: e.clientX, y: e.clientY };
      const latlng = map.mouseEventToLatLng(e);
      timer = setTimeout(() => {
        timer = null;
        lastPress = Date.now();
        onPick(latlng);
      }, LONG_PRESS_MS);
    };
    const onPointerMove = (e) => {
      if (timer && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel();
    };
    const onContextMenu = (e) => {
      e.originalEvent?.preventDefault();
      if (Date.now() - lastPress < 1000) return;
      onPick(e.latlng);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointercancel', cancel);
    map.on('contextmenu', onContextMenu);
    map.on('movestart zoomstart', cancel);
    return () => {
      cancel();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', cancel);
      el.removeEventListener('pointercancel', cancel);
      map.off('contextmenu', onContextMenu);
      map.off('movestart zoomstart', cancel);
    };
  }, [map, onPick]);

  return null;
}
