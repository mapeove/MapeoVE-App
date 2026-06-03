"use client";

import { useState, useEffect } from "react";
import { Business, BRAND, CATEGORY_COLORS } from "@/types/mapeove";
import { useAuth } from "@/hooks/use-auth";
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
  Pencil,
  Save,
  Upload,
  Trash2,
  Walk,
  Bike,
  Car,
  ChevronRight,
  Loader2
} from "lucide-react";

interface BusinessDetailProps {
  business: Business;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  onRefresh?: () => void;
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
      return { isOpen: true, label: "Abierto ahora" };
    } else {
      return { isOpen: false, label: "Cerrado" };
    }
  }

  return { isOpen: false, label: hours };
}

function getTravelTimes(distanceKm: number) {
  // Road-network layout factor
  const roadDistance = distanceKm * 1.3;

  const times = {
    walking: Math.round((roadDistance / 5) * 60),
    cycling: Math.round((roadDistance / 15) * 60),
    moto: Math.round((roadDistance / 40) * 60),
    car: Math.round((roadDistance / 50) * 60),
  };

  const formatTime = (mins: number) => {
    if (mins < 1) return "Menos de 1 min";
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs} h ${remainingMins} min` : `${hrs} h`;
  };

  return {
    walking: formatTime(times.walking),
    cycling: formatTime(times.cycling),
    moto: formatTime(times.moto),
    car: formatTime(times.car),
  };
}

export function BusinessDetail({
  business,
  onClose,
  userLocation,
  onRefresh,
}: BusinessDetailProps) {
  const { user } = useAuth();
  const categoryColor = CATEGORY_COLORS[business.category.slug] || BRAND.blue;

  // Habilitar edición si es SUPER_ADMIN o el OWNER de este negocio
  const canEdit =
    user !== null &&
    (user.role === "SUPER_ADMIN" ||
      (user.role === "OWNER" && business.ownerId === user.id));

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(business.phone || "");
  const [editWhatsapp, setEditWhatsapp] = useState(business.whatsapp || "");
  const [editHours, setEditHours] = useState(business.hours || "");
  const [editAddress, setEditAddress] = useState(business.address || "");
  const [editImage, setEditImage] = useState(business.image || "");
  const [editImages, setEditImages] = useState<string[]>(business.images || []);
  const [saveLoading, setSaveLoading] = useState(false);

  // Gallery active image
  const allImages = [business.image, ...(business.images || [])].filter(Boolean) as string[];
  const [activeImage, setActiveImage] = useState<string | null>(
    allImages.length > 0 ? allImages[0] : null
  );

  // Reset active image when business changes
  useEffect(() => {
    const updatedImages = [business.image, ...(business.images || [])].filter(Boolean) as string[];
    setActiveImage(updatedImages.length > 0 ? updatedImages[0] : null);
    setIsEditing(false);
    setEditPhone(business.phone || "");
    setEditWhatsapp(business.whatsapp || "");
    setEditHours(business.hours || "");
    setEditAddress(business.address || "");
    setEditImage(business.image || "");
    setEditImages(business.images || []);
    setShowRoutes(false);
  }, [business]);

  // Route calculation states
  const [showRoutes, setShowRoutes] = useState(false);

  const hasValidDistance =
    business.distance !== undefined &&
    userLocation !== null &&
    isInVenezuela(userLocation.lat, userLocation.lng);

  const travelTimes = business.distance !== undefined ? getTravelTimes(business.distance) : null;
  const { isOpen, label: openLabel } = getOpenStatus(business.hours);

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, isGallery = false) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (isGallery) {
          setEditImages((prev) => [...prev, data.url]);
        } else {
          setEditImage(data.url);
        }
      } else {
        alert(data.error || "Error al subir imagen");
      }
    } catch {
      alert("Error al conectar con el servidor de carga");
    }
  }

  async function handleSave() {
    setSaveLoading(true);
    try {
      const payload: Record<string, any> = {
        phone: editPhone,
        whatsapp: editWhatsapp,
        hours: editHours,
        image: editImage || null,
        images: editImages,
      };

      if (user?.role === "SUPER_ADMIN") {
        payload.address = editAddress;
      }

      const res = await fetch(`/api/businesses/${business.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || "Error al guardar cambios");
      }
    } catch {
      alert("Error de red, intenta de nuevo");
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[50vh] md:max-h-none md:max-w-[420px] md:mx-auto md:rounded-2xl md:mb-3 border border-gray-100 flex flex-col">
      {/* Drag handle (mobile) */}
      <div className="flex justify-center pt-2 pb-0 md:hidden flex-shrink-0">
        <div className="w-9 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header Image or Colored Ribbon */}
      <div className="relative h-28 md:h-32 overflow-hidden flex-shrink-0 bg-gray-50">
        {activeImage ? (
          <img
            src={activeImage}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${categoryColor}15` }}
          >
            {business.category.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/35 hover:bg-black/60 transition-colors z-10"
        >
          <X size={14} className="text-white" />
        </button>

        {/* Edit Button */}
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors text-gray-700 z-10 active:scale-90"
          >
            <Pencil size={12} />
          </button>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-2 left-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white leading-tight shadow-sm uppercase"
            style={{ backgroundColor: categoryColor }}
          >
            {business.category.icon} {business.category.name}
          </span>
        </div>
      </div>

      {/* Gallery Carousel (Thumbnails) */}
      {allImages.length > 1 && !isEditing && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 px-4 mt-2 scrollbar-none flex-shrink-0">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                activeImage === img ? "border-blue-600 scale-95" : "border-transparent"
              }`}
            >
              <img src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Content scroll container */}
      <div className="overflow-y-auto flex-1 px-4 pt-2.5 pb-4">
        {isEditing ? (
          /* ========================================================================= */
          /* EDIT MODE FORM */
          /* ========================================================================= */
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase">Editar Datos del Negocio</h3>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  {saveLoading ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                  <span>Guardar</span>
                </button>
              </div>
            </div>

            {user?.role === "SUPER_ADMIN" && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Dirección (Admin)</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Teléfono</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">WhatsApp (con código, ej. +58412...)</label>
              <input
                type="text"
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase">Horarios</label>
              <input
                type="text"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Edit Main Image */}
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-gray-500 uppercase block">Imagen Principal</span>
                <span className="text-[8px] text-gray-400">Sube una foto directamente</span>
              </div>
              <div className="flex items-center gap-2">
                {editImage && (
                  <img src={editImage} className="w-8 h-8 object-cover rounded-lg border border-gray-200" />
                )}
                <label className="flex items-center gap-0.5 px-2 py-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-lg cursor-pointer hover:bg-blue-700 shadow-sm">
                  <Upload size={10} />
                  <span>Subir</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                </label>
              </div>
            </div>

            {/* Edit Gallery Images */}
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase block">Fotos de la Galería</span>
                  <span className="text-[8px] text-gray-400">Añade múltiples capturas</span>
                </div>
                <label className="flex items-center gap-0.5 px-2 py-1.5 bg-purple-600 text-white text-[9px] font-bold rounded-lg cursor-pointer hover:bg-purple-700 shadow-sm">
                  <Upload size={10} />
                  <span>Añadir</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                </label>
              </div>

              {editImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 bg-white">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 text-white flex items-center justify-center rounded-full shadow-sm"
                      >
                        <X size={6} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* DISPLAY MODE */
          /* ========================================================================= */
          <>
            {/* Title & Badges */}
            <h2 className="text-base font-bold text-gray-900 leading-tight pr-6">
              {business.name}
            </h2>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isOpen ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-100"
                }`}
              >
                <CircleDot size={8} />
                {openLabel}
              </span>
              {business.verified && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  <Shield size={9} />
                  Verificado
                </span>
              )}
            </div>

            {/* Description */}
            {business.description && (
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                {business.description}
              </p>
            )}

            {/* Details Rows */}
            <div className="mt-3 space-y-2 border-t border-b border-gray-50 py-2.5">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600 leading-tight">{business.address}</span>
              </div>
              {business.hours && (
                <div className="flex items-start gap-2">
                  <Clock size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 leading-tight">{business.hours}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{business.phone}</span>
                </div>
              )}
              {hasValidDistance && (
                <div className="flex items-center gap-2">
                  <Navigation size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-bold" style={{ color: BRAND.blue }}>
                    A {business.distance} km de ti
                  </span>
                </div>
              )}
            </div>

            {/* Internal Routes (Estimated times) */}
            {showRoutes && travelTimes && (
              <div className="mt-3 bg-blue-50/50 rounded-xl p-3 border border-blue-100 animate-slide-up">
                <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                  Tiempos Estimados de Viaje (Ruta MapeoVE)
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-blue-100 flex flex-col items-center justify-between">
                    <span className="text-blue-600 font-bold block mb-1">🚶</span>
                    <span className="text-[9px] text-gray-400 font-medium">Caminando</span>
                    <span className="text-[11px] font-bold text-gray-800 mt-0.5">{travelTimes.walking}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100 flex flex-col items-center justify-between">
                    <span className="text-blue-600 font-bold block mb-1">🚲</span>
                    <span className="text-[9px] text-gray-400 font-medium">Bicicleta</span>
                    <span className="text-[11px] font-bold text-gray-800 mt-0.5">{travelTimes.cycling}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100 flex flex-col items-center justify-between">
                    <span className="text-blue-600 font-bold block mb-1">🛵</span>
                    <span className="text-[9px] text-gray-400 font-medium">Moto</span>
                    <span className="text-[11px] font-bold text-gray-800 mt-0.5">{travelTimes.moto}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100 flex flex-col items-center justify-between">
                    <span className="text-blue-600 font-bold block mb-1">🚗</span>
                    <span className="text-[9px] text-gray-400 font-medium">Coche</span>
                    <span className="text-[11px] font-bold text-gray-800 mt-0.5">{travelTimes.car}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3.5 flex gap-2">
              {business.phone && (
                <button
                  onClick={handleCall}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  <Phone size={13} />
                  <span>Llamar</span>
                </button>
              )}
              {business.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </button>
              )}
              {hasValidDistance && (
                <button
                  onClick={() => setShowRoutes(!showRoutes)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95 shadow-sm"
                  style={{ backgroundColor: BRAND.red }}
                >
                  <Navigation size={13} />
                  <span>{showRoutes ? "Ver Detalles" : "Cómo llegar"}</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
