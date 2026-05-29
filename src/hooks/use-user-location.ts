"use client";

import { useState, useEffect } from "react";
import { MAP_CONFIG } from "@/types/mapeove";

interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isRealLocation, setIsRealLocation] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsRealLocation(true);
        },
        () => {
          // Fallback a La Victoria — NO es ubicación real del usuario
          setUserLocation({ lat: MAP_CONFIG.latitude, lng: MAP_CONFIG.longitude });
          setIsRealLocation(false);
        }
      );
    } else {
      setUserLocation({ lat: MAP_CONFIG.latitude, lng: MAP_CONFIG.longitude });
      setIsRealLocation(false);
    }
  }, []);

  return { userLocation, isRealLocation };
}
