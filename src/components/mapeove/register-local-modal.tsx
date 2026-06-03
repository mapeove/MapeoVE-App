"use client";

import { useState, useEffect } from "react";
import { X, Store, CreditCard, Clock, MessageCircle, Phone, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { BRAND } from "@/types/mapeove";

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

export function RegisterLocalModal({ isOpen, onClose, user }: RegisterLocalModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingRequests, setExistingRequests] = useState<RequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PAGO_MOVIL");
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // Load categories
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    }

    // Load existing requests
    async function loadRequests() {
      setLoadingRequests(true);
      try {
        const res = await fetch("/api/business-requests/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setExistingRequests(data.requests);
          }
        }
      } catch (err) {
        console.error("Error loading my requests:", err);
      } finally {
        setLoadingRequests(false);
      }
    }

    loadCategories();
    loadRequests();
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
          paymentMethod,
          paymentReference,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        // Refresh requests list
        setExistingRequests([data.request, ...existingRequests]);
      } else {
        setError(data.error || "Ocurrió un error al enviar la solicitud");
      }
    } catch {
      setError("Error de conexión al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div 
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-gray-100 animate-scale-in"
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
          
          {loadingRequests ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Cargando estado...</span>
            </div>
          ) : existingRequests.length > 0 && !success ? (
            /* Show status of existing requests */
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Tus Solicitudes</h4>
              <div className="space-y-2">
                {existingRequests.map((req) => (
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
              {existingRequests.some(r => r.status === "REJECTED") && (
                <button
                  onClick={() => setExistingRequests([])}
                  className="w-full py-2 border border-blue-600 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
                >
                  Enviar nueva solicitud
                </button>
              )}
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
              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

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
                      {categories.map((cat) => (
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
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Dirección Exacta (La Victoria) *</label>
                  <div className="relative">
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

                {/* Instructions */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2 text-[10px] text-blue-800">
                  <p className="font-bold">Realiza el pago y coloca la referencia abajo:</p>
                  <div className="grid grid-cols-1 gap-1 divide-y divide-blue-200/50">
                    <p className="pt-1"><strong>Pago Móvil:</strong> Banco Mercantil (0105), 0424-1234567, RIF V-12345678-9</p>
                    <p className="pt-1"><strong>Transferencia:</strong> Bco Mercantil, Cta Cte 0105-0123-45-0123456789, RIF V-12345678-9 (MapeoVE C.A.)</p>
                    <p className="pt-1"><strong>Binance Pay (USDT):</strong> ID: 123456789 (pagos@mapeove.com)</p>
                  </div>
                </div>

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
                  disabled={submitting}
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
