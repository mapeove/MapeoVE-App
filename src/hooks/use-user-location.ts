"use client";

import { useState, useEffect } from "react";
import { MAP_CONFIG } from "@/types/mapeove";

interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Fallback a La Victoria
          setUserLocation({ lat: MAP_CONFIG.latitude, lng: MAP_CONFIG.longitude });
        }
      );
    } else {
      setUserLocation({ lat: MAP_CONFIG.latitude, lng: MAP_CONFIG.longitude });
    }
  }, []);

  return { userLocation };
}
