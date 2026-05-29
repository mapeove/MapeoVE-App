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
  // Only show categories that have businesses, ordered as the user specified
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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {filteredCategories.map((category) => {
        const isActive = activeCategory === category.slug;
        const color = CATEGORY_COLORS[category.slug] || BRAND.blue;

        return (
          <button
            key={category.id}
            onClick={() =>
              onCategoryChange(isActive ? null : category.slug)
            }
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border-2 ${
              isActive
                ? "text-white shadow-lg scale-105"
                : "bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:shadow-md"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: color,
                    borderColor: color,
                    boxShadow: `0 4px 14px ${color}40`,
                  }
                : {}
            }
          >
            <span className="text-base">{category.icon}</span>
            <span>{category.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
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
