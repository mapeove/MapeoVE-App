"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check, X } from "lucide-react";

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

  useEffect(() => {
    import("maplibre-gl").then((mod) => {
      setMaplibregl(mod.default);
    });
  }, []);

  useEffect(() => {
    if (!maplibregl || !mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
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
  }, [maplibregl]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-scale-in">
      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm relative z-10">
        <div>
          <h3 className="text-sm font-black text-gray-900">Ubicación de tu local</h3>
          <p className="text-[10px] text-gray-500">Toca el mapa para colocar el marcador</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
          <X size={16} />
        </button>
      </div>
      <div ref={mapContainer} className="flex-1 w-full bg-gray-100" />
      {coords && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
          <button 
            onClick={() => onSelect(coords.lat, coords.lng)}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Check size={18} /> Confirmar Ubicación
          </button>
        </div>
      )}
    </div>
  );
}
