/**
 * Leaflet + OpenStreetMap + Nominatim qidiruv (tekin, API kalit talab qilmaydi).
 * Nominatim qoidalari: kamroq so‘rov, faqat admin forma uchun.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

function parseCoord(v, fallback) {
  if (v == null || String(v).trim() === '') return fallback;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {{
 *   latStr: string,
 *   lngStr: string,
 *   onChange: (p: { lat: number, lng: number, label?: string }) => void,
 * }} props
 */
export default function PlacePickerMap({ latStr, lngStr, onChange }) {
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchErr, setSearchErr] = useState(null);
  const lastReqRef = useRef(0);

  const lat = parseCoord(latStr, TASHKENT.lat);
  const lng = parseCoord(lngStr, TASHKENT.lng);

  const notifyCoords = useCallback(
    (nlat, nlng, label) => {
      onChange({ lat: nlat, lng: nlng, ...(label ? { label } : {}) });
    },
    [onChange]
  );

  useEffect(() => {
    if (!wrapRef.current) return undefined;
    const el = wrapRef.current;
    const map = L.map(el).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const p = marker.getLatLng();
      notifyCoords(p.lat, p.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      notifyCoords(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;
    setMapReady(true);

    const t = window.setTimeout(() => map.invalidateSize(), 200);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
      setMapReady(false);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bir marta init
  }, []);

  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapRef.current) return;
    const m = markerRef.current;
    const map = mapRef.current;
    const cur = m.getLatLng();
    if (Math.abs(cur.lat - lat) < 1e-7 && Math.abs(cur.lng - lng) < 1e-7) return;
    m.setLatLng([lat, lng]);
    map.setView([lat, lng], Math.max(map.getZoom(), 12), { animate: false });
  }, [lat, lng, mapReady]);

  const runSearch = async () => {
    const q = search.trim();
    if (!q) {
      setSearchErr('Qidiruv matnini kiriting');
      return;
    }
    const now = Date.now();
    if (now - lastReqRef.current < 1100) {
      setSearchErr('Bir oz kuting (Nominatim cheklovi)');
      return;
    }
    lastReqRef.current = now;
    setSearching(true);
    setSearchErr(null);
    setResults([]);
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        limit: '8',
        addressdetails: '1',
        'accept-language': 'uz,ru,en',
      });
      const res = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Qidiruv xatosi');
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      if (!data?.length) setSearchErr('Natija topilmadi');
    } catch {
      setSearchErr('Tarmoq yoki xizmat xatosi');
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (item) => {
    const nlat = parseFloat(item.lat);
    const nlng = parseFloat(item.lon);
    if (!Number.isFinite(nlat) || !Number.isFinite(nlng)) return;
    const label = item.display_name || item.name || '';
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([nlat, nlng]);
      mapRef.current.setView([nlat, nlng], 16, { animate: true });
    }
    notifyCoords(nlat, nlng, label);
    setResults([]);
    setSearch('');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchErr('Brauzer joylashuvni qo‘llab-quvvatlamaydi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nlat = pos.coords.latitude;
        const nlng = pos.coords.longitude;
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLatLng([nlat, nlng]);
          mapRef.current.setView([nlat, nlng], 15, { animate: true });
        }
        notifyCoords(nlat, nlng);
        setSearchErr(null);
      },
      () => setSearchErr('Joylashuv rad etildi yoki mavjud emas')
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchErr(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
              }
            }}
            placeholder="Manzil yoki joy nomi (Toshkent, Amir Temur…)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
          {results.length > 0 && (
            <ul className="absolute z-[1000] mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
              {results.map((item) => (
                <li key={`${item.place_id ?? item.osm_id}-${item.lat}-${item.lon}`}>
                  <button
                    type="button"
                    onClick={() => pickResult(item)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50"
                  >
                    <span className="line-clamp-2 text-gray-900">{item.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={runSearch}
            disabled={searching}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? '…' : 'Qidirish'}
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
            title="Mening joylashuvim"
          >
            Joylashuv
          </button>
        </div>
      </div>
      {searchErr && <p className="text-xs text-amber-700">{searchErr}</p>}
      <p className="text-[11px] leading-snug text-gray-500">
        Xarita: OpenStreetMap. Qidiruv: Nominatim (tekin). Xaritada bosish yoki marker tortish — kenglik/uzunlik
        yangilanadi.
      </p>
      <div
        ref={wrapRef}
        className="h-[220px] w-full overflow-hidden rounded-lg border border-gray-200 sm:h-[260px]"
      />
    </div>
  );
}
