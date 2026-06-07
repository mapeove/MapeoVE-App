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
  ChevronLeft,
  ChevronRight,
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

  const rawImages = business.businessImages && business.businessImages.length > 0
    ? business.businessImages
    : business.image
      ? [{ id: "legacy", url: business.image, isPrimary: true, createdAt: new Date().toISOString() }]
      : [];

  const sortedImages = [...rawImages].sort((a: any, b: any) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateA - dateB;
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisorOpen, setIsVisorOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset expanded status and image index when switching businesses
  useEffect(() => {
    setIsExpanded(false);
    setCurrentImageIndex(0);
    setIsVisorOpen(false);
  }, [business.id]);

  useEffect(() => {
    if (!isVisorOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisorOpen(false);
      } else if (e.key === "ArrowLeft" && sortedImages.length > 1) {
        setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight" && sortedImages.length > 1) {
        setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisorOpen, sortedImages.length]);

  const hasValidDistance =
    business.distance !== undefined &&
    userLocation !== null &&
    isInVenezuela(userLocation.lat, userLocation.lng);

  const { isOpen, label: openLabel } = getOpenStatus(business.hours);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

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

        {/* Imagen, carrusel o placeholder */}
        {(() => {
          if (sortedImages.length > 0) {
            const currentImg = sortedImages[currentImageIndex];
            return (
              <div 
                className="relative h-44 md:h-48 overflow-hidden flex-shrink-0 bg-gray-55 border-b border-gray-100 cursor-zoom-in"
                onClick={() => setIsVisorOpen(true)}
              >
                <img
                  src={currentImg.url}
                  alt={business.name}
                  className="w-full h-full object-cover select-none"
                />
                
                {currentImg.isPrimary && (
                  <span className="absolute top-2 left-3 bg-blue-650/90 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm z-10"
                    style={{ backgroundColor: BRAND.blue }}
                  >
                    Principal
                  </span>
                )}

                {/* Left Arrow Button */}
                {sortedImages.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-all z-10 active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right Arrow Button */}
                {sortedImages.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-all z-10 active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Close button sobre imagen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10"
                >
                  <X size={14} className="text-white" />
                </button>

                {/* Badge de categoría sobre imagen */}
                <div className="absolute bottom-2 left-3 z-10">
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white leading-tight shadow-md"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {business.category.icon} {business.category.name}
                  </span>
                </div>

                {/* Indicator dot or counter if multiple images */}
                {sortedImages.length > 1 && (
                  <div className="absolute bottom-2 right-3 bg-black/55 text-[10px] font-bold px-2 py-0.5 rounded-full text-white z-10">
                    {currentImageIndex + 1} / {sortedImages.length}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div className="relative h-36 overflow-hidden flex-shrink-0 bg-gray-55 border-b border-gray-100 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-300 gap-1.5">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">Sin imágenes</span>
                </div>
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                >
                  <X size={14} className="text-gray-500" />
                </button>
                {/* Category badge */}
                <div className="absolute bottom-2 left-3 z-10">
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white leading-tight shadow"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {business.category.icon} {business.category.name}
                  </span>
                </div>
              </div>
            );
          }
        })()}

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

      {/* Visor modal fullscreen */}
      {isVisorOpen && mounted && sortedImages.length > 0 && createPortal(
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-sm select-none"
          onClick={() => setIsVisorOpen(false)}
        >
          {/* Close button X */}
          <button
            onClick={() => setIsVisorOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[100001] active:scale-95"
          >
            <X size={24} />
          </button>

          {/* Left Arrow */}
          {sortedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
              }}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[100001] active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Right Arrow */}
          {sortedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[100001] active:scale-95"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Centered Image */}
          <div 
            className="max-w-[90vw] max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={sortedImages[currentImageIndex].url}
              alt={`${business.name} vista ampliada`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl select-none"
            />
          </div>

          {/* Counter (Bottom Centered) */}
          <div className="absolute bottom-6 bg-black/60 text-white text-xs font-black px-4 py-1.5 rounded-full backdrop-blur-sm z-[100001]">
            {currentImageIndex + 1} / {sortedImages.length}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
