"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
} from "lucide-react";

interface BusinessDetailProps {
  business: Business;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  onStartNavigation: () => void;
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
    const nowMin = now.getHours() * 65 + now.getMinutes(); // match approximate minutes logic safely

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
  onStartNavigation,
}: BusinessDetailProps) {
  const categoryColor = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
  const whatsappNumber = business.whatsapp?.replace(/[^0-9]/g, "") || "";
  const phoneNumber = business.phone?.replace(/[^0-9]/g, "") || "";

  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset expanded status when switching businesses
  useEffect(() => {
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

  return (
    <>
      {/* ── PORTAL FOR MOBILE ACTION BAR (z-index 99999 to guarantee visibility on phone overlays) ── */}
      {mounted && createPortal(
        <div
          className="fixed bottom-0 left-0 right-0 z-[99999] bg-white border-t border-gray-100 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.12)] md:hidden pointer-events-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="px-3 pt-3 pb-2">
            <div className="flex gap-2">
              <button
                onClick={handleCall}
                disabled={!phoneNumber}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
                style={{ backgroundColor: BRAND.blue }}
              >
                <Phone size={14} />
                <span>Llamar</span>
              </button>
              <button
                onClick={handleWhatsApp}
                disabled={!whatsappNumber}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={onStartNavigation}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all"
                style={{ backgroundColor: BRAND.red }}
              >
                <Navigation size={14} />
                <span>Cómo llegar</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EMBEDDED SHEET FOR DESKTOP & MOBILE WRAPPER ── */}
      <div className={`relative bg-white rounded-t-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out flex flex-col md:max-w-[420px] md:mx-auto md:rounded-2xl md:mb-3 ${
        isExpanded ? "h-[80vh]" : "max-h-[55vh] md:h-auto md:max-h-none"
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
          <div className="relative h-28 md:h-32 overflow-hidden flex-shrink-0">
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
          <div className="relative flex-shrink-0">
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

        {/* Contenido scrolleable (pb-24 on mobile prevents being covered by the portal buttons) */}
        <div className="overflow-y-auto px-4 pt-3 pb-24 md:pb-4 flex-1 min-h-0">
          {/* Nombre */}
          <h2 className="text-base font-extrabold text-gray-900 leading-tight pr-6">
            {business.name}
          </h2>

          {/* Badges: estado + verificado */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Badge Abierto/Cerrado */}
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
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

          {/* Info rows ── dirección, horario, teléfono, distancia */}
          <div className="mt-3.5 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-650 font-medium leading-relaxed">{business.address}</span>
            </div>
            {business.hours && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-650 font-medium">{business.hours}</span>
              </div>
            )}
            {phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-650 font-medium">{business.phone}</span>
              </div>
            )}
            {hasValidDistance && (
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-bold" style={{ color: BRAND.blue }}>
                  {business.distance} km de distancia
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones principales ── Solo se muestran dentro del sheet en escritorio (hidden md:block) */}
        <div className="hidden md:block px-4 pb-4 pt-3 border-t border-gray-100 bg-white flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleCall}
              disabled={!phoneNumber}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all hover:shadow disabled:opacity-40"
              style={{ backgroundColor: BRAND.blue }}
            >
              <Phone size={14} />
              <span>Llamar</span>
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={!whatsappNumber}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all hover:shadow disabled:opacity-40"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onStartNavigation}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all hover:shadow-lg hover:shadow-red-500/10"
              style={{ backgroundColor: BRAND.red }}
            >
              <Navigation size={14} />
              <span>Cómo llegar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
