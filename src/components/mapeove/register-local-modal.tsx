"use client";

import { useState, useEffect } from "react";
import { X, Store, CreditCard, Clock, MessageCircle, Phone, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { BRAND } from "@/types/mapeove";
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
  paymentMethod: string;
  paymentReference: string;
  createdAt: string;
}

interface PaymentSettings {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  pagoMovilInfo: string;
  transferInfo: string;
  binanceInfo: string;
  binanceNetwork?: string;
  binanceWallet?: string;
  binanceFeeType?: string;
  binanceFeeValue?: number;
}

export function RegisterLocalModal({ isOpen, onClose, user }: RegisterLocalModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingRequests, setExistingRequests] = useState<RequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [note, setNote] = useState("");
  const [plan, setPlan] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState("PAGO_MOVIL");
  const [paymentReference, setPaymentReference] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

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
            setExistingRequests(Array.isArray(data.requests) ? data.requests : []);
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

    async function loadPaymentSettings() {
      try {
        const res = await fetch("/api/payment-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setPaymentSettings(data.settings);
          }
        }
      } catch (err) {
        console.error("Error loading payment settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    }

    loadCategories();
    loadRequests();
    loadPaymentSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!businessName || !categoryId || !address || !phone || !whatsapp || !paymentMethod || !paymentReference) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Debes seleccionar la ubicación en el mapa");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          categoryId,
          address,
          phone,
          whatsapp,
          description,
          openingHours,
          note,
          plan,
          latitude,
          longitude,
          paymentMethod,
          paymentReference,
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

  const getBasePrice = () => {
    if (!paymentSettings) return 0;
    return plan === "MONTHLY" ? paymentSettings.monthlyPrice : paymentSettings.yearlyPrice;
  };

  const calculateBinanceTotal = (base: number) => {
    if (!paymentSettings || paymentMethod !== "BINANCE") return base;
    if (!paymentSettings.binanceFeeType || paymentSettings.binanceFeeValue == null) return base;

    if (paymentSettings.binanceFeeType === "FIXED") {
      return base + paymentSettings.binanceFeeValue;
    } else if (paymentSettings.binanceFeeType === "PERCENTAGE") {
      return base / (1 - paymentSettings.binanceFeeValue / 100);
    }
    return base;
  };

  const basePrice = getBasePrice();
  const totalToPay = calculateBinanceTotal(basePrice);

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
          onClose={() => setShowMapSelector(false)} 
          onSelect={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
            setShowMapSelector(false);
          }} 
        />
      )}
      
      <div 
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden border border-gray-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 text-white shrink-0"
          style={{ backgroundColor: BRAND.blue }}
        >
          <div className="flex items-center gap-2">
            <Store size={18} />
            <h3 className="font-bold text-sm">Registrar Mi Local</h3>
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
          ) : !forceShowForm && (Array.isArray(existingRequests) && existingRequests.length > 0) && !success ? (
            /* Show status of existing requests */
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Tus Solicitudes</h4>
              <div className="space-y-2">
                {(Array.isArray(existingRequests) ? existingRequests : []).map((req) => (
                  <div key={req.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-gray-900">{req.businessName}</p>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <p>Método de pago: {req.paymentMethod}</p>
                      <p>Referencia: {req.paymentReference}</p>
                      <p>Fecha: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    {req.status === "PENDING" && (
                      <p className="text-[10px] text-gray-400 italic">
                        Tu pago se encuentra en proceso de validación.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Allow sending another request if previous is rejected */}
              {(Array.isArray(existingRequests) ? existingRequests : []).some(r => r.status === "REJECTED") && (
                <button
                  onClick={() => setExistingRequests([])}
                  className="w-full py-2 border border-blue-600 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
                >
                  Enviar nueva solicitud
                </button>
              )}
            </div>
          ) : !forceShowForm && user?.role === "OWNER" && (!Array.isArray(existingRequests) || existingRequests.length === 0) && !success ? (
            /* Show "No tienes solicitudes todavía" for OWNERs without requests */
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 border border-gray-200">
                <Store size={24} />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                No tienes solicitudes todavía
              </p>
              <button
                onClick={() => setForceShowForm(true)}
                className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all w-full max-w-xs mx-auto"
              >
                Registrar mi local
              </button>
            </div>
          ) : success ? (
            /* Success View */
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-200">
                <CheckCircle size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900">¡Solicitud recibida con éxito!</h4>
                <p className="text-xs text-gray-500 px-4 leading-relaxed">
                  Hemos registrado los datos de tu negocio y la referencia de pago. En breve nuestro equipo lo verificará y activará el acceso.
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

              {/* Local Details */}
              <div className="space-y-3">
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
                        placeholder="Ej. 0424-1234567"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Dirección Exacta del local *</label>
                  <div className="relative mb-2">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                      <MapPin size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Calle, sector, referencia de ubicación"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
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
              </div>

              {/* Payment Details */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={14} className="text-blue-600" />
                  <span>Método de Pago Manual</span>
                </h4>

                {loadingSettings ? (
                  <p className="text-xs text-gray-500">Cargando métodos de pago...</p>
                ) : !paymentSettings ? (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                    Los métodos de pago aún no están configurados. No puedes enviar la solicitud.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlan("MONTHLY")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          plan === "MONTHLY"
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Mensual</p>
                        <p className="text-lg font-black text-gray-900 mt-0.5">
                          {paymentSettings.monthlyPrice} <span className="text-xs">{paymentSettings.currency}</span>
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlan("YEARLY")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          plan === "YEARLY"
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Anual</p>
                        <p className="text-lg font-black text-gray-900 mt-0.5">
                          {paymentSettings.yearlyPrice} <span className="text-xs">{paymentSettings.currency}</span>
                        </p>
                      </button>
                    </div>

                    {/* Instructions */}
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2 text-[10px] text-blue-800">
                      <p className="font-bold">Realiza el pago por el monto seleccionado y coloca la referencia abajo:</p>
                      <div className="grid grid-cols-1 gap-1 divide-y divide-blue-200/50">
                        <p className="pt-1"><strong>Pago Móvil:</strong> {paymentSettings.pagoMovilInfo}</p>
                        <p className="pt-1"><strong>Transferencia:</strong> {paymentSettings.transferInfo}</p>
                        <p className="pt-1"><strong>Binance Pay (USDT):</strong> {paymentSettings.binanceInfo}</p>
                      </div>
                    </div>

                    {paymentMethod === "BINANCE" && paymentSettings.binanceWallet && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-900 text-[10px] space-y-1.5 animate-fade-in mt-2">
                        <p className="font-bold flex items-center gap-1"><AlertTriangle size={12} /> Pago vía Binance ({paymentSettings.binanceNetwork})</p>
                        <p><strong>Wallet a transferir:</strong> <span className="select-all font-mono bg-yellow-100 px-1 py-0.5 rounded">{paymentSettings.binanceWallet}</span></p>
                        {paymentSettings.binanceFeeValue != null && paymentSettings.binanceFeeValue > 0 && (
                          <div className="pt-1 mt-1 border-t border-yellow-200/50 text-[9px] opacity-80">
                            <p>Precio Base: {basePrice} {paymentSettings.currency}</p>
                            <p>Comisión Estimada: {(totalToPay - basePrice).toFixed(2)} {paymentSettings.currency}</p>
                          </div>
                        )}
                        <p className="text-[11px] font-black mt-2 pt-1 border-t border-yellow-200">
                          Debes enviar exactamente {totalToPay.toFixed(2)} USDT para que lleguen netos {basePrice} USDT.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Método utilizado *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 font-medium"
                    >
                      <option value="PAGO_MOVIL">Pago Móvil</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="BINANCE">Binance Pay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Referencia de Pago *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nro. de transacción o hash"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !paymentSettings}
                  className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  {submitting ? "Enviando solicitud..." : "Enviar Solicitud y Registrar"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
