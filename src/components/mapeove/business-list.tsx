"use client";

import { Business, BRAND, CATEGORY_COLORS } from "@/types/mapeove";
import { isInVenezuela } from "@/lib/coordinate-validator";
import { MapPin, Clock, Navigation, Shield } from "lucide-react";

interface BusinessListProps {
  businesses: Business[];
  onSelectBusiness: (business: Business) => void;
  selectedId: string | null;
  userLocation?: { lat: number; lng: number } | null;
}

export function BusinessList({
  businesses,
  onSelectBusiness,
  selectedId,
  userLocation = null,
}: BusinessListProps) {
  // Only show distances if user location is within Venezuela
  const showDistances = userLocation !== null;

  if (!Array.isArray(businesses) || businesses.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-sm text-gray-500 font-medium">
          {showDistances
            ? "No hay negocios cercanos registrados en esta zona"
            : "No hay negocios registrados en esta zona"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {showDistances
            ? "Intenta moverte o cambiar de categoría"
            : "Intenta mover el mapa o cambiar de categoría"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {(Array.isArray(businesses) ? businesses : []).map((business) => {
        const color = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
        const isSelected = selectedId === business.id;
        const shouldShowDistance = showDistances && business.distance !== undefined;

        return (
          <button
            key={business.id}
            onClick={() => onSelectBusiness(business)}
            className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
              isSelected
                ? "border-blue-200 bg-blue-50/50 shadow-sm"
                : "border-transparent bg-white hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* Category icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {business.category.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-gray-900 truncate">
                    {business.name}
                  </h3>
                  {business.sponsoredCategory && (!business.sponsoredUntil || new Date(business.sponsoredUntil) > new Date()) && (
                    <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0 border border-amber-200">
                      Patrocinado
                    </span>
                  )}
                  {business.featured && (!business.featuredUntil || new Date(business.featuredUntil) > new Date()) && (
                    <span className="text-[8px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0 border border-blue-200">
                      Destacado
                    </span>
                  )}
                  {business.verified ? (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0 border border-blue-100">
                      <Shield size={7} />
                      Verificado
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                      Sin verificar
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  {business.category.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[11px] text-gray-600 truncate">
                    {business.address}
                  </span>
                </div>
                {business.hours && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 truncate">
                      {business.hours}
                    </span>
                  </div>
                )}
              </div>

              {/* Distance badge */}
              {shouldShowDistance && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Navigation size={10} style={{ color: BRAND.blue }} />
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: BRAND.blue }}
                  >
                    {business.distance} km
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
