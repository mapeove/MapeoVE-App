"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Business, BRAND } from "@/types/mapeove";
import { searchBusinesses } from "@/lib/mapeove-api";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSelectBusiness: (business: Business) => void;
  onClear: () => void;
  onSelectGeocode?: (result: { name: string; lat: number; lng: number }) => void;
}

export function SearchBar({ onSearch, onSelectBusiness, onClear, onSelectGeocode }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      if (value.trim().length === 0) onClear();
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [businesses, geocodeRes] = await Promise.all([
          searchBusinesses(value).catch(() => []),
          fetch(`/api/geocode?q=${encodeURIComponent(value)}`)
            .then((res) => res.json())
            .then((data) => data.features || [])
            .catch(() => [])
        ]);

        const formattedGeocode = geocodeRes.map((f: any, idx: number) => ({
          id: `geocode-${idx}-${f.geometry?.coordinates?.[0] || idx}-${f.geometry?.coordinates?.[1] || idx}`,
          type: "geocode" as const,
          name: f.place_name || f.properties?.label || f.text || "Dirección encontrada",
          lat: f.geometry?.coordinates?.[1] || 0,
          lng: f.geometry?.coordinates?.[0] || 0
        }));

        const formattedBiz = businesses.map((b) => ({
          id: `business-${b.id}`,
          type: "business" as const,
          name: b.name,
          subtext: `${b.category.name} · ${b.address}`,
          lat: Number(b.latitude),
          lng: Number(b.longitude),
          business: b
        }));

        // Combine: local businesses first, then global locations
        const combined = [...formattedBiz, ...formattedGeocode];
        setResults(combined);
        setShowResults(true);
        onSearch(value);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowResults(false);
    onClear();
    inputRef.current?.focus();
  }

  function handleSelect(item: any) {
    setQuery(item.name);
    setShowResults(false);
    if (item.type === "business") {
      onSelectBusiness(item.business);
    } else {
      onSelectGeocode?.({ name: item.name, lat: item.lat, lng: item.lng });
    }
  }

  return (
    <div ref={containerRef} className="relative z-30">
      <div className="relative flex items-center">
        <div className="absolute left-2.5 text-gray-400">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Buscar"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white shadow-lg border border-gray-100 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto z-50"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
        >
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <div className="mt-0.5 flex-shrink-0">
                <MapPin size={14} style={{ color: item.type === "business" ? BRAND.blue : "#7C3AED" }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {item.type === "business" ? item.subtext : "Dirección / Lugar"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showResults && results.length === 0 && !isSearching && query.length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-center z-50"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
        >
          <p className="text-xs text-gray-500">No se encontraron resultados para &quot;{query}&quot;</p>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-center z-50"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Buscando...</p>
          </div>
        </div>
      )}
    </div>
  );
}
