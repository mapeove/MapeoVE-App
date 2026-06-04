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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-gray-800">Negocios Registrados</h4>
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">
                    Total: {businesses.length}
                  </span>
                </div>

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
                    </div>
                  ))}
                </div>
              </div>
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
