"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { X, Mail, Lock, LogIn } from "lucide-react";
import { BRAND } from "@/types/mapeove";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor ingresa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Credenciales incorrectas");
      }
    } catch {
      setError("Ocurrió un error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 text-white"
          style={{ backgroundColor: BRAND.blue }}
        >
          <div className="flex items-center gap-2">
            <LogIn size={18} />
            <h3 className="font-bold text-sm">Iniciar Sesión</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: BRAND.blue }}
            >
              <span>{loading ? "Iniciando sesión..." : "Acceder"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
