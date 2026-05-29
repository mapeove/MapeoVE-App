"use client";

import { Category, CATEGORY_COLORS, BRAND } from "@/types/mapeove";

interface CategoryFiltersProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
}

export function CategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
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

  const filteredCategories = orderedSlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is Category => !!c && c.businessCount > 0);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
      {filteredCategories.map((category) => {
        const isActive = activeCategory === category.slug;
        const color = CATEGORY_COLORS[category.slug] || BRAND.blue;

        return (
          <button
            key={category.id}
            onClick={() =>
              onCategoryChange(isActive ? null : category.slug)
            }
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${
              isActive
                ? "text-white shadow-md scale-[1.03]"
                : "bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:shadow-sm"
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
            <span className="text-sm">{category.icon}</span>
            <span>{category.name}</span>
            <span
              className={`text-[10px] px-1 py-0.5 rounded-full leading-none ${
                isActive
                  ? "bg-white/25 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {category.businessCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
