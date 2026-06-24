"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Business, BRAND, CATEGORY_COLORS, formatBusinessAddress } from "@/types/mapeove";
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
    userLocation !== null;

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
          className="fixed bottom-0 left-0 right-0 z-[99999] md:hidden pointer-events-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Glassmorphism background */}
          <div 
            className="mx-3 mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "0 -4px 32px -4px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6) inset",
            }}
          >
            <div className="px-3 py-3">
              <div className="flex gap-2">
                <button
                  onClick={handleCall}
                  disabled={!phoneNumber}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blue}dd)`,
                    boxShadow: `0 4px 14px -2px ${BRAND.blue}50`,
                  }}
                >
                  <Phone size={14} />
                  <span>Llamar</span>
                </button>
                <button
                  onClick={handleWhatsApp}
                  disabled={!whatsappNumber}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #25D366, #20BD5A)",
                    boxShadow: "0 4px 14px -2px rgba(37,211,102,0.35)",
                  }}
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={onStartNavigation}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.red}dd)`,
                    boxShadow: `0 4px 14px -2px ${BRAND.red}50`,
                  }}
                >
                  <Navigation size={14} />
                  <span>Cómo llegar</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EMBEDDED SHEET FOR DESKTOP & MOBILE WRAPPER ── */}
      <div className={`relative bg-white rounded-t-2xl overflow-hidden transition-all duration-300 ease-in-out flex flex-col md:max-w-[420px] md:mx-auto md:rounded-2xl md:mb-3 ${
        isExpanded ? "h-[80vh]" : "max-h-[60vh] md:h-auto md:max-h-none"
      }`}
        style={{
          boxShadow: "0 -8px 40px -8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Imagen, carrusel o placeholder */}
        {(() => {
          if (sortedImages.length > 0) {
            return (
              <div className="relative h-[150px] md:h-[300px] overflow-hidden flex-shrink-0 bg-gray-900">
                {/* Drag handle overlay (mobile only) */}
                <div 
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/60 backdrop-blur-sm z-20 md:hidden cursor-pointer hover:bg-white/80 active:bg-white transition-colors"
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
                    <div key={img.id || idx} className="w-full h-full flex-shrink-0 snap-start relative bg-gray-900 flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={business.name}
                        className="w-full h-full object-contain md:object-cover select-none"
                      />
                      {/* Gradient overlay at bottom for text readability */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                      {img.isPrimary && (
                        <span 
                          className="absolute top-3 left-3 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-lg z-10"
                          style={{ 
                            background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blue}cc)`,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          ★ Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Category badge floating on the image */}
                <div 
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10"
                >
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-bold shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <span className="text-sm">{business.category.icon}</span>
                    <span>{business.category.name}</span>
                  </div>
                </div>

                {/* Left Arrow Button */}
                {sortedImages.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-white transition-all z-10 active:scale-90"
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right Arrow Button */}
                {sortedImages.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-white transition-all z-10 active:scale-90"
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Dot indicators */}
                {sortedImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {sortedImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-full transition-all duration-300 ${
                          idx === currentImageIndex 
                            ? "bg-white w-4 h-1.5" 
                            : "bg-white/40 w-1.5 h-1.5"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Photo counter */}
                {sortedImages.length > 1 && (
                  <div 
                    className="absolute bottom-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white z-10"
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {currentImageIndex + 1}/{sortedImages.length}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div className="relative h-[150px] md:h-[300px] overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${categoryColor}15, ${categoryColor}08)`,
                }}
              >
                {/* Drag handle overlay (mobile only) */}
                <div 
                  className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 z-20 md:hidden cursor-pointer hover:bg-gray-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                />
                
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}10)`,
                      border: `1px solid ${categoryColor}20`,
                    }}
                  >
                    {business.category.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Sin imágenes</span>
                </div>

                {/* Category badge */}
                <div className="absolute bottom-3 left-3 z-10">
                  <div 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-bold shadow-sm"
                    style={{ backgroundColor: categoryColor }}
                  >
                    <span className="text-sm">{business.category.icon}</span>
                    <span>{business.category.name}</span>
                  </div>
                </div>
              </div>
            );
          }
        })()}

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-4 pt-4 pb-32 md:pb-4 flex-1 min-h-0">
          
          {/* ── Header: Name + Close ── */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
                {business.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-all shrink-0 active:scale-90"
              style={{
                background: "rgba(0,0,0,0.05)",
              }}
            >
              <X size={13} className="text-gray-500" />
            </button>
          </div>

          {/* ── Status badges ── */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <span
              className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors"
              style={{
                color: isOpen ? "#15803d" : "#6b7280",
                background: isOpen ? "rgba(34,197,94,0.08)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${isOpen ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <CircleDot size={8} className="md:w-[9px] md:h-[9px]" />
              {openLabel}
            </span>
            {business.verified ? (
              <span 
                className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  color: BRAND.blue,
                  background: `${BRAND.blue}0a`,
                  border: `1px solid ${BRAND.blue}18`,
                }}
              >
                <Shield size={9} className="md:w-2.5 md:h-2.5" />
                Verificado
              </span>
            ) : (
              <span 
                className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  color: "#6b7280",
                  background: "rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <Shield size={9} className="md:w-2.5 md:h-2.5" />
                No verificado
              </span>
            )}
          </div>

          {/* ── Info cards grid ── */}
          <div 
            className="rounded-xl overflow-hidden mb-3"
            style={{
              border: "1px solid rgba(0,0,0,0.06)",
              background: "rgba(0,0,0,0.015)",
            }}
          >
            {/* Address */}
            <div className="flex items-start gap-3 px-3.5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  background: `${BRAND.blue}0c`,
                }}
              >
                <MapPin size={14} style={{ color: BRAND.blue }} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Dirección</span>
                <span className="text-[11.5px] md:text-xs text-gray-700 font-medium leading-relaxed block">{formatBusinessAddress(business)}</span>
              </div>
            </div>

            {/* Hours */}
            {business.hours && (
              <div className="flex items-start gap-3 px-3.5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(245,158,11,0.08)" }}
                >
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Horario</span>
                  <span className="text-[11.5px] md:text-xs text-gray-700 font-medium leading-relaxed block">{business.hours}</span>
                </div>
              </div>
            )}

            {/* Phone */}
            {phoneNumber && (
              <div className="flex items-center gap-3 px-3.5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,197,94,0.08)" }}
                >
                  <Phone size={14} className="text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Teléfono</span>
                  <span className="text-[11.5px] md:text-xs text-gray-700 font-medium block">{business.phone}</span>
                </div>
              </div>
            )}

            {/* Distance */}
            {hasValidDistance && (
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${BRAND.red}0c` }}
                >
                  <Navigation size={14} style={{ color: BRAND.red }} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Distancia</span>
                  <span className="text-[11.5px] md:text-xs font-bold block" style={{ color: BRAND.blue }}>
                    {business.distance} km de tu ubicación
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Social Links Row ── */}
          {(business.website || business.instagram || business.facebook || business.tiktok) && (
            <div className="flex flex-wrap gap-2 mb-1">
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    color: BRAND.blue,
                    background: `${BRAND.blue}08`,
                    border: `1px solid ${BRAND.blue}15`,
                  }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span>Web</span>
                </a>
              )}
              {business.instagram && (
                <a
                  href={business.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    color: "#E1306C",
                    background: "rgba(225,48,108,0.06)",
                    border: "1px solid rgba(225,48,108,0.12)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <span>Instagram</span>
                </a>
              )}
              {business.facebook && (
                <a
                  href={business.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    color: "#1877F2",
                    background: "rgba(24,119,242,0.06)",
                    border: "1px solid rgba(24,119,242,0.12)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  <span>Facebook</span>
                </a>
              )}
              {business.tiktok && (
                <a
                  href={business.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    color: "#010101",
                    background: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                  <span>TikTok</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Desktop action buttons ── */}
        <div className="hidden md:block px-4 pb-4 pt-3 bg-white flex-shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex gap-2">
            <button
              onClick={handleCall}
              disabled={!phoneNumber}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all hover:shadow-lg disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blue}dd)`,
                boxShadow: `0 4px 14px -2px ${BRAND.blue}30`,
              }}
            >
              <Phone size={14} />
              <span>Llamar</span>
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={!whatsappNumber}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all hover:shadow-lg disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #25D366, #20BD5A)",
                boxShadow: "0 4px 14px -2px rgba(37,211,102,0.3)",
              }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onStartNavigation}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold active:scale-95 transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.red}dd)`,
                boxShadow: `0 4px 14px -2px ${BRAND.red}30`,
              }}
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
