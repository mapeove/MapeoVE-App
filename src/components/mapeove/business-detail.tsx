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
  ChevronRight,
} from "lucide-react";

interface BusinessDetailProps {
  business: Business;
  onClose: () => void;
}

export function BusinessDetail({ business, onClose }: BusinessDetailProps) {
  const categoryColor = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
  const whatsappNumber = business.whatsapp?.replace(/[^0-9]/g, "") || "";
  const phoneNumber = business.phone?.replace(/[^0-9]/g, "") || "";

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
    window.open(
      `https://www.openstreetmap.org/directions?from=&to=${business.latitude},${business.longitude}`,
      "_blank"
    );
  }

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">
      {/* Color header bar */}
      <div className="h-2" style={{ backgroundColor: categoryColor }} />

      <div className="p-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={16} className="text-gray-600" />
        </button>

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {business.category.icon} {business.category.name}
          </span>
          {business.verified && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Shield size={12} />
              Verificado
            </span>
          )}
        </div>

        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 pr-8 leading-tight">
          {business.name}
        </h2>

        {/* Description */}
        {business.description && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {business.description}
          </p>
        )}

        {/* Info rows */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{business.address}</span>
          </div>
          {business.hours && (
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{business.hours}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{business.phone}</span>
            </div>
          )}
          {business.distance !== undefined && (
            <div className="flex items-start gap-3">
              <Navigation size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium" style={{ color: BRAND.blue }}>
                {business.distance} km de distancia
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-2.5">
          {phoneNumber && (
            <button
              onClick={handleCall}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: BRAND.blue }}
            >
              <Phone size={16} />
              Llamar
            </button>
          )}
          {whatsappNumber && (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </button>
          )}
          <button
            onClick={handleDirections}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND.red }}
          >
            <Navigation size={16} />
            Cómo llegar
          </button>
        </div>
      </div>
    </div>
  );
}
