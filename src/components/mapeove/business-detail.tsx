"use client";

import { useEffect, useState } from "react";
import { Business, BRAND, CATEGORY_COLORS } from "@/types/mapeove";
import { isInVenezuela } from "@/lib/coordinate-validator";
import {
  X,
  Phone,
  MessageCircle,
  Navigation,
  MapPin,
  Clock,
  Shield,
  CircleDot,
  Footprints,
  Bike,
  Car,
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

interface BusinessDetailProps {
  business: Business;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  activeRoute?: {
    distance: number;
    duration: number;
    mode: string;
  } | null;
  onCalculateRoute?: (mode: string) => Promise<void>;
  onClearRoute?: () => void;
  routeError?: string | null;
  routeLoading?: boolean;
}

/**
 * Determina si un negocio está "Abierto" o "Cerrado" basado en el campo hours.
 */
function getOpenStatus(hours: string | null): { isOpen: boolean; label: string } {
  if (!hours) return { isOpen: false, label: "Sin horario" };

  const lower = hours.toLowerCase();

  if (lower.includes("24") || lower.includes("siempre") || lower.includes("todo el día")) {
    return { isOpen: true, label: "Abierto 24h" };
  }

  const rangeMatch = lower.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.?)\s*[-–a]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.?)/
  );

  if (rangeMatch) {
    const toMinutes = (h: string, m: string, p: string) => {
      let hour = parseInt(h, 10);
      const min = m ? parseInt(m, 10) : 0;
      if (p.startsWith("p") && hour !== 12) hour += 12;
      if (p.startsWith("a") && hour === 12) hour = 0;
      return hour * 60 + min;
    };

    const openMin = toMinutes(rangeMatch[1], rangeMatch[2] || "0", rangeMatch[3]);
    const closeMin = toMinutes(rangeMatch[4], rangeMatch[5] || "0", rangeMatch[6]);

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (nowMin >= openMin && nowMin <= closeMin) {
      return { isOpen: true, label: "Abierto ahora" };
    } else {
      return { isOpen: false, label: "Cerrado" };
    }
  }

  return { isOpen: false, label: hours };
}

