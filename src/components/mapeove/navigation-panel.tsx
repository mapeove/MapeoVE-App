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

function formatGeocodeName(f: any): string {
  const name = f.text || "";
  if (!f.context || !Array.isArray(f.context)) {
    return f.place_name || name || "Dirección encontrada";
  }

  const stateItem = f.context.find((c: any) => c.id?.startsWith("region") || c.place_designation === "state");
  const countryItem = f.context.find((c: any) => c.id?.startsWith("country") || c.place_designation === "country");

  const parts = [name];
  if (stateItem && stateItem.text) {
    parts.push(stateItem.text);
  }
  if (countryItem && countryItem.text) {
    parts.push(countryItem.text);
  }

  return parts.join(", ");
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
  /** Live GPS navigation state (tracking, deviation, remaining distance) */
  liveNav?: {
    livePosition: { lat: number; lng: number } | null;
    remainingDistance: number | null;
    remainingTime: number | null;
    isDeviated: boolean;
    isRecalculating: boolean;
    gpsError: string | null;
    hasArrived: boolean;
    nextManeuver?: { text: string; distanceText: string } | null;
  };
  /** Whether the map camera is currently following the user */
  isFollowing?: boolean;
  /** Toggle camera follow on/off */
  onToggleFollowing?: () => void;
  /** True when user pressed Iniciar and GPS tracking is active */
  isActiveNavigation?: boolean;
  /** True when user arrived within 50m of destination */
  hasArrived?: boolean;
  /** Start active GPS navigation */
  onInitNavigation?: (gpsOrigin: boolean) => void;
  /** Stop active GPS navigation (keep route visible) */
  onStopNavigation?: () => void;
  /** Re-center camera on user */
  onRecenter?: () => void;
  /** Callback when the origin type changes (gps vs manual) */
  onOriginTypeChange?: (isGps: boolean) => void;
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
  setDestCoords,
  liveNav,
  isFollowing,
  onToggleFollowing,
  isActiveNavigation = false,
  hasArrived = false,
  onInitNavigation,
  onStopNavigation,
  onRecenter,
  onOriginTypeChange,
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

  // Notify parent component about origin type changes
  useEffect(() => {
    if (onOriginTypeChange) {
      onOriginTypeChange(originType === "gps");
    }
  }, [originType, onOriginTypeChange]);

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
        name: formatGeocodeName(f),
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

      // Force user to select one of the suggestions for custom origin/destination
      if (originType === "custom" && originQuery && !originCoords) {
        alert("Por favor selecciona una de las sugerencias de origen.");
        handleGeocode(originQuery, "origin");
        setGeocoding(false);
        return;
      }

      if (destType === "custom" && destQuery && !destCoords) {
        alert("Por favor selecciona una de las sugerencias de destino.");
        handleGeocode(destQuery, "destination");
        setGeocoding(false);
        return;
      }

      // Check if GPS was selected but not available
      if (originType === "gps" && !userLocation) {
        alert("La ubicación GPS no está disponible. Por favor activa la geolocalización o selecciona otra opción.");
        setGeocoding(false);
        return;
      }

      if (originType === "map" && !originCoords) {
        alert("Por favor selecciona un punto de origen en el mapa.");
        setGeocoding(false);
        return;
      }

      if (destType === "map" && !destCoords) {
        alert("Por favor selecciona un punto de destino en el mapa.");
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
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36">
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
          <div className="absolute bottom-0 inset-x-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-white flex-shrink-0 z-30">
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
          <div className="absolute top-4 left-4 right-4 md:left-4 md:right-auto md:w-[390px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-[9998] pointer-events-auto flex items-center gap-3">
            <button 
              onClick={() => {
                setIsConfiguring(true);
                onClearRoute();
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Volver a configurar"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              {isActiveNavigation && liveNav?.nextManeuver ? (
                <>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Siguiente indicación</p>
                  <p className="text-xs font-black text-gray-800 leading-tight">
                    {liveNav.nextManeuver.text}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Plan de viaje</p>
                  <p className="text-xs font-black text-gray-800 truncate">
                    {originType === "gps" ? "Mi ubicación" : originSelectedName} → {destType === "business" ? business?.name : destSelectedName}
                  </p>
                </>
              )}
            </div>
            <button 
              onClick={handleExit}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
              title="Cerrar navegación"
            >
              <X size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Bottom Floating Card — scrollable route info. Bottom padding reserves space for the fixed mobile action bar. */}
          <div className="absolute bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto md:w-[390px] bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-gray-100 z-[9997] pointer-events-auto flex flex-col" style={{maxHeight: "50vh"}}>
            {/* Pull handle (mobile only) */}
            <div className="flex justify-center pt-2 pb-0 md:hidden flex-shrink-0">
              <div className="w-8 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Scrollable content — pb-20 on mobile so content is not hidden behind fixed action bar */}
            <div className="overflow-y-auto flex-1 px-3 pt-2 pb-20 md:pb-4 md:p-4 md:pt-5 flex flex-col gap-2.5 md:gap-3">

              {/* ── Active Navigation Banner ────────────────────────────────────── */}
              {isActiveNavigation && !hasArrived && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-600 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                  <p className="text-[11px] font-black text-white">
                    {originType === "gps" ? "Siguiendo ruta" : "Navegación manual"}
                  </p>
                  <span className="ml-auto text-[9px] font-bold text-blue-200 uppercase tracking-wide">
                    {originType === "gps" ? "GPS activo" : "Manual"}
                  </span>
                </div>
              )}

              {/* ── Arrival Banner ──────────────────────────────────────────── */}
              {hasArrived && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500 rounded-xl">
                  <Check size={14} className="text-white flex-shrink-0" />
                  <p className="text-[11px] font-black text-white">¡Has llegado a tu destino!</p>
                </div>
              )}

              {/* ── GPS Error Banner ───────────────────────────────────────── */}
              {liveNav?.gpsError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-red-700 leading-tight">{liveNav.gpsError}</p>
                </div>
              )}

              {/* ── Recalculating Banner ────────────────────────────────────── */}
              {liveNav?.isRecalculating && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-[10px] font-bold text-blue-700">Recalculando ruta...</p>
                </div>
              )}

              {/* ── Off-route warning (only during active GPS navigation) ──────── */}
              {liveNav?.isDeviated && !liveNav.isRecalculating && isActiveNavigation && originType === "gps" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                  <AlertTriangle size={13} className="text-orange-500 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-orange-700">Fuera de ruta</p>
                </div>
              )}

              {/* ── Route header ──────────────────────────────────────────── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                    {routeMode === "driving-car" && <Car size={20} />}
                    {routeMode === "driving-car-moto" && <MotorcycleIcon size={20} />}
                    {routeMode === "cycling-regular" && <Bike size={20} />}
                    {routeMode === "foot-walking" && <Footprints size={20} />}
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 leading-none">Ruta calculada</h3>
                    <p className="text-[9px] font-semibold text-gray-500 mt-1 leading-none">
                      Modo: {routeMode === "driving-car" ? "Coche" : routeMode === "driving-car-moto" ? "Moto" : routeMode === "cycling-regular" ? "Bicicleta" : "Caminar"}
                    </p>
                  </div>
                </div>

                {activeRoute && (
                  <div className="flex flex-col items-end flex-shrink-0">
                    {activeRoute.isFallback ? (
                      <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                        <AlertTriangle size={8} /> Ruta aprox.
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {/* "En ruta" solo cuando origen es GPS y tenemos posición real */}
                        {originType === "gps" && liveNav?.livePosition ? "En ruta" : "Ruta óptima"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Route Stats ─────────────────────────────────────────────
                   REGLA: distancia/tiempo restante GPS solo cuando originType === "gps".
                   Si el origen fue elegido en mapa o dirección escrita, el usuario
                   no está físicamente en ese punto → usar datos de la respuesta ORS.
                   Esto evita mostrar distancias absurdas como 6799 km cuando el
                   dispositivo está en España y el destino en Venezuela.
              ─────────────────────────────────────────────────────────────── */}
              {activeRoute && (
                <div className="flex items-center justify-between border-y border-gray-50 py-2.5 my-0.5">
                  <div className="flex-1 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      {isActiveNavigation && liveNav?.remainingDistance != null ? "Restante" : "Distancia"}
                    </p>
                    <p className="text-base font-black text-gray-900 leading-tight mt-0.5">
                      {isActiveNavigation && liveNav?.remainingDistance != null
                        ? formatDistance(liveNav.remainingDistance)
                        : formatDistance(activeRoute.distance)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex-1 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      {isActiveNavigation && liveNav?.remainingTime != null ? "Tiempo rest." : "Tiempo est."}
                    </p>
                    <p className="text-base font-black text-gray-900 leading-tight mt-0.5">
                      {isActiveNavigation && liveNav?.remainingTime != null
                        ? formatDuration(liveNav.remainingTime)
                        : activeRoute.isFallback
                        ? "—"
                        : formatDuration(activeRoute.duration)}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Transport mode selector ───────────────────────────────── */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Cambiar Transporte</span>
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
                        <IconC size={15} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Follow location toggle ─────────────────────────────── */}
              {onToggleFollowing && (
                <button
                  type="button"
                  onClick={onToggleFollowing}
                  className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border text-[11px] font-black transition-all active:scale-95 ${
                    isFollowing
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Locate size={13} />
                  {isFollowing ? "Siguiendo mi ubicación" : "Seguir mi ubicación"}
                </button>
              )}

              {/* ── Desktop action buttons ─────────────────────────────────────── */}
              <div className="hidden md:grid grid-cols-3 gap-2 pt-1">
                {isActiveNavigation ? (
                  /* Active navigation: Detener / Recentrar / Salir */
                  <>
                    <button
                      onClick={onStopNavigation}
                      className="py-2.5 bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-black rounded-xl active:scale-95 transition-all text-center"
                    >
                      Detener
                    </button>
                    <button
                      onClick={onRecenter}
                      className="py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-black rounded-xl active:scale-95 transition-all text-center border border-blue-100"
                    >
                      Recentrar
                    </button>
                    <button
                      onClick={handleExit}
                      className="py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm hover:shadow transition-all text-center"
                    >
                      Salir
                    </button>
                  </>
                ) : activeRoute ? (
                  /* Route ready, not yet navigating: Iniciar / Editar / Salir */
                  <>
                    <button
                      onClick={() => onInitNavigation?.(originType === "gps")}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm hover:shadow transition-all text-center"
                    >
                      Iniciar
                    </button>
                    <button
                      onClick={() => {
                        setIsConfiguring(true);
                        onClearRoute();
                      }}
                      className="py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-black rounded-xl active:scale-95 transition-all text-center"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleExit}
                      className="py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm hover:shadow transition-all text-center"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  /* No route yet: Recalcular / Editar / Salir */
                  <>
                    <button
                      onClick={() => handleCalculateRoute()}
                      disabled={geocoding || routeLoading}
                      className="py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 border border-blue-100"
                    >
                      {geocoding || routeLoading ? (
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Recalcular"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsConfiguring(true);
                        onClearRoute();
                      }}
                      className="py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-black rounded-xl active:scale-95 transition-all text-center"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleExit}
                      className="py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm hover:shadow transition-all text-center"
                    >
                      Salir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              MOBILE FIXED ACTION BAR
              3 states: no-route | route-ready | active-navigation
          ══════════════════════════════════════════════════════ */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[99999] bg-white border-t-2 border-gray-200 pointer-events-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="grid grid-cols-3 gap-2 px-3 py-2">
              {isActiveNavigation ? (
                /* Active navigation: Detener / Recentrar / Salir */
                <>
                  <button
                    onClick={onStopNavigation}
                    className="py-3 bg-gray-100 text-gray-900 text-xs font-black rounded-xl active:scale-95 transition-all text-center border border-gray-200"
                  >
                    Detener
                  </button>
                  <button
                    onClick={onRecenter}
                    className="py-3 bg-blue-50 text-blue-700 text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 border border-blue-200"
                  >
                    <Locate size={12} />
                    Recentrar
                  </button>
                  <button
                    onClick={handleExit}
                    className="py-3 bg-red-500 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm transition-all text-center"
                  >
                    Salir
                  </button>
                </>
              ) : activeRoute ? (
                /* Route ready, not yet navigating: Iniciar / Editar / Salir */
                <>
                  <button
                    onClick={() => onInitNavigation?.(originType === "gps")}
                    className="py-3 bg-blue-600 text-white text-xs font-black rounded-xl active:scale-95 shadow-md transition-all text-center"
                  >
                    Iniciar
                  </button>
                  <button
                    onClick={() => {
                      setIsConfiguring(true);
                      onClearRoute();
                    }}
                    className="py-3 border-2 border-gray-300 bg-white text-gray-900 text-xs font-black rounded-xl active:scale-95 transition-all text-center"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleExit}
                    className="py-3 bg-red-500 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm transition-all text-center"
                  >
                    Salir
                  </button>
                </>
              ) : (
                /* No route: Recalcular / Editar / Salir */
                <>
                  <button
                    onClick={() => handleCalculateRoute()}
                    disabled={geocoding || routeLoading}
                    className="py-3 bg-blue-50 text-blue-700 text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1 border border-blue-200"
                  >
                    {geocoding || routeLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Recalcular"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsConfiguring(true);
                      onClearRoute();
                    }}
                    className="py-3 border-2 border-gray-300 bg-white text-gray-900 text-xs font-black rounded-xl active:scale-95 transition-all text-center"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleExit}
                    className="py-3 bg-red-500 text-white text-xs font-black rounded-xl active:scale-95 shadow-sm transition-all text-center"
                  >
                    Salir
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
