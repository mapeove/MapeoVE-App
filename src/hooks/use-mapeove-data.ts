"use client";

import { useState, useEffect, useCallback } from "react";
import { Business, Category } from "@/types/mapeove";
import { fetchCategories, fetchBusinesses } from "@/lib/mapeove-api";

export function useMapeoveData(userLocation: { lat: number; lng: number } | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial de datos
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, biz] = await Promise.all([
          fetchCategories(),
          fetchBusinesses({ limit: 100 }),
        ]);
        setCategories(cats);
        setBusinesses(biz.businesses);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Recargar negocios al cambiar categoría, búsqueda o ubicación
  useEffect(() => {
    async function loadByCategory() {
      try {
        const result = await fetchBusinesses({
          category: activeCategory || undefined,
          q: searchQuery || undefined,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          limit: 100,
        });
        setBusinesses(result.businesses);
      } catch (err) {
        console.error("Error cargando negocios:", err);
      }
    }
    if (!isLoading) loadByCategory();
  }, [activeCategory, isLoading, userLocation, searchQuery]);

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
  };
}
