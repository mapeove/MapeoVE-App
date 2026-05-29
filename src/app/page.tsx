"use client";

import { useState, useEffect, useCallback } from "react";
import { SplashOverlay } from "@/components/mapeove/splash-overlay";
import { SearchBar } from "@/components/mapeove/search-bar";
import { CategoryFilters } from "@/components/mapeove/category-filters";
import { BusinessDetail } from "@/components/mapeove/business-detail";
import { BusinessList } from "@/components/mapeove/business-list";
import { MapeoVEMap } from "@/components/mapeove/mapeove-map";
import {
  Business,
  Category,
  BRAND,
} from "@/types/mapeove";
import {
  fetchCategories,
  fetchBusinesses,
} from "@/lib/mapeove-api";
import { MapPin, List, X, ChevronUp } from "lucide-react";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showList, setShowList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch initial data
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
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Get user location
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
          // Default to La Victoria center
          setUserLocation({ lat: 10.2268, lng: -67.3312 });
        }
      );
    } else {
      setUserLocation({ lat: 10.2268, lng: -67.3312 });
    }
  }, []);

  // Fetch businesses when category changes
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
        console.error("Error loading businesses:", err);
      }
    }
    if (!isLoading) loadByCategory();
  }, [activeCategory, isLoading, userLocation, searchQuery]);

  const handleMarkerClick = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setShowList(false);
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

  const handleSelectBusinessFromSearch = useCallback(
    (business: Business) => {
      setSelectedBusiness(business);
      setShowList(false);
    },
    []
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedBusiness(null);
  }, []);

  const businessCount = businesses.length;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* Splash Screen */}
      <SplashOverlay />

      {/* Map */}
      <MapeoVEMap
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onMarkerClick={handleMarkerClick}
        userLocation={userLocation}
      />

      {/* Top overlay: Search + Categories */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="p-4 pt-3 space-y-3 pointer-events-auto">
          {/* Search Bar */}
          <SearchBar
            onSearch={handleSearch}
            onSelectBusiness={handleSelectBusinessFromSearch}
            onClear={handleClearSearch}
          />

          {/* Category Filters */}
          <CategoryFilters
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Bottom Section: Business Detail or List toggle */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Business count badge */}
        <div className="flex justify-center mb-2">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-white text-xs font-bold"
            style={{ backgroundColor: BRAND.blue }}
          >
            <MapPin size={14} />
            {businessCount} negocio{businessCount !== 1 ? "s" : ""} en La
            Victoria
          </div>
        </div>

        {/* Business Detail Panel */}
        {selectedBusiness && (
          <div className="relative mx-3 mb-3">
            <BusinessDetail
              business={selectedBusiness}
              onClose={handleCloseDetail}
            />
          </div>
        )}

        {/* Business List Panel */}
        {showList && !selectedBusiness && (
          <div className="bg-white rounded-t-3xl shadow-2xl max-h-[60vh] overflow-hidden">
            <div className="sticky top-0 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Negocios cercanos
                </h3>
                <button
                  onClick={() => setShowList(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[52vh] p-3">
              <BusinessList
                businesses={businesses}
                onSelectBusiness={handleMarkerClick}
                selectedId={selectedBusiness?.id || null}
              />
            </div>
          </div>
        )}

        {/* Toggle List Button (when detail not showing) */}
        {!selectedBusiness && !showList && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowList(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-lg text-sm font-bold text-gray-700 hover:shadow-xl transition-all active:scale-95 border border-gray-100"
            >
              <List size={16} />
              Ver lista
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: BRAND.blue }}
              >
                {businessCount}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Center on user location floating button */}
      {userLocation && !selectedBusiness && !showList && (
        <div className="absolute bottom-24 right-4 z-20">
          <button
            onClick={() => {
              // The GeolocateControl handles this
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl transition-all active:scale-95 border border-gray-100"
            title="Mi ubicación"
          >
            <MapPin size={20} style={{ color: BRAND.blue }} />
          </button>
        </div>
      )}
    </div>
  );
}
