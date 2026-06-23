"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BRAND } from "@/types/mapeove";
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const logoUrl = "/mapeove-logo.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Falta el token de recuperación en la dirección de la página.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "No se pudo restablecer la contraseña. Verifica si el enlace ya expiró o no es válido.");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error de conexión al procesar tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircle size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">¡Contraseña cambiada!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl active:scale-95 transition-all shadow-md"
          style={{ backgroundColor: BRAND.blue }}
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 space-y-6">
      {/* Header and Logo */}
      <div className="text-center space-y-3">
        <img 
          src={logoUrl} 
          alt="MapeoVE" 
          className="h-12 mx-auto"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Nueva Contraseña</h2>
          <p className="text-xs text-gray-500">
            Ingresa tu nueva clave de acceso para actualizar tu cuenta.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block">Nueva Contraseña</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Lock size={15} />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block">Confirmar Contraseña</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Lock size={15} />
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl active:scale-95 disabled:opacity-50 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
          style={{ backgroundColor: BRAND.blue }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Actualizando...
            </>
          ) : (
            "Restablecer Contraseña"
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          <ArrowLeft size={13} />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center py-16">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-gray-500">Cargando...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
