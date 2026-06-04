"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check, X, Map as MapIcon } from "lucide-react";

export default function LocationSelectorMap({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [maplibregl, setMaplibregl] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
  const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";
  const SATELLITE_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;

  useEffect(() => {
    setMounted(true);
    import("maplibre-gl").then((mod) => {
      setMaplibregl(mod.default);
    });
  }, []);

  useEffect(() => {
    if (!maplibregl || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: isSatellite ? SATELLITE_STYLE : MAP_STYLE,
      center: [-67.3312, 10.2268], // Base coordinates (can be any)
      zoom: 14,
      attributionControl: false,
    });
    
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;

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

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(isSatellite ? SATELLITE_STYLE : MAP_STYLE);
  }, [isSatellite]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-scale-in">
      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm relative z-10">
        <div>
          <h3 className="text-sm font-black text-gray-900">Ubicación de tu local</h3>
          <p className="text-[10px] text-gray-500">Toca el mapa para colocar el marcador</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
          <X size={16} />
        </button>
      </div>
      <div className="relative flex-1 w-full bg-gray-100">
        <div ref={mapContainer} className="absolute inset-0" />
        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className="absolute top-4 left-4 z-[10000] p-2 bg-white rounded-xl shadow-md text-xs font-bold text-gray-700 flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <MapIcon size={16} />
          {isSatellite ? "Mapa Normal" : "Satélite"}
        </button>
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
