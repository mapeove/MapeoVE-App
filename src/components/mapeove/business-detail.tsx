"use client";

import { useEffect, useState, useRef } from "react";
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

interface ZoomableImageProps {
  src: string;
  alt: string;
  isActive: boolean;
}

function ZoomableImage({ src, alt, isActive }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const startScaleRef = useRef(1);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  // Reset zoom when image source changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Reset zoom when active status changes
  useEffect(() => {
    if (!isActive) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isActive]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPosRef.current = { ...position };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      startScaleRef.current = scale;
      
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      startPosRef.current = { ...position };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scale === 1 && e.touches.length !== 2) return;
    
    // Stop propagation so the parent scroll container doesn't swipe
    e.stopPropagation();

    if (e.touches.length === 1 && touchStartRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      
      const width = typeof window !== "undefined" ? window.innerWidth : 360;
      const height = typeof window !== "undefined" ? window.innerHeight : 600;
      const maxPanX = (scale - 1) * (width / 2);
      const maxPanY = (scale - 1) * (height / 2);
      
      setPosition({
        x: Math.max(-maxPanX, Math.min(maxPanX, startPosRef.current.x + dx)),
        y: Math.max(-maxPanY, Math.min(maxPanY, startPosRef.current.y + dy))
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current && touchStartRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const nextScale = Math.max(1, Math.min(4, startScaleRef.current * factor));
      setScale(nextScale);

      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      const dx = center.x - touchStartRef.current.x;
      const dy = center.y - touchStartRef.current.y;
      
      const width = typeof window !== "undefined" ? window.innerWidth : 360;
      const height = typeof window !== "undefined" ? window.innerHeight : 600;
      const maxPanX = (nextScale - 1) * (width / 2);
      const maxPanY = (nextScale - 1) * (height / 2);

      setPosition({
        x: Math.max(-maxPanX, Math.min(maxPanX, startPosRef.current.x + dx)),
        y: Math.max(-maxPanY, Math.min(maxPanY, startPosRef.current.y + dy))
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchStartDistRef.current = null;
    
    if (scale < 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // prevent closing the visor!
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
        setPosition({ x: 0, y: 0 });
      }
    }
    lastTapRef.current = now;
  };

  return (
    <div 
      className="overflow-hidden w-full h-full flex items-center justify-center relative"
      style={{ touchAction: scale > 1 ? "none" : "pan-x" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleDoubleTap}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-100 ease-out select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          maxHeight: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 80px)",
        }}
      />
    </div>
  );
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

  const detailScrollContainerRef = useRef<HTMLDivElement>(null);
  const visorScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset expanded status and image index when switching businesses
  useEffect(() => {
    setIsExpanded(false);
    setCurrentImageIndex(0);
    setIsVisorOpen(false);
  }, [business.id]);

  // Sync scroll positions when currentImageIndex changes programmatically (e.g. keydowns or clicks)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < sortedImages.length) {
        setCurrentImageIndex(newIndex);
      }
    }
  };

  // Sync visor scroll position when visor is opened
  useEffect(() => {
    if (isVisorOpen && visorScrollContainerRef.current) {
      setTimeout(() => {
        if (visorScrollContainerRef.current) {
          const width = visorScrollContainerRef.current.clientWidth;
          visorScrollContainerRef.current.scrollTo({
            left: currentImageIndex * width,
            behavior: "auto"
          });
        }
      }, 50);
    }
  }, [isVisorOpen]);

  useEffect(() => {
    if (!isVisorOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisorOpen(false);
      } else if (e.key === "ArrowLeft" && sortedImages.length > 1) {
        const prevIdx = currentImageIndex === 0 ? sortedImages.length - 1 : currentImageIndex - 1;
        setCurrentImageIndex(prevIdx);
        if (visorScrollContainerRef.current) {
          visorScrollContainerRef.current.scrollTo({
            left: prevIdx * visorScrollContainerRef.current.clientWidth,
            behavior: "smooth"
          });
        }
      } else if (e.key === "ArrowRight" && sortedImages.length > 1) {
        const nextIdx = currentImageIndex === sortedImages.length - 1 ? 0 : currentImageIndex + 1;
        setCurrentImageIndex(nextIdx);
        if (visorScrollContainerRef.current) {
          visorScrollContainerRef.current.scrollTo({
            left: nextIdx * visorScrollContainerRef.current.clientWidth,
            behavior: "smooth"
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisorOpen, sortedImages.length, currentImageIndex]);

  const hasValidDistance =
    business.distance !== undefined &&
    userLocation !== null &&
    isInVenezuela(userLocation.lat, userLocation.lng);

  const { isOpen, label: openLabel } = getOpenStatus(business.hours);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (detailScrollContainerRef.current) {
      const width = detailScrollContainerRef.current.clientWidth;
      const nextIndex = currentImageIndex === 0 ? sortedImages.length - 1 : currentImageIndex - 1;
      detailScrollContainerRef.current.scrollTo({
        left: nextIndex * width,
        behavior: "smooth"
      });
      setCurrentImageIndex(nextIndex);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (detailScrollContainerRef.current) {
      const width = detailScrollContainerRef.current.clientWidth;
      const nextIndex = currentImageIndex === sortedImages.length - 1 ? 0 : currentImageIndex + 1;
      detailScrollContainerRef.current.scrollTo({
        left: nextIndex * width,
        behavior: "smooth"
      });
      setCurrentImageIndex(nextIndex);
    }
  };

  const handleVisorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < sortedImages.length) {
        setCurrentImageIndex(newIndex);
      }
    }
  };

  const handleVisorPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visorScrollContainerRef.current) {
      const width = visorScrollContainerRef.current.clientWidth;
      const nextIndex = currentImageIndex === 0 ? sortedImages.length - 1 : currentImageIndex - 1;
      visorScrollContainerRef.current.scrollTo({
        left: nextIndex * width,
        behavior: "smooth"
      });
      setCurrentImageIndex(nextIndex);
    }
  };

  const handleVisorNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visorScrollContainerRef.current) {
      const width = visorScrollContainerRef.current.clientWidth;
      const nextIndex = currentImageIndex === sortedImages.length - 1 ? 0 : currentImageIndex + 1;
      visorScrollContainerRef.current.scrollTo({
        left: nextIndex * width,
        behavior: "smooth"
      });
      setCurrentImageIndex(nextIndex);
    }
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
        isExpanded ? "h-[80vh]" : "max-h-[60vh] md:h-auto md:max-h-none"
      }`}>
        {/* Imagen, carrusel o placeholder */}
        {(() => {
          if (sortedImages.length > 0) {
            return (
              <div className="relative h-[130px] md:h-[280px] overflow-hidden flex-shrink-0 bg-gray-50 md:bg-gray-55 border-b border-gray-100">
                {/* Drag handle overlay (mobile only) */}
                <div 
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/50 backdrop-blur-sm z-20 md:hidden cursor-pointer hover:bg-white/75 active:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                />

                <div 
                  ref={detailScrollContainerRef}
                  onScroll={handleScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full cursor-zoom-in"
                  onClick={() => setIsVisorOpen(true)}
                >
                  {sortedImages.map((img, idx) => (
                    <div key={img.id || idx} className="w-full h-full flex-shrink-0 snap-start relative bg-gray-50 md:bg-transparent flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={business.name}
                        className="w-full h-full object-contain md:object-cover select-none"
                      />
                      {img.isPrimary && (
                        <span className="absolute top-3 left-3 bg-blue-650/90 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm z-10"
                          style={{ backgroundColor: BRAND.blue }}
                        >
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>

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

                {/* Indicadores inferiores tipo ● ○ ○ ○ */}
                {sortedImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {sortedImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                          idx === currentImageIndex ? "bg-white scale-110" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Contador de fotos (ej. 1/5) */}
                {sortedImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/55 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white z-10 backdrop-blur-sm">
                    {currentImageIndex + 1}/{sortedImages.length}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div className="relative h-[130px] md:h-[280px] overflow-hidden flex-shrink-0 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                {/* Drag handle overlay (mobile only) */}
                <div 
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-300 z-20 md:hidden cursor-pointer hover:bg-gray-450 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                />
                
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-300 gap-1.5">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-[9px] font-black tracking-wider text-gray-400 uppercase">Sin imágenes</span>
                </div>
              </div>
            );
          }
        })()}

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-4 pt-3 pb-32 md:pb-4 flex-1 min-h-0 space-y-2.5">
          {/* Header Row: Category Icon + Category Badge + Close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-lg shadow-sm text-white shrink-0"
                style={{ backgroundColor: categoryColor }}
              >
                {business.category.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span 
                  className="inline-block text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 md:px-2.5 py-0.5 rounded-full text-white w-fit"
                  style={{ backgroundColor: categoryColor }}
                >
                  {business.category.name}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 shrink-0"
            >
              <X size={12} className="md:w-3.5 md:h-3.5" />
            </button>
          </div>

          {/* Nombre */}
          <h2 className="text-sm md:text-base font-extrabold text-gray-900 leading-tight">
            {business.name}
          </h2>

          {/* Badges: estado + verificado */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`flex items-center gap-1 text-[10px] md:text-[11px] font-semibold px-2 md:px-2.5 py-0.5 rounded-full ${
                isOpen
                  ? "text-green-700 bg-green-50"
                  : "text-gray-500 bg-gray-100"
              }`}
            >
              <CircleDot size={8} className="md:w-[9px] md:h-[9px]" />
              {openLabel}
            </span>
            {business.verified && (
              <span className="flex items-center gap-0.5 text-[10px] md:text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                <Shield size={9} className="md:w-2.5 md:h-2.5" />
                Verificado
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Info rows */}
          <div className="space-y-2 md:space-y-2.5">
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5 md:w-3.5 md:h-3.5" />
              <span className="text-[11px] md:text-xs text-gray-650 font-medium leading-relaxed">{business.address}</span>
            </div>
            {business.hours && (
              <div className="flex items-start gap-2">
                <Clock size={12} className="text-gray-400 flex-shrink-0 mt-0.5 md:w-3.5 md:h-3.5" />
                <span className="text-[11px] md:text-xs text-gray-650 font-medium leading-relaxed">{business.hours}</span>
              </div>
            )}
            {phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-gray-400 flex-shrink-0 md:w-3.5 md:h-3.5" />
                <span className="text-[11px] md:text-xs text-gray-650 font-medium">{business.phone}</span>
              </div>
            )}
            {hasValidDistance && (
              <div className="flex items-center gap-2">
                <Navigation size={12} className="text-gray-400 flex-shrink-0 md:w-3.5 md:h-3.5" />
                <span className="text-[11px] md:text-xs font-bold" style={{ color: BRAND.blue }}>
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
          className="fixed inset-0 z-[100000] flex flex-col bg-black select-none"
          onClick={() => setIsVisorOpen(false)}
        >
          {/* Close button X */}
          <button
            onClick={() => setIsVisorOpen(false)}
            className="absolute p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[100001] active:scale-95"
            style={{ 
              top: "calc(1rem + env(safe-area-inset-top))", 
              right: "calc(1rem + env(safe-area-inset-right))" 
            }}
          >
            <X size={24} />
          </button>

          {/* Swipe container for fullscreen images */}
          <div 
            ref={visorScrollContainerRef}
            onScroll={handleVisorScroll}
            className="flex-1 flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full"
          >
            {sortedImages.map((img, idx) => (
              <div 
                key={img.id || idx} 
                className="w-screen h-full flex-shrink-0 snap-start flex items-center justify-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <ZoomableImage
                  src={img.url}
                  alt={`${business.name} vista ampliada ${idx + 1}`}
                  isActive={currentImageIndex === idx}
                />
              </div>
            ))}
          </div>

          {/* Left Arrow (Desktop/accessibility) */}
          {sortedImages.length > 1 && (
            <button
              onClick={handleVisorPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[100001] active:scale-95 hidden sm:flex"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Right Arrow (Desktop/accessibility) */}
          {sortedImages.length > 1 && (
            <button
              onClick={handleVisorNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[100001] active:scale-95 hidden sm:flex"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Counter (Bottom Centered) */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-black px-4 py-1.5 rounded-full backdrop-blur-sm z-[100001]"
            style={{ 
              bottom: "calc(1.5rem + env(safe-area-inset-bottom))" 
            }}
          >
            {currentImageIndex + 1} / {sortedImages.length}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
