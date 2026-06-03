"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/mapeove/auth-modal";
import { User, LogOut, Shield, Settings, Menu } from "lucide-react";
import { BRAND } from "@/types/mapeove";

interface AuthButtonProps {
  onOpenAdminPanel: () => void;
}

export function AuthButton({ onOpenAdminPanel }: AuthButtonProps) {
  const { user, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative z-40 pointer-events-auto">
      {/* Trigger Button */}
      {user ? (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-lg text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
        >
          <div
            className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-[10px] font-bold uppercase select-none"
            style={{
              backgroundColor: user.role === "SUPER_ADMIN" ? BRAND.red : BRAND.blue,
            }}
          >
            {user.name.substring(0, 2)}
          </div>
        </button>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-lg text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
        >
          <User size={18} />
        </button>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Dropdown Menu */}
      {menuOpen && user && (
        <>
          {/* Overlay to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />

          <div
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2.5 z-50 animate-scale-in"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
          >
            {/* User Details */}
            <div className="px-3.5 pb-2.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              <span
                className="inline-block mt-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white tracking-wider"
                style={{
                  backgroundColor:
                    user.role === "SUPER_ADMIN"
                      ? BRAND.red
                      : user.role === "OWNER"
                      ? BRAND.yellow
                      : "#6B7280",
                }}
              >
                {user.role}
              </span>
            </div>

            {/* Menu Options */}
            <div className="pt-1.5 space-y-0.5">
              {user.role === "SUPER_ADMIN" && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAdminPanel();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Shield size={14} className="text-red-500" />
                  <span>Panel de Administración</span>
                </button>
              )}

              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50/50 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
