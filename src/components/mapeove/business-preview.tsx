"use client";

import { Business, BRAND, CATEGORY_COLORS } from "@/types/mapeove";
import { X, CircleDot, ChevronRight } from "lucide-react";

interface BusinessPreviewProps {
  business: Business;
  onClose: () => void;
  onViewDetails: () => void;
}

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
      return { isOpen: true, label: "Abierto" };
    } else {
      return { isOpen: false, label: "Cerrado" };
    }
  }

  return { isOpen: false, label: hours };
}

export function BusinessPreview({
  business,
  onClose,
  onViewDetails,
}: BusinessPreviewProps) {
  const categoryColor = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
  const { isOpen, label: openLabel } = getOpenStatus(business.hours);

  return (
    <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[30vh] md:max-h-none md:max-w-[420px] md:mx-auto md:rounded-2xl md:mb-3 border border-gray-100">
      {/* Drag handle (mobile) */}
      <div className="flex justify-center pt-2 pb-1 md:hidden">
        <div className="w-9 h-1 rounded-full bg-gray-300" />
      </div>

      <div className="flex p-3 relative gap-3">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={14} className="text-gray-500" />
        </button>

        {/* Left Side: Thumbnail Image or Category Icon */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative bg-gray-50 flex items-center justify-center">
          {business.image ? (
            <img
              src={business.image}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              {business.category.icon}
            </div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
          <div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white leading-tight uppercase"
              style={{ backgroundColor: categoryColor }}
            >
              {business.category.icon} {business.category.name}
            </span>

            <h3 className="text-sm font-bold text-gray-900 leading-snug mt-1 truncate">
              {business.name}
            </h3>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                  isOpen ? "text-green-600" : "text-gray-400"
                }`}
              >
                <CircleDot size={8} className="fill-current" />
                {openLabel}
              </span>
              {business.verified && (
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.2 rounded-full scale-90 origin-left">
                  ✓ Verificado
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onViewDetails}
            className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 rounded-lg text-white text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ backgroundColor: BRAND.blue }}
          >
            <span>Ver detalles</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
