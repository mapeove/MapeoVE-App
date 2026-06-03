"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  X, Plus, Pencil, Trash2, CheckCircle, AlertTriangle, 
  Store, ListCollapse, Users, Loader2, Upload, Trash, Image as ImageIcon
} from "lucide-react";
import { BRAND, CATEGORY_COLORS } from "@/types/mapeove";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export function AdminDashboard({ isOpen, onClose, onRefreshData }: AdminDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"businesses" | "categories" | "users">("businesses");
  
  // Data lists
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Form states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Business Form fields
  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizLat, setBizLat] = useState("");
  const [bizLng, setBizLng] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizWhatsapp, setBizWhatsapp] = useState("");
  const [bizCategoryId, setBizCategoryId] = useState("");
  const [bizVerified, setBizVerified] = useState(false);
  const [bizActive, setBizActive] = useState(true);
  const [bizOwnerId, setBizOwnerId] = useState("");
  const [bizImage, setBizImage] = useState("");
  const [bizImages, setBizImages] = useState<string[]>([]);

  // Category Form fields
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catSlug, setCatSlug] = useState("");

  // Message notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && user?.role === "SUPER_ADMIN") {
      fetchData();
    }
  }, [isOpen, activeTab]);

  async function fetchData() {
    setLoading(true);
    setNotification(null);
    try {
      if (activeTab === "businesses") {
        const res = await fetch("/api/businesses?limit=100");
        const data = await res.json();
        if (data.success) setBusinesses(data.data);
        
        // Also prefetch categories and users for dropdowns
        const [catRes, userRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/users")
        ]);
        const catData = await catRes.json();
        const userData = await userRes.json();
        if (catData.success) setCategories(catData.data);
        if (userData.success) setUsersList(userData.data);
      } else if (activeTab === "categories") {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } else if (activeTab === "users") {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) setUsersList(data.data);
      }
    } catch {
      showNotice("error", "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  function showNotice(type: "success" | "error", text: string) {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  }

  // Handle Image Upload
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
          setBizImages((prev) => [...prev, data.url]);
        } else {
          setBizImage(data.url);
        }
        showNotice("success", "Imagen subida a Supabase!");
      } else {
        showNotice("error", data.error || "Error al subir imagen");
      }
    } catch {
      showNotice("error", "Error al conectar con el servidor de subida");
    }
  }

  // Submit form
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setNotification(null);

    try {
      if (activeTab === "businesses") {
        const payload = {
          name: bizName,
          description: bizDesc,
          address: bizAddress,
          latitude: parseFloat(bizLat),
          longitude: parseFloat(bizLng),
          phone: bizPhone || null,
          whatsapp: bizWhatsapp || null,
          categoryId: bizCategoryId,
          verified: bizVerified,
          active: bizActive,
          ownerId: bizOwnerId || null,
          image: bizImage || null,
          images: bizImages,
        };

        const url = editingItem ? `/api/businesses/${editingItem.id}` : "/api/businesses";
        const method = editingItem ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        
        if (data.success) {
          showNotice("success", editingItem ? "Negocio actualizado" : "Negocio creado");
          setShowForm(false);
          fetchData();
          if (onRefreshData) onRefreshData();
        } else {
          showNotice("error", data.error || "Error al guardar negocio");
        }
      } else if (activeTab === "categories") {
        const payload = { name: catName, icon: catIcon, slug: catSlug };
        const url = editingItem ? `/api/categories/${editingItem.id}` : "/api/categories";
        const method = editingItem ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
          showNotice("success", editingItem ? "Categoría actualizada" : "Categoría creada");
          setShowForm(false);
          fetchData();
          if (onRefreshData) onRefreshData();
        } else {
          showNotice("error", data.error || "Error al guardar categoría");
        }
      }
    } catch {
      showNotice("error", "Error de red");
    } finally {
      setSaveLoading(false);
    }
  }

  // Delete Item
  async function handleDelete(id: string) {
    if (!confirm("¿Está seguro de eliminar este elemento?")) return;
    setNotification(null);

    try {
      const endpoint = activeTab === "businesses" ? `/api/businesses/${id}` 
                     : activeTab === "categories" ? `/api/categories/${id}`
                     : `/api/users/${id}`;
      
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        showNotice("success", "Elemento eliminado/desactivado correctamente");
        fetchData();
        if (onRefreshData) onRefreshData();
      } else {
        showNotice("error", data.error || "Error al eliminar");
      }
    } catch {
      showNotice("error", "Error de conexión");
    }
  }

  // Update user role
  async function handleUserRoleChange(id: string, newRole: string) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice("success", "Rol de usuario actualizado");
        fetchData();
      } else {
        showNotice("error", data.error || "Error al cambiar rol");
      }
    } catch {
      showNotice("error", "Error de red");
    }
  }

  // Open Form for new/edit
  function openForm(item: any = null) {
    setEditingItem(item);
    setShowForm(true);

    if (activeTab === "businesses") {
      setBizName(item?.name || "");
      setBizDesc(item?.description || "");
      setBizAddress(item?.address || "");
      setBizLat(item?.latitude?.toString() || "");
      setBizLng(item?.longitude?.toString() || "");
      setBizPhone(item?.phone || "");
      setBizWhatsapp(item?.whatsapp || "");
      setBizCategoryId(item?.categoryId || (categories[0]?.id || ""));
      setBizVerified(item?.verified || false);
      setBizActive(item?.active !== undefined ? item.active : true);
      setBizOwnerId(item?.ownerId || "");
      setBizImage(item?.image || "");
      setBizImages(item?.images || []);
    } else if (activeTab === "categories") {
      setCatName(item?.name || "");
      setCatIcon(item?.icon || "");
      setCatSlug(item?.slug || "");
    }
  }

  if (!isOpen || user?.role !== "SUPER_ADMIN") return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
      {/* Container */}
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-2xl shadow-2xl relative animate-scale-in flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between text-white" style={{ backgroundColor: BRAND.blue }}>
          <div className="flex items-center gap-2">
            <Store size={20} />
            <h2 className="text-sm font-black uppercase tracking-wider">Panel de Administración</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-50 border-b border-gray-100">
          <button
            onClick={() => { setActiveTab("businesses"); setShowForm(false); }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "businesses" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Store size={14} />
            <span>Negocios</span>
          </button>
          <button
            onClick={() => { setActiveTab("categories"); setShowForm(false); }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "categories" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ListCollapse size={14} />
            <span>Categorías</span>
          </button>
          <button
            onClick={() => { setActiveTab("users"); setShowForm(false); }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "users" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Users size={14} />
            <span>Usuarios</span>
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3 mx-4 mt-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            notification.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {notification.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4">
          {showForm ? (
            /* ========================================================================= */
            /* FORM VIEW */
            /* ========================================================================= */
            <form onSubmit={handleSave} className="space-y-4 max-w-xl mx-auto pb-8">
              <h3 className="text-xs font-bold text-gray-700 uppercase border-b border-gray-100 pb-1.5">
                {editingItem ? "Editar" : "Crear nuevo"} {activeTab === "businesses" ? "Negocio" : "Categoría"}
              </h3>

              {activeTab === "businesses" && (
                <>
                  {/* Business form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Negocio</label>
                      <input type="text" required value={bizName} onChange={(e) => setBizName(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Categoría</label>
                      <select value={bizCategoryId} onChange={(e) => setBizCategoryId(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Descripción</label>
                    <textarea rows={2} value={bizDesc} onChange={(e) => setBizDesc(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Dirección Completa</label>
                      <input type="text" required value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Asignar Propietario (OWNER)</label>
                      <select value={bizOwnerId} onChange={(e) => setBizOwnerId(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option value="">Ninguno (Administrado global)</option>
                        {usersList.filter(u => u.role === "OWNER").map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Latitud (ej. 10.2268)</label>
                      <input type="number" step="any" required value={bizLat} onChange={(e) => setBizLat(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Longitud (ej. -67.3312)</label>
                      <input type="number" step="any" required value={bizLng} onChange={(e) => setBizLng(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</label>
                      <input type="text" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp (ej. +58412...)</label>
                      <input type="text" value={bizWhatsapp} onChange={(e) => setBizWhatsapp(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>

                  {/* Main Image Upload */}
                  <div className="border border-dashed border-gray-200 rounded-xl p-3.5 bg-gray-50 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Imagen Principal del Negocio</span>
                      <span className="text-[9px] text-gray-400">Suba una imagen directamente a Supabase Storage</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {bizImage && (
                        <img src={bizImage} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                      )}
                      <label className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                        <Upload size={12} />
                        <span>Subir</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Gallery Images Upload */}
                  <div className="border border-dashed border-gray-200 rounded-xl p-3.5 bg-gray-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Galería de Imágenes</span>
                        <span className="text-[9px] text-gray-400">Sube múltiples fotos para el negocio</span>
                      </div>
                      <label className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                        <Upload size={12} />
                        <span>Añadir Foto</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                      </label>
                    </div>

                    {bizImages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
                        {bizImages.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 bg-white">
                            <img src={img} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setBizImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-full shadow-sm active:scale-90"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={bizVerified} onChange={(e) => setBizVerified(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-600 font-bold">✓ Negocio Verificado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={bizActive} onChange={(e) => setBizActive(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-600 font-bold">Activo en el mapa</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === "categories" && (
                <>
                  {/* Category form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
                      <input type="text" required placeholder="ej. Farmacias" value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Slug (identificador URL)</label>
                      <input type="text" required placeholder="ej. farmacias" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Ícono (Emoji)</label>
                    <input type="text" required placeholder="ej. 💊" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none" />
                  </div>
                </>
              )}

              {/* Form buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-60 shadow-md"
                >
                  {saveLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* LIST VIEW */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                  Listado de {activeTab === "businesses" ? "Negocios" : activeTab === "categories" ? "Categorías" : "Usuarios"}
                </h3>
                {activeTab !== "users" && (
                  <button
                    onClick={() => openForm()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all hover:shadow active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Añadir {activeTab === "businesses" ? "Negocio" : "Categoría"}</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12 text-gray-400 gap-1.5">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Cargando datos...</span>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100">
                          {activeTab === "businesses" && (
                            <>
                              <th className="p-3">Negocio</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Ubicación</th>
                              <th className="p-3">Propietario</th>
                              <th className="p-3 text-right">Acciones</th>
                            </>
                          )}
                          {activeTab === "categories" && (
                            <>
                              <th className="p-3">Ícono</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Slug</th>
                              <th className="p-3 text-right">Acciones</th>
                            </>
                          )}
                          {activeTab === "users" && (
                            <>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Correo</th>
                              <th className="p-3">Rol</th>
                              <th className="p-3 text-right">Acciones</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {/* BUSINESS ROWS */}
                        {activeTab === "businesses" && businesses.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50">
                            <td className="p-3 flex items-center gap-2">
                              {b.image ? (
                                <img src={b.image} className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                                  {b.category?.icon || "🏪"}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-800">{b.name}</p>
                                <p className="text-[10px] text-gray-400">{b.city}, {b.state}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: CATEGORY_COLORS[b.category?.slug] || BRAND.blue }}>
                                {b.category?.icon} {b.category?.name}
                              </span>
                            </td>
                            <td className="p-3 text-gray-500 font-mono text-[10px]">
                              {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}
                            </td>
                            <td className="p-3 text-gray-500">
                              {b.ownerId ? (
                                <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                  {usersList.find(u => u.id === b.ownerId)?.name || "Dueño asignado"}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Sin dueño</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button onClick={() => openForm(b)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-500 active:scale-95">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDelete(b.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors text-gray-500 active:scale-95">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* CATEGORY ROWS */}
                        {activeTab === "categories" && categories.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50">
                            <td className="p-3 text-lg">{c.icon}</td>
                            <td className="p-3 font-bold text-gray-800">{c.name}</td>
                            <td className="p-3 font-mono text-gray-500">{c.slug}</td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button onClick={() => openForm(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-500 active:scale-95">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors text-gray-500 active:scale-95">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* USER ROWS */}
                        {activeTab === "users" && usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800">{u.name}</td>
                            <td className="p-3 text-gray-500">{u.email}</td>
                            <td className="p-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                                className="px-2 py-0.5 text-[11px] rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="VISITANTE">VISITANTE</option>
                                <option value="OWNER">OWNER</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDelete(u.id)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors text-gray-500 active:scale-95">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
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
  );
}
