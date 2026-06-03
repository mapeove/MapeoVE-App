"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, Store, Users } from "lucide-react";
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

export function AdminDashboard({ isOpen, onClose, businesses }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"negocios" | "usuarios">("negocios");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || activeTab !== "usuarios") return;

    async function loadUsers() {
      setLoadingUsers(true);
      setError("");
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.users) {
            setUsers(data.users);
          } else {
            setError(data.error || "No se pudo cargar la lista de usuarios");
          }
        } else {
          setError("Error de autorización o servidor al cargar usuarios");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Error de conexión al cargar usuarios");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 text-white"
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
          <div className="w-full md:w-56 bg-white border-r border-gray-100 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0">
            <button
              onClick={() => setActiveTab("negocios")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "negocios"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Store size={16} />
              <span>Gestionar Negocios ({businesses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("usuarios")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "usuarios"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Users size={16} />
              <span>Gestionar Usuarios</span>
            </button>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
            {activeTab === "negocios" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-800">Negocios Registrados</h4>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">
                    Total: {businesses.length}
                  </span>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3">Categoría</th>
                          <th className="px-4 py-3">Dirección</th>
                          <th className="px-4 py-3">Verificado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {businesses.map((biz) => (
                          <tr key={biz.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3.5 font-bold text-gray-900">{biz.name}</td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                <span>{biz.category.icon}</span>
                                <span>{biz.category.name}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-500">{biz.address}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-block w-2 h-2 rounded-full ${biz.verified ? "bg-blue-500" : "bg-gray-300"}`} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-800">Usuarios Registrados</h4>
                </div>

                {error && (
                  <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    {error}
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
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Correo</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Fecha de registro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
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
                          {users.length === 0 && !error && (
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
