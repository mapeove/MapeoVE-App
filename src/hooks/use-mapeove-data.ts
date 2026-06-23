"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Business, Category } from "@/types/mapeove";
import { fetchCategories, fetchBusinesses } from "@/lib/mapeove-api";
import { haversineDistance, roundDistance } from "@/lib/geo";

export function useMapeoveData(userLocation: { lat: number; lng: number } | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Carga de categorías e inicialización (solo una vez)
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error cargando categorias:", err);
      }
    }
    loadCats();
  }, []);

  // Carga de negocios según activeCategory (incluye la carga inicial)
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoadingNearby(true);
        const biz = await fetchBusinesses({
          category: activeCategory || undefined,
          limit: 10000,
        });
        if (active) {
          setBusinesses(biz.businesses);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error cargando negocios:", err);
      } finally {
        if (active) {
          setLoadingNearby(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [activeCategory]);

  // Calcular la distancia de cada negocio al GPS real en el cliente y ordenar premium/destacado/cercanía
  const businessesWithDistance = useMemo(() => {
    const now = new Date();

    const mapped = businesses.map((b) => {
      if (!userLocation) {
        return { ...b, distance: undefined };
      }
      const dist = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        Number(b.latitude),
        Number(b.longitude)
      );
      return {
        ...b,
        distance: roundDistance(dist),
      };
    });

    return mapped.sort((a, b) => {
      const aSponsored = !!(a.sponsoredCategory && (!a.sponsoredUntil || new Date(a.sponsoredUntil) > now));
      const bSponsored = !!(b.sponsoredCategory && (!b.sponsoredUntil || new Date(b.sponsoredUntil) > now));

      if (aSponsored && !bSponsored) return -1;
      if (!aSponsored && bSponsored) return 1;

      const aFeatured = !!(a.featured && (!a.featuredUntil || new Date(a.featuredUntil) > now));
      const bFeatured = !!(b.featured && (!b.featuredUntil || new Date(b.featuredUntil) > now));

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [businesses, userLocation]);

  // Mantener selectedBusiness sincronizado y con distancia calculada
  const selectedBusinessWithDistance = useMemo(() => {
    if (!selectedBusiness) return null;
    const found = businessesWithDistance.find((b) => b.id === selectedBusiness.id);
    if (found) return found;

    if (!userLocation) return selectedBusiness;
    const dist = haversineDistance(
      userLocation.lat,
      userLocation.lng,
      Number(selectedBusiness.latitude),
      Number(selectedBusiness.longitude)
    );
    return {
      ...selectedBusiness,
      distance: roundDistance(dist),
    };
  }, [selectedBusiness, businessesWithDistance, userLocation]);

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
      setLoadingNearby(true);
      const result = await fetchBusinesses({
        category: activeCategory || undefined,
        limit: 10000,
      });
      setBusinesses(result.businesses);
    } catch (err) {
      console.error("Error refreshing businesses:", err);
    } finally {
      setLoadingNearby(false);
    }
  }, [activeCategory]);

  return {
    categories,
    businesses: businessesWithDistance,
    selectedBusiness: selectedBusinessWithDistance,
    activeCategory,
    isLoading,
    loadingNearby,
    searchQuery,
    businessCount: businessesWithDistance.length,
    handleMarkerClick,
    handleCategoryChange,
    handleSearch,
    handleClearSearch,
    handleSelectBusinessFromSearch,
    handleCloseDetail,
    refreshBusinesses,
  };
}