export function BusinessDetail({
  business,
  onClose,
  userLocation,
  activeRoute,
  onCalculateRoute,
  onClearRoute,
  routeError,
  routeLoading,
}: BusinessDetailProps) {
  const categoryColor = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
  const whatsappNumber = business.whatsapp?.replace(/[^0-9]/g, "") || "";
  const phoneNumber = business.phone?.replace(/[^0-9]/g, "") || "";

  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset routing UI when selecting another business
  useEffect(() => {
    setIsRoutingActive(false);
    setIsExpanded(false);
  }, [business.id]);

  const hasValidDistance =
    business.distance !== undefined &&
    userLocation !== null &&
    isInVenezuela(userLocation.lat, userLocation.lng);

  const { isOpen, label: openLabel } = getOpenStatus(business.hours);

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

  const startInternalRouting = async (mode: string) => {
    setIsRoutingActive(true);
    if (onCalculateRoute) {
      await onCalculateRoute(mode);
    }
  };

  const handleCancelRouting = () => {
    setIsRoutingActive(false);
    if (onClearRoute) {
      onClearRoute();
    }
  };

  // Format routing summary values
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMin = minutes % 60;
      return `${hours} h ${remainingMin} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className={`bg-white rounded-t-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out flex flex-col md:max-w-[420px] md:mx-auto md:rounded-2xl md:mb-3 ${
      isExpanded ? "h-[85vh]" : "max-h-[55vh] md:h-auto md:max-h-none"
    }`}>
      {/* Drag handle (mobile) */}
      <div 
        className="flex justify-center pt-3 pb-2 md:hidden cursor-pointer hover:bg-gray-50 active:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 rounded-full bg-gray-300" />
      </div>

      {/* Imagen o placeholder */}
      {business.image ? (
        <div className="relative h-28 md:h-32 overflow-hidden">
          <img
            src={business.image}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Close button sobre imagen */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
          {/* Badge de categoría sobre imagen */}
          <div className="absolute bottom-2 left-3">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white leading-tight shadow-sm"
              style={{ backgroundColor: categoryColor }}
            >
              {business.category.icon} {business.category.name}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Barra de color como acento visual */}
          <div className="h-1.5" style={{ backgroundColor: categoryColor }} />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <X size={14} className="text-gray-500" />
          </button>
          {/* Header con ícono de categoría grande */}
          <div className="flex items-center gap-3 px-4 pt-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0 shadow-sm"
              style={{ backgroundColor: categoryColor }}
            >
              {business.category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white leading-tight"
                style={{ backgroundColor: categoryColor }}
              >
                {business.category.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contenido scrolleable */}
      <div className={`overflow-y-auto px-4 pt-2.5 pb-4 flex-1 min-h-0 ${isExpanded ? "" : "md:max-h-[380px]"}`}>
        {/* Nombre */}
        <h2 className="text-base font-bold text-gray-900 leading-tight pr-6">
          {business.name}
        </h2>

        {/* Badges: estado + verificado */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Badge Abierto/Cerrado */}
          <span
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isOpen
                ? "text-green-700 bg-green-50"
                : "text-gray-500 bg-gray-100"
            }`}
          >
            <CircleDot size={9} />
            {openLabel}
          </span>
          {business.verified && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              <Shield size={10} />
              Verificado
            </span>
          )}
        </div>

        {/* Info rows — orden: dirección, horario, teléfono, distancia */}
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
          {hasValidDistance && !isRoutingActive && (
            <div className="flex items-center gap-2">
              <Navigation size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs font-semibold" style={{ color: BRAND.blue }}>
                {business.distance} km de distancia
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de acciones pegajosa al fondo (Mobile First) */}
      <div className="bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-4 border-t border-gray-100 flex-shrink-0 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)] z-10">
        {isRoutingActive ? (
          <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Navegación Interna
              </span>
              <button
                onClick={handleCancelRouting}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase"
              >
                Salir
              </button>
            </div>

            {/* Travel Mode Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "driving-car", label: "Coche", icon: Car },
                { id: "driving-car-moto", label: "Moto", icon: MotorcycleIcon },
                { id: "cycling-regular", label: "Bici", icon: Bike },
                { id: "foot-walking", label: "Caminar", icon: Footprints },
              ].map((mode) => {
                const isSelected = activeRoute?.mode === mode.id || 
                  (mode.id === "driving-car-moto" && activeRoute?.mode === "driving-car-moto");
                const IconComponent = mode.icon;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => startInternalRouting(mode.id)}
                    className={`py-2 px-1 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent size={16} />
                    <span className="text-[9px] font-semibold">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Summary / Loading / Error */}
            <div className="pt-1.5 border-t border-gray-200/60 min-h-[42px] flex items-center justify-center">
              {routeLoading ? (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-500 font-medium">Buscando ruta...</span>
                </div>
              ) : routeError ? (
                <p className="text-xs font-bold text-red-600 text-center py-1">
                  {routeError}
                </p>
              ) : activeRoute ? (
                <div className="w-full flex justify-around text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Distancia</p>
                    <p className="text-xs font-black text-gray-800">
                      {formatDistance(activeRoute.distance)}
                    </p>
                  </div>
                  <div className="border-l border-gray-200" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Tiempo Estimado</p>
                    <p className="text-xs font-black text-gray-800">
                      {formatDuration(activeRoute.duration)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  Selecciona un modo para calcular la ruta
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Botones de acción normales */
          <div className="flex gap-2">
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
              onClick={() => startInternalRouting("driving-car")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: BRAND.red }}
            >
              <Navigation size={14} />
              <span>Cómo llegar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
