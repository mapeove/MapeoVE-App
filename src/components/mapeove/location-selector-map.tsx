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
  onSelect: (lat: number, lng: number) => void;
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
    }

    map.on("click", (e: any) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      setCoords({ lat, lng });

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

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-scale-in">
      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm relative z-10">
        <div>
          <h3 className="text-sm font-black text-gray-900">Ubicación de tu local</h3>
          <p className="text-[10px] text-gray-550 font-bold">Toca el mapa para colocar el marcador</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
          <X size={16} />
        </button>
      </div>
      <div className="relative flex-1 w-full bg-gray-100">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-[100000] w-[90%] max-w-sm pointer-events-auto"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <button 
          onClick={() => {
            if (coords) onSelect(coords.lat, coords.lng);
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
