"use client";

import { Business, BRAND, CATEGORY_COLORS } from "@/types/mapeove";
import {
  X,
  Phone,
  MessageCircle,
  Navigation,
  MapPin,
  Clock,
  Shield,
} from "lucide-react";

interface BusinessDetailProps {
  business: Business;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
}

/** Check if coordinates are roughly within Venezuela */
function isInVenezuela(lat: number, lng: number): boolean {
  return lat >= 0 && lat <= 13 && lng >= -74 && lng <= -59;
}

export function BusinessDetail({
  business,
  onClose,
  userLocation,
}: BusinessDetailProps) {
  const categoryColor = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
  const whatsappNumber = business.whatsapp?.replace(/[^0-9]/g, "") || "";
  const phoneNumber = business.phone?.replace(/[^0-9]/g, "") || "";

  // Distance logic: only show if user location is within Venezuela
  const hasValidDistance =
    business.distance !== undefined &&
    userLocation !== null &&
    isInVenezuela(userLocation.lat, userLocation.lng);

  function handleCall() {
    if (phoneNumber) window.open(`tel:${phoneNumber}`, "_self");
  }

  function handleWhatsApp() {
    if (whatsappNumber) {
      const text = encodeURIComponent(
        `Hola, te contacto desde MapeoVE - ${business.name}`
      );
      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
    }
  }

  function handleDirections() {
    const lat = Number(business.latitude);
    const lng = Number(business.longitude);

    // If user has a valid location within Venezuela, use directions
    if (
      userLocation &&
      isInVenezuela(userLocation.lat, userLocation.lng)
    ) {
      window.open(
        `https://www.openstreetmap.org/directions?from=${userLocation.lat},${userLocation.lng}&to=${lat},${lng}`,
        "_blank"
      );
    } else {
      // No valid user location — just open the destination
      window.open(
        `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
        "_blank"
      );
    }
  }

  return (
    <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[45vh] md:max-h-none md:max-w-[420px] md:mx-auto md:rounded-2xl md:mb-3">
      {/* Drag handle (mobile) */}
      <div className="flex justify-center pt-2 pb-0 md:hidden">
        <div className="w-9 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Color accent bar */}
      <div className="h-1 md:h-1.5" style={{ backgroundColor: categoryColor }} />

      {/* Scrollable content */}
      <div className="overflow-y-auto max-h-[calc(45vh-32px)] md:max-h-[400px] px-4 pt-3 pb-4">
        {/* Header row: category + close */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white leading-tight"
              style={{ backgroundColor: categoryColor }}
            >
              {business.category.icon} {business.category.name}
            </span>
            {business.verified && (
              <span className="flex items-center gap-0.5 text-[11px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                <Shield size={10} />
                Verificado
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Name */}
        <h2 className="text-base font-bold text-gray-900 leading-tight pr-6">
          {business.name}
        </h2>

        {/* Description — truncated to 2 lines */}
        {business.description && (
          <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {business.description}
          </p>
        )}

        {/* Info rows — compact */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">{business.address}</span>
          </div>
          {business.hours && (
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">{business.hours}</span>
            </div>
          )}
          {phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">{business.phone}</span>
            </div>
          )}
          {hasValidDistance && (
            <div className="flex items-center gap-2">
              <Navigation size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs font-semibold" style={{ color: BRAND.blue }}>
                {business.distance} km de distancia
              </span>
            </div>
          )}
        </div>

        {/* Action buttons — compact grid */}
        <div className="mt-3 flex gap-2">
          {phoneNumber && (
            <button
              onClick={handleCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: BRAND.blue }}
            >
              <Phone size={14} />
              <span>Llamar</span>
            </button>
          )}
          {whatsappNumber && (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </button>
          )}
          <button
            onClick={handleDirections}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND.red }}
          >
            <Navigation size={14} />
            <span>Cómo llegar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
