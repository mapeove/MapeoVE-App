"use client";

import { useState, useEffect } from "react";
import { X, Store, Clock, MessageCircle, Phone, MapPin, CheckCircle, Camera, Upload, Trash2, Edit2 } from "lucide-react";
import { BRAND, formatBusinessAddress } from "@/types/mapeove";
import { VENEZUELA_LOCATIONS } from "@/lib/venezuela-locations";
import { PromotionRequestForm } from "./promotion-request-form";
import dynamic from "next/dynamic";

const LocationSelectorMap = dynamic(() => import("./location-selector-map"), { ssr: false });

interface RegisterLocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface RequestData {
  id: string;
  businessName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export function RegisterLocalModal({ isOpen, onClose, user }: RegisterLocalModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingRequests, setExistingRequests] = useState<RequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"datos" | "fotos" | "promocionar">("datos");

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; path: string; isPrimary: boolean }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const [businessEmail, setBusinessEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Structured Address Fields
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [parish, setParish] = useState("");
  
  // Custom helper states for dropdown selections
  const [selectedCity, setSelectedCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [selectedParish, setSelectedParish] = useState("");
  const [customParish, setCustomParish] = useState("");

  const [selectedSectorType, setSelectedSectorType] = useState("Urbanización");
  const [customSectorType, setCustomSectorType] = useState("");
  const [sectorType, setSectorType] = useState("Urbanización");
  const [sectorName, setSectorName] = useState("");

  const [selectedStreetType, setSelectedStreetType] = useState("Calle");
  const [customStreetType, setCustomStreetType] = useState("");
  const [streetType, setStreetType] = useState("Calle");
  const [streetName, setStreetName] = useState("");

  const [houseNumber, setHouseNumber] = useState("");
  const [reference, setReference] = useState("");

  // Owner Edit Mode States
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [isEditingUserBiz, setIsEditingUserBiz] = useState(false);
  const [userBizEditSaving, setUserBizEditSaving] = useState(false);
  const [userBizEditSuccess, setUserBizEditSuccess] = useState(false);

  // Sync city field
  useEffect(() => {
    if (selectedCity === "Otra ciudad") {
      setCity(customCity);
    } else {
      setCity(selectedCity);
    }
  }, [selectedCity, customCity]);

  // Sync parish field
  useEffect(() => {
    if (selectedParish === "Otra parroquia") {
      setParish(customParish);
    } else {
      setParish(selectedParish);
    }
  }, [selectedParish, customParish]);

  // Sync sectorType field
  useEffect(() => {
    if (selectedSectorType === "Otro") {
      setSectorType(customSectorType);
    } else {
      setSectorType(selectedSectorType);
    }
  }, [selectedSectorType, customSectorType]);

  // Sync streetType field
  useEffect(() => {
    if (selectedStreetType === "Otro") {
      setStreetType(customStreetType);
    } else {
      setStreetType(selectedStreetType);
    }
  }, [selectedStreetType, customStreetType]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset form fields
    setBusinessName("");
    setAddress("");
    setPhone("");
    setWhatsapp("");
    setDescription("");
    setOpeningHours("");
    setNote("");
    setLatitude(null);
    setLongitude(null);
    setUploadedImages([]);
    setBusinessEmail("");
    setWebsite("");
    setInstagram("");
    setFacebook("");
    setTiktok("");
    setError("");
    setSuccess(false);

    setState("");
    setCity("");
    setParish("");
    setSelectedCity("");
    setCustomCity("");
    setSelectedParish("");
    setCustomParish("");

    setSectorType("Urbanización");
    setSelectedSectorType("Urbanización");
    setCustomSectorType("");
    setSectorName("");

    setStreetType("Calle");
    setSelectedStreetType("Calle");
    setCustomStreetType("");
    setStreetName("");

    setHouseNumber("");
    setReference("");

    // Reset edit states
    setEditingBusinessId(null);
    setIsEditingUserBiz(false);
    setUserBizEditSaving(false);
    setUserBizEditSuccess(false);

    // Load categories
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          const cats = json && json.success && Array.isArray(json.data) 
            ? json.data 
            : (Array.isArray(json) ? json : []);
          setCategories(cats);
          if (cats.length > 0) setCategoryId(cats[0].id);
        } else {
          setError("Error al cargar las categorías.");
        }
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Error de conexión al cargar las categorías.");
      }
    }

    // Load existing requests
    async function loadRequests() {
      setLoadingRequests(true);
      try {
        const res = await fetch("/api/business-requests/me");
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            const reqs = Array.isArray(data.requests) ? data.requests : [];
            setExistingRequests(reqs);
            const approvedReq = reqs.find((r: any) => r.status === "APPROVED" && r.businessId);
            if (approvedReq) {
              handleStartEdit(approvedReq.businessId);
            }
          } else {
            setError("Error al obtener tus solicitudes.");
          }
        } else {
          setError("Error de servidor al cargar tus solicitudes.");
        }
      } catch (err) {
        console.error("Error loading my requests:", err);
        setError("Error de conexión al cargar tus solicitudes.");
      } finally {
        setLoadingRequests(false);
      }
    }

    loadCategories();
    loadRequests();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const MAX_PHOTOS = 5;
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    const slotsAvailable = MAX_PHOTOS - uploadedImages.length;

    if (slotsAvailable <= 0) {
      setError(`Ya alcanzaste el límite máximo de ${MAX_PHOTOS} fotos.`);
      e.target.value = "";
      return;
    }

    if (files.length > slotsAvailable) {
      setError(`Solo puedes agregar ${slotsAvailable} foto${slotsAvailable === 1 ? "" : "s"} más. Seleccionaste ${files.length}.`);
      e.target.value = "";
      return;
    }

    // Validate ALL files before uploading any
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(`"${file.name}" tiene un formato no permitido. Use JPG, JPEG, PNG o WEBP.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" supera los 5MB permitidos por imagen.`);
        e.target.value = "";
        return;
      }
    }

    setError("");
    setUploadingImage(true);
    setUploadProgress({ current: 0, total: files.length });

    const tempPath = `temp-requests/temp-req-${user?.id || 'guest'}-${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", tempPath);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUploadedImages((prev) => {
            const isFirst = prev.length === 0;
            return [...prev, { url: data.url, path: data.path, isPrimary: isFirst }];
          });
        } else {
          setError(data.error || `Error al subir "${file.name}".`);
          break;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        setError(`Error de conexión al subir "${file.name}".`);
        break;
      }
    }

    setUploadingImage(false);
    setUploadProgress(null);
    e.target.value = "";
  };

  const handleSetPrimary = (index: number) => {
    setUploadedImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!businessName || !categoryId || !phone || !whatsapp) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (!state || !state.trim()) {
      setError("El Estado es obligatorio");
      return;
    }
    if (!city || !city.trim()) {
      setError("La Ciudad/Municipio es obligatoria");
      return;
    }
    const hasZone = !!(sectorName && sectorName.trim());
    const hasStreet = !!(streetName && streetName.trim());
    if (!hasZone && !hasStreet) {
      setError("Debes indicar al menos el Nombre de zona o el Nombre de vía/calle");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Debes seleccionar la ubicación en el mapa");
      return;
    }

    setSubmitting(true);
    try {
      const imagesPayload = [
        ...uploadedImages.filter((img) => img.isPrimary).map((img) => img.url),
        ...uploadedImages.filter((img) => !img.isPrimary).map((img) => img.url),
      ];

      const constructedAddress = formatBusinessAddress({
        address: "",
        state,
        city,
        parish,
        sectorType,
        sectorName,
        streetType,
        streetName,
        houseNumber,
        reference,
      });

      const res = await fetch("/api/business-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          categoryId,
          address: constructedAddress,
          phone,
          whatsapp,
          description,
          openingHours,
          note,
          latitude,
          longitude,
          images: imagesPayload,
          businessEmail: businessEmail.trim() || null,
          website: website.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          tiktok: tiktok.trim() || null,
          state,
          city,
          parish,
          sectorType,
          sectorName,
          streetType,
          streetName,
          houseNumber,
          reference,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        // Refresh requests list
        setExistingRequests([data.request, ...(Array.isArray(existingRequests) ? existingRequests : [])]);
      } else {
        setError(data.error || "Ocurrió un error al enviar la solicitud");
      }
    } catch {
      setError("Error de conexión al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = async (bizId: string) => {
    setError("");
    setEditingBusinessId(bizId);
    try {
      const res = await fetch(`/api/businesses/${bizId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const biz = data.data;
          setBusinessName(biz.name);
          setCategoryId(biz.categoryId);
          setAddress(biz.address);
          setLatitude(biz.latitude);
          setLongitude(biz.longitude);
          setPhone(biz.phone || "");
          setWhatsapp(biz.whatsapp || "");
          setOpeningHours(biz.hours || "");
          setDescription(biz.description || "");
          setBusinessEmail(biz.businessEmail || "");
          setWebsite(biz.website || "");
          setInstagram(biz.instagram || "");
          setFacebook(biz.facebook || "");
          setTiktok(biz.tiktok || "");

          const dbState = biz.state || "";
          const dbCity = biz.city || "";
          const dbParish = biz.parish || "";
          const dbSectorType = biz.sectorType || "Urbanización";
          const dbStreetType = biz.streetType || "Calle";

          setState(dbState);
          setCity(dbCity);
          setParish(dbParish);
          setSectorName(biz.sectorName || "");
          setHouseNumber(biz.houseNumber || "");
          setReference(biz.reference || "");

          // Find state & city objects to check city list and parishes
          const stateObj = VENEZUELA_LOCATIONS.find((s) => s.name === dbState);
          const cityList = stateObj?.cities.map((c) => c.name) || [];

          if (dbCity) {
            if (cityList.includes(dbCity)) {
              setSelectedCity(dbCity);
              setCustomCity("");
            } else {
              setSelectedCity("Otra ciudad");
              setCustomCity(dbCity);
            }
          } else {
            setSelectedCity("");
            setCustomCity("");
          }

          const cityObj = stateObj?.cities.find((c) => c.name === dbCity);
          const parishList = cityObj?.parishes || [];

          if (dbParish) {
            if (parishList.includes(dbParish)) {
              setSelectedParish(dbParish);
              setCustomParish("");
            } else {
              setSelectedParish("Otra parroquia");
              setCustomParish(dbParish);
            }
          } else {
            setSelectedParish("");
            setCustomParish("");
          }


          const standardSectors = ["Urbanización", "Barrio", "Sector", "Casco Central", "Zona Industrial", "Conjunto Residencial", "Centro Comercial", "Edificio"];
          if (dbSectorType) {
            if (standardSectors.includes(dbSectorType)) {
              setSelectedSectorType(dbSectorType);
              setCustomSectorType("");
              setSectorType(dbSectorType);
            } else {
              setSelectedSectorType("Otro");
              setCustomSectorType(dbSectorType);
              setSectorType(dbSectorType);
            }
          } else {
            setSelectedSectorType("Urbanización");
            setCustomSectorType("");
            setSectorType("Urbanización");
          }

          const standardStreets = ["Calle", "Avenida", "Vereda", "Callejón", "Carretera", "Troncal", "Redoma", "Vía Principal", "Vía Secundaria"];
          if (dbStreetType) {
            if (standardStreets.includes(dbStreetType)) {
              setSelectedStreetType(dbStreetType);
              setCustomStreetType("");
              setStreetType(dbStreetType);
            } else {
              setSelectedStreetType("Otro");
              setCustomStreetType(dbStreetType);
              setStreetType(dbStreetType);
            }
          } else {
            setSelectedStreetType("Calle");
            setCustomStreetType("");
            setStreetType("Calle");
          }

          setIsEditingUserBiz(true);
        } else {
          setError("No se pudieron cargar los datos del local.");
        }
      } else {
        setError("Error al obtener los datos del local.");
      }
    } catch (err) {
      console.error("Error loading business for edit:", err);
      setError("Error de conexión al obtener los datos.");
    }
  };

  const handleSaveUserBiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUserBizEditSuccess(false);

    if (!businessName || !categoryId || !phone || !whatsapp) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Debes seleccionar la ubicación en el mapa");
      return;
    }

    if (!state || !state.trim()) {
      setError("El Estado es obligatorio");
      return;
    }
    if (!city || !city.trim()) {
      setError("La Ciudad/Municipio es obligatoria");
      return;
    }
    const hasZone = !!(sectorName && sectorName.trim());
    const hasStreet = !!(streetName && streetName.trim());
    if (!hasZone && !hasStreet) {
      setError("Debes indicar al menos el Nombre de zona o el Nombre de vía/calle");
      return;
    }

    const finalAddress = formatBusinessAddress({
      address: address || "",
      state,
      city,
      parish,
      sectorType,
      sectorName,
      streetType,
      streetName,
      houseNumber,
      reference,
    });

    if (!finalAddress) {
      setError("La dirección no puede estar vacía");
      return;
    }

    setUserBizEditSaving(true);
    try {
      const res = await fetch(`/api/businesses/${editingBusinessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          categoryId,
          address: finalAddress,
          latitude,
          longitude,
          phone,
          whatsapp,
          hours: openingHours,
          description,
          businessEmail: businessEmail.trim() || null,
          website: website.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          tiktok: tiktok.trim() || null,
          state: state || null,
          city: city || null,
          parish: parish || null,
          sectorType: sectorType || null,
          sectorName: sectorName || null,
          streetType: streetType || null,
          streetName: streetName || null,
          houseNumber: houseNumber || null,
          reference: reference || "",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUserBizEditSuccess(true);
        setError("");
        setTimeout(() => {
          setIsEditingUserBiz(false);
          setEditingBusinessId(null);
          setUserBizEditSuccess(false);
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || "Ocurrió un error al guardar los cambios");
      }
    } catch (err) {
      console.error("Error updating user business:", err);
      setError("Error de conexión al guardar los cambios");
    } finally {
      setUserBizEditSaving(false);
    }
  };

  // Payment price calculation removed — registration is now free

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Pendiente de aprobación</span>;
      case "APPROVED":
        return <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Aprobado</span>;
      case "REJECTED":
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Rechazado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {showMapSelector && (
        <LocationSelectorMap 
          initialLat={latitude}
          initialLng={longitude}
          onClose={() => setShowMapSelector(false)} 
          onSelect={(lat, lng, address) => {
            setLatitude(lat);
            setLongitude(lng);
            if (address) {
              setAddress(address);
            }
            setShowMapSelector(false);
          }} 
        />
      )}
      
      <div 
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden border border-gray-100 animate-scale-in pb-12 sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 text-white shrink-0"
          style={{ backgroundColor: BRAND.blue }}
        >
          <div className="flex items-center gap-2">
            <Store size={18} />
            <h3 className="font-bold text-sm">Mi negocio</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}
          
          {loadingRequests ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Cargando estado...</span>
            </div>
          ) : isEditingUserBiz ? (
            /* User Business Edit Form */
            <form onSubmit={handleSaveUserBiz} className="space-y-4 pb-4">
              {/* TABS */}
              <div className="flex items-center gap-1 border-b border-gray-100 pb-2 mb-4 shrink-0 overflow-x-auto no-scrollbar">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab("datos"); }}
                  className={`px-3 py-2 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "datos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Datos del negocio
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab("fotos"); }}
                  className={`px-3 py-2 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "fotos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Fotos y perfil
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab("promocionar"); }}
                  className={`px-3 py-2 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "promocionar" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Promocionar
                </button>
              </div>

              <div className={activeTab === "datos" ? "space-y-3" : "hidden"}>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Store size={14} className="text-blue-600" />
                  <span>Editar Datos de tu Negocio</span>
                </h4>

                {userBizEditSuccess && (
                  <div className="p-3 text-xs bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="font-bold">Datos actualizados correctamente.</span>
                  </div>
                )}
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hamburguesas El Catire"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Categoría *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 font-medium"
                    >
                      {(Array.isArray(categories) ? categories : []).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Horario *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <Clock size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 8:00 AM - 6:00 PM"
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Teléfono Fijo / Móvil *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 0244-1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">WhatsApp *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <MessageCircle size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej. +584121234567"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {/* DIRECCIÓN ESTRUCTURADA */}
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-150 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Dirección Estructurada</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Estado *</label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(val);
                          setCity("");
                          setSelectedCity("");
                          setCustomCity("");
                          setSelectedParish("");
                          setCustomParish("");
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      >
                        <option value="">Selecciona estado</option>
                        {VENEZUELA_LOCATIONS.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Ciudad/Municipio *</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCity(val);
                          if (val !== "Otra ciudad") setCustomCity("");
                          setSelectedParish("");
                          setCustomParish("");
                        }}
                        disabled={!state}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Selecciona ciudad</option>
                        {VENEZUELA_LOCATIONS.find((s) => s.name === state)?.cities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                        <option value="Otra ciudad">Otra ciudad / municipio</option>
                      </select>
                      {selectedCity === "Otra ciudad" && (
                        <input
                          type="text"
                          placeholder="Ej. Colonia Tovar, El Junquito..."
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          className="mt-1.5 w-full px-2.5 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Parroquia</label>
                      <select
                        value={selectedParish}
                        onChange={(e) => {
                          setSelectedParish(e.target.value);
                          if (e.target.value !== "Otra parroquia") {
                            setCustomParish("");
                          }
                        }}
                        disabled={!city}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Selecciona parroquia (opcional)</option>
                        {(VENEZUELA_LOCATIONS.find((s) => s.name === state)?.cities.find((c) => c.name === city)?.parishes || []).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="Otra parroquia">Otra parroquia</option>
                      </select>
                    </div>
                  </div>

                  {selectedParish === "Otra parroquia" && (
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Escribe la parroquia *</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Vicente Bolívar"
                        value={customParish}
                        onChange={(e) => setCustomParish(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Tipo de zona *</label>
                      <select
                        value={selectedSectorType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSectorType(val);
                          if (val !== "Otro") {
                            setCustomSectorType("");
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      >
                        <option value="Urbanización">Urbanización</option>
                        <option value="Barrio">Barrio</option>
                        <option value="Sector">Sector</option>
                        <option value="Casco Central">Casco Central</option>
                        <option value="Zona Industrial">Zona Industrial</option>
                        <option value="Conjunto Residencial">Conjunto Residencial</option>
                        <option value="Centro Comercial">Centro Comercial</option>
                        <option value="Edificio">Edificio</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Nombre de zona (opcional si hay calle/vía)</label>
                      <input
                        type="text"
                        placeholder="Ej. Las Mercedes o Centro"
                        value={sectorName}
                        onChange={(e) => setSectorName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>

                  {selectedSectorType === "Otro" && (
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Especifica tipo de zona *</label>
                      <input
                        type="text"
                        placeholder="Ej. Caserío, Parcelamiento..."
                        value={customSectorType}
                        onChange={(e) => setCustomSectorType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Tipo de vía *</label>
                      <select
                        value={selectedStreetType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedStreetType(val);
                          if (val !== "Otro") {
                            setCustomStreetType("");
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      >
                        <option value="Calle">Calle</option>
                        <option value="Avenida">Avenida</option>
                        <option value="Vereda">Vereda</option>
                        <option value="Callejón">Callejón</option>
                        <option value="Carretera">Carretera</option>
                        <option value="Troncal">Troncal</option>
                        <option value="Redoma">Redoma</option>
                        <option value="Vía Principal">Vía Principal</option>
                        <option value="Vía Secundaria">Vía Secundaria</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Nombre de calle/vía (opcional si hay zona)</label>
                      <input
                        type="text"
                        placeholder="Ej. Calle Nieves o Av. Bolívar"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>

                  {selectedStreetType === "Otro" && (
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Especifica tipo de vía *</label>
                      <input
                        type="text"
                        placeholder="Ej. Autopista, Calzada..."
                        value={customStreetType}
                        onChange={(e) => setCustomStreetType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Número de casa/local/apto (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Local 10, Casa S/N, Quinta María..."
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Punto de Referencia (Recomendado)</label>
                    <textarea
                      placeholder="Ej. Frente a la plaza, portón verde, al lado de la farmacia..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 resize-none"
                    />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Recomendado para Venezuela: escribe una referencia clara si existe, por ejemplo: frente a la plaza, portón verde, al lado de la farmacia. Si no tienes una referencia conocida, puedes dejarlo vacío.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Ubicación en el Mapa *</label>
                  <button
                    type="button"
                    onClick={() => setShowMapSelector(true)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-gray-200"
                  >
                    <MapPin size={14} className="text-red-500" />
                    {latitude && longitude ? (
                      <span className="text-green-600">✓ Ubicación Seleccionada ({latitude.toFixed(5)}, {longitude.toFixed(5)})</span>
                    ) : (
                      <span>Seleccionar en el Mapa</span>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Descripción del Negocio</label>
                  <textarea
                    placeholder="Describe los productos o servicios que ofreces..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5 pt-2 border-t border-gray-100">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Correo electrónico del negocio (Privado - solo Admin)</label>
                    <input
                      type="email"
                      placeholder="Ej. contacto@tunegocio.com"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Página Web (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. www.tunegocio.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Instagram (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. @tunegocio o URL"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Facebook (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. tunegocio o URL"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">TikTok (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. @tunegocio o URL"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Guardar / Cancelar */}
              
              <div className={activeTab === "promocionar" ? "space-y-3" : "hidden"}>
                {editingBusinessId ? (
                  <PromotionRequestForm businessId={editingBusinessId} />
                ) : (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center space-y-2">
                    <p className="text-xs text-blue-900 font-medium">
                      Para solicitar una promoción, primero debes registrar tu negocio de forma gratuita.
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Una vez registrado, vuelve a esta sección para pagar con USDC y activar la promoción que desees.
                    </p>
                  </div>
                )}
              </div>

              <div className={activeTab === "fotos" ? "space-y-3" : "hidden"}><p className="text-xs text-gray-500 py-4 text-center">La edición de fotos está disponible en la versión Premium o registrando un nuevo local.</p></div>
              <div className={activeTab === "datos" ? "flex gap-2 justify-end pt-3 border-t border-gray-150" : "hidden"}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingUserBiz(false);
                    setEditingBusinessId(null);
                  }}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-250 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userBizEditSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {userBizEditSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          ) : success ? (
            /* Success View */
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-200">
                <CheckCircle size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900">¡Negocio registrado con éxito!</h4>
                <p className="text-xs text-gray-500 px-4 leading-relaxed">
                  Tu negocio ya está visible en el mapa de MapeoVE. Un administrador podrá verificarlo próximamente.
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              {/* TABS */}
              <div className="flex items-center gap-1 border-b border-gray-100 pb-2 mb-4 shrink-0 overflow-x-auto no-scrollbar">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab("datos"); }}
                  className={`px-3 py-2 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "datos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Datos del negocio
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab("fotos"); }}
                  className={`px-3 py-2 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "fotos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Fotos y perfil
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setActiveTab("promocionar"); }}
                  className={`px-3 py-2 text-[11px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "promocionar" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Promocionar
                </button>
              </div>


              {/* Local Details */}
              <div className={activeTab === "datos" ? "space-y-3" : "hidden"}>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Store size={14} className="text-blue-600" />
                  <span>Datos de tu Negocio</span>
                </h4>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hamburguesas El Catire"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Categoría *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 font-medium"
                    >
                      {(Array.isArray(categories) ? categories : []).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Horario *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <Clock size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 8:00 AM - 6:00 PM"
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Teléfono Fijo / Móvil *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 0244-1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">WhatsApp *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                        <MessageCircle size={14} />
                      </span>
                      <input
                        type="text"
                        required
                      required
                      placeholder="Ej. 0424-1234567"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                </div>

                {/* DIRECCIÓN ESTRUCTURADA (EDIT) */}
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-150 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Dirección Estructurada</span>
                  
                  {address && (
                    <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-800">
                      <strong>Dirección registrada actual:</strong> {address}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Estado *</label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(val);
                          setCity("");
                          setSelectedCity("");
                          setCustomCity("");
                          setSelectedParish("");
                          setCustomParish("");
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      >
                        <option value="">Selecciona estado</option>
                        {VENEZUELA_LOCATIONS.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Ciudad/Municipio *</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCity(val);
                          if (val !== "Otra ciudad") setCustomCity("");
                          setSelectedParish("");
                          setCustomParish("");
                        }}
                        disabled={!state}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Selecciona ciudad</option>
                        {VENEZUELA_LOCATIONS.find((s) => s.name === state)?.cities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                        <option value="Otra ciudad">Otra ciudad / municipio</option>
                      </select>
                      {selectedCity === "Otra ciudad" && (
                        <input
                          type="text"
                          placeholder="Ej. Colonia Tovar, El Junquito..."
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          className="mt-1.5 w-full px-2.5 py-2 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                        />
                      )}
                    </div>


                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Parroquia</label>
                      <select
                        value={selectedParish}
                        onChange={(e) => {
                          setSelectedParish(e.target.value);
                          if (e.target.value !== "Otra parroquia") {
                            setCustomParish("");
                          }
                        }}
                        disabled={!city}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Selecciona parroquia (opcional)</option>
                        {(VENEZUELA_LOCATIONS.find((s) => s.name === state)?.cities.find((c) => c.name === city)?.parishes || []).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="Otra parroquia">Otra parroquia</option>
                      </select>
                    </div>
                  </div>

                  {selectedParish === "Otra parroquia" && (
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Escribe la parroquia *</label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Vicente Bolívar"
                        value={customParish}
                        onChange={(e) => setCustomParish(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Tipo de zona *</label>
                      <select
                        value={selectedSectorType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedSectorType(val);
                          if (val !== "Otro") {
                            setCustomSectorType("");
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      >
                        <option value="Urbanización">Urbanización</option>
                        <option value="Barrio">Barrio</option>
                        <option value="Sector">Sector</option>
                        <option value="Casco Central">Casco Central</option>
                        <option value="Zona Industrial">Zona Industrial</option>
                        <option value="Conjunto Residencial">Conjunto Residencial</option>
                        <option value="Centro Comercial">Centro Comercial</option>
                        <option value="Edificio">Edificio</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Nombre de zona (opcional si hay calle/vía)</label>
                      <input
                        type="text"
                        placeholder="Ej. Las Mercedes o Centro"
                        value={sectorName}
                        onChange={(e) => setSectorName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>

                  {selectedSectorType === "Otro" && (
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Especifica tipo de zona *</label>
                      <input
                        type="text"
                        placeholder="Ej. Caserío, Parcelamiento..."
                        value={customSectorType}
                        onChange={(e) => setCustomSectorType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Tipo de vía *</label>
                      <select
                        value={selectedStreetType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedStreetType(val);
                          if (val !== "Otro") {
                            setCustomStreetType("");
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      >
                        <option value="Calle">Calle</option>
                        <option value="Avenida">Avenida</option>
                        <option value="Vereda">Vereda</option>
                        <option value="Callejón">Callejón</option>
                        <option value="Carretera">Carretera</option>
                        <option value="Troncal">Troncal</option>
                        <option value="Redoma">Redoma</option>
                        <option value="Vía Principal">Vía Principal</option>
                        <option value="Vía Secundaria">Vía Secundaria</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Nombre de calle/vía (opcional si hay zona)</label>
                      <input
                        type="text"
                        placeholder="Ej. Calle Nieves o Av. Bolívar"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>

                  {selectedStreetType === "Otro" && (
                    <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Especifica tipo de vía *</label>
                      <input
                        type="text"
                        placeholder="Ej. Autopista, Calzada..."
                        value={customStreetType}
                        onChange={(e) => setCustomStreetType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Número de casa/local/apto (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Local 10, Casa S/N, Quinta María..."
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-gray-400 uppercase mb-1">Punto de Referencia (Recomendado)</label>
                    <textarea
                      placeholder="Ej. Frente a la plaza, portón verde, al lado de la farmacia..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 resize-none"
                    />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Recomendado para Venezuela: escribe una referencia clara si existe, por ejemplo: frente a la plaza, portón verde, al lado de la farmacia. Si no tienes una referencia conocida, puedes dejarlo vacío.
                    </p>
                    {isEditingUserBiz && !reference && (
                      <p className="text-[9px] text-amber-600 font-bold mt-1">
                        ⚠️ Sugerencia: Completa el punto de referencia para ayudar a tus clientes a encontrarte.
                      </p>
                    )}
                  </div>
                </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowMapSelector(true)}
                    className="w-full py-2 border border-blue-200 text-blue-600 bg-blue-50 rounded-xl text-[11px] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MapPin size={14} />
                    {latitude && longitude ? "Cambiar ubicación en el mapa" : "Seleccionar ubicación en el mapa"}
                  </button>
                  
                  {latitude && longitude && (
                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle size={10} /> Ubicación seleccionada ({latitude.toFixed(5)}, {longitude.toFixed(5)})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Descripción del Negocio</label>
                  <textarea
                    placeholder="Describe los productos, especialidades o servicios que ofreces..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Nota o Mensaje Promocional</label>
                  <input
                    type="text"
                    placeholder="Ej. ¡20% de descuento los viernes en pizzas!"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5 pt-2 border-t border-gray-100">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Correo electrónico del negocio (Privado - solo Admin)</label>
                    <input
                      type="email"
                      placeholder="Ej. contacto@tunegocio.com"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Página Web (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. www.tunegocio.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Instagram (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. @tunegocio o URL"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Facebook (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. tunegocio o URL"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">TikTok (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. @tunegocio o URL"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Fotos del establecimiento */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Camera size={14} className="text-blue-600" />
                  <span>Fotos del Establecimiento (Máx. 5)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group bg-gray-50 flex items-center justify-center">
                      <img src={img.url} alt={`Local ${index + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Controls overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(index)}
                          className={`w-full py-1 text-[9px] font-bold rounded-md text-center transition-all ${
                            img.isPrimary
                              ? "bg-green-600 text-white"
                              : "bg-white/95 text-gray-800 hover:bg-white"
                          }`}
                        >
                          {img.isPrimary ? "★ Principal" : "Marcar Principal"}
                        </button>
                      </div>

                      {/* Sticky indicator for primary */}
                      {img.isPrimary && (
                        <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-10">
                          ★ Principal
                        </span>
                      )}
                    </div>
                  ))}

                  {uploadedImages.length < 5 && (
                    <label className={`aspect-video rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 hover:text-blue-600 transition-all ${uploadingImage ? 'pointer-events-none opacity-50' : ''}`}>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleUploadImages}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && uploadProgress ? (
                        <>
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />
                          <span className="text-[10px] font-bold text-blue-600">{uploadProgress.current}/{uploadProgress.total}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-500">Subir Fotos</span>
                          <span className="text-[9px] text-gray-400">{5 - uploadedImages.length} espacio{(5 - uploadedImages.length) !== 1 ? "s" : ""} restante{(5 - uploadedImages.length) !== 1 ? "s" : ""}</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              
              <div className={activeTab === "promocionar" ? "space-y-3" : "hidden"}>
                {editingBusinessId ? (
                  <PromotionRequestForm businessId={editingBusinessId} />
                ) : (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center space-y-2">
                    <p className="text-xs text-blue-900 font-medium">
                      Para solicitar una promoción, primero debes registrar tu negocio de forma gratuita.
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Una vez registrado, vuelve a esta sección para pagar con USDC y activar la promoción que desees.
                    </p>
                  </div>
                )}
              </div>

              <div className={activeTab === "datos" || activeTab === "fotos" ? "block" : "hidden"}>
              {/* Free registration notice */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">🎉 ¡Registro completamente gratuito!</p>
                <p>El registro de negocios en MapeoVE es gratuito. Tu local será publicado automáticamente como No verificado. El equipo de MapeoVE podrá revisarlo posteriormente para marcarlo como Verificado.</p>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  {submitting ? "Registrando negocio..." : "Registrar Mi Negocio Gratis"}
                </button>
              </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
