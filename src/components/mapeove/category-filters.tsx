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

  const filteredCategories = Array.isArray(categories)
    ? orderedSlugs
        .map((slug) => categories.find((c) => c?.slug === slug))
        .filter((c): c is Category => !!c)
    : [];

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-3 px-4 md:mx-0 md:px-0 snap-x snap-mandatory touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
      {filteredCategories.map((category) => {
        const isActive = activeCategory === category.slug;
        const color = CATEGORY_COLORS[category.slug] || BRAND.blue;
        const currentCount = categoryCounts ? (categoryCounts[category.slug] ?? 0) : category.businessCount;

        return (
          <button
            key={category.id}
            onClick={() =>
              onCategoryChange(isActive ? null : category.slug)
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
            <span className="text-xs">{category.icon}</span>
            <span>{category.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-black leading-none ${
                isActive
                  ? "bg-white/25 text-white"
                  : "bg-slate-200/60 text-slate-500"
              }`}
            >
              {currentCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
