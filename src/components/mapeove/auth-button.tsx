"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth-modal";
import { RegisterLocalModal } from "./register-local-modal";
import { LogIn, LogOut, User, ShieldAlert, LayoutDashboard, ChevronDown, Store } from "lucide-react";
import { BRAND } from "@/types/mapeove";

interface AuthButtonProps {
  onOpenDashboard: () => void;
}

export function AuthButton({ onOpenDashboard }: AuthButtonProps) {
  const { user, logout, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDashboardClick = () => {
    setDropdownOpen(false);
    onOpenDashboard();
  };

  if (loading) {
    return (
      <div 
        className="w-10 h-10 sm:w-28 sm:h-10 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center pointer-events-auto"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white shadow-lg border border-gray-100 text-xs font-bold text-gray-700 hover:text-gray-900 hover:shadow-xl active:scale-95 transition-all pointer-events-auto"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
        >
          <LogIn size={14} style={{ color: BRAND.blue }} />
          <span className="hidden sm:inline">Iniciar Sesión</span>
        </button>
        <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const userColor = isSuperAdmin ? BRAND.red : BRAND.blue;

  return (
    <div ref={dropdownRef} className="relative z-40 pointer-events-auto">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white shadow-lg border border-gray-100 text-xs font-bold text-gray-700 hover:shadow-xl active:scale-95 transition-all"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
      >
        <span 
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: userColor }}
        >
          {isSuperAdmin ? <ShieldAlert size={12} /> : <User size={12} />}
        </span>
        <span className="hidden sm:inline truncate max-w-[80px]">{user.name}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {dropdownOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-scale-in text-gray-800 z-50"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Usuario</p>
            <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
          </div>

          {!isSuperAdmin && (
            <button
              onClick={() => {
                setDropdownOpen(false);
                setRegisterModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 text-sm sm:text-xs sm:py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors font-bold"
            >
              <Store size={16} className="text-gray-500" />
              <span>{user.role === "OWNER" ? "Mi local" : "Registrar local"}</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={handleDashboardClick}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 text-sm sm:text-xs sm:py-2 text-gray-700 hover:bg-gray-50 text-left transition-colors font-bold"
            >
              <LayoutDashboard size={16} className="text-gray-500" />
              <span>Panel de Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              logout();
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-3.5 text-sm sm:text-xs sm:py-2 text-red-600 hover:bg-red-50 text-left transition-colors font-bold"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      {/* Local registration/details Modal */}
      {!isSuperAdmin && (
        <RegisterLocalModal 
          isOpen={registerModalOpen} 
          onClose={() => setRegisterModalOpen(false)} 
          user={user}
        />
      )}
    </div>
  );
}
