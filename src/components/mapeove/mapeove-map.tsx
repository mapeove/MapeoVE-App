"use client";

import { useEffect, useRef, useState } from "react";
import { Business, CATEGORY_COLORS, BRAND, MAP_CONFIG } from "@/types/mapeove";
import { isValidVenezuelaCoordinate } from "@/lib/coordinate-validator";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MapeoVEMapProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onMarkerClick: (business: Business) => void;
  userLocation: { lat: number; lng: number } | null;
  routeGeoJSON?: any;
  onMapClick?: (coords: {lat: number, lng: number}) => void;
  customMarkers?: {lat: number, lng: number, color: string}[];
}

interface BusinessFeatureProperties {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
}

// ─── buildGeoJSON ────────────────────────────────────────────────────────────
// FASE 2: Genera un FeatureCollection de GeoJSON a partir de los negocios.
// Cada negocio se convierte en un Point con properties.
// Se validan coordenadas (Number.isFinite + rango Venezuela) antes de incluir.

function buildGeoJSON(businesses: Business[]): GeoJSON.FeatureCollection<GeoJSON.Point, BusinessFeatureProperties> {
  const features: GeoJSON.Feature<GeoJSON.Point, BusinessFeatureProperties>[] = [];

  for (const business of businesses) {
    const lat = Number(business.latitude);
    const lng = Number(business.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn(
        `[MapeoVE GeoJSON] Coordenadas no finitas para "${business.name}": lat=${business.latitude}, lng=${business.longitude}`
      );
      continue;
    }

    if (!isValidVenezuelaCoordinate(lat, lng)) {
      console.warn(
        `[MapeoVE GeoJSON] Coordenadas fuera de Venezuela para "${business.name}": lat=${lat}, lng=${lng}`
      );
      continue;
    }

    const color = CATEGORY_COLORS[business.category.slug] || BRAND.blue;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
      },
      properties: {
        id: business.id,
        name: business.name,
        category: business.category.slug,
        icon: business.category.icon,
        color,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

// ─── Source & Layer IDs ──────────────────────────────────────────────────────

const SOURCE_ID = "businesses";
const CIRCLES_LAYER_ID = "business-circles";
const LABELS_LAYER_ID = "business-labels";

// ─── Component ───────────────────────────────────────────────────────────────

export function MapeoVEMap({
  businesses,
  selectedBusiness,
  onMarkerClick,
  userLocation,
  routeGeoJSON,
  onMapClick,
  customMarkers,
}: MapeoVEMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const userMarkerRef = useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [layersReady, setLayersReady] = useState(false);

  // Refs para rastrear si source/layers ya fueron creados
  const sourcesAddedRef = useRef(false);

  // ─── Inicializar mapa ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !mapContainer.current || mapRef.current) return;

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
      const map = mapRef.current;
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      maplibreRef.current = null;
      sourcesAddedRef.current = false;
      setMapLoaded(false);
    };
  }, []);

  // ─── FASE 3 & 4: Crear source GeoJSON + layers (circles + labels) ──────
  // Se ejecuta UNA vez cuando el mapa carga y hay datos disponibles.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !mapLoaded || !maplibregl || sourcesAddedRef.current) return;
    if (businesses.length === 0) return;

    const geojson = buildGeoJSON(businesses);

    // ─── FASE 3: Source GeoJSON ──────────────────────────────────────────
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: geojson,
    });

    // ─── Navegación Interna Source & Layer ─────────────────────────────────
    map.addSource("route-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    map.addLayer({
      id: "route-layer",
      type: "line",
      source: "route-source",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": BRAND.red,
        "line-width": 5,
        "line-opacity": 0.8,
      },
    });

    // ─── FASE 3: Layer business-circles ─────────────────────────────────
    map.addLayer({
      id: CIRCLES_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        // FASE 5: Radio dinámico según selección
        "circle-radius": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          8,
          5,
        ],
        // Color de categoría
        "circle-color": ["get", "color"],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
        // Un poco de opacidad para suavizar
        "circle-opacity": 0.9,
        "circle-stroke-opacity": 1,
      },
    });

    // ─── FASE 4: Layer business-labels (symbol, emoji, zoom >= 14) ──────
    map.addLayer({
      id: LABELS_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      minzoom: 14,
      layout: {
        "text-field": ["get", "icon"],
        "text-size": 10,
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-opacity": 1,
      },
    });

    sourcesAddedRef.current = true;
    setLayersReady(true);
  }, [mapLoaded, businesses]);

  // ─── FASE 7: Actualización eficiente con source.setData() ──────────────
  // Cuando cambian los businesses (filtros, búsqueda), solo actualiza los datos
  // del source, sin recrear mapa, source ni layers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !sourcesAddedRef.current) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const geojson = buildGeoJSON(businesses);
    source.setData(geojson);
  }, [businesses, mapLoaded]);

  // ─── Actualizar capa de ruta ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !sourcesAddedRef.current) return;

    const source = map.getSource("route-source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (routeGeoJSON) {
      source.setData(routeGeoJSON);

      // Enfocar la ruta en el mapa con un fitBounds cómodo
      try {
        const feature = routeGeoJSON.features?.[0];
        const coords = feature?.geometry?.coordinates;
        if (coords && coords.length > 0) {
          const maplibregl = maplibreRef.current;
          if (maplibregl) {
            const bounds = coords.reduce((acc: any, coord: any) => {
              return acc.extend(coord);
            }, new maplibregl.LngLatBounds(coords[0], coords[0]));
            
            map.fitBounds(bounds, {
              padding: { top: 120, bottom: 250, left: 50, right: 50 },
              maxZoom: 16,
              duration: 800,
            });
          }
        }
      } catch (err) {
        console.error("Error setting map bounds to route:", err);
      }
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [routeGeoJSON, mapLoaded]);

  // ─── FASE 5: Selección eficiente con setPaintProperty() ────────────────
  // Cuando selectedBusiness cambie, NO recrear mapa ni layers.
  // Solo actualiza las propiedades de pintura para destacar el seleccionado.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !sourcesAddedRef.current) return;

    const selectedId = selectedBusiness?.id ?? null;

    // Actualizar circle-radius con expresión MapLibre
    // Si el feature tiene el ID del negocio seleccionado → radio 8, sino → 5
    map.setPaintProperty(CIRCLES_LAYER_ID, "circle-radius", [
      "case",
      ["==", ["get", "id"], selectedId],
      8,
      5,
    ]);

    // Actualizar circle-stroke-width: más grueso para el seleccionado
    map.setPaintProperty(CIRCLES_LAYER_ID, "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], selectedId],
      3,
      2,
    ]);

    // Actualizar circle-opacity: el seleccionado es completamente opaco
    map.setPaintProperty(CIRCLES_LAYER_ID, "circle-opacity", [
      "case",
      ["==", ["get", "id"], selectedId],
      1,
      0.85,
    ]);
  }, [selectedBusiness, mapLoaded]);

  // ─── FASE 6: Click nativo MapLibre + cursor pointer ────────────────────
  // Registra listeners una sola vez cuando los layers están listos.
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  const businessesRef = useRef(businesses);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  // Circles specific clicks and cursor
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReady) return;

    const handleCircleClick = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const businessId = feature.properties?.id as string | undefined;
      if (!businessId) return;

      const business = businessesRef.current.find((b) => b.id === businessId);
      if (business && onMarkerClickRef.current) {
        onMarkerClickRef.current(business);
      }
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", CIRCLES_LAYER_ID, handleCircleClick);
    map.on("mouseenter", CIRCLES_LAYER_ID, handleMouseEnter);
    map.on("mouseleave", CIRCLES_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("click", CIRCLES_LAYER_ID, handleCircleClick);
      map.off("mouseenter", CIRCLES_LAYER_ID, handleMouseEnter);
      map.off("mouseleave", CIRCLES_LAYER_ID, handleMouseLeave);
    };
  }, [mapLoaded, layersReady]);

  // General map clicks
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const handleMapClick = (e: any) => {
      let features: any[] = [];
      try {
        if (map.getLayer(CIRCLES_LAYER_ID)) {
          features = map.queryRenderedFeatures(e.point, { layers: [CIRCLES_LAYER_ID] });
        }
      } catch (err) {
        // Safe query fallback
      }
      if (features.length === 0 && onMapClickRef.current) {
        onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapLoaded]);

  // ─── Marcador del usuario (DOM Marker — se mantiene) ───────────────────
  useEffect(() => {
    const maplibregl = maplibreRef.current;
    if (!mapRef.current || !userLocation || !mapLoaded || !maplibregl) return;

    const lat = Number(userLocation.lat);
    const lng = Number(userLocation.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (userMarkerRef.current) {
      (userMarkerRef.current as { setLngLat: (lngLat: [number, number]) => void }).setLngLat([lng, lat]);
    } else {
      const markerRoot = document.createElement("div");
      markerRoot.style.cssText = `
        width: 16px;
        height: 16px;
        cursor: pointer;
        z-index: 20;
        position: relative;
      `;

      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${BRAND.blue};
        border: 2.5px solid white;
        box-shadow: 0 0 0 2px ${BRAND.blue}40, 0 1px 4px rgba(0,0,0,0.2);
      `;

      const pulseEl = document.createElement("div");
      pulseEl.style.cssText = `
        position: absolute;
        top: -6px;
        left: -6px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${BRAND.blue}20;
        animation: pulse 2s infinite;
      `;

      markerRoot.appendChild(pulseEl);
      markerRoot.appendChild(dot);

      // anchor: "center" → el punto se centra exactamente en la ubicación del usuario
      userMarkerRef.current = new maplibregl.Marker({ element: markerRoot, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current as Parameters<typeof maplibregl.Marker.prototype.addTo>[0]);
    }
  }, [userLocation, mapLoaded]);

  // ─── Custom Markers (for origin/destination) ──────────────────────────
  const customMarkersRefs = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    const maplibregl = maplibreRef.current;
    if (!mapRef.current || !mapLoaded || !maplibregl) return;

    // Remove old markers
    customMarkersRefs.current.forEach(m => m.remove());
    customMarkersRefs.current = [];

    if (customMarkers) {
      customMarkers.forEach(cm => {
        const markerRoot = document.createElement("div");
        markerRoot.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${cm.color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        `;
        const m = new maplibregl.Marker({ element: markerRoot, anchor: "center" })
          .setLngLat([cm.lng, cm.lat])
          .addTo(mapRef.current as Parameters<typeof maplibregl.Marker.prototype.addTo>[0]);
        customMarkersRefs.current.push(m);
      });
    }
  }, [customMarkers, mapLoaded]);

  // ─── Fly to selected business ──────────────────────────────────────────
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

  // ─── Error state ───────────────────────────────────────────────────────
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
