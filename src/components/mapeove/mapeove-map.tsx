"use client";

import { useEffect, useRef, useState } from "react";
import { Business, CATEGORY_COLORS, BRAND, MAP_CONFIG } from "@/types/mapeove";

interface MapeoVEMapProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onMarkerClick: (business: Business) => void;
  userLocation: { lat: number; lng: number } | null;
}

export function MapeoVEMap({
  businesses,
  selectedBusiness,
  onMarkerClick,
  userLocation,
}: MapeoVEMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: maplibregl.Map | null = null;

    // Import maplibre-gl dinámicamente para evitar problemas de SSR
    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainer.current || mapRef.current) return;

      // Importar CSS de maplibre
      const linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
      if (!document.querySelector('link[href*="maplibre-gl"]')) {
        document.head.appendChild(linkEl);
      }

      map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [MAP_CONFIG.longitude, MAP_CONFIG.latitude],
        zoom: MAP_CONFIG.zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), "bottom-right");
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "bottom-right"
      );

      map.on("load", () => {
        setMapLoaded(true);
      });

      mapRef.current = map;
    });

    return () => {
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update business markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    businesses.forEach((business) => {
      const color = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
      const isSelected = selectedBusiness?.id === business.id;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "mapeove-marker";
      el.style.cssText = `
        width: ${isSelected ? "44px" : "36px"};
        height: ${isSelected ? "44px" : "36px"};
        border-radius: 50% 50% 50% 4px;
        background: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? "20px" : "16px"};
        box-shadow: 0 2px 8px ${color}80, 0 0 0 ${isSelected ? "3px" : "2px"} white;
        cursor: pointer;
        transform: rotate(-45deg);
        transition: all 0.2s ease;
        z-index: ${isSelected ? "10" : "1"};
      `;

      // Counter-rotate the icon inside the rotated marker
      const iconSpan = document.createElement("span");
      iconSpan.style.cssText = "transform: rotate(45deg); display: flex;";
      iconSpan.textContent = business.category.icon;
      el.appendChild(iconSpan);

      el.addEventListener("click", () => onMarkerClick(business));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([business.longitude, business.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [businesses, selectedBusiness, onMarkerClick, mapLoaded]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation || !mapLoaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${BRAND.blue};
        border: 3px solid white;
        box-shadow: 0 0 0 2px ${BRAND.blue}40, 0 2px 8px rgba(0,0,0,0.3);
        z-index: 20;
        position: relative;
      `;

      const pulseEl = document.createElement("div");
      pulseEl.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${BRAND.blue}20;
        animation: pulse 2s infinite;
      `;

      el.appendChild(pulseEl);

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current);
    }
  }, [userLocation, mapLoaded]);

  // Fly to selected business
  useEffect(() => {
    if (!mapRef.current || !selectedBusiness || !mapLoaded) return;

    mapRef.current.flyTo({
      center: [selectedBusiness.longitude, selectedBusiness.latitude],
      zoom: 15,
      duration: 800,
    });
  }, [selectedBusiness, mapLoaded]);

  return (
    <>
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100vh",
        }}
      />
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .maplibregl-ctrl-bottom-right {
          bottom: 16px !important;
          right: 16px !important;
        }
        .maplibregl-ctrl-group {
          border-radius: 12px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
          overflow: hidden !important;
        }
        .maplibregl-ctrl-group button {
          width: 40px !important;
          height: 40px !important;
        }
        .maplibregl-ctrl-geolocate {
          border-radius: 12px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
        }
        .maplibregl-ctrl-geolocate button {
          width: 40px !important;
          height: 40px !important;
        }
      `}</style>
    </>
  );
}
