"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Business, Category } from "@/types/mapeove";
import { fetchCategories, fetchBusinesses } from "@/lib/mapeove-api";

export function useMapeoveData(userLocation: { lat: number; lng: number } | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Ref para rastrear si la carga inicial ya se hizo
  const initialLoadDone = useRef(false);

  // Ref para rastrear la ubicación usada en la última carga
  // Se inicializa con la locationKey que tendrá la primera carga
  const prevLocationRef = useRef<string>(userLocation
    ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}`
    : "null"
  );

  // Ref para rastrear los filtros activos al momento de la carga inicial
  const initialCategoryRef = useRef<string | null>(null);
  const initialSearchRef = useRef<string>("");

  // Carga inicial — solo UNA vez
  useEffect(() => {
    if (initialLoadDone.current) return;

    async function loadData() {
      try {
        const [cats, biz] = await Promise.all([
          fetchCategories(),
          fetchBusinesses({ limit: 100 }),
        ]);
        setCategories(cats);
        setBusinesses(biz.businesses);
        initialLoadDone.current = true;
        // Registrar la locationKey usada en la carga inicial para evitar
        // que el segundo efecto haga una llamada redundante inmediatamente
        prevLocationRef.current = userLocation
          ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}`
          : "null";
        // Registrar los filtros vigentes al momento de la carga inicial
        initialCategoryRef.current = activeCategory;
        initialSearchRef.current = searchQuery;
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Recargar negocios cuando cambian categoría, búsqueda o ubicación
  // Se ejecuta DESPUÉS de la carga inicial
  useEffect(() => {
    if (!initialLoadDone.current) return;

    // Calcular la locationKey actual
    const locationKey = userLocation
      ? `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}`
      : "null";

    // Si la ubicación no cambió Y la categoría no cambió → no recargar
    const locationChanged = locationKey !== prevLocationRef.current;
    const categoryChanged = activeCategory !== initialCategoryRef.current;

    if (!locationChanged && !categoryChanged) {
      return; // Nada cambió — no recargar
    }

    prevLocationRef.current = locationKey;
    initialCategoryRef.current = activeCategory;

    async function loadByFilter() {
      try {
        const result = await fetchBusinesses({
          category: activeCategory || undefined,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          limit: 100,
        });
        setBusinesses(result.businesses);
      } catch (err) {
        console.error("Error cargando negocios:", err);
      }
    }
    loadByFilter();
  }, [activeCategory, userLocation]);

  const handleMarkerClick = useCallback((business: Business) => {
    setSelectedBusiness(business);
  }, []);

  const handleCategoryChange = useCallback((slug: string | null) => {
    setActiveCategory(slug);
    setSelectedBusiness(null);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleSelectBusinessFromSearch = useCallback((business: Business) => {
    setSelectedBusiness(business);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedBusiness(null);
  }, []);

  const refreshBusinesses = useCallback(async () => {
    try {
      const result = await fetchBusinesses({
        category: activeCategory || undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        limit: 100,
      });
      setBusinesses(result.businesses);
    } catch (err) {
      console.error("Error refreshing businesses:", err);
    }
  }, [activeCategory, userLocation]);

  return {
    categories,
    businesses,
    selectedBusiness,
    activeCategory,
    isLoading,
    searchQuery,
    businessCount: businesses.length,
    handleMarkerClick,
    handleCategoryChange,
    handleSearch,
    handleClearSearch,
    handleSelectBusinessFromSearch,
    handleCloseDetail,
    refreshBusinesses,
  };
}
