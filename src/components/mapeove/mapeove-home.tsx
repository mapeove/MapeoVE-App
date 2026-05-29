"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SplashOverlay } from "@/components/mapeove/splash-overlay";
import { SearchBar } from "@/components/mapeove/search-bar";
import { CategoryFilters } from "@/components/mapeove/category-filters";
import { BusinessDetail } from "@/components/mapeove/business-detail";
import { BusinessList } from "@/components/mapeove/business-list";
import { BRAND } from "@/types/mapeove";
import { useUserLocation } from "@/hooks/use-user-location";
import { useMapeoveData } from "@/hooks/use-mapeove-data";
import { MapPin, List, X } from "lucide-react";

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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Splash Screen */}
      <SplashOverlay />

      {/* Mapa — solo cliente */}
      <MapeoVEMap
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onMarkerClick={handleMarkerClick}
        userLocation={userLocation}
      />

      {/* Barra superior: Búsqueda + Categorías */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="p-4 pt-3 space-y-3 pointer-events-auto">
          <SearchBar
            onSearch={handleSearch}
            onSelectBusiness={handleSelectBusinessFromSearch}
            onClear={handleClearSearch}
          />
          <CategoryFilters
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Sección inferior: Detalle o Lista */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Contador de negocios */}
        <div className="flex justify-center mb-2">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-white text-xs font-bold"
            style={{ backgroundColor: BRAND.blue }}
          >
            <MapPin size={14} />
            {businessCount} negocio{businessCount !== 1 ? "s" : ""} en La Victoria
          </div>
        </div>

        {/* Panel de detalle del negocio */}
        {selectedBusiness && (
          <div className="relative mx-3 mb-3">
            <BusinessDetail
              business={selectedBusiness}
              onClose={handleCloseDetail}
            />
          </div>
        )}

        {/* Panel de lista de negocios */}
        {showList && !selectedBusiness && (
          <div className="bg-white rounded-t-3xl shadow-2xl max-h-[60vh] overflow-hidden">
            <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Negocios cercanos
                </h3>
                <button
                  onClick={() => setShowList(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[52vh] p-3">
              <BusinessList
                businesses={businesses}
                onSelectBusiness={handleMarkerClick}
                selectedId={selectedBusiness?.id || null}
              />
            </div>
          </div>
        )}

        {/* Botón Ver lista */}
        {!selectedBusiness && !showList && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowList(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-lg text-sm font-bold text-gray-700 hover:shadow-xl transition-all active:scale-95 border border-gray-100"
            >
              <List size={16} />
              Ver lista
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: BRAND.blue }}
              >
                {businessCount}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Botón flotante de ubicación */}
      {userLocation && !selectedBusiness && !showList && (
        <div className="absolute bottom-24 right-4 z-20">
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all active:scale-95 border border-gray-100"
            title="Mi ubicación"
          >
            <MapPin size={20} style={{ color: BRAND.blue }} />
          </button>
        </div>
      )}
    </div>
  );
}
