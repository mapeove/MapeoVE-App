"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, Store, Users, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Business, BRAND } from "@/types/mapeove";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface BusinessRequestData {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  businessName: string;
  categoryId: string;
  category: {
    name: string;
    icon: string;
  };
  address: string;
  phone: string;
  whatsapp: string;
  description: string | null;
  openingHours: string | null;
  note: string | null;
  paymentMethod: string;
  paymentReference: string;
  plan: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export function AdminDashboard({ isOpen, onClose, businesses }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"negocios" | "usuarios" | "solicitudes" | "pagos">("negocios");
  
  // Photo management state
  const [selectedAdminBiz, setSelectedAdminBiz] = useState<Business | null>(null);
  const [bizImages, setBizImages] = useState<{ id: string; url: string; isPrimary: boolean; createdAt: string }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [bizMessage, setBizMessage] = useState<{ type: "success" | "error" | ""; text: string } | null>(null);

  useEffect(() => {
    setBizMessage(null);
  }, [activeTab]);

  const handleSaveAndBack = () => {
    setSelectedAdminBiz(null);
    setBizMessage({ type: "success", text: "Fotos actualizadas correctamente" });
  };

  // Fetch Business Images when opened in Admin View
  useEffect(() => {
    if (!selectedAdminBiz) {
      setBizImages([]);
      return;
    }

    async function loadBizImages() {
      setLoadingImages(true);
      try {
        const res = await fetch(`/api/businesses/${selectedAdminBiz.id}/images`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.images) {
            setBizImages(data.images);
          }
        }
      } catch (err) {
        console.error("Error fetching biz images:", err);
      } finally {
        setLoadingImages(false);
      }
    }

    loadBizImages();
  }, [selectedAdminBiz]);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAdminBiz || !e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const MAX_PHOTOS = 5;
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    // Calculate how many slots remain
    const currentCount = bizImages.length;
    const slotsAvailable = MAX_PHOTOS - currentCount;

    if (slotsAvailable <= 0) {
      setBizMessage({ type: "error", text: `Ya alcanzaste el límite máximo de ${MAX_PHOTOS} fotos por comercio.` });
      e.target.value = "";
      return;
    }

    if (files.length > slotsAvailable) {
      setBizMessage({
        type: "error",
        text: `Solo puedes agregar ${slotsAvailable} foto${slotsAvailable === 1 ? "" : "s"} más. Seleccionaste ${files.length}.`,
      });
      e.target.value = "";
      return;
    }

    // Validate all files before uploading any
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setBizMessage({ type: "error", text: `"${file.name}" tiene un formato no permitido. Use JPG, JPEG, PNG o WEBP.` });
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setBizMessage({ type: "error", text: `"${file.name}" supera los 5MB permitidos por imagen.` });
        e.target.value = "";
        return;
      }
    }

    setBizMessage(null);
    setUploadingImage(true);
    setUploadProgress({ current: 0, total: files.length });

    let uploadedCount = 0;
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      const formData = new FormData();
      formData.append("file", file);
      // Only first image uploaded is primary if the gallery is empty
      formData.append("isPrimary", (currentCount === 0 && i === 0) ? "true" : "false");

      try {
        const res = await fetch(`/api/businesses/${selectedAdminBiz.id}/images`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setBizImages(prev => [...prev, data.image].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)));
          uploadedCount++;
        } else {
          setBizMessage({ type: "error", text: data.error || `Error al subir "${file.name}"` });
          hasError = true;
          break;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        setBizMessage({ type: "error", text: `Error de conexión al subir "${file.name}"` });
        hasError = true;
        break;
      }
    }

    setUploadingImage(false);
    setUploadProgress(null);
    e.target.value = "";

    if (!hasError && uploadedCount > 0) {
      setBizMessage({
        type: "success",
        text: uploadedCount === 1
          ? "Foto subida correctamente."
          : `${uploadedCount} fotos subidas correctamente.`,
      });
    }
  };

  const handleDeletePhoto = async (imageId: string) => {
    if (!selectedAdminBiz) return;
    if (!confirm("¿Estás seguro de que deseas eliminar esta foto?")) return;

    try {
      const res = await fetch(`/api/businesses/${selectedAdminBiz.id}/images/${imageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBizImages(prev => prev.filter(img => img.id !== imageId));
        // Refetch to handle primary switch if needed
        const refetchRes = await fetch(`/api/businesses/${selectedAdminBiz.id}/images`);
        if (refetchRes.ok) {
          const refetchData = await refetchRes.json();
          if (refetchData.success && refetchData.images) {
            setBizImages(refetchData.images);
          }
        }
      } else {
        alert(data.error || "Error al eliminar la imagen");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Error de conexión al eliminar la imagen");
    }
  };

  const handleSetPrimaryPhoto = async (imageId: string) => {
    if (!selectedAdminBiz) return;

    try {
      const res = await fetch(`/api/businesses/${selectedAdminBiz.id}/images/${imageId}/primary`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBizImages(prev => 
          prev.map(img => ({
            ...img,
            isPrimary: img.id === imageId,
          })).sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
        );
      } else {
        alert(data.error || "Error al establecer como principal");
      }
    } catch (err) {
      console.error("Error setting primary image:", err);
      alert("Error de conexión");
    }
  };

  // Users Data
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Requests Data
  const [requests, setRequests] = useState<BusinessRequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Payment Settings Data
  const [paymentSettings, setPaymentSettings] = useState({
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    pagoMovilInfo: "",
    transferInfo: "",
    binanceInfo: "",
    binanceNetwork: "TRC20",
    binanceWallet: "",
    binanceFeeType: "FIXED",
    binanceFeeValue: 0,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });

  // Fetch Users
  useEffect(() => {
    if (!isOpen || activeTab !== "usuarios") return;

    async function loadUsers() {
      setLoadingUsers(true);
      setUsersError("");
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.users) {
            setUsers(Array.isArray(data.users) ? data.users : []);
          } else {
            setUsersError(data.error || "No se pudo cargar la lista de usuarios");
          }
        } else {
          setUsersError("Error de autorización o servidor al cargar usuarios");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsersError("Error de conexión al cargar usuarios");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, [isOpen, activeTab]);

  // Fetch Business Requests
  const loadRequests = async () => {
    setLoadingRequests(true);
    setRequestsError("");
    try {
      const res = await fetch("/api/admin/business-requests");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.requests) {
          setRequests(Array.isArray(data.requests) ? data.requests : []);
        } else {
          setRequestsError(data.error || "No se pudieron cargar las solicitudes");
        }
      } else {
        setRequestsError("Error de autorización o servidor al cargar solicitudes");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequestsError("Error de conexión al cargar solicitudes");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== "solicitudes") return;
    loadRequests();
  }, [isOpen, activeTab]);

  // Fetch Payment Settings
  useEffect(() => {
    if (!isOpen || activeTab !== "pagos") return;
    
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch("/api/payment-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setPaymentSettings(data.settings);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, [isOpen, activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentSettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsMessage({ type: "success", text: "Configuración guardada correctamente." });
      } else {
        setSettingsMessage({ type: "error", text: data.error || "Error al guardar la configuración." });
      }
    } catch (err) {
      setSettingsMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/business-requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Reload list to get updated status
        loadRequests();
      } else {
        alert(data.error || "Error al aprobar la solicitud");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Error de conexión al aprobar");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/business-requests/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Reload list to get updated status
        loadRequests();
      } else {
        alert(data.error || "Error al rechazar la solicitud");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Error de conexión al rechazar");
    } finally {
      setActioningId(null);
    }
  };

  if (!isOpen) return null;

  const pendingRequestsCount = (Array.isArray(requests) ? requests : []).filter(r => r.status === "PENDING").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 text-white shrink-0"
          style={{ backgroundColor: BRAND.blue }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-yellow-400" />
            <div>
              <h3 className="font-bold text-sm">Panel de Control MapeoVE</h3>
              <p className="text-[10px] text-white/80">Rol: Administrador del Sistema</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50">
          {/* Sidebar */}
          <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-100 p-2 sm:p-4 flex flex-row md:flex-col gap-1 sm:gap-2 overflow-x-auto md:overflow-x-visible shrink-0">
            <button
              onClick={() => setActiveTab("negocios")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === "negocios"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Store size={16} />
              <span>Negocios ({businesses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("solicitudes")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === "solicitudes"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <FileText size={16} />
              <span className="flex items-center gap-1.5">
                <span>Solicitudes</span>
                {pendingRequestsCount > 0 && (
                  <span className="bg-yellow-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                    {pendingRequestsCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === "usuarios"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Users size={16} />
              <span>Usuarios</span>
            </button>
            <button
              onClick={() => setActiveTab("pagos")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 sm:py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === "pagos"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Store size={16} />
              <span>Pagos</span>
            </button>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto min-w-0">
            {/* TAB: NEGOCIOS */}
            {activeTab === "negocios" && (
              selectedAdminBiz ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedAdminBiz(null)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-250 rounded-xl text-xs font-bold text-gray-750 flex items-center gap-1 transition-colors"
                      style={{ backgroundColor: "#f3f4f6" }}
                    >
                      ← Volver a Comercios
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Comercios / Fotos
                    </span>
                  </div>

                  <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm space-y-1.5">
                    <h5 className="text-sm font-black text-gray-900">{selectedAdminBiz.name}</h5>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="bg-gray-100 font-bold px-2 py-0.5 rounded-full text-gray-600">
                        {selectedAdminBiz.category.icon} {selectedAdminBiz.category.name}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${
                        selectedAdminBiz.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {selectedAdminBiz.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Galería de Fotos</h5>

                    {loadingImages ? (
                      <div className="flex items-center gap-2 py-10 justify-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-500">Cargando fotos...</span>
                      </div>
                    ) : bizImages.length === 0 ? (
                      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">📷</span>
                        <p className="text-xs text-gray-500 font-medium">Este comercio no tiene fotos registradas.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {bizImages.map((img) => (
                          <div 
                            key={img.id} 
                            className={`relative bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all ${
                              img.isPrimary ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200"
                            }`}
                          >
                            <div className="aspect-video relative overflow-hidden bg-gray-55 h-24 shrink-0">
                              <img
                                src={img.url}
                                alt="Foto comercio"
                                className="w-full h-full object-cover"
                              />
                              {img.isPrimary && (
                                <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                  Principal
                                </span>
                              )}
                            </div>
                            <div className="p-2 flex gap-1 justify-between shrink-0 bg-gray-50 border-t border-gray-150">
                              <button
                                onClick={() => handleSetPrimaryPhoto(img.id)}
                                disabled={img.isPrimary}
                                className={`flex-1 py-1 rounded-lg text-[9px] font-bold text-center transition-all ${
                                  img.isPrimary
                                    ? "bg-blue-50/50 text-blue-400 cursor-default"
                                    : "bg-white border border-gray-200 hover:bg-blue-50 hover:text-blue-700 text-gray-700 active:scale-95"
                                }`}
                              >
                                Principal
                              </button>
                              <button
                                onClick={() => handleDeletePhoto(img.id)}
                                className="px-2 py-1 bg-white border border-red-200 hover:bg-red-50 hover:text-red-750 text-red-500 rounded-lg text-[9px] font-bold text-center transition-all active:scale-95"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-gray-750 uppercase tracking-wider">Subir Fotos</h5>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bizImages.length >= 5 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {bizImages.length}/5 fotos
                      </span>
                    </div>

                    {bizMessage && bizMessage.text && (
                      <div className={`p-2.5 text-xs rounded-xl border flex items-start gap-2 ${
                        bizMessage.type === "success"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        <span className="font-bold leading-relaxed">{bizMessage.text}</span>
                      </div>
                    )}

                    {uploadingImage && uploadProgress && (
                      <div className="flex items-center gap-2.5 py-2 px-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-xs font-bold text-blue-700">
                          Subiendo foto {uploadProgress.current} de {uploadProgress.total}...
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className={`cursor-pointer px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md flex items-center gap-2 ${
                        bizImages.length >= 5 || uploadingImage ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                      }`}>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={handleUploadPhoto}
                          disabled={uploadingImage || bizImages.length >= 5}
                        />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        <span>Seleccionar fotos</span>
                      </label>
                      <div className="text-[10px] text-gray-400 leading-relaxed">
                        <span className="font-semibold">Puedes seleccionar varias a la vez.</span><br />
                        JPG · JPEG · PNG · WEBP · Máx. 5MB por imagen<br />
                        {bizImages.length < 5 && (
                          <span className="text-blue-500 font-bold">Quedan {5 - bizImages.length} espacio{5 - bizImages.length !== 1 ? "s" : ""} disponibles.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón Guardar y volver */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveAndBack}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md"
                    >
                      Guardar y volver
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-black text-gray-800">Negocios Registrados</h4>
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">
                      Total: {businesses.length}
                    </span>
                  </div>

                  {bizMessage && bizMessage.text && (
                    <div className={`p-3 text-xs rounded-xl border flex items-center gap-2 ${
                      bizMessage.type === "success" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {bizMessage.type === "success" ? (
                        <CheckCircle2 size={14} className="text-green-600" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                      <span className="font-bold">{bizMessage.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(Array.isArray(businesses) ? businesses : []).map((biz) => (
                      <div key={biz.id} className="bg-white border border-gray-150 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h5 className="text-xs sm:text-sm font-black text-gray-900 truncate pr-2">{biz.name}</h5>
                          <span className={`shrink-0 inline-block w-2 h-2 rounded-full mt-1 ${biz.verified ? "bg-blue-500" : "bg-gray-300"}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <span>{biz.category.icon}</span>
                            <span>{biz.category.name}</span>
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">{biz.address}</p>
                        <button
                          onClick={() => {
                            setBizMessage(null);
                            setSelectedAdminBiz(biz);
                          }}
                          className="mt-1 w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                          style={{ backgroundColor: "#f3f4f6" }}
                        >
                          📷 Gestionar Fotos
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* TAB: SOLICITUDES DE LOCAL */}
            {activeTab === "solicitudes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-gray-800">Solicitudes de Local y Suscripción</h4>
                </div>

                {requestsError && (
                  <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {requestsError}
                  </div>
                )}

                {loadingRequests ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Cargando solicitudes...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {(Array.isArray(requests) ? requests : []).map((req) => (
                      <div key={req.id} className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm space-y-4">
                        {/* Summary Line */}
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-gray-100 pb-2">
                          <div>
                            <h5 className="text-xs sm:text-sm font-black text-gray-950">{req.businessName}</h5>
                            <p className="text-[10px] text-gray-500">Solicitante: {req.user.name} ({req.user.email})</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] sm:text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded-full text-gray-600">
                              {req.category.icon} {req.category.name}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              req.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                              req.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>

                        {/* Local Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] sm:text-xs">
                          <div className="space-y-1">
                            <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Datos del Local</p>
                            <p><strong>Dirección:</strong> {req.address}</p>
                            <p><strong>Teléfono:</strong> {req.phone} | <strong>WhatsApp:</strong> {req.whatsapp}</p>
                            <p><strong>Horario:</strong> {req.openingHours || "No indicado"}</p>
                            <p><strong>Descripción:</strong> {req.description || "N/A"}</p>
                            {req.note && <p><strong>Oferta/Nota:</strong> {req.note}</p>}
                          </div>
                          
                          <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200/60 rounded-xl">
                            <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Detalles de Suscripción Manual</p>
                            <p><strong>Plan Elegido:</strong> {req.plan === "MONTHLY" ? "Mensual" : req.plan === "YEARLY" ? "Anual" : "No especificado"}</p>
                            <p><strong>Método de pago:</strong> {req.paymentMethod}</p>
                            <p><strong>Referencia:</strong> {req.paymentReference}</p>
                            <p><strong>Fecha Solicitud:</strong> {new Date(req.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Action Buttons for Pending requests */}
                        {req.status === "PENDING" && (
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={actioningId !== null}
                              className="px-3.5 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              <span>Rechazar</span>
                            </button>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actioningId !== null}
                              className="px-3.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              <span>Aprobar y Crear Negocio</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {requests.length === 0 && !loadingRequests && (
                      <p className="text-xs text-gray-500 text-center py-6">
                        No hay solicitudes registradas en el sistema.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: USUARIOS */}
            {activeTab === "usuarios" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-gray-800">Usuarios Registrados</h4>
                </div>

                {usersError && (
                  <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {usersError}
                  </div>
                )}

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Cargando usuarios...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(Array.isArray(users) ? users : []).map((u) => (
                      <div key={u.id} className="bg-white border border-gray-150 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="text-xs sm:text-sm font-black text-gray-900 truncate">{u.name}</h5>
                          <span className={`shrink-0 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                            u.role === "SUPER_ADMIN" ? "bg-red-500" : u.role === "OWNER" ? "bg-blue-500" : "bg-green-500"
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-600 truncate">{u.email}</p>
                        <p className="text-[9px] text-gray-400">
                          Registrado: {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {users.length === 0 && !usersError && (
                      <p className="text-xs text-gray-500 text-center col-span-full py-6">
                        No hay usuarios registrados.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PAGOS */}
            {activeTab === "pagos" && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-gray-800">Configuración de Pagos</h4>
                </div>

                {settingsMessage.text && (
                  <div className={`p-3 text-xs rounded-xl border ${settingsMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {settingsMessage.text}
                  </div>
                )}

                {loadingSettings ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Cargando...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSettings} className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Precio Mensual</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={paymentSettings.monthlyPrice}
                          onChange={e => setPaymentSettings({...paymentSettings, monthlyPrice: parseFloat(e.target.value)})}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Precio Anual</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={paymentSettings.yearlyPrice}
                          onChange={e => setPaymentSettings({...paymentSettings, yearlyPrice: parseFloat(e.target.value)})}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Moneda (Ej. USD)</label>
                      <input
                        type="text"
                        required
                        value={paymentSettings.currency}
                        onChange={e => setPaymentSettings({...paymentSettings, currency: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Instrucciones Pago Móvil</label>
                      <textarea
                        required
                        value={paymentSettings.pagoMovilInfo}
                        onChange={e => setPaymentSettings({...paymentSettings, pagoMovilInfo: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Instrucciones Transferencia Bancaria</label>
                      <textarea
                        required
                        value={paymentSettings.transferInfo}
                        onChange={e => setPaymentSettings({...paymentSettings, transferInfo: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Instrucciones Binance Pay</label>
                      <textarea
                        required
                        value={paymentSettings.binanceInfo}
                        onChange={e => setPaymentSettings({...paymentSettings, binanceInfo: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        rows={2}
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <h5 className="text-[11px] font-bold text-gray-800 mb-2">Configuración Avanzada Binance</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Red Binance *</label>
                          <select
                            required
                            value={paymentSettings.binanceNetwork}
                            onChange={e => setPaymentSettings({...paymentSettings, binanceNetwork: e.target.value})}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="TRC20">Tron (TRC20)</option>
                            <option value="BEP20">BNB Smart Chain (BEP20)</option>
                            <option value="ERC20">Ethereum (ERC20)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Wallet (Dirección) *</label>
                          <input
                            type="text"
                            required
                            value={paymentSettings.binanceWallet}
                            onChange={e => setPaymentSettings({...paymentSettings, binanceWallet: e.target.value})}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Comisión *</label>
                          <select
                            required
                            value={paymentSettings.binanceFeeType}
                            onChange={e => setPaymentSettings({...paymentSettings, binanceFeeType: e.target.value})}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="FIXED">Fija (USD)</option>
                            <option value="PERCENTAGE">Porcentaje (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor Comisión *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={paymentSettings.binanceFeeValue}
                            onChange={e => setPaymentSettings({...paymentSettings, binanceFeeValue: parseFloat(e.target.value)})}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {savingSettings ? "Guardando..." : "Guardar Configuración"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
