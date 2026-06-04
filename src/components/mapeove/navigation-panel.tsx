"use client";

import { useState, useEffect } from "react";
import { Business, BRAND } from "@/types/mapeove";
import { 
  X, 
  MapPin, 
  Navigation, 
  Car, 
  Bike, 
  Footprints, 
  Search, 
  ArrowLeft,
  Check,
  Locate,
  AlertTriangle,
  Map
} from "lucide-react";

function MotorcycleIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M7 16h10" />
      <path d="M17 16l-3-6H9l-3 6" />
      <path d="M12 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    </svg>
  );
}

interface NavigationPanelProps {
  business: Business | null;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onCalculateRoute: (
    mode: string, 
    start?: { lat: number; lng: number }, 
    end?: { lat: number; lng: number }
  ) => Promise<void>;
  onClearRoute: () => void;
  activeRoute: {
    distance: number;
    duration: number;
    mode: string;
    isFallback?: boolean;
  } | null;
  routeError: string | null;
  routeLoading: boolean;
  mapSelectionMode: "origin" | "destination" | null;
  onMapSelectionRequest: (mode: "origin" | "destination" | null) => void;
  selectedMapCoords: { type: "origin" | "destination"; lat: number; lng: number } | null;
  originCoords: { lat: number; lng: number } | null;
  setOriginCoords: (coords: { lat: number; lng: number } | null) => void;
  destCoords: { lat: number; lng: number } | null;
  setDestCoords: (coords: { lat: number; lng: number } | null) => void;
}

