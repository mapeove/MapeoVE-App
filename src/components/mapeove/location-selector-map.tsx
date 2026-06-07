"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check, X } from "lucide-react";
import { MAP_STYLE, INITIAL_MAP_CONFIG } from "@/lib/map-config";

export default function LocationSelectorMap({ 
  onSelect, 
  onClose,
  initialLat,
  initialLng
}: { 
  onSelect: (lat: number, lng: number, address?: string) => void;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [maplibregl, setMaplibregl] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [mounted, setMounted] = useState(false);

  // Search Address States
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    import("maplibre-gl").then((mod) => {
      setMaplibregl(mod.default);
    });
  }, []);

  useEffect(() => {
    if (!maplibregl || !mapContainer.current || mapRef.current) return;

    const startCenter: [number, number] = (initialLng != null && initialLat != null)
      ? [initialLng, initialLat] 
      : [INITIAL_MAP_CONFIG.longitude, INITIAL_MAP_CONFIG.latitude];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE, // Same style as main map
      center: startCenter,
      zoom: INITIAL_MAP_CONFIG.zoomSelector,
      maxZoom: INITIAL_MAP_CONFIG.maxZoom,
      attributionControl: true,
    });
    
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;

    // Pre-populate marker if initial coords are passed
    if (initialLat != null && initialLng != null) {
      markerRef.current = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([initialLng, initialLat])
        .addTo(map);
    } else {
      // Geolocate user automatically if there is no initial coordinate
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setCoords({ lat, lng });
            map.flyTo({ center: [lng, lat], zoom: 16 });

            if (markerRef.current) {
              markerRef.current.setLngLat([lng, lat]);
            } else {
              markerRef.current = new maplibregl.Marker({ color: "#2563eb" })
                .setLngLat([lng, lat])
                .addTo(map);
            }
          },
          (error) => {
            console.warn("Geolocation query failed or was denied:", error);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }

    map.on("click", (e: any) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      setCoords({ lat, lng });
      setSelectedAddress(""); // Clear address label since they clicked a custom spot

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new maplibregl.Marker({ color: "#2563eb" })
          .setLngLat([lng, lat])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
    };
  }, [maplibregl]); // Run only once when maplibre loads

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        // Use proximity parameter to prioritize user coordinates or fallback default center
        const lat = coords?.lat || INITIAL_MAP_CONFIG.latitude;
        const lng = coords?.lng || INITIAL_MAP_CONFIG.longitude;
        const proximity = `${lng},${lat}`;
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}&proximity=${proximity}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.features)) {
            setSuggestions(data.features);
          }
        }
      } catch (err) {
        console.error("Geocoding search failed:", err);
      }
    }, 300);
  };

  const handleSelectSuggestion = (sug: any) => {
    const geoCoords = sug.geometry?.coordinates || sug.center;
    if (geoCoords && geoCoords.length === 2) {
      const lng = geoCoords[0];
      const lat = geoCoords[1];
      const name = sug.place_name || sug.text || "Dirección encontrada";
      
      setCoords({ lat, lng });
      setSelectedAddress(name);
      setSearchQuery(name);
      setSuggestions([]);

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 16 });

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else if (maplibregl) {
          markerRef.current = new maplibregl.Marker({ color: "#2563eb" })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);
        }
      }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-scale-in">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm relative z-10 shrink-0">
        <div>
          <h3 className="text-sm font-black text-gray-900">Ubicación de tu local</h3>
          <p className="text-[10px] text-gray-555 font-bold">Toca el mapa o busca para colocar el marcador</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
          <X size={16} />
        </button>
      </div>

      {/* Buscador de dirección */}
      <div className="p-3 bg-gray-55 border-b border-gray-150 relative z-20 flex flex-col gap-1 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Buscar dirección o lugar (Ej. España, La Victoria...)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 shadow-xs font-semibold"
          />
          <span className="absolute left-3 text-gray-400 text-xs">
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="absolute right-3 text-gray-400 hover:text-gray-600 font-black text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggestions list */}
        {suggestions.length > 0 && (
          <div className="absolute left-3 right-3 top-[48px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 divide-y divide-gray-100">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(sug)}
                className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-semibold transition-colors truncate block"
              >
                📍 {sug.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="relative flex-1 w-full bg-gray-100 min-h-0">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      
      {/* Confirm Button */}
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-[100000] w-[90%] max-w-sm pointer-events-auto"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <button 
          onClick={() => {
            if (coords) onSelect(coords.lat, coords.lng, selectedAddress);
          }}
          disabled={!coords}
          className={`w-full text-white font-bold py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform ${
            coords ? "bg-blue-600 active:scale-95" : "bg-gray-400 opacity-80 cursor-not-allowed"
          }`}
        >
          <Check size={18} /> Confirmar Ubicación
        </button>
      </div>
    </div>,
    document.body
  );
}
