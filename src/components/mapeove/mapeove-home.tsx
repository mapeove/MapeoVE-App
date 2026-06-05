"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SplashOverlay } from "@/components/mapeove/splash-overlay";
import { SearchBar } from "@/components/mapeove/search-bar";
import { CategoryFilters } from "@/components/mapeove/category-filters";
import { BusinessDetail } from "@/components/mapeove/business-detail";
import { BusinessList } from "@/components/mapeove/business-list";
import { NavigationPanel } from "@/components/mapeove/navigation-panel";
import { BRAND } from "@/types/mapeove";
import { useUserLocation } from "@/hooks/use-user-location";
import { useMapeoveData } from "@/hooks/use-mapeove-data";
import { useLiveNavigation } from "@/hooks/use-live-navigation";
import { MapPin, List, X } from "lucide-react";
import { AuthButton } from "@/components/mapeove/auth-button";
import { AdminDashboard } from "@/components/mapeove/admin-dashboard";

// Dynamic import del mapa — ssr: false porque MapLibre GL usa window/document
const MapeoVEMap = dynamic(
  () => import("@/components/mapeove/mapeove-map").then((mod) => mod.MapeoVEMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin"
            style={{ borderColor: BRAND.blue, borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-500 font-medium">Cargando mapa...</p>
        </div>
      </div>
    ),
  }
);

export function MapeoVEHome() {
  const { userLocation } = useUserLocation();
  const {
    categories,
    businesses,
    selectedBusiness,
    activeCategory,
    businessCount,
    handleMarkerClick,
    handleCategoryChange,
    handleSearch,
    handleClearSearch,
    handleSelectBusinessFromSearch,
    handleCloseDetail,
  } = useMapeoveData(userLocation);

  const [showList, setShowList] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Navigation / UX states
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true); // camera follows user GPS
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Route states
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<{
    distance: number;
    duration: number;
    mode: string;
    isFallback?: boolean;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] = useState<"origin" | "destination" | null>(null);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{type: "origin" | "destination", lat: number, lng: number} | null>(null);

  // Live navigation (GPS tracking, deviation, auto-recalc)
  const liveNav = useLiveNavigation({
    isActive: isNavigationActive,
    routeGeoJSON,
    destCoords,
    transportMode: activeRoute?.mode ?? "driving-car",
    isFallback: activeRoute?.isFallback ?? false,
    onRecalculate: async (mode, start, end) => {
      await calculateRoute(mode, start, end);
    },
  });

  // Clear map selection coords when entering a selection mode to ensure fresh tap coordinates
  useEffect(() => {
    if (mapSelectionMode) {
      setSelectedMapCoords(null);
    }
  }, [mapSelectionMode]);

  // Clear route when switching selected business or closing details (when not in navigation mode)
  useEffect(() => {
    if (!isNavigationActive) {
      setRouteGeoJSON(null);
      setActiveRoute(null);
      setRouteError(null);
      setOriginCoords(null);
      setDestCoords(null);
      setSelectedMapCoords(null);
    }
  }, [selectedBusiness, isNavigationActive]);

  const calculateRoute = async (
    mode: string, 
    customStart?: { lat: number; lng: number }, 
    customEnd?: { lat: number; lng: number }
  ) => {
    setRouteLoading(true);
    setRouteError(null);

    let startPoint = "";
    if (customStart) {
      startPoint = `${customStart.lng},${customStart.lat}`;
    } else if (userLocation) {
      startPoint = `${userLocation.lng},${userLocation.lat}`;
    } else {
      setRouteError("Activa tu ubicación o escribe un origen.");
      setRouteLoading(false);
      return;
    }

    let endPoint = "";
    if (customEnd) {
      endPoint = `${customEnd.lng},${customEnd.lat}`;
    } else if (selectedBusiness) {
      const bizLat = Number(selectedBusiness.latitude);
      const bizLng = Number(selectedBusiness.longitude);
      if (!Number.isFinite(bizLat) || !Number.isFinite(bizLng)) {
        setRouteError("Este negocio no tiene ubicación válida.");
        setRouteLoading(false);
        return;
      }
      endPoint = `${bizLng},${bizLat}`;
    } else {
      setRouteError("Falta destino para calcular ruta.");
      setRouteLoading(false);
      return;
    }

    const start = startPoint;
    const end = endPoint;

    try {
      const res = await fetch(`/api/directions?start=${start}&end=${end}&profile=${mode}`);
      if (!res.ok) {
        if (res.status === 501) {
          setRouteError("La navegación no está configurada todavía");
        } else {
          try {
            const errData = await res.json();
            setRouteError(errData.error || "No se pudo calcular la ruta.");
          } catch {
            setRouteError("Error al calcular la ruta.");
          }
        }
        setRouteGeoJSON(null);
        setActiveRoute(null);
        return;
      }

      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        setRouteGeoJSON(data);
        setActiveRoute({
          distance: feature.properties.summary.distance,
          duration: feature.properties.summary.duration,
          mode,
          isFallback: data.isFallback
        });
      } else {
        setRouteError("No se encontró una ruta disponible.");
        setRouteGeoJSON(null);
        setActiveRoute(null);
      }
    } catch (err) {
      console.error("Error fetching directions:", err);
      setRouteError("Error al conectar con el servidor.");
      setRouteGeoJSON(null);
      setActiveRoute(null);
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteGeoJSON(null);
    setActiveRoute(null);
    setRouteError(null);
  };

  const getMapMarkers = () => {
    if (isNavigationActive) {
      const markers = [];
      if (originCoords) {
        markers.push({ ...originCoords, color: "#007AFF" }); // Blue marker for origin
      }
      if (destCoords) {
        markers.push({ ...destCoords, color: BRAND.red }); // Red marker for destination
      }
      return markers;
    }
    return selectedMapCoords ? [{ ...selectedMapCoords, color: "#10B981" }] : undefined;
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-gray-100"
      style={{
        // Safe areas para iPhone con notch/dynamic island
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Splash Screen */}
      <SplashOverlay />

      {/* Mapa — solo cliente */}
      <MapeoVEMap
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onMarkerClick={handleMarkerClick}
        userLocation={isNavigationActive && liveNav.livePosition ? liveNav.livePosition : userLocation}
        routeGeoJSON={routeGeoJSON}
        onMapClick={(coords) => {
          if (mapSelectionMode) {
            setSelectedMapCoords({ type: mapSelectionMode, lat: coords.lat, lng: coords.lng });
            setMapSelectionMode(null);
          }
        }}
        customMarkers={getMapMarkers()}
        followUserLocation={isNavigationActive && isFollowing}
        onStopFollowing={() => setIsFollowing(false)}
      />

      {/* Barra superior: Búsqueda + Categorías (Hidden during navigation) */}
      {!isNavigationActive && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="px-3 pt-2 pb-1 space-y-2 pointer-events-auto md:px-4 md:pt-3 md:space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <SearchBar
                  onSearch={handleSearch}
                  onSelectBusiness={handleSelectBusinessFromSearch}
                  onClear={handleClearSearch}
                />
              </div>
              <AuthButton onOpenDashboard={() => setDashboardOpen(true)} />
            </div>
            <CategoryFilters
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </div>
      )}

      {/* Panel de administración SUPER_ADMIN */}
      <AdminDashboard 
        isOpen={dashboardOpen} 
        onClose={() => setDashboardOpen(false)} 
        businesses={businesses}
      />

      {/* Sección inferior (Hidden during navigation) */}
      {!isNavigationActive && (
        <div className="absolute bottom-0 left-0 right-0 z-20"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Contador de negocios */}
          {!selectedBusiness && !showList && (
            <div className="flex justify-center mb-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-white text-[11px] font-bold"
                style={{ backgroundColor: BRAND.blue }}
              >
                <MapPin size={12} />
                {businessCount} negocio{businessCount !== 1 ? "s" : ""} encontrados
              </div>
            </div>
          )}

          {/* Panel de detalle del negocio — bottom sheet */}
          {selectedBusiness && (
            <div className={`mx-0 mb-0 md:mx-3 md:mb-3 ${mapSelectionMode ? "opacity-0 pointer-events-none" : ""}`}>
              <BusinessDetail
                business={selectedBusiness}
                onClose={() => {
                  handleCloseDetail();
                  clearRoute();
                }}
                userLocation={userLocation}
                onStartNavigation={() => {
                  setIsNavigationActive(true);
                  setIsFollowing(true); // reset camera following when navigation starts
                  const start = userLocation || null;
                  const end = { lat: Number(selectedBusiness.latitude), lng: Number(selectedBusiness.longitude) };
                  setOriginCoords(start);
                  setDestCoords(end);
                  if (start) {
                    calculateRoute("driving-car", start, end);
                  }
                }}
              />
            </div>
          )}

          {/* Panel de lista de negocios */}
          {showList && !selectedBusiness && (
            <div className="bg-white rounded-t-2xl shadow-2xl max-h-[55vh] overflow-hidden">
              <div className="sticky top-0 bg-white px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    Negocios cercanos
                  </h3>
                  <button
                    onClick={() => setShowList(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[47vh] p-3">
                <BusinessList
                  businesses={businesses}
                  onSelectBusiness={handleMarkerClick}
                  selectedId={selectedBusiness?.id || null}
                  userLocation={userLocation}
                />
              </div>
            </div>
          )}

          {/* Botón Ver lista */}
          {!selectedBusiness && !showList && (
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setShowList(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white shadow-lg text-xs font-bold text-gray-700 hover:shadow-xl transition-all active:scale-95 border border-gray-100"
              >
                <List size={14} />
                Ver lista
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  {businessCount}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* NavigationPanel (Active routing panel) */}
      {isNavigationActive && (
        <div className={mapSelectionMode ? "opacity-0 pointer-events-none" : ""}>
          <NavigationPanel
            business={selectedBusiness}
            userLocation={userLocation}
            onClose={() => {
              liveNav.stopTracking();
              setIsNavigationActive(false);
              setIsFollowing(true);
              setOriginCoords(null);
              setDestCoords(null);
              setSelectedMapCoords(null);
              clearRoute();
            }}
            onCalculateRoute={calculateRoute}
            onClearRoute={clearRoute}
            activeRoute={activeRoute}
            routeError={routeError}
            routeLoading={routeLoading}
            mapSelectionMode={mapSelectionMode}
            onMapSelectionRequest={setMapSelectionMode}
            selectedMapCoords={selectedMapCoords}
            originCoords={originCoords}
            setOriginCoords={setOriginCoords}
            destCoords={destCoords}
            setDestCoords={setDestCoords}
            liveNav={liveNav}
            isFollowing={isFollowing}
            onToggleFollowing={() => setIsFollowing((f) => !f)}
          />
        </div>
      )}

      {mapSelectionMode && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-2xl shadow-lg border-2 border-blue-500 pointer-events-auto">
          <p className="text-sm font-bold text-blue-600">
            Toca el mapa para seleccionar {mapSelectionMode === "origin" ? "Origen" : "Destino"}
          </p>
          <button 
            onClick={() => setMapSelectionMode(null)}
            className="text-xs text-red-500 w-full text-center mt-1 font-bold"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
