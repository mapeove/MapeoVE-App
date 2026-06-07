"use client";

import { Business, BRAND, CATEGORY_COLORS } from "@/types/mapeove";
import { isInVenezuela } from "@/lib/coordinate-validator";
import { MapPin, Clock, Navigation } from "lucide-react";

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
          No se encontraron negocios
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Intenta con otra búsqueda o categoría
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
                  {business.verified && (
                    <span className="text-green-500 text-[10px]">✓</span>
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