export function NavigationPanel({
  business,
  userLocation,
  onClose,
  onCalculateRoute,
  onClearRoute,
  activeRoute,
  routeError,
  routeLoading,
  mapSelectionMode,
  onMapSelectionRequest,
  selectedMapCoords,
  originCoords,
  setOriginCoords,
  destCoords,
  setDestCoords
}: NavigationPanelProps) {
  const [isConfiguring, setIsConfiguring] = useState(true);
  
  // Origen states
  const [originType, setOriginType] = useState<"gps" | "custom" | "map">("gps");
  const [originQuery, setOriginQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [originSearching, setOriginSearching] = useState(false);
  const [originSelectedName, setOriginSelectedName] = useState("Mi ubicación GPS");

  // Destino states
  const [destType, setDestType] = useState<"business" | "custom" | "map">("business");
  const [destQuery, setDestQuery] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [destSearching, setDestSearching] = useState(false);
  const [destSelectedName, setDestSelectedName] = useState(business?.name || "Seleccionar destino");

  // General routing states
  const [routeMode, setRouteMode] = useState("driving-car");
  const [geocoding, setGeocoding] = useState(false);

  // Sync selected business as destination when component mounts or business changes
  useEffect(() => {
    if (business) {
      setDestType("business");
      setDestCoords({ lat: Number(business.latitude), lng: Number(business.longitude) });
      setDestSelectedName(business.name);
    }
  }, [business]);

  // Sync map selection coordinates
  useEffect(() => {
    if (selectedMapCoords) {
      const formattedCoords = `${selectedMapCoords.lat.toFixed(5)}, ${selectedMapCoords.lng.toFixed(5)}`;
      if (selectedMapCoords.type === "origin") {
        setOriginType("map");
        setOriginCoords({ lat: selectedMapCoords.lat, lng: selectedMapCoords.lng });
        setOriginSelectedName(`Punto en el mapa (${formattedCoords})`);
      } else if (selectedMapCoords.type === "destination") {
        setDestType("map");
        setDestCoords({ lat: selectedMapCoords.lat, lng: selectedMapCoords.lng });
        setDestSelectedName(`Punto en el mapa (${formattedCoords})`);
      }
    }
  }, [selectedMapCoords]);

  // Handle route success/loading transition
  useEffect(() => {
    if (activeRoute && !routeLoading && !geocoding) {
      setIsConfiguring(false);
    }
  }, [activeRoute, routeLoading, geocoding]);

  // Geocoding helper
  const handleGeocode = async (query: string, type: "origin" | "destination") => {
    if (!query.trim()) return;
    
    if (type === "origin") {
      setOriginSearching(true);
      setOriginSuggestions([]);
    } else {
      setDestSearching(true);
      setDestSuggestions([]);
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const features = data.features || [];
      
      const formatted = features.map((f: any) => ({
        name: f.place_name || f.properties?.label || f.text || "Dirección encontrada",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0]
      }));

      if (type === "origin") {
        setOriginSuggestions(formatted);
      } else {
        setDestSuggestions(formatted);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      if (type === "origin") {
        setOriginSearching(false);
      } else {
        setDestSearching(false);
      }
    }
  };

  const handleSelectSuggestion = (
    sugg: { name: string; lat: number; lng: number }, 
    type: "origin" | "destination"
  ) => {
    if (type === "origin") {
      setOriginCoords({ lat: sugg.lat, lng: sugg.lng });
      setOriginSelectedName(sugg.name);
      setOriginQuery(sugg.name);
      setOriginSuggestions([]);
    } else {
      setDestCoords({ lat: sugg.lat, lng: sugg.lng });
      setDestSelectedName(sugg.name);
      setDestQuery(sugg.name);
      setDestSuggestions([]);
    }
  };

  const handleCalculateRoute = async (modeOverride?: string) => {
    setGeocoding(true);
    const mode = modeOverride || routeMode;
    
    try {
      let finalOrigin = originType === "gps" ? undefined : originCoords;
      let finalDest = destType === "business" ? undefined : destCoords;

      // Handle raw custom input if search suggestions list wasn't explicitly clicked
      if (originType === "custom" && originQuery && !originCoords) {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(originQuery)}`);
        const data = await res.json();
        if (data.features?.length > 0) {
          const c = data.features[0].geometry.coordinates;
          finalOrigin = { lng: c[0], lat: c[1] };
          setOriginCoords(finalOrigin);
        } else {
          alert("Origen no encontrado.");
          setGeocoding(false);
          return;
        }
      }

      if (destType === "custom" && destQuery && !destCoords) {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(destQuery)}`);
        const data = await res.json();
        if (data.features?.length > 0) {
          const c = data.features[0].geometry.coordinates;
          finalDest = { lng: c[0], lat: c[1] };
          setDestCoords(finalDest);
        } else {
          alert("Destino no encontrado.");
          setGeocoding(false);
          return;
        }
      }

      // Check if GPS was selected but not available
      if (originType === "gps" && !userLocation) {
        alert("La ubicación GPS no está disponible. Por favor activa la geolocalización o selecciona otra opción.");
        setGeocoding(false);
        return;
      }

      await onCalculateRoute(mode, finalOrigin || undefined, finalDest || undefined);
    } catch (error) {
      console.error("Error planning route:", error);
    } finally {
      setGeocoding(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h} h ${m} min`;
    }
    return `${minutes} min`;
  };

  // Helper to close navigation
  const handleExit = () => {
    onClearRoute();
    onClose();
  };

  return (
    <>
      {/* 1. CONFIGURATION OVERLAY (Full screen on mobile, elegant side panel on desktop) */}
      {isConfiguring && (
        <div className="fixed inset-0 md:absolute md:inset-y-0 md:left-0 md:right-auto md:w-[420px] bg-white z-[9999] shadow-2xl flex flex-col transition-all duration-300">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <button 
                onClick={activeRoute ? () => setIsConfiguring(false) : handleExit}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <h2 className="text-base font-extrabold text-gray-800">Planificar Ruta</h2>
            </div>
            <button 
              onClick={handleExit}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">
            {/* ORIGIN SECTION */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Punto de Origen
              </label>

              {/* Selector de tipo */}
              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setOriginType("gps");
                    setOriginCoords(userLocation);
                    setOriginSelectedName("Mi ubicación GPS");
                    setOriginSuggestions([]);
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all ${
                    originType === "gps" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mi GPS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOriginType("custom");
                    setOriginCoords(null);
                    setOriginSelectedName("");
                    setOriginSuggestions([]);
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all ${
                    originType === "custom" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Dirección
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOriginType("map");
                    setOriginCoords(null);
                    setOriginSelectedName("");
                    setOriginSuggestions([]);
                    onMapSelectionRequest("origin");
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all ${
                    originType === "map" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mapa
                </button>
              </div>

              {/* Input Dinámico */}
              <div className="relative">
                {originType === "gps" && (
                  <div className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <Locate size={14} className="animate-pulse" />
                      Ubicación GPS seleccionada
                    </span>
                    {userLocation && (
                      <span className="text-[10px] text-blue-500 font-mono">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}

                {originType === "custom" && (
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="Escribe dirección de origen..."
                        value={originQuery}
                        onChange={(e) => {
                          setOriginQuery(e.target.value);
                          setOriginCoords(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleGeocode(originQuery, "origin");
                        }}
                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleGeocode(originQuery, "origin")}
                        className="absolute right-2 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                      >
                        {originSearching ? (
                          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                      </button>
                    </div>

                    {originSuggestions.length > 0 && (
                      <div className="border border-gray-100 rounded-xl bg-white shadow-xl max-h-40 overflow-y-auto divide-y divide-gray-50 z-20 relative">
                        {originSuggestions.map((sugg, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectSuggestion(sugg, "origin")}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 transition-colors flex items-start gap-1.5"
                          >
                            <MapPin size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{sugg.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {originCoords && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 px-1">
                        <Check size={12} /> Ubicación validada
                      </p>
                    )}
                  </div>
                )}

                {originType === "map" && (
                  <div 
                    onClick={() => onMapSelectionRequest("origin")}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Map size={14} />
                      {originSelectedName || "Toca para seleccionar en el mapa"}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline">Cambiar</span>
                  </div>
                )}
              </div>
            </div>

            {/* DESTINATION SECTION */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Punto de Destino
              </label>

              {/* Selector de tipo */}
              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  disabled={!business}
                  onClick={() => {
                    setDestType("business");
                    if (business) {
                      setDestCoords({ lat: Number(business.latitude), lng: Number(business.longitude) });
                      setDestSelectedName(business.name);
                    }
                    setDestSuggestions([]);
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all disabled:opacity-40 ${
                    destType === "business" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Negocio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestType("custom");
                    setDestCoords(null);
                    setDestSelectedName("");
                    setDestSuggestions([]);
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all ${
                    destType === "custom" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Dirección
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestType("map");
                    setDestCoords(null);
                    setDestSelectedName("");
                    setDestSuggestions([]);
                    onMapSelectionRequest("destination");
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all ${
                    destType === "map" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mapa
                </button>
              </div>

              {/* Input Dinámico */}
              <div className="relative">
                {destType === "business" && (
                  <div className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                      <MapPin size={14} />
                      {destSelectedName}
                    </span>
                    {destCoords && (
                      <span className="text-[10px] text-red-500 font-mono">
                        {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}

                {destType === "custom" && (
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="Escribe dirección de destino..."
                        value={destQuery}
                        onChange={(e) => {
                          setDestQuery(e.target.value);
                          setDestCoords(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleGeocode(destQuery, "destination");
                        }}
                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleGeocode(destQuery, "destination")}
                        className="absolute right-2 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                      >
                        {destSearching ? (
                          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                      </button>
                    </div>

                    {destSuggestions.length > 0 && (
                      <div className="border border-gray-100 rounded-xl bg-white shadow-xl max-h-40 overflow-y-auto divide-y divide-gray-50 z-20 relative">
                        {destSuggestions.map((sugg, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectSuggestion(sugg, "destination")}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 transition-colors flex items-start gap-1.5"
                          >
                            <MapPin size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{sugg.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {destCoords && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-0.5 px-1">
                        <Check size={12} /> Ubicación validada
                      </p>
                    )}
                  </div>
                )}

                {destType === "map" && (
                  <div 
                    onClick={() => onMapSelectionRequest("destination")}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Map size={14} />
                      {destSelectedName || "Toca para seleccionar en el mapa"}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline">Cambiar</span>
                  </div>
                )}
              </div>
            </div>

            {/* TRANSPORTATION MODE SELECTOR */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Modo de Transporte
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "driving-car", label: "Coche", icon: Car },
                  { id: "driving-car-moto", label: "Moto", icon: MotorcycleIcon },
                  { id: "cycling-regular", label: "Bici", icon: Bike },
                  { id: "foot-walking", label: "Caminar", icon: Footprints },
                ].map((mode) => {
                  const isSelected = routeMode === mode.id;
                  const IconComp = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setRouteMode(mode.id)}
                      className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.03]"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <IconComp size={18} />
                      <span className="text-[10px] font-black">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {routeError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-start gap-2 animate-shake">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <p>{routeError}</p>
              </div>
            )}
          </div>

          {/* Action button at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-4 border-t border-gray-100 bg-white">
            <button
              onClick={() => handleCalculateRoute()}
              disabled={geocoding || routeLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-60"
            >
              {geocoding || routeLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  <span>Calcular Ruta</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. MAP VIEW MODE (Compact top & bottom floating elements, fully exposes the map) */}
      {!isConfiguring && (
        <>
          {/* Top Floating Bar */}
          <div className="absolute top-4 left-4 right-4 md:left-4 md:right-auto md:w-[390px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-[999] pointer-events-auto flex items-center gap-3">
            <button 
              onClick={() => setIsConfiguring(true)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Volver a configurar"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Plan de viaje</p>
              <p className="text-xs font-black text-gray-800 truncate">
                {originType === "gps" ? "Mi ubicación" : originSelectedName} → {destType === "business" ? business?.name : destSelectedName}
              </p>
            </div>
            <button 
              onClick={handleExit}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
              title="Cerrar navegación"
            >
              <X size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Bottom Floating Card */}
          <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[390px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[999] pointer-events-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  {routeMode === "driving-car" && <Car size={20} />}
                  {routeMode === "driving-car-moto" && <MotorcycleIcon size={20} />}
                  {routeMode === "cycling-regular" && <Bike size={20} />}
                  {routeMode === "foot-walking" && <Footprints size={20} />}
                </span>
                <div>
                  <h3 className="text-sm font-black text-gray-900 leading-none">Ruta calculada</h3>
                  <p className="text-[10px] font-semibold text-gray-500 mt-1">
                    Modo: {routeMode === "driving-car" ? "Coche" : routeMode === "driving-car-moto" ? "Moto" : routeMode === "cycling-regular" ? "Bicicleta" : "Caminar"}
                  </p>
                </div>
              </div>

              {activeRoute && (
                <div className="flex flex-col items-end">
                  {activeRoute.isFallback ? (
                    <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                      <AlertTriangle size={8} /> Ruta aproximada
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Ruta óptima
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Route Stats */}
            {activeRoute && (
              <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-3 my-1">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Distancia</p>
                  <p className="text-lg font-black text-gray-800">{formatDistance(activeRoute.distance)}</p>
                </div>
                <div className="text-center border-l border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tiempo Estimado</p>
                  <p className="text-lg font-black text-gray-800">
                    {activeRoute.isFallback ? "—" : formatDuration(activeRoute.duration)}
                  </p>
                </div>
              </div>
            )}

            {/* Mode switch bar at bottom for quick switching */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {[
                  { id: "driving-car", icon: Car },
                  { id: "driving-car-moto", icon: MotorcycleIcon },
                  { id: "cycling-regular", icon: Bike },
                  { id: "foot-walking", icon: Footprints },
                ].map((mode) => {
                  const isSelected = routeMode === mode.id;
                  const IconC = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setRouteMode(mode.id);
                        handleCalculateRoute(mode.id);
                      }}
                      className={`p-2 rounded-xl border transition-all ${
                        isSelected 
                          ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105" 
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <IconC size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsConfiguring(true)}
                  className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Editar
                </button>
                <button
                  onClick={handleExit}
                  className="px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl active:scale-95 shadow-sm hover:shadow transition-all"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
