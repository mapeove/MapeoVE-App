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
  const mapRef = useRef<unknown>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const userMarkerRef = useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Initialize map — import maplibre-gl dinámicamente y guardar referencia
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !mapContainer.current || mapRef.current) return;

        // Guardar referencia al módulo para otros useEffect
        maplibreRef.current = maplibregl;

        // Cargar CSS desde CDN
        if (!document.querySelector('link[href*="maplibre-gl"]')) {
          const linkEl = document.createElement("link");
          linkEl.rel = "stylesheet";
          linkEl.href = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
          document.head.appendChild(linkEl);
        }

        const map = new maplibregl.Map({
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

        map.on("error", () => {
          setMapError(true);
        });

        mapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) {
          setMapError(true);
        }
      });

    return () => {
      cancelled = true;
      const map = mapRef.current as { remove: () => void } | null;
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      maplibreRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update business markers
  useEffect(() => {
    const maplibregl = maplibreRef.current;
    const map = mapRef.current as { current: unknown } | null;
    if (!map || !mapLoaded || !maplibregl) return;

    // Clear existing markers
    (markersRef.current as { remove: () => void }[]).forEach((marker) => marker.remove());
    markersRef.current = [];

    businesses.forEach((business) => {
      // Validar coordenadas — convertir a número si vienen como string
      const lat = Number(business.latitude);
      const lng = Number(business.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.warn(
          `[MapeoVE] Coordenadas inválidas para "${business.name}":`,
          `lat=${business.latitude}, lng=${business.longitude}`
        );
        return; // No crear marker para negocios sin coordenadas válidas
      }

      const color = CATEGORY_COLORS[business.category.slug] || BRAND.blue;
      const isSelected = selectedBusiness?.id === business.id;

      // Estructura anidada: root (libre para MapLibre) → pin (con rotate) → icono (contrarrotado)
      const markerRoot = document.createElement("div");
      markerRoot.className = "mapeove-marker-root";
      markerRoot.style.cssText = `
        width: ${isSelected ? "48px" : "40px"};
        height: ${isSelected ? "48px" : "40px"};
        cursor: pointer;
        z-index: ${isSelected ? "10" : "1"};
        transition: all 0.2s ease;
      `;

      const pin = document.createElement("div");
      pin.className = "mapeove-marker-pin";
      pin.style.cssText = `
        width: ${isSelected ? "40px" : "34px"};
        height: ${isSelected ? "40px" : "34px"};
        border-radius: 50% 50% 50% 4px;
        background: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isSelected ? "20px" : "16px"};
        box-shadow: 0 2px 8px ${color}80, 0 0 0 ${isSelected ? "3px" : "2px"} white;
        transform: rotate(-45deg);
        transition: all 0.2s ease;
      `;

      const iconSpan = document.createElement("span");
      iconSpan.style.cssText = `
        transform: rotate(45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      iconSpan.textContent = business.category.icon;

      pin.appendChild(iconSpan);
      markerRoot.appendChild(pin);

      markerRoot.addEventListener("click", () => onMarkerClick(business));

      const marker = new maplibregl.Marker({ element: markerRoot })
        .setLngLat([lng, lat])
        .addTo(mapRef.current as Parameters<typeof maplibregl.Marker.prototype.addTo>[0]);

      markersRef.current.push(marker);
    });
  }, [businesses, selectedBusiness, onMarkerClick, mapLoaded]);

  // Update user location marker
  useEffect(() => {
    const maplibregl = maplibreRef.current;
    if (!mapRef.current || !userLocation || !mapLoaded || !maplibregl) return;

    const lat = Number(userLocation.lat);
    const lng = Number(userLocation.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (userMarkerRef.current) {
      (userMarkerRef.current as { setLngLat: (lngLat: [number, number]) => void }).setLngLat([lng, lat]);
    } else {
      // Estructura anidada: root (sin transform) → dot + pulse
      const markerRoot = document.createElement("div");
      markerRoot.style.cssText = `
        width: 20px;
        height: 20px;
        cursor: pointer;
        z-index: 20;
        position: relative;
      `;

      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${BRAND.blue};
        border: 3px solid white;
        box-shadow: 0 0 0 2px ${BRAND.blue}40, 0 2px 8px rgba(0,0,0,0.3);
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

      markerRoot.appendChild(pulseEl);
      markerRoot.appendChild(dot);

      userMarkerRef.current = new maplibregl.Marker({ element: markerRoot })
        .setLngLat([lng, lat])
        .addTo(mapRef.current as Parameters<typeof maplibregl.Marker.prototype.addTo>[0]);
    }
  }, [userLocation, mapLoaded]);

  // Fly to selected business
  useEffect(() => {
    if (!mapRef.current || !selectedBusiness || !mapLoaded) return;

    const lat = Number(selectedBusiness.latitude);
    const lng = Number(selectedBusiness.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    (mapRef.current as { flyTo: (options: { center: [number, number]; zoom: number; duration: number }) => void }).flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 800,
    });
  }, [selectedBusiness, mapLoaded]);

  // Error state
  if (mapError) {
    return (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="text-4xl">🗺️</div>
          <p className="text-sm text-gray-600 font-medium">No se pudo cargar el mapa</p>
          <p className="text-xs text-gray-400">Verifica tu conexión a internet y recarga la página</p>
        </div>
      </div>
    );
  }

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
