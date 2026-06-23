"use client";

import { Category, CATEGORY_COLORS, BRAND } from "@/types/mapeove";

interface CategoryFiltersProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  categoryCounts?: Record<string, number>;
}

export function CategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
  categoryCounts,
}: CategoryFiltersProps) {
  const orderedSlugs = [
    "restaurantes",
    "farmacias",
    "gasolineras",
    "hoteles",
    "talleres",
    "salud",
    "comercios",
  ];

  // Map and filter categories to show only those with active businesses (count > 0)
  const filteredCategories = Array.isArray(categories)
    ? orderedSlugs
        .map((slug) => {
          const cat = categories.find((c) => c?.slug === slug);
          const count = categoryCounts ? (categoryCounts[slug] ?? 0) : (cat?.businessCount ?? 0);
          return { cat, count, slug };
        })
        .filter((item): item is { cat: Category; count: number; slug: string } => !!item.cat && item.count > 0)
    : [];

  const totalCount = filteredCategories.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-3 px-4 md:mx-0 md:px-0 snap-x snap-mandatory touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
      {/* Chip "Todos" */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 border flex-shrink-0 snap-start ${
          activeCategory === null
            ? "text-white shadow-sm scale-[1.02]"
            : "bg-slate-50 text-slate-600 border-slate-100/50 hover:bg-slate-100/70 hover:border-slate-200/50"
        }`}
        style={
          activeCategory === null
            ? {
                backgroundColor: BRAND.blue,
                borderColor: BRAND.blue,
                boxShadow: `0 2px 8px ${BRAND.blue}35`,
              }
            : {}
        }
      >
        <span className="text-xs">🌐</span>
        <span>Todos</span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-full font-black leading-none ${
            activeCategory === null
              ? "bg-white/25 text-white"
              : "bg-slate-200/60 text-slate-500"
          }`}
        >
          {totalCount}
        </span>
      </button>

      {/* Chips de Categorías */}
      {filteredCategories.map(({ cat, count, slug }) => {
        const isActive = activeCategory === slug;
        const color = CATEGORY_COLORS[slug] || BRAND.blue;

        return (
          <button
            key={cat.id}
            onClick={() =>
              onCategoryChange(isActive ? null : slug)
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 border flex-shrink-0 snap-start ${
              isActive
                ? "text-white shadow-sm scale-[1.02]"
                : "bg-slate-50 text-slate-600 border-slate-100/50 hover:bg-slate-100/70 hover:border-slate-200/50"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: color,
                    borderColor: color,
                    boxShadow: `0 2px 8px ${color}35`,
                  }
                : {}
            }
          >
            <span className="text-xs">{cat.icon}</span>
            <span>{cat.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-black leading-none ${
                isActive
                  ? "bg-white/25 text-white"
                  : "bg-slate-200/60 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
