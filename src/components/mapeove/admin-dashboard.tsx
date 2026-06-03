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
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export function AdminDashboard({ isOpen, onClose, businesses }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"negocios" | "usuarios" | "solicitudes">("negocios");
  
  // Users Data
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Requests Data
  const [requests, setRequests] = useState<BusinessRequestData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

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
            setUsers(data.users);
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
          setRequests(data.requests);
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

  const pendingRequestsCount = requests.filter(r => r.status === "PENDING").length;

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

                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3">Categoría</th>
                          <th className="px-4 py-3">Dirección</th>
                          <th className="px-4 py-3">Verificado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[11px] sm:text-xs text-gray-700">
                        {businesses.map((biz) => (
                          <tr key={biz.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 sm:py-3.5 font-bold text-gray-900">{biz.name}</td>
                            <td className="px-4 py-3 sm:py-3.5">
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold">
                                <span>{biz.category.icon}</span>
                                <span>{biz.category.name}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 sm:py-3.5 text-gray-500 truncate max-w-[200px]">{biz.address}</td>
                            <td className="px-4 py-3 sm:py-3.5">
                              <span className={`inline-block w-2 h-2 rounded-full ${biz.verified ? "bg-blue-500" : "bg-gray-300"}`} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                    {requests.map((req) => (
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
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[450px] sm:min-w-0">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Correo</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Registro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px] sm:text-xs text-gray-700">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3.5 font-bold text-gray-900">{u.name}</td>
                              <td className="px-4 py-3.5 text-gray-600">{u.email}</td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                                  u.role === "SUPER_ADMIN" ? "bg-red-500" : u.role === "OWNER" ? "bg-blue-500" : "bg-green-500"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-gray-500">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && !usersError && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">
                                No hay usuarios registrados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
