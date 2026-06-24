// MapeoVE Types

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  businessCount: number;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  phone: string | null;
  whatsapp: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  country: string;
  parish?: string | null;
  sectorType?: string | null;
  sectorName?: string | null;
  streetType?: string | null;
  streetName?: string | null;
  houseNumber?: string | null;
  reference?: string | null;
  latitude: number;
  longitude: number;
  image: string | null;
  hours: string | null;
  verified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  businessEmail?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  featured?: boolean;
  featuredUntil?: string | null;
  sponsoredCategory?: boolean;
  sponsoredUntil?: string | null;
  promotionTitle?: string | null;
  promotionDescription?: string | null;
  promotionImage?: string | null;
  promotionUntil?: string | null;
  promotionCategory?: string | null;
  promotionTemplate?: string | null;
  promotionPrice?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  distance?: number;
  businessImages?: {
    id: string;
    businessId: string;
    url: string;
    isPrimary: boolean;
    createdAt: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// MapLibre Marker data
export interface BusinessMarker {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  latitude: number;
  longitude: number;
}

// Category filter
export interface CategoryFilter {
  slug: string;
  name: string;
  icon: string;
  count: number;
  active: boolean;
}

// MapeoVE Brand Colors
export const BRAND = {
  blue: "#0B3D91",
  yellow: "#F4C430",
  red: "#D72638",
  white: "#FFFFFF",
} as const;

// Initial map config
export const MAP_CONFIG = {
  latitude: 10.2268,
  longitude: -67.3312,
  zoom: 13,
  style: "https://demotiles.maplibre.org/style.json", // OpenStreetMap style
} as const;

// Category color mapping for markers
export const CATEGORY_COLORS: Record<string, string> = {
  restaurantes: BRAND.red,
  farmacias: "#22C55E",
  gasolineras: "#8B5CF6",
  hoteles: BRAND.blue,
  talleres: "#F97316",
  salud: "#06B6D4",
  comercios: BRAND.yellow,
};

export function formatBusinessAddress(business: {
  address: string;
  state?: string | null;
  city?: string | null;
  parish?: string | null;
  sectorType?: string | null;
  sectorName?: string | null;
  streetType?: string | null;
  streetName?: string | null;
  houseNumber?: string | null;
  reference?: string | null;
}): string {
  const state = business.state?.trim();
  const city = business.city?.trim();
  
  if (!state || !city) {
    return business.address;
  }

  let parts = `${state}, ${city}`;

  const parish = business.parish?.trim();
  if (parish) {
    parts += `, Parroquia ${parish}`;
  }

  const sectorType = business.sectorType?.trim();
  const sectorName = business.sectorName?.trim();
  let zonePart = "";
  if (sectorType && sectorName) {
    zonePart = `${sectorType} ${sectorName}`;
  } else if (sectorName) {
    zonePart = sectorName;
  }

  const streetType = business.streetType?.trim();
  const streetName = business.streetName?.trim();
  let streetPart = "";
  if (streetType && streetName) {
    streetPart = `${streetType} ${streetName}`;
  } else if (streetName) {
    streetPart = streetName;
  }

  const houseNumber = business.houseNumber?.trim();
  
  let details = "";
  if (zonePart) {
    details += zonePart;
  }
  if (streetPart) {
    if (details) {
      details += `, ${streetPart}`;
    } else {
      details += streetPart;
    }
  }
  if (houseNumber) {
    if (details) {
      details += `, Nro/Local ${houseNumber}`;
    } else {
      details += `Nro/Local ${houseNumber}`;
    }
  }

  if (details) {
    parts += `. ${details}`;
  }

  const reference = business.reference?.trim();
  if (reference) {
    parts += `. Ref: ${reference}`;
  }

  return parts;
}
