"use client";

import { useEffect, useRef, useState } from "react";
import { Business, CATEGORY_COLORS, BRAND } from "@/types/mapeove";
import { MAP_STYLE, INITIAL_MAP_CONFIG } from "@/lib/map-config";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MapeoVEMapProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onMarkerClick: (business: Business) => void;
  userLocation: { lat: number; lng: number } | null;
  routeGeoJSON?: any;
  onMapClick?: (coords: {lat: number, lng: number}) => void;
  customMarkers?: {lat: number, lng: number, color: string}[];
  /** When true, camera follows userLocation changes smoothly */
  followUserLocation?: boolean;
  /** Called when the user manually drags the map (so parent can disable following) */
  onStopFollowing?: () => void;
  /** When true, any map click should be captured as a coordinate selection.
   *  Circles (business markers) will not consume the click; the general map click fires instead. */
  isSelecting?: boolean;
  isRealLocation?: boolean;
  selectedGeocode?: { lat: number; lng: number } | null;
  onVisibleBusinessesChange?: (businesses: Business[]) => void;
  bearing?: number;
  isActiveNavigation?: boolean;
  onRecenter?: () => void;
  focusNearbyTrigger?: number;
  onMapExplore?: (coords: { lat: number; lng: number }) => void;
  onResetToGps?: () => void;
  activeCategory?: string | null;
}



