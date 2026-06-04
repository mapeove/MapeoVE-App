"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { X, Mail, Lock, LogIn, User, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { BRAND } from "@/types/mapeove";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = "login" | "register" | "forgot-password";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, forgotPassword } = useAuth();
  const [view, setView] = useState<AuthView>("login");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("VISITANTE");

  // Status indicators
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSwitchView = (newView: AuthView) => {
    setView(newView);
    setError("");
    setSuccessMsg("");
    // Keep email across views but reset password/names
    setPassword("");
    setName("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !password) {
      setError("Por favor ingresa tu correo y contraseña");
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
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name || !email || !password || !role) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const result = await register(name, email, password, role);
      if (result.success) {
        // Auto-login after successful registration
        const loginRes = await login(email, password);
        if (loginRes.success) {
          onClose();
        } else {
          // If auto-login fails, redirect to login page
          handleSwitchView("login");
          setSuccessMsg("¡Cuenta creada con éxito! Por favor inicia sesión.");
        }
      } else {
        setError(result.error || "Error al registrar la cuenta");
      }
    } catch {
      setError("Error al registrar la cuenta en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccessMsg(result.message || "Solicitud de recuperación generada con éxito.");
      } else {
        setError(result.error || "Error al procesar la recuperación.");
      }
    } catch {
      setError("Error al procesar la recuperación en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden border border-gray-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 text-white"
          style={{ backgroundColor: BRAND.blue }}
        >
          <div className="flex items-center gap-2">
            {view !== "login" && (
              <button 
                onClick={() => handleSwitchView("login")} 
                className="mr-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                title="Volver"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <LogIn size={18} />
            <h3 className="font-bold text-sm">
              {view === "login" && "Iniciar Sesión"}
              {view === "register" && "Crear Cuenta"}
              {view === "forgot-password" && "Restablecer Contraseña"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail size={15} />
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchView("forgot-password")}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock size={15} />
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
                  className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  {loading ? "Iniciando sesión..." : "Acceder"}
                </button>
              </div>

              <div className="pt-3 text-center border-t border-gray-100">
                <p className="text-[11px] text-gray-500">
                  ¿No tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchView("register")}
                    className="text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* VIEW: REGISTER */}
          {view === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
                  />
                </div>
              </div>



              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </button>
              </div>

              <div className="pt-3 text-center border-t border-gray-100">
                <p className="text-[11px] text-gray-500">
                  ¿Ya tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchView("login")}
                    className="text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === "forgot-password" && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Ingresa tu correo registrado y te enviaremos las instrucciones para restablecer tu contraseña.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail size={15} />
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: BRAND.blue }}
                >
                  {loading ? "Procesando..." : "Enviar Solicitud"}
                </button>
              </div>

              <div className="pt-3 text-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleSwitchView("login")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft size={14} />
                  <span>Volver a iniciar sesión</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
