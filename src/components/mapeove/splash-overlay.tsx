"use client";

import { useState, useEffect } from "react";
import { BRAND } from "@/types/mapeove";

export function SplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const hideTimer = setTimeout(() => setVisible(false), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: BRAND.blue }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
          <img
            src="/mapeove-logo.png"
            alt="MapeoVE Logo"
            className="w-24 h-24 object-contain rounded-xl"
          />
        </div>
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{ color: BRAND.white }}
          >
            MapeoVE
          </h1>
          <p
            className="mt-2 text-base font-medium tracking-wide"
            style={{ color: BRAND.yellow }}
          >
            Descubre negocios cerca de ti
          </p>
        </div>
        <div className="mt-4 flex gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{
              backgroundColor: BRAND.yellow,
              animationDelay: "0ms",
            }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{
              backgroundColor: BRAND.yellow,
              animationDelay: "150ms",
            }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{
              backgroundColor: BRAND.yellow,
              animationDelay: "300ms",
            }}
          />
        </div>
      </div>
      <p
        className="absolute bottom-8 text-xs font-medium opacity-60"
        style={{ color: BRAND.white }}
      >
        Conectando negocios en toda Venezuela
      </p>
    </div>
  );
}