function getCategoryIconSvg(slug: string): string {
  switch (slug) {
    case "restaurantes":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z"/><path d="M18 22V17"/></svg>`;
    case "farmacias":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`;
    case "gasolineras":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V2h8v20H3Z"/><path d="M17 12h4"/><path d="M11 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/><path d="M17 12a2 2 0 0 0 2 2v4a2 2 0 0 0 2-2v-4"/></svg>`;
    case "hoteles":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>`;
    case "talleres":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    case "salud":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="13" rx="2"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="16" x2="12" y2="21"/></svg>`;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MapeoVEMap({
  businesses,
  selectedBusiness,
  onMarkerClick,
  userLocation,
  routeGeoJSON,
  onMapClick,
  customMarkers,
  followUserLocation = false,
  onStopFollowing,
  isSelecting = false,
  isRealLocation = false,
  selectedGeocode = null,
  onVisibleBusinessesChange,
  bearing = 0,
  isActiveNavigation = false,
  onRecenter,
  focusNearbyTrigger = 0,
  onMapExplore,
  onResetToGps,
  activeCategory = null,
}: MapeoVEMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const userMarkerRef = useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const isUserGestureRef = useRef(false);

  // Refs para rastrear si source/layers ya fueron creados
  const sourcesAddedRef = useRef(false);
  const businessMarkersRefs = useRef<any[]>([]);

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
          style: MAP_STYLE,
          center: [INITIAL_MAP_CONFIG.longitude, INITIAL_MAP_CONFIG.latitude],
          zoom: INITIAL_MAP_CONFIG.zoom,
        });

        map.addControl(new maplibregl.NavigationControl(), "bottom-right");
        const geolocate = new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        });
        map.addControl(geolocate, "bottom-right");

        geolocate.on("geolocate", () => {
          if (onRecenter) {
            onRecenter();
          }
          if (onResetToGps) {
            onResetToGps();
          }
        });

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
      if (userMarkerRef.current) {
        try {
          (userMarkerRef.current as any).remove();
        } catch (e) {}
        userMarkerRef.current = null;
      }
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
  // Se ejecuta UNA vez cuando el mapa carga.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !mapLoaded || !maplibregl || sourcesAddedRef.current) return;

    // ─── Navegación Interna Source & Layer ─────────────────────────────────
    map.addSource("route-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    // Capa de borde blanco para ruta premium (casing)
    map.addLayer({
      id: "route-layer-casing",
      type: "line",
      source: "route-source",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": 12, // 8px principal + 2px borde por lado
        "line-opacity": 0.95,
      },
    });

    // Capa azul principal
    map.addLayer({
      id: "route-layer",
      type: "line",
      source: "route-source",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 8,
        "line-opacity": 0.95,
      },
    });

    sourcesAddedRef.current = true;
    setLayersReady(true);
  }, [mapLoaded]);



  // ─── Actualizar capa de ruta ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !sourcesAddedRef.current) return;

    const source = map.getSource("route-source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (routeGeoJSON) {
      source.setData(routeGeoJSON);

      // Enfocar la ruta en el mapa — animación suave, sin zoom agresivo
      try {
        const feature = routeGeoJSON.features?.[0];
        const coords = feature?.geometry?.coordinates;
        if (coords && coords.length > 0) {
          const maplibregl = maplibreRef.current;
          if (maplibregl) {
            const bounds = coords.reduce((acc: any, coord: any) => {
              return acc.extend(coord);
            }, new maplibregl.LngLatBounds(coords[0], coords[0]));
            
            // padding generoso para dejar el mapa visible por encima del panel
            // maxZoom bajo para no hacer zoom excesivo en rutas cortas
            // duration alto para transición suave sin sensación de "reset"
            map.fitBounds(bounds, {
              padding: { top: 100, bottom: 220, left: 40, right: 40 },
              maxZoom: 15,
              duration: 1200,
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

  const onVisibleBusinessesChangeRef = useRef(onVisibleBusinessesChange);
  useEffect(() => {
    onVisibleBusinessesChangeRef.current = onVisibleBusinessesChange;
  }, [onVisibleBusinessesChange]);

  const handleMapUpdate = () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();

      const visibleBiz = (businessesRef.current || []).filter((b) => {
        const lat = Number(b.latitude);
        const lng = Number(b.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        return (
          lng >= bounds.getWest() &&
          lng <= bounds.getEast() &&
          lat >= bounds.getSouth() &&
          lat <= bounds.getNorth()
        );
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("=== MAPA UPDATE ===");
        console.log("Centro del mapa:", `lat: ${center.lat.toFixed(6)}, lng: ${center.lng.toFixed(6)}`);
        console.log("Zoom actual:", zoom.toFixed(2));
        console.log("Negocios visibles:", visibleBiz.map(b => `${b.name} (${b.category.slug})`));
        console.log("Negocios filtrados (en memoria):", businessesRef.current.length);
      }

      if (onVisibleBusinessesChangeRef.current) {
        onVisibleBusinessesChangeRef.current(visibleBiz);
      }
    } catch (err) {
      console.error("Error al calcular negocios visibles:", err);
    }
  };

  // Sincronizar negocios visibles cuando cambian los negocios cargados o los filtros
  useEffect(() => {
    if (mapLoaded && layersReady) {
      handleMapUpdate();
    }
  }, [businesses, mapLoaded, layersReady]);

  // Escuchar el evento moveend para volver a calcular los negocios visibles al mover el mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReady) return;

    const handleMoveEnd = () => {
      handleMapUpdate();
      if (isUserGestureRef.current) {
        isUserGestureRef.current = false;
        const center = map.getCenter();
        if (onMapExplore) {
          onMapExplore({ lat: center.lat, lng: center.lng });
        }
      }
    };

    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [mapLoaded, layersReady, onMapExplore]);

  // Keep isSelecting in a ref so click handlers always read the latest value
  const isSelectingRef = useRef(isSelecting);
  useEffect(() => { isSelectingRef.current = isSelecting; }, [isSelecting]);

  // State to trigger marker updates on map movements (which change pixel projection)
  const [mapViewportVersion, setMapViewportVersion] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const handleViewportChange = () => {
      setMapViewportVersion((v) => v + 1);
    };

    map.on("zoomend", handleViewportChange);
    map.on("moveend", handleViewportChange);
    map.on("idle", handleViewportChange);

    return () => {
      map.off("zoomend", handleViewportChange);
      map.off("moveend", handleViewportChange);
      map.off("idle", handleViewportChange);
    };
  }, [mapLoaded]);

  // HTML Markers for Businesses (including clustering)
  useEffect(() => {
    const maplibregl = maplibreRef.current;
    const map = mapRef.current;
    if (!map || !mapLoaded || !maplibregl) return;

    // Remove existing business markers
    businessMarkersRefs.current.forEach((m) => m.remove());
    businessMarkersRefs.current = [];

    // During active navigation, do not render business markers to keep map clean
    if (isActiveNavigation) return;

    const currentZoomLevel = map.getZoom();
    const showLabels = currentZoomLevel >= 16;

    const selectedId = selectedBusiness?.id;

    // Filter by viewport bounds to optimize DOM element count
    const bounds = map.getBounds();
    const businessesInViewport = (businesses || []).filter((b) => {
      if (activeCategory && b.category.slug !== activeCategory) return false;
      if (b.id === selectedId) return true; // Always keep selected
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      return (
        lng >= bounds.getWest() &&
        lng <= bounds.getEast() &&
        lat >= bounds.getSouth() &&
        lat <= bounds.getNorth()
      );
    });

    // Separate selected business from clustering so it is always rendered as its own marker
    const businessesToCluster = businessesInViewport.filter((b) => b.id !== selectedId);

    // Dynamic clustering logic based on screen distance (pixels)
    const clusters: any[] = [];
    const radiusPx = 45; // pixel radius for clustering

    for (const biz of businessesToCluster) {
      const lat = Number(biz.latitude);
      const lng = Number(biz.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const pos = map.project([lng, lat]);

      let added = false;
      for (const cluster of clusters) {
        const dist = Math.hypot(cluster.x - pos.x, cluster.y - pos.y);
        if (dist < radiusPx) {
          cluster.businesses.push(biz);
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push({
          x: pos.x,
          y: pos.y,
          lng,
          lat,
          businesses: [biz],
        });
      }
    }

    const MAP_CATEGORY_COLORS: Record<string, string> = {
      restaurantes: "#F97316", // rojo/naranja
      farmacias: "#22C55E",    // verde
      gasolineras: "#D72638",  // rojo
      hoteles: "#0B3D91",      // azul
      talleres: "#8B5CF6",     // morado/gris
      salud: "#06B6D4",        // turquesa
      comercios: "#F4C430",    // amarillo
    };

    // Render clusters
    clusters.forEach((cluster) => {
      const count = cluster.businesses.length;

      if (count === 1) {
        // Render single business marker
        const business = cluster.businesses[0];
        renderSingleBusinessMarker(business, false);
      } else {
        // Render cluster badge
        const clusterEl = document.createElement("div");
        clusterEl.className = "mapeove-cluster-marker animate-fade-in";
        
        let labelText = `${count}`;
        if (count >= 10) labelText = "10+";
        else if (count >= 5) labelText = "5+";
        else if (count >= 3) labelText = "3+";

        clusterEl.innerText = labelText;

        clusterEl.addEventListener("click", (e) => {
          e.stopPropagation();
          map.flyTo({
            center: [cluster.lng, cluster.lat],
            zoom: Math.min(map.getZoom() + 1.5, 18),
            duration: 600,
          });
        });

        try {
          const marker = new maplibregl.Marker({ element: clusterEl, anchor: "center" })
            .setLngLat([cluster.lng, cluster.lat])
            .addTo(map);
          businessMarkersRefs.current.push(marker);
        } catch (err) {
          console.error("Error creating cluster marker:", err);
        }
      }
    });

    // Always render selected business if it exists and is filtered/in the list
    if (selectedBusiness) {
      const isFiltered = (businesses || []).some((b) => b.id === selectedId);
      if (isFiltered) {
        renderSingleBusinessMarker(selectedBusiness, true);
      }
    }

    // Helper function to render a single business marker
    function renderSingleBusinessMarker(business: Business, isSelected: boolean) {
      if (!maplibregl || !map) return;
      const lat = Number(business.latitude);
      const lng = Number(business.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const color = MAP_CATEGORY_COLORS[business.category.slug] || BRAND.blue;
      const svgIcon = getCategoryIconSvg(business.category.slug);

      const now = new Date();
      const isSponsored = !!(business.sponsoredCategory && (!business.sponsoredUntil || new Date(business.sponsoredUntil) > now));
      const isFeatured = !!(business.featured && (!business.featuredUntil || new Date(business.featuredUntil) > now));

      const markerEl = document.createElement("div");
      markerEl.className = `mapeove-business-marker-wrapper animate-fade-in ${isSelected ? "selected" : ""}`;
      if (isSponsored) {
        markerEl.classList.add("sponsored");
      } else if (isFeatured) {
        markerEl.classList.add("featured");
      }

      if (showLabels) {
        markerEl.classList.add("show-label");
      }

      let badgeHtml = "";
      if (isSponsored) {
        badgeHtml = `<div class="marker-sponsored-badge">Patrocinado</div>`;
      } else if (isFeatured) {
        badgeHtml = `<div class="marker-featured-badge">Destacado</div>`;
      }

      markerEl.innerHTML = `
        ${badgeHtml}
        <div class="marker-icon-circle" style="background-color: ${color};">
          ${svgIcon}
        </div>
        <div class="marker-name-label">${business.name}</div>
      `;

      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerClick(business);
      });

      try {
        const marker = new maplibregl.Marker({ element: markerEl, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        businessMarkersRefs.current.push(marker);
      } catch (err) {
        console.error("Error creating business marker:", err);
      }
    }

  }, [businesses, selectedBusiness, mapLoaded, isActiveNavigation, mapViewportVersion]);

  // General map clicks
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const handleMapClick = (e: any) => {
      if (!onMapClickRef.current) return;
      onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapLoaded]);

  // ─── Marcador del usuario (DOM Marker — se mantiene) ───────────────────
  useEffect(() => {
    const maplibregl = maplibreRef.current;
    const map = mapRef.current;
    if (!map || !userLocation || !mapLoaded || !maplibregl || !isRealLocation) {
      if (userMarkerRef.current) {
        try {
          (userMarkerRef.current as any).remove();
        } catch (e) {}
        userMarkerRef.current = null;
      }
      return;
    }

    const lat = Number(userLocation.lat);
    const lng = Number(userLocation.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const markerElementId = "user-gps-marker";
    let markerEl = document.getElementById(markerElementId);

    const arrowHtml = `
      <div class="user-location-arrow" style="transform: rotate(${bearing}deg); transition: transform 0.2s ease-out;">
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path d="M12 3L4 20L12 16L20 20Z" fill="white" />
        </svg>
      </div>
    `;

    const dotHtml = `
      <div style="position: relative; width: 16px; height: 16px;">
        <div style="position: absolute; top: -6px; left: -6px; width: 28px; height: 28px; border-radius: 50%; background: ${BRAND.blue}20; animation: pulse 2s infinite;"></div>
        <div style="width: 16px; height: 16px; border-radius: 50%; background: ${BRAND.blue}; border: 2.5px solid white; box-shadow: 0 0 0 2px ${BRAND.blue}40, 0 1px 4px rgba(0,0,0,0.2);"></div>
      </div>
    `;

    if (userMarkerRef.current && markerEl) {
      (userMarkerRef.current as any).setLngLat([lng, lat]);
      markerEl.style.width = isActiveNavigation ? "48px" : "42px";
      markerEl.style.height = isActiveNavigation ? "48px" : "42px";
      markerEl.innerHTML = isActiveNavigation ? arrowHtml : dotHtml;
    } else {
      if (userMarkerRef.current) {
        try {
          (userMarkerRef.current as any).remove();
        } catch (e) {}
      }

      const markerRoot = document.createElement("div");
      markerRoot.id = markerElementId;
      markerRoot.style.cssText = `
        width: ${isActiveNavigation ? "48px" : "42px"};
        height: ${isActiveNavigation ? "48px" : "42px"};
        cursor: pointer;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      markerRoot.innerHTML = isActiveNavigation ? arrowHtml : dotHtml;

      try {
        userMarkerRef.current = new maplibregl.Marker({ element: markerRoot, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
      } catch (err) {
        console.error("Error creating user marker:", err);
      }
    }
  }, [userLocation, mapLoaded, isActiveNavigation, bearing]);

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
  // ─── Fly to selected geocode ──────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedGeocode || !mapLoaded) return;

    const lat = Number(selectedGeocode.lat);
    const lng = Number(selectedGeocode.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    (mapRef.current as any).flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 800,
    });
  }, [selectedGeocode, mapLoaded]);

  // ─── Focus nearby businesses ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !focusNearbyTrigger) return;

    const refCenter = isRealLocation ? userLocation : null;
    const validBiz = (businesses || []).filter((b) => {
      if (activeCategory && b.category.slug !== activeCategory) return false;
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      const isValid = Number.isFinite(lat) && Number.isFinite(lng);
      if (!isValid) return false;
      if (refCenter) {
        return b.distance !== undefined && b.distance <= 20;
      }
      return true;
    });

    if (validBiz.length === 0) return;

    if (validBiz.length === 1) {
      const lat = Number(validBiz[0].latitude);
      const lng = Number(validBiz[0].longitude);
      map.flyTo({
        center: [lng, lat],
        zoom: 15.5,
        duration: 800,
      });
    } else {
      const maplibregl = maplibreRef.current;
      if (!maplibregl) return;

      const bounds = new maplibregl.LngLatBounds();
      validBiz.forEach((b) => {
        bounds.extend([Number(b.longitude), Number(b.latitude)]);
      });

      if (refCenter) {
        bounds.extend([refCenter.lng, refCenter.lat]);
      }

      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 220, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [focusNearbyTrigger, mapLoaded]);

  // ─── Center on user location once when real location is available ───
  const centeredOnUserRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation || !isRealLocation || centeredOnUserRef.current) return;

    centeredOnUserRef.current = true;
    map.setCenter([userLocation.lng, userLocation.lat]);
    map.setZoom(15);
  }, [userLocation, isRealLocation, mapLoaded]);

  // ─── Follow user location (live navigation camera tracking) ───────────────
  // Uses easeTo for smooth continuous following without jarring jumps.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !followUserLocation || !userLocation) return;

    const lat = Number(userLocation.lat);
    const lng = Number(userLocation.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (isActiveNavigation) {
      (map as any).flyTo({
        center: [lng, lat],
        zoom: 18,
        pitch: 70,
        bearing: bearing || map.getBearing(),
        offset: [0, 150], // Places the vehicle in the lower portion of the screen (tercio inferior)
        duration: 1000,
      });
    } else {
      (map as any).easeTo({
        center: [lng, lat],
        zoom: Math.max((map as any).getZoom?.() ?? 15, 15),
        pitch: 0,
        bearing: 0,
        offset: [0, 0],
        duration: 800,
      });
    }
  }, [userLocation, followUserLocation, mapLoaded, isActiveNavigation, bearing]);

  // ─── Reset map camera angle when exiting navigation ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!isActiveNavigation) {
      (map as any).easeTo({
        pitch: 0,
        bearing: 0,
        offset: [0, 0],
        duration: 1000
      });
    }
  }, [isActiveNavigation, mapLoaded]);

  // ─── Detect user map drag → stop following ─────────────────────────────
  const onStopFollowingRef = useRef(onStopFollowing);
  useEffect(() => { onStopFollowingRef.current = onStopFollowing; }, [onStopFollowing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const handleMoveStart = (e: any) => {
      // originalEvent is set only when triggered by user interaction (touch/mouse)
      if (e.originalEvent) {
        isUserGestureRef.current = true;
        if (onStopFollowingRef.current) {
          onStopFollowingRef.current();
        }
      }
    };

    map.on("movestart", handleMoveStart);
    return () => {
      map.off("movestart", handleMoveStart);
    };
  }, [mapLoaded]);

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
        className={isActiveNavigation ? "navigation-active" : ""}
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
      {isActiveNavigation && !followUserLocation && userLocation && (
        <button 
          className="recenter-button"
          onClick={() => {
            if (onRecenter) {
              onRecenter();
            }
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: 18,
                pitch: 70,
                bearing: bearing || mapRef.current.getBearing(),
                offset: [0, 150],
                duration: 1000,
              });
            }
          }}
        >
          🎯 Recentrar
        </button>
      )}
      <style jsx global>{`
        .navigation-active .maplibregl-ctrl {
          display: none !important;
        }
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

        /* Sponsored & Featured premium marker styles */
        .mapeove-business-marker-wrapper.sponsored .marker-icon-circle {
          border: 2px solid #F4C430 !important;
          box-shadow: 0 0 0 2px rgba(244, 196, 48, 0.4), 0 0 12px #F4C430, 0 2px 6px rgba(0,0,0,0.3) !important;
          transform: scale(1.1);
        }
        .mapeove-business-marker-wrapper.sponsored .marker-sponsored-badge {
          position: absolute;
          top: -14px;
          background: #F4C430;
          color: #000;
          font-size: 7px;
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 4px;
          text-transform: uppercase;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          white-space: nowrap;
          border: 1px solid white;
          z-index: 2;
        }
        .mapeove-business-marker-wrapper.sponsored .marker-name-label {
          background: #F4C430 !important;
          color: #000 !important;
          font-weight: 900 !important;
          border: 1px solid white;
        }

        .mapeove-business-marker-wrapper.featured .marker-icon-circle {
          border: 2px solid #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4), 0 0 10px rgba(59, 130, 246, 0.6), 0 2px 6px rgba(0,0,0,0.3) !important;
          transform: scale(1.05);
        }
        .mapeove-business-marker-wrapper.featured .marker-featured-badge {
          position: absolute;
          top: -14px;
          background: #3b82f6;
          color: white;
          font-size: 7px;
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 4px;
          text-transform: uppercase;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          white-space: nowrap;
          border: 1px solid white;
          z-index: 2;
        }
        .mapeove-business-marker-wrapper.featured .marker-name-label {
          background: #3b82f6 !important;
          color: white !important;
          font-weight: 800 !important;
          border: 1px solid white;
        }
      `}</style>
    </>
  );
}
