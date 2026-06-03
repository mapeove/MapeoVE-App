"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { X, Mail, Lock, User, ShieldAlert } from "lucide-react";
import { BRAND } from "@/types/mapeove";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("VISITANTE"); // VISITANTE or OWNER for registration testing
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Credenciales inválidas");
        }
      } else {
        const res = await register(name, email, password, role);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Error al registrarse");
        }
      }
    } catch {
      setError("Error de red, intenta de nuevo");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative animate-scale-in border border-gray-100 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800 z-10"
        >
          <X size={16} />
        </button>

        {/* Brand Banner */}
        <div
          className="p-6 text-white text-center flex flex-col items-center gap-1"
          style={{ backgroundColor: BRAND.blue }}
        >
          <span className="text-2xl font-black tracking-wider">MapeoVE</span>
          <span className="text-xs text-white/80">
            {isLogin ? "Accede a tu cuenta de MapeoVE" : "Crea tu cuenta de MapeoVE"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 ${
              isLogin ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 ${
              !isLogin ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
              <ShieldAlert size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Field (Register only) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
              <div className="relative flex items-center">
                <User size={14} className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-100 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Correo Electrónico</label>
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-3 text-gray-400" />
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-100 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Contraseña</label>
            <div className="relative flex items-center">
              <Lock size={14} className="absolute left-3 text-gray-400" />
              <input
                type="password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-100 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Role selector (Register only - for testing purposes) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo de Usuario</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="VISITANTE">Visitante (Solo explorar)</option>
                <option value="OWNER">Propietario de Negocio (OWNER)</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-55"
            style={{ backgroundColor: BRAND.blue }}
          >
            {isLoading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>
        </form>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[9px] text-gray-400 leading-tight">
            Accede con las credenciales proporcionadas por el administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
